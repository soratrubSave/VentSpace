'use client';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'default';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  onConfirm,
  onCancel,
  variant = 'default'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      button: 'bg-red-600 hover:bg-red-700 text-white border-red-500',
      title: 'text-red-400'
    },
    warning: {
      button: 'bg-orange-600 hover:bg-orange-700 text-white border-orange-500',
      title: 'text-orange-400'
    },
    default: {
      button: 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600',
      title: 'text-gray-300'
    }
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0e0e12] border border-gray-800 rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <h3 className={`text-xl font-bold mb-3 ${style.title}`}>
            {title}
          </h3>
          <p className="text-gray-400 mb-6 leading-relaxed">
            {message}
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-gray-700 bg-[#121218] text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors font-mono text-sm"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg border transition-colors font-mono text-sm ${style.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
