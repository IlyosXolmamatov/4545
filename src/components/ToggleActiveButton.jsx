import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';

/**
 * Faol / Nofaol toggle tugmasi
 *
 * @param {boolean}  isActive  - Joriy holat
 * @param {Function} onToggle  - (newValue: boolean) => Promise<void>
 * @param {'sm'|'md'|'lg'} size - Tugma o'lchami (default: 'md')
 */
const ToggleActiveButton = ({ isActive, onToggle, size = 'md' }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onToggle(!isActive);
    } finally {
      setLoading(false);
    }
  };

  const sizeClass = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  }[size] ?? 'px-3 py-1.5 text-sm gap-1.5';

  const iconSize = { sm: 12, md: 14, lg: 16 }[size] ?? 14;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`
        inline-flex items-center rounded-lg font-semibold
        transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClass}
        ${isActive
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-red-100   text-red-700   hover:bg-red-200'}
      `}
    >
      {loading ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : isActive ? (
        <Check size={iconSize} strokeWidth={3} />
      ) : (
        <X size={iconSize} strokeWidth={3} />
      )}
      <span>{isActive ? 'Faol' : 'Nofaol'}</span>
    </button>
  );
};

export default ToggleActiveButton;
