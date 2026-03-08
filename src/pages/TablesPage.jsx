import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, X, Loader2,
  Users, UserCircle, MapPin, Crown,
} from 'lucide-react';

import {
  tableAPI,
  TableStatus,
  TableType,
} from '../api/tables';
import { extractErrorMessage } from '../utils/errorHandler';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import ConfirmModal from '../components/ConfirmModal';

// ─── NORMALIZE (backend strings → numbers) ───────────────────────────────────
const STATUS_STR = { Empty: 1, NotEmpty: 2, Reserved: 3 };
const TYPE_STR   = { Simple: 1, Terrace: 2, VIP: 3 };

const normalizeTable = (t) => ({
  ...t,
  tableStatus: typeof t.tableStatus === 'string' ? (STATUS_STR[t.tableStatus] ?? t.tableStatus) : t.tableStatus,
  tableType:   typeof t.tableType   === 'string' ? (TYPE_STR[t.tableType]     ?? t.tableType)   : t.tableType,
});

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG = [
  { type: TableType.Simple,  label: 'Ichkari', icon: MapPin },
  { type: TableType.Terrace, label: 'Terasa', icon: MapPin },
  { type: TableType.VIP,     label: 'VIP',     icon: Crown  },
];

const DEFAULT_FORM = {
  tableNumber: '',
  capacity:    '',
  tableStatus: TableStatus.Free,
  tableType:   TableType.Simple,
};

// ─── TABLE CARD ───────────────────────────────────────────────────────────────

