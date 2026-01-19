import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  // Detect theme from body class
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    document.body.classList.contains('dark-mode') ? 'dark' : 'light'
  );

  // Watch for theme changes
  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 max-w-md">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} theme={theme} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
  theme: 'dark' | 'light';
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose, theme }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getColorClass = () => {
    switch (toast.type) {
      case 'success':
        return theme === 'dark'
          ? 'border-emerald-500/20 bg-emerald-500/5'
          : 'border-emerald-500/30 bg-emerald-50';
      case 'error':
        return theme === 'dark'
          ? 'border-rose-500/20 bg-rose-500/5'
          : 'border-rose-500/30 bg-rose-50';
      case 'info':
        return theme === 'dark'
          ? 'border-blue-500/20 bg-blue-500/5'
          : 'border-blue-500/30 bg-blue-50';
    }
  };

  return (
    <div
      className={`
        premium-glass rounded-[24px] p-4 pr-12 border shadow-2xl
        flex items-center gap-3 min-w-[300px] max-w-md
        animate-in slide-in-from-right duration-300
        ${getColorClass()}
      `}
    >
      {getIcon()}
      <p className={`flex-1 text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
        {toast.message}
      </p>
      <button
        onClick={onClose}
        className={`absolute top-3 right-3 p-1 rounded-lg transition-colors ${
          theme === 'dark'
            ? 'hover:bg-white/10 text-slate-400'
            : 'hover:bg-slate-200 text-slate-500'
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
