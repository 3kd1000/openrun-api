import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'default' | 'success' | 'error' | 'warning';

interface ToastState {
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'default', duration: number = 3000) => {
    setToast({ message, type, duration });
  }, []);

  const handleClose = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={handleClose}
        />
      )}
    </ToastContext.Provider>
  );
};

// 내부 Toast 컴포넌트
interface ToastProps {
  message: string;
  type: ToastType;
  duration: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, duration, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'var(--color-success, #22c55e)';
      case 'error':
        return 'var(--color-error, #ef4444)';
      case 'warning':
        return 'var(--color-warning, #f59e0b)';
      default:
        return 'var(--color-text, #333)';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(var(--navigation-height, 60px) + 16px)',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: getBackgroundColor(),
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        zIndex: 9999,
        textAlign: 'center',
        maxWidth: 'calc(100vw - 32px)',
        wordBreak: 'keep-all',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        animation: 'toastFadeIn 0.2s ease-out',
      }}
    >
      {message}
      <style>{`
        @keyframes toastFadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ToastProvider;
