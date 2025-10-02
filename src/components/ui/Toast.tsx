import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 rounded-2xl shadow-soft-lg backdrop-blur-sm max-w-sm border slide-up ${
              toast.type === 'success' 
                ? 'bg-gradient-to-r from-pastel-green-50 to-pastel-green-100/80 text-pastel-green-800 border-pastel-green-200/50' 
                : 'bg-gradient-to-r from-pastel-rose-50 to-pastel-rose-100/80 text-pastel-rose-800 border-pastel-rose-200/50'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${
              toast.type === 'success' 
                ? 'bg-pastel-green-200/50' 
                : 'bg-pastel-rose-200/50'
            }`}>
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
            </div>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className={`flex-shrink-0 p-1 rounded-lg transition-all duration-200 hover:scale-110 ${
                toast.type === 'success' 
                  ? 'hover:bg-pastel-green-200/50' 
                  : 'hover:bg-pastel-rose-200/50'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}