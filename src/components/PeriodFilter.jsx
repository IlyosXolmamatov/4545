import { useState } from 'react';
import { CalendarDays } from 'lucide-react';

const PERIODS = [
  { value: 1, label: 'Kunlik' },
  { value: 2, label: 'Haftalik' },
  { value: 3, label: 'Oylik' },
  { value: 4, label: 'Yillik' },
  { value: 5, label: 'Maxsus' },
];

/**
 * @param {{ filter: {period:number, startDate:string|null, endDate:string|null}, onChange: (f)=>void }} props
 */
export default function PeriodFilter({ filter, onChange }) {
  const [localStart, setLocalStart] = useState('');
  const [localEnd, setLocalEnd]     = useState('');

  const handlePeriod = (p) => {
    if (p !== 5) {
      onChange({ period: p, startDate: null, endDate: null });
    } else {
      // Switch to custom — don't fire query until user presses Apply
      onChange({ period: 5, startDate: null, endDate: null });
      setLocalStart('');
      setLocalEnd('');
    }
  };

  const handleApply = () => {
    if (!localStart || !localEnd) return;
    onChange({
      period: 5,
      startDate: localStart + 'T00:00:00',
      endDate:   localEnd   + 'T23:59:59',
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Period buttons */}
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => handlePeriod(p.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filter.period === p.value
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {p.label}
        </button>
      ))}

      {/* Custom date range */}
      {filter.period === 5 && (
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          <CalendarDays className="w-4 h-4 text-gray-400 hidden sm:block" />
          <input
            type="date"
            value={localStart}
            onChange={(e) => setLocalStart(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="date"
            value={localEnd}
            min={localStart || undefined}
            onChange={(e) => setLocalEnd(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleApply}
            disabled={!localStart || !localEnd}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Qo'llash
          </button>
          {filter.startDate && (
            <span className="text-xs text-indigo-600 dark:text-indigo-400">
              {filter.startDate.slice(0, 10)} → {filter.endDate?.slice(0, 10)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