const TableCard = ({ table, onEdit, onDelete, canEdit, canDelete, isDark }) => {
  // Capacity — now provided by backend in `table.capacity`
  const capacity = table.capacity;

  const getStatusConfig = (status) => ({
    [TableStatus.Free]: {
      badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      label: "Bo'sh",
      dot: null,
      cardBg: isDark ? 'bg-slate-900' : 'bg-white',
      cardBorder: isDark ? 'border-slate-800 hover:border-emerald-500/50' : 'border-slate-100 hover:border-emerald-300',
      number: isDark ? 'text-slate-100' : 'text-slate-800',
    },
    [TableStatus.Occupied]: {
      badge: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      label: 'Band',
      dot: 'bg-rose-500',
      cardBg: isDark ? 'bg-rose-950/60' : 'bg-rose-50',
      cardBorder: isDark ? 'border-rose-800/70 hover:border-rose-500' : 'border-rose-200 hover:border-rose-400',
      number: isDark ? 'text-rose-400' : 'text-rose-600',
    },
    [TableStatus.Reserved]: {
      badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      label: 'Rezerv',
      dot: 'bg-amber-400',
      cardBg: isDark ? 'bg-amber-950/40' : 'bg-amber-50',
      cardBorder: isDark ? 'border-amber-800/60 hover:border-amber-500' : 'border-amber-200 hover:border-amber-400',
      number: isDark ? 'text-amber-400' : 'text-amber-600',
    },
  }[status]);

  const statusCfg = getStatusConfig(table.tableStatus);

  return (
    <div className={`relative rounded-2xl border-2 p-4 cursor-pointer group
                    transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
                    ${statusCfg.cardBg} ${statusCfg.cardBorder}`}>

      {/* Type badge — yuqori o'ng */}
      <div className={`absolute top-2.5 right-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide ${
        isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'
      }`}>
        {table.tableType === TableType.Simple ? 'Ichkari' : table.tableType === TableType.Terrace ? 'Terasa' : 'VIP'}
      </div>

      {/* Status dot */}
      {statusCfg.dot && (
        <div className="absolute top-2.5 left-2.5">
          <span className="relative flex h-2 w-2">
            {table.tableStatus === TableStatus.Occupied && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusCfg.dot} opacity-75`} />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${statusCfg.dot}`} />
          </span>
        </div>
      )}

      {/* STOL label */}
      <p className={`text-[10px] font-semibold uppercase tracking-widest mt-3 ${
        isDark ? 'text-slate-400' : 'text-slate-500'
      }`}>
        STOL
      </p>

      {/* Stol raqami */}
      <p className={`text-3xl font-black leading-none mt-0.5 ${statusCfg.number}`}>
        #{table.tableNumber}
      </p>

      {/* Status badge */}
      <div className="mt-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.badge}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Capacity + Waiter */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1">
          <Users size={11} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
          <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {capacity ? `${capacity} kishi` : '—'}
          </span>
        </div>
        {table.waiterName && (
          <div className="flex items-center gap-1">
            <UserCircle size={11} className="text-basand-300" />
            <span className="text-xs font-medium text-basand-300 truncate max-w-16">
              {table.waiterName}
            </span>
          </div>
        )}
      </div>

      {/* Active order SKU — band bo'lsa */}
      {table.tableStatus === TableStatus.Occupied && table.activeSku && (
        <div className={`mt-2 px-2 py-1 rounded-lg text-[10px] font-mono ${
          isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'
        }`}>
          {table.activeSku}
        </div>
      )}

      {/* Edit/Delete — hover da */}
      {(canEdit || canDelete) && (
        <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100
                        transition-opacity flex items-center justify-center gap-2">
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(table); }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-sm transition-colors"
            >
              <Pencil size={14} className="text-white" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(table); }}
              className="p-2 bg-red-500/30 hover:bg-red-500/50 rounded-xl backdrop-blur-sm transition-colors"
            >
              <Trash2 size={14} className="text-red-300" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const TablesPage = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();

  const { isDark } = useThemeStore();
  const [dlg, setDlg] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing]     = useState(false);
  const [editId, setEditId]           = useState(null);
  const [formData, setFormData]       = useState(DEFAULT_FORM);

  // ── Theme helper ──
  const theme = {
    page: isDark ? 'bg-slate-950 min-h-screen' : 'bg-slate-50 min-h-screen',
    card: isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100',
    text: isDark ? 'text-slate-100' : 'text-slate-900',
    subtext: isDark ? 'text-slate-400' : 'text-slate-500',
    section: isDark ? 'text-slate-300' : 'text-slate-700',
    filterBtn: isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600',
    filterActive: isDark ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-white',
    divider: isDark ? 'bg-slate-700' : 'bg-slate-200',
  };

  // ── Queries ──
  const { data: tables = [], isLoading, isFetching } = useQuery({
    queryKey: ['tables'],
    queryFn: tableAPI.getAll,
    select: (data) => (Array.isArray(data) ? data.map(normalizeTable) : []),
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  });

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: ({ tableNumber, tableStatus, tableType, capacity }) =>
      tableAPI.create({ tableNumber, tableStatus, tableType, capacity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success("Stol qo'shildi");
      closeModal();
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Qo'shishda xatolik")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, tableNumber, tableStatus, tableType, capacity }) =>
      tableAPI.update({ id, tableNumber, tableStatus, tableType, capacity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Stol yangilandi');
      closeModal();
    },
    onError: (err) => toast.error(extractErrorMessage(err, 'Yangilashda xatolik')),
  });

  const deleteMutation = useMutation({
    mutationFn: tableAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success("Stol o'chirildi");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "O'chirishda xatolik")),
  });

  // ── Handlers ──
  const openCreateModal = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData(DEFAULT_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (table) => {
    setIsEditing(true);
    setEditId(table.id);
    setFormData({
      tableNumber: table.tableNumber,
      capacity:    table.capacity ?? '',
      tableStatus: table.tableStatus,
      tableType:   table.tableType,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (table) => {
    setDlg({
      message: `${table.tableNumber}-stol o'chirilsinmi?`,
      confirmText: "Ha, o'chirish",
      onConfirm: () => deleteMutation.mutate(table.id),
    });
  };

  const closeModal = () => setIsModalOpen(false);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate tableNumber
    const num = parseInt(formData.tableNumber);
    if (!num || num < 1) {
      toast.error("Stol raqami 1 dan katta bo'lishi kerak");
      return;
    }

    // Validate capacity
    const cap = parseInt(formData.capacity);
    if (!cap || cap < 1) {
      toast.error("O'rindiqlar soni 1 dan katta bo'lishi kerak");
      return;
    }

    const payload = {
      tableNumber: num,
      capacity:    cap,
      tableStatus: parseInt(formData.tableStatus),
      tableType:   parseInt(formData.tableType),
    };

    if (isEditing) updateMutation.mutate({ id: editId, ...payload });
    else           createMutation.mutate(payload);
  };

  // ── Stats ──
  const freeCount     = tables.filter((t) => t.tableStatus === TableStatus.Free).length;
  const occupiedCount = tables.filter((t) => t.tableStatus === TableStatus.Occupied).length;
  const reservedCount = tables.filter((t) => t.tableStatus === TableStatus.Reserved).length;

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const canEdit   = hasPermission('Table_Update');
  const canDelete = hasPermission('Table_Delete');

  // ── Filter ──
  const filteredTables = typeFilter === 'all'
    ? tables
    : tables.filter(t => t.tableType === typeFilter);

  const tableTypes = typeFilter === 'all' ? [TableType.Simple, TableType.Terrace, TableType.VIP] : [typeFilter];

  // ─── LOADING SKELETON ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={`${theme.page} p-6`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-32 rounded-2xl animate-pulse ${
              isDark ? 'bg-slate-800' : 'bg-slate-200'
            }`} />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`h-32 rounded-2xl animate-pulse ${
              isDark ? 'bg-slate-800' : 'bg-slate-200'
            }`} />
          ))}
        </div>
      </div>
    );
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className={`${theme.page} p-6`}>

      {/* ── PAGE HEADER ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${theme.text}`}>Stollar</h1>
          <p className={`text-sm mt-0.5 ${theme.subtext}`}>Restoran stollari</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              isFetching ? 'bg-basand-300' : 'bg-green-400'
            }`} />
            <span className={`text-xs font-medium ${theme.subtext}`}>Live</span>
          </div>

          {/* Yangi stol */}
          {hasPermission('Table_Create') && (
            <button
              onClick={openCreateModal}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                         transition-colors shadow-sm ${
                           isDark
                             ? 'bg-white text-slate-900 hover:bg-slate-100'
                             : 'bg-slate-900 text-white hover:bg-slate-700'
                         }`}
            >
              <Plus size={16} />
              Yangi stol
            </button>
          )}
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Jami', count: tables.length, color: isDark ? 'text-slate-100' : 'text-slate-800' },
          { label: "Bo'sh", count: freeCount, color: 'text-emerald-500' },
          { label: 'Band', count: occupiedCount, color: 'text-rose-500' },
          { label: 'Rezerv', count: reservedCount, color: 'text-amber-500' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl p-4 border shadow-sm ${theme.card}`}>
            <p className={`text-xs font-medium uppercase tracking-widest ${theme.subtext}`}>{stat.label}</p>
            <p className={`text-4xl font-black mt-1 ${stat.color}`}>{stat.count}</p>
            <div className={`mt-2 h-0.5 w-10 rounded-full ${theme.divider}`} />
          </div>
        ))}
      </div>

      {/* ── TYPE FILTER TABS ── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {[
          { label: 'Hammasi', value: 'all' },
          { label: 'Ichkari', value: TableType.Simple, icon: <MapPin size={12} /> },
          { label: 'Terasa', value: TableType.Terrace, icon: <MapPin size={12} /> },
          { label: 'VIP', value: TableType.VIP, icon: <Crown size={12} /> },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
                       border transition-all ${
                         typeFilter === f.value
                           ? theme.filterActive
                           : theme.filterBtn + ' hover:border-basand-300'
                       }`}
          >
            {f.icon}
            {f.label}
            {f.value !== 'all' && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                typeFilter === f.value
                  ? isDark ? 'bg-slate-700 text-slate-200' : 'bg-white/20 text-white'
                  : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
              }`}>
                {tables.filter(t => t.tableType === f.value).length}
              </span>
            )}
          </button>
        ))}

        {/* Status counter badges — o'ng tomonda */}
        <div className="ml-auto flex items-center gap-2">
          {[
            { label: "Bo'sh", status: TableStatus.Free, dot: 'bg-emerald-400' },
            { label: 'Band', status: TableStatus.Occupied, dot: 'bg-rose-400' },
            { label: 'Rezerv', status: TableStatus.Reserved, dot: 'bg-amber-400' },
          ].map(s => (
            <div key={s.status} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs ${
              isDark ? 'bg-slate-900' : 'bg-white border border-slate-100'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              <span className={theme.subtext}>{s.label} — </span>
              <span className={`font-bold ${theme.text}`}>
                {tables.filter(t => t.tableStatus === s.status).length} ta
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABLE SECTIONS ── */}
      <div className="space-y-8">
        {tableTypes.map((type) => {
          const sectionTables = filteredTables.filter(t => t.tableType === type);
          if (sectionTables.length === 0) return null;

          const config = TYPE_CONFIG.find(c => c.type === type);
          const Icon = config.icon;
          const iconBg = type === TableType.VIP
            ? 'bg-gradient-to-br from-amber-400 to-brand-400'
            : type === TableType.Terrace
            ? (isDark ? 'bg-emerald-800' : 'bg-emerald-600')
            : (isDark ? 'bg-slate-700' : 'bg-slate-900');

          return (
            <div key={type} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center text-white`}>
                  <Icon size={14} />
                </div>
                <h2 className={`text-sm font-bold uppercase tracking-widest ${theme.section}`}>
                  {config.label}
                </h2>
                <div className={`flex-1 h-px ${theme.divider}`} />
                <span className={`text-xs font-medium ${theme.subtext}`}>
                  {sectionTables.filter(t => t.tableStatus === TableStatus.Occupied).length} band •{' '}
                  {sectionTables.filter(t => t.tableStatus === TableStatus.Free).length} bo'sh stol
                </span>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {sectionTables.map(table => (
                  <TableCard
                    key={table.id}
                    table={table}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    isDark={isDark}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {tables.length === 0 && (
        <div className={`flex flex-col items-center justify-center py-24 ${theme.subtext}`}>
          <span className="text-5xl mb-3">🪑</span>
          <p className="font-medium">Hali stol qo'shilmagan</p>
        </div>
      )}

      {/* ── MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`rounded-2xl w-full max-w-md shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-900' : 'bg-white'
          }`}>

            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'
            }`}>
              <h2 className={`text-lg font-bold ${theme.text}`}>
                {isEditing ? '✏️ Stolni tahrirlash' : "➕ Yangi stol qo'shish"}
              </h2>
              <button
                onClick={closeModal}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">

              {/* Stol raqami + O'rindiqlar soni */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${theme.section}`}>
                    Stol raqami <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="tableNumber"
                    value={formData.tableNumber}
                    onChange={handleInput}
                    min={1}
                    placeholder="5"
                    className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-basand-400 focus:border-transparent outline-none transition-all ${
                      isDark
                        ? 'bg-slate-800 border-slate-600 text-white placeholder-gray-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-gray-400'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${theme.section}`}>
                    O'rindiqlar soni <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInput}
                    min={1}
                    max={50}
                    placeholder="4"
                    className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-basand-400 focus:border-transparent outline-none transition-all ${
                      isDark
                        ? 'bg-slate-800 border-slate-600 text-white placeholder-gray-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-gray-400'
                    }`}
                    required
                  />
                </div>
              </div>

           

              {/* Stol turi */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${theme.section}`}>
                  🏠 Stol turi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPE_CONFIG.map(({ type, label }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, tableType: type }))}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                        parseInt(formData.tableType) === type
                          ? (isDark
                              ? 'bg-basand-500 text-white border-basand-500 shadow-lg'
                              : 'bg-basand-400 text-white border-basand-400 shadow-lg')
                          : (isDark
                              ? 'bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-500'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${theme.section}`}>
                  ⚡ Holati
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: TableStatus.Free,     label: "Bo'sh",  cls: 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600' },
                    { val: TableStatus.Occupied, label: 'Band',   cls: 'bg-rose-500 border-rose-500 text-white hover:bg-rose-600'       },
                    { val: TableStatus.Reserved, label: 'Rezerv', cls: 'bg-amber-400 border-amber-400 text-slate-900 hover:bg-amber-500'  },
                  ].map(({ val, label, cls }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, tableStatus: val }))}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                        parseInt(formData.tableStatus) === val
                          ? cls
                          : (isDark
                              ? 'bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-500'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className={`flex justify-end gap-3 pt-4 border-t ${
                isDark ? 'border-slate-700' : 'border-slate-100'
              }`}>
                <button
                  type="button"
                  onClick={closeModal}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${
                    isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Bekor
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className={`px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm ${
                    isDark
                      ? 'bg-basand-500 text-white hover:bg-basand-600 disabled:bg-slate-700'
                      : 'bg-basand-400 text-white hover:bg-basand-500 disabled:bg-slate-400'
                  }`}
                >
                  {isMutating && <Loader2 size={16} className="animate-spin" />}
                  {isEditing ? 'Saqlash' : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        open={!!dlg}
        message={dlg?.message}
        confirmText={dlg?.confirmText}
        danger={dlg?.danger ?? true}
        onConfirm={() => { dlg?.onConfirm?.(); setDlg(null); }}
        onCancel={() => setDlg(null)}
      />
    </div>
  );
};

export default TablesPage;
