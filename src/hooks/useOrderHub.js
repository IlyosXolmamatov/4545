/**
 * useOrderHub.js — SignalR hook for real-time order events
 * =========================================================
 * Connects to /hubs/order and invalidates React Query caches
 * when the backend broadcasts order changes.
 *
 * Strategy (senior-level data fetching):
 *   • No constant polling — queries run once on mount
 *   • Mutation onSuccess already invalidates for the CURRENT user
 *   • This hook handles CROSS-USER changes: waiter creates order →
 *     admin/cashier UI updates immediately via SignalR, not next poll
 *   • 60s stale fallback refetchInterval remains in queries as safety net
 *
 * Events handled (backend may use any of these names):
 *   OrderCreated | OrderUpdated | OrderChanged  | OrderDeleted
 *   OrderStatusChanged | ReceiveOrder | ReceiveOrderUpdate
 *   OrdersRefresh  (full re-fetch signal)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as signalR from '@microsoft/signalr';

const HUB_URL = import.meta.env.VITE_API_BASE_URL + '/hubs/order';

export function useOrderHub() {
  const queryClient   = useQueryClient();
  const connectionRef = useRef(null);
  const startedRef    = useRef(false);
  const pendingRef    = useRef([]);

  const [connectionState, setConnectionState] = useState(
    signalR.HubConnectionState.Disconnected
  );

  const flushPending = useCallback(async (conn) => {
    const queue = pendingRef.current.splice(0);
    for (const { method, args } of queue) {
      try {
        await conn.invoke(method, ...args);
      } catch (err) {
        console.warn(`[OrderHub] flush invoke "${method}" failed:`, err?.message);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // ── 1. Build connection ────────────────────────────────────────────────
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('access_token') ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    // ── 2. Lifecycle callbacks ─────────────────────────────────────────────
    connection.onreconnecting(() => {
      if (!cancelled) setConnectionState(signalR.HubConnectionState.Reconnecting);
    });
    connection.onreconnected(() => {
      if (!cancelled) {
        setConnectionState(signalR.HubConnectionState.Connected);
        flushPending(connection);
        // Re-sync after reconnect
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['orders', 'my-active'] });
        queryClient.invalidateQueries({ queryKey: ['orders', 'all-for-blocking'] });
      }
    });
    connection.onclose((err) => {
      if (!cancelled) setConnectionState(signalR.HubConnectionState.Disconnected);
      if (err) console.warn('[OrderHub] closed with error:', err.message);
    });

    // ── 3. Invalidation helper ─────────────────────────────────────────────
    const invalidateOrders = (orderId) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'my-active'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'all-for-blocking'] });
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      }
    };

    // ── 4. Domain event handlers ───────────────────────────────────────────
    // All common backend event name variants — backend may use any of these

    // New order created
    const onOrderCreated = (payload) => {
      invalidateOrders(payload?.id ?? payload?.orderId);
    };
    connection.on('OrderCreated', onOrderCreated);
    connection.on('ReceiveOrder', onOrderCreated);
    connection.on('NewOrder',     onOrderCreated);

    // Order updated (items, service charge, table change, etc.)
    const onOrderUpdated = (payload) => {
      const id = payload?.id ?? payload?.orderId;
      // Optimistic: patch the specific order in cache if full payload given
      if (id && payload?.items !== undefined) {
        queryClient.setQueryData(['order', id], (old) =>
          old ? { ...old, ...payload } : old
        );
        queryClient.setQueryData(['orders'], (old) =>
          Array.isArray(old) ? old.map(o => o.id === id ? { ...o, ...payload } : o) : old
        );
        queryClient.setQueryData(['orders', 'my-active'], (old) =>
          Array.isArray(old) ? old.map(o => o.id === id ? { ...o, ...payload } : o) : old
        );
      } else {
        invalidateOrders(id);
      }
    };
    connection.on('OrderUpdated',      onOrderUpdated);
    connection.on('OrderChanged',      onOrderUpdated);
    connection.on('ReceiveOrderUpdate', onOrderUpdated);

    // Status change (finish/cancel — may also free a table)
    const onStatusChanged = (payload) => {
      invalidateOrders(payload?.id ?? payload?.orderId);
      // Also refresh tables since order finish/cancel frees the table
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    };
    connection.on('OrderStatusChanged', onStatusChanged);
    connection.on('OrderFinished',      onStatusChanged);
    connection.on('OrderCancelled',     onStatusChanged);

    // Order deleted
    connection.on('OrderDeleted', (payload) => {
      const id = payload?.id ?? payload?.orderId ?? payload;
      if (id) {
        queryClient.removeQueries({ queryKey: ['order', id] });
      }
      invalidateOrders();
    });

    // Full refresh signal from backend
    connection.on('OrdersRefresh', () => invalidateOrders());

    // ── 5. Start connection ────────────────────────────────────────────────
    (async () => {
      try {
        setConnectionState(signalR.HubConnectionState.Connecting);
        await connection.start();

        if (cancelled) {
          connection.stop();
          return;
        }

        startedRef.current = true;
        setConnectionState(signalR.HubConnectionState.Connected);
        console.log('[OrderHub] Connected ✓');
        await flushPending(connection);

      } catch (err) {
        if (!cancelled) {
          setConnectionState(signalR.HubConnectionState.Disconnected);
          // Hub may not exist — this is fine, mutation invalidations still work
          console.info('[OrderHub] Could not connect (will rely on mutation invalidation):', err?.message);
        }
      }
    })();

    // ── 6. Cleanup ─────────────────────────────────────────────────────────
    return () => {
      cancelled = true;
      startedRef.current = false;
      connectionRef.current = null;
      pendingRef.current = [];

      if (connection.state === signalR.HubConnectionState.Connecting) return;
      connection.stop();
    };
  }, [queryClient, flushPending]);

  return { connectionState };
}
