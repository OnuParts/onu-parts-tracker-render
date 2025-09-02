import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'default' | 'destructive';

interface ToastProps {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: ToastVariant;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  title,
  description,
  action,
  variant = 'default',
  className,
  onOpenChange,
  open,
}) => {
  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-md rounded-md border p-4 shadow-md',
        variant === 'destructive' 
          ? 'bg-destructive text-destructive-foreground border-destructive' 
          : 'bg-background text-foreground',
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {description && <div className="text-sm opacity-90 mt-1">{description}</div>}
        </div>
        
        <button 
          onClick={handleClose}
          className="text-foreground/50 hover:text-foreground focus:outline-none ml-4"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {action && (
        <div className="mt-3 flex justify-end">
          {action}
        </div>
      )}
    </div>
  );
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

interface ToasterState {
  toasts: ToastProps[];
}

interface ToasterContextValue extends ToasterState {
  toast: (props: Omit<ToastProps, 'id'>) => { id: string; dismiss: () => void };
  dismiss: (id?: string) => void;
}

const ToasterContext = React.createContext<ToasterContextValue | null>(null);

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);
  
  // Generate ID for toasts
  const generateId = React.useCallback(() => {
    return Math.random().toString(36).substring(2, 9);
  }, []);
  
  // Add a toast
  const toast = React.useCallback((props: Omit<ToastProps, 'id'>) => {
    const id = generateId();
    
    setToasts((prevToasts) => [
      ...prevToasts,
      {
        ...props,
        id,
        open: true,
        onOpenChange: (open) => {
          if (!open) dismiss(id);
        },
      },
    ]);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismiss(id);
    }, 5000);
    
    return {
      id,
      dismiss: () => dismiss(id),
    };
  }, [generateId]);
  
  // Dismiss toast(s)
  const dismiss = React.useCallback((id?: string) => {
    setToasts((prevToasts) => {
      if (id) {
        return prevToasts.filter((toast) => toast.id !== id);
      }
      return [];
    });
  }, []);
  
  const value = React.useMemo(() => ({
    toasts,
    toast,
    dismiss,
  }), [toasts, toast, dismiss]);
  
  return (
    <ToasterContext.Provider value={value}>
      {children}
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </ToasterContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToasterContext);
  if (!context) {
    throw new Error('useToast must be used within a ToasterProvider');
  }
  return context;
}