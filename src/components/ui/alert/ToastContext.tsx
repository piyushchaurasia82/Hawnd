import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import Alert from './Alert';

interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'default';
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  actions?: ToastAction[];
}

interface ToastContextProps {
  showToast: (toast: Omit<Toast, 'id'>) => number;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

let toastId = 0;
const TOAST_STORAGE_KEY = 'app_last_toast';

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Remove toast by id
  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Show toast and persist in localStorage
  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    toastId += 1;
    const newToast = { ...toast, id: toastId };
    setToasts((prev) => [...prev, newToast]);
    // Persist in localStorage
    localStorage.setItem(TOAST_STORAGE_KEY, JSON.stringify({ ...newToast, shownAt: Date.now() }));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, toast.duration || 5000);
    return newToast.id;
  }, []);

  // Listen for toast:remove events
  React.useEffect(() => {
    const handler = (e: any) => {
      if (e.detail && typeof e.detail.id === 'number') {
        setToasts((prev) => prev.filter((t) => t.id !== e.detail.id));
      }
    };
    window.addEventListener('toast:remove', handler);
    return () => window.removeEventListener('toast:remove', handler);
  }, []);

  // On mount, show toast from localStorage if present and not expired
  useEffect(() => {
    const stored = localStorage.getItem(TOAST_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Only show if not expired (within duration)
        const now = Date.now();
        const duration = parsed.duration || 5000;
        if (parsed.shownAt && now - parsed.shownAt < duration) {
          setToasts([{ ...parsed, id: ++toastId }]);
          // Remove from storage immediately so it doesn't show again
          localStorage.removeItem(TOAST_STORAGE_KEY);
          setTimeout(() => {
            setToasts([]);
          }, duration - (now - parsed.shownAt));
        } else {
          localStorage.removeItem(TOAST_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(TOAST_STORAGE_KEY);
      }
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast/blur wrapper: fixed, top-right, width fits toast */}
      {toasts.length > 0 && (
        <div className="fixed top-6 right-6 z-[99999999998]" style={{ pointerEvents: 'none' }}>
          {/* Blur overlay, fills parent */}
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              background: 'rgba(255,255,255,0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />
          {/* Toast container, fills parent, pointer events enabled */}
          <div className="relative z-10 w-full toast-container" style={{ pointerEvents: 'auto' }}>
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className="toast-item animate-slide-in"
              >
                <Alert
                  variant={toast.type}
                  title={toast.title}
                  message={toast.message}
                  duration={toast.duration}
                  onClose={() => removeToast(toast.id)}
                  actions={toast.actions}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}; 