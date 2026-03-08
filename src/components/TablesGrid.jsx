/**
 * TablesGrid.jsx
 * ==============
 * Renders all tables with real-time status colors.
 * Blocks new-order creation when a table is BUSY (tableStatus = 2).
 *
 * DATA FLOW:
 *   1. useQuery(['tables'])  — initial HTTP fetch on mount
 *   2. useTableHub()         — SignalR listener (runs in AppLayout, shared)
 *      └─ TableStatusChanged → queryClient.setQueryData(['tables'], ...)
 *   3. React re-renders this grid automatically (same cache key)
 *
 * TABLE STATUS:
 *   1 = Empty    (ACTIVE)   → green
 *   2 = NotEmpty (BUSY)     → red/rose
 *   3 = Reserved            → amber
 */

import { useQuery } from '@tanstack/react-query';
import * as signalR from '@microsoft/signalr';
import { Wifi, WifiOff, Loader2, Users, ShoppingBag, Clock } from 'lucide-react';

import { tableAPI } from '../api/tables';   // your existing tables API
import { useTableHub } from '../hooks/useTableHub';

// ─── TABLE STATUS CONFIG ──────────────────────────────────────────────────────

const TableStatus = {
  Empty    : 1,
  NotEmpty : 2,
  Reserved : 3,
};

const STATUS_CONFIG = {
  [TableStatus.Empty]: {
    label  : "Bo'sh",
    card   : 'bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 active:scale-95',
    border : 'border-emerald-200 dark:border-emerald-800',
    number : 'text-slate-900 dark:text-white',
    badge  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    dot    : 'bg-emerald-400 animate-pulse',
    cursor : 'cursor-pointer',
    blocked: false,
  },
  [TableStatus.NotEmpty]: {
    label  : 'Band',
    card   : 'bg-rose-50 dark:bg-rose-950/40',
    border : 'border-rose-300 dark:border-rose-700',
    number : 'text-rose-700 dark:text-rose-300',
    badge  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    dot    : 'bg-rose-500',
    cursor : 'cursor-pointer',  // still clickable — opens existing order
    blocked: true,              // blocks NEW order creation
  },
  [TableStatus.Reserved]: {
    label  : 'Rezerv',
    card   : 'bg-amber-50 dark:bg-amber-950/30',
    border : 'border-amber-300 dark:border-amber-700',
    number : 'text-amber-700 dark:text-amber-300',
    badge  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    dot    : 'bg-amber-400',
    cursor : 'cursor-pointer',
    blocked: true,
  },
};

// Fallback for unknown status values
const FALLBACK_CONFIG = STATUS_CONFIG[TableStatus.Empty];

// ─── CONNECTION STATE INDICATOR ───────────────────────────────────────────────

function ConnectionBadge({ state }) {
  const isConnected    = state === signalR.HubConnectionState.Connected;
  const isReconnecting = state === signalR.HubConnectionState.Reconnecting;
  const isConnecting   = state === signalR.HubConnectionState.Connecting;

  if (isConnected) return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
      <Wifi size={13} />
      Real-time
    </span>
  );

  if (isReconnecting || isConnecting) return (
    <span className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
      <Loader2 size={13} className="animate-spin" />
      {isReconnecting ? 'Qayta ulanmoqda…' : 'Ulanmoqda…'}
    </span>
  );

  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
      <WifiOff size={13} />
      Oflayn
    </span>
  );
}

// ─── SINGLE TABLE CARD ────────────────────────────────────────────────────────

function TableCard({ table, onClick }) {
  const cfg = STATUS_CONFIG[table.tableStatus] ?? FALLBACK_CONFIG;

  return (
    <div
      onClick={() => onClick(table)}
      className={`
        relative rounded-2xl border-2 p-4 transition-all duration-200 select-none
        ${cfg.card} ${cfg.border} ${cfg.cursor}
      `}
    >
      {/* Status dot */}
      <span className={`
        absolute top-3 right-3 w-2.5 h-2.5 rounded-full
        ${cfg.dot}
      `} />

      {/* Table number */}
      <p className={`text-3xl font-black ${cfg.number}`}>
        {table.tableNumber}
      </p>

      {/* Capacity (optional) */}
      {table.capacity && (
        <p className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mt-1">
          <Users size={11} />
          {table.capacity} kishi
        </p>
      )}

      {/* Status badge */}
      <span className={`
        mt-3 inline-flex items-center gap-1 text-xs font-semibold
        px-2.5 py-1 rounded-full
        ${cfg.badge}
      `}>
        {cfg.blocked && <Clock size={10} />}
        {cfg.label}
      </span>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

/**
 * @param {object}   props
 * @param {function} props.onSelectTable  — called with table object on click
 * @param {boolean}  [props.blockBusy]    — if true, toast-blocks clicks on busy tables
 */
export default function TablesGrid({ onSelectTable, blockBusy = false }) {
  // connectionState comes from the hook — used only for UI badge
  const { connectionState } = useTableHub();

  // React Query: initial fetch + cache that SignalR updates in real-time
  const { data: tables = [], isLoading } = useQuery({
    queryKey    : ['tables'],
    queryFn     : tableAPI.getAll,
    // Background polling as fallback if SignalR drops
    refetchInterval            : 10_000,
    refetchIntervalInBackground: true,
    staleTime   : 0,
  });

  // ── Handle table click ────────────────────────────────────────────────────
  const handleClick = (table) => {
    const cfg = STATUS_CONFIG[table.tableStatus] ?? FALLBACK_CONFIG;

    if (blockBusy && cfg.blocked) {
      // Caller decides what to do with busy tables — pass it through
      // (POSTerminal opens existing order; TablesPage may show info)
    }

    onSelectTable?.(table);
  };

  // ── Summary counts ────────────────────────────────────────────────────────
  const empty    = tables.filter(t => t.tableStatus === TableStatus.Empty).length;
  const busy     = tables.filter(t => t.tableStatus === TableStatus.NotEmpty).length;
  const reserved = tables.filter(t => t.tableStatus === TableStatus.Reserved).length;

  return (
    <div className="space-y-4">

      {/* ── Top bar: counts + connection state ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {empty} bo'sh
          </span>
          <span className="flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {busy} band
          </span>
          {reserved > 0 && (
            <span className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {reserved} rezerv
            </span>
          )}
        </div>

        <ConnectionBadge state={connectionState} />
      </div>

      {/* ── Table grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <ShoppingBag size={48} className="mb-3 opacity-30" />
          <p className="font-medium">Stollar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {tables
            .slice()
            .sort((a, b) => (a.tableNumber ?? 0) - (b.tableNumber ?? 0))
            .map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={handleClick}
              />
            ))}
        </div>
      )}
    </div>
  );
}
