import { AlertTriangle, X } from 'lucide-react';

/**
 * Reusable confirm dialog (native confirm() o'rniga)
 *
 * Props:
 *   open        {boolean}   - ko'rsatish/yashirish
 *   title       {string}    - sarlavha (ixtiyoriy)
 *   message     {string}    - asosiy matn
 *   confirmText {string}    - tasdiqlash tugmasi matni (default: "Ha, tasdiqlash")
 *   cancelText  {string}    - bekor qilish matni (default: "Bekor qilish")
 *   danger      {boolean}   - qizil tasdiqlash tugmasi (o'chirish uchun, default: true)
 *   onConfirm   {function}  - tasdiqlanganda
 *   onCancel    {function}  - bekor qilinganda
 */
const ConfirmModal = ({
  open,
  title,
  message,
  confirmText = "Ha, tasdiqlash",
  cancelText  = "Bekor qilish",
  danger      = true,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
            ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-basand-100 dark:bg-basand-800/30'}`}>
            <AlertTriangle
              size={20}
              className={danger ? 'text-red-600 dark:text-red-400' : 'text-basand-500 dark:text-basand-300'}
            />
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pt-3 pb-5">
          {title && (
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {title}
            </h3>
          )}
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold
                       bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700
                       text-slate-700 dark:text-slate-300 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors
              ${danger
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/30'
                : 'bg-basand-400 hover:bg-basand-500 shadow-lg shadow-brand-200 dark:shadow-brand-800/30'
              }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
