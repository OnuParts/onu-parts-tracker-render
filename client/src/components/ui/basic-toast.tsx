import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

// Define the toast types
type ToastType = 'default' | 'success' | 'error';

// Toast properties
interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Context for toast management
interface ToastContextType {
  toasts: ToastProps[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

// Create the context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast container that displays all toasts
const ToastContainer: React.FC = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('Toast component must be used within a ToastProvider');
  }
  
  const { toasts, removeToast } = context;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={`p-4 rounded shadow-lg flex items-start justify-between ${
            toast.type === 'error' 
              ? 'bg-red-500 text-white' 
              : toast.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-800 border border-gray-200'
          }`}
        >
          <span>{toast.message}</span>
          <button 
            onClick={() => removeToast(toast.id)}
            className="ml-4 text-current opacity-70 hover:opacity-100"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

// Provider that manages toast state
export const ToastProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  
  // Remove a toast by ID
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  // Add a new toast
  const addToast = useCallback((message: string, type: ToastType = 'default', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  }, [removeToast]);
  
  // Context value
  const value = {
    toasts,
    addToast,
    removeToast
  };
  
  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Hook to use toast functionality
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return {
    toast: (message: string) => context.addToast(message),
    success: (message: string) => context.addToast(message, 'success'),
    error: (message: string) => context.addToast(message, 'error'),
    dismiss: context.removeToast
  };
};