import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/30 to-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-8 border border-white/20"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center shadow-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 id="confirm-dialog-title" className="text-xl font-bold text-gray-900 mb-3">
              {title}
            </h3>
            <p id="confirm-dialog-description" className="text-gray-600 mb-8 text-base">
              {message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="btn-secondary text-sm"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}