import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm fade-in">
      <div
        className="absolute inset-0 bg-gradient-to-br from-pastel-neutral-900/40 to-pastel-neutral-800/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-pastel-lg w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col border border-pastel-neutral-200/30 slide-up`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between p-6 border-b border-pastel-neutral-200/30">
          <h2 id="modal-title" className="text-2xl font-bold text-gradient-primary">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-pastel-neutral-400 hover:text-pastel-rose-600 hover:bg-pastel-rose-50 rounded-xl p-2.5 transition-all duration-300 group"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-transparent to-pastel-blue-50/20">
          {children}
        </div>
      </div>
    </div>
  );
}