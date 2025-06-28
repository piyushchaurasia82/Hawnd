import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import Alert from './Alert';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextProps {
  showToast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

let toastId = 0;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    toastId += 1;
    setToasts((prev) => [...prev, { ...toast, id: toastId }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, toast.duration || 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[99999999999] flex flex-col gap-3">
        {toasts.map((toast) => (
          <Alert
            key={toast.id}
            variant={toast.type}
            title={toast.title}
            message={toast.message}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}; 