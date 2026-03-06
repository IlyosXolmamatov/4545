/**
 * useTableHub.js — Production-ready SignalR hook
 * ================================================
 * CONNECTION LIFECYCLE:
 *   1. build()  — creates HubConnection object (no network yet)
 *   2. .on()    — registers event handlers (must be before start)
 *   3. start()  — begins HTTP negotiation → upgrades to WebSocket
 *   4. cleanup  — safe stop() only when NOT in Connecting state
 *
 * KEY PROBLEMS SOLVED:
 *   ✓ "stopped during negotiation" — stop() never called on Connecting state
 *   ✓ duplicate connections        — cancelled flag + single effect
 *   ✓ stale token                  — accessTokenFactory reads fresh each reconnect
 *   ✓ invoke before start()        — pendingInvoke queue flushes after connected
 *   ✓ React StrictMode safe        — cancelled closure handles double-mount
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as signalR from '@microsoft/signalr';

const HUB_URL = import.meta.env.VITE_API_BASE_URL + '/hubs/table';

// Map backend string status → integer (your system uses 1/2/3 internally)
// Backend may send either format — this normalises both
const normaliseStatus = (raw) => {
  if (typeof raw === 'number') return raw;           // already integer
  if (raw === 'ACTIVE')        return 1;             // Empty
  if (raw === 'BUSY')          return 2;             // NotEmpty
  if (raw === 'RESERVED')      return 3;
  return 1;
};

export function useTableHub() {
  const queryClient    = useQueryClient();
  const connectionRef  = useRef(null);   // holds the HubConnection instance
  const startedRef     = useRef(false);  // true once start() has resolved successfully
  const pendingRef     = useRef([]);     // hub methods queued before connection is ready

  // Exposed to consumers so UI can show "Connecting…" / "Reconnecting…" etc.
  const [connectionState, setConnectionState] = useState(
    signalR.HubConnectionState.Disconnected
  );

  // ── Invoke helper — queues calls made before start() resolves ─────────────
  const safeInvoke = useCallback(async (method, ...args) => {
    const conn = connectionRef.current;
    if (!conn) return;

    if (conn.state === signalR.HubConnectionState.Connected) {
      return conn.invoke(method, ...args).catch((err) =>
        console.warn(`[TableHub] invoke "${method}" failed:`, err?.message)
      );
    }

    // Not connected yet — queue and flush after start() resolves
    pendingRef.current.push({ method, args });
  }, []);

  // ── Public: join a specific table's SignalR group ─────────────────────────
  const subscribeToTable = useCallback((tableId) => {
    safeInvoke('SubscribeToTable', tableId);
  }, [safeInvoke]);

  // ── Public: leave a specific table's SignalR group ────────────────────────
  const unsubscribeFromTable = useCallback((tableId) => {
    safeInvoke('UnsubscribeFromTable', tableId);
  }, [safeInvoke]);

  // ── Flush any queued invocations after connection is established ───────────
  const flushPending = useCallback(async (conn) => {
    const queue = pendingRef.current.splice(0);
    for (const { method, args } of queue) {
      try {
        await conn.invoke(method, ...args);
      } catch (err) {
        console.warn(`[TableHub] flush invoke "${method}" failed:`, err?.message);
      }
    }
  }, []);

  useEffect(() => {
    // `cancelled` — closure flag: true when React unmounts this effect
    // prevents stop()-during-negotiation and stale-update errors
    let cancelled = false;

    // ── 1. Build connection (no network traffic yet) ───────────────────────
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        // Read token fresh on every reconnect (handles token rotation)
        accessTokenFactory: () => localStorage.getItem('access_token') ?? '',
      })
      // Reconnect schedule: immediate → 2s → 5s → 10s → 30s
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    // ── 2. Register lifecycle callbacks ───────────────────────────────────
    connection.onreconnecting(() => {
      if (!cancelled) setConnectionState(signalR.HubConnectionState.Reconnecting);
      console.log('[TableHub] Reconnecting…');
    });

    connection.onreconnected(() => {
      if (!cancelled) {
        setConnectionState(signalR.HubConnectionState.Connected);
        flushPending(connection);
      }
      console.log('[TableHub] Reconnected');
    });

    connection.onclose((err) => {
      if (!cancelled) setConnectionState(signalR.HubConnectionState.Disconnected);
      if (err) console.warn('[TableHub] Connection closed with error:', err.message);
    });

    // ── 3. Register domain event handlers (BEFORE start) ──────────────────
    //
    // TableStatusChanged — primary real-time event
    // Payload: { id, tableNumber, tableStatus: number }
    //      OR  { tableId, status: "ACTIVE"|"BUSY" }   ← backend variant
    connection.on('TableStatusChanged', (payload) => {
      // Normalise both payload shapes into one consistent shape
      const id     = payload.id     ?? payload.tableId;
      const status = normaliseStatus(payload.tableStatus ?? payload.status);

      queryClient.setQueryData(['tables'], (old) => {
        if (!Array.isArray(old)) return old;
        return old.some(t => t.id === id)
          ? old.map(t => t.id === id ? { ...t, ...payload, tableStatus: status } : t)
          : [...old, { ...payload, tableStatus: status }];
      });
    });

    // TableUpdated — full table object refreshed (name, capacity, etc.)
    connection.on('TableUpdated', (table) => {
      queryClient.setQueryData(['tables'], (old) => {
        if (!Array.isArray(old)) return old;
        return old.some(t => t.id === table.id)
          ? old.map(t => t.id === table.id ? { ...t, ...table } : t)
          : [...old, table];
      });
    });

    // TablesRefresh — backend requests full re-fetch (e.g. bulk change)
    connection.on('TablesRefresh', () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    });

    // ── 4. Start connection (async — does NOT block render) ───────────────
    (async () => {
      try {
        setConnectionState(signalR.HubConnectionState.Connecting);
        await connection.start();

        // If React cleanup already ran while we were negotiating:
        // connection is now Connected — safe to stop() immediately
        if (cancelled) {
          connection.stop();
          return;
        }

        startedRef.current = true;
        setConnectionState(signalR.HubConnectionState.Connected);
        console.log('[TableHub] Connected ✓');

        // Flush any hub-method calls that arrived before we were connected
        await flushPending(connection);

      } catch (err) {
        if (!cancelled) {
          setConnectionState(signalR.HubConnectionState.Disconnected);
          console.warn('[TableHub] Failed to connect:', err?.message);
        }
        // withAutomaticReconnect handles retries from here
      }
    })();

    // ── 5. Cleanup ─────────────────────────────────────────────────────────
    return () => {
      cancelled = true;
      startedRef.current = false;
      connectionRef.current = null;
      pendingRef.current = [];

      if (connection.state === signalR.HubConnectionState.Connecting) {
        // CRITICAL: never call stop() during negotiation phase
        // The async block above will call stop() after start() resolves
        return;
      }

      connection.stop();
    };
  }, [queryClient, flushPending]);

  return {
    connectionState,      // signalR.HubConnectionState enum value
    subscribeToTable,     // (tableId: string) => void
    unsubscribeFromTable, // (tableId: string) => void
  };
}
