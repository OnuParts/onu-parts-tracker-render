// A very simple toast utility that doesn't use React or JSX at all

// Types
interface ToastOptions {
  duration?: number;
  type?: 'success' | 'error' | 'info';
}

const defaultOptions: ToastOptions = {
  duration: 3000,
  type: 'info'
};

// Function to show a toast
function showToast(message: string, options: ToastOptions = {}) {
  const opts = { ...defaultOptions, ...options };
  
  // Create container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.innerHTML = message;
  toast.style.padding = '12px 16px';
  toast.style.margin = '8px';
  toast.style.backgroundColor = opts.type === 'error' ? '#f44336' : 
                               opts.type === 'success' ? '#4caf50' : '#2196f3';
  toast.style.color = 'white';
  toast.style.borderRadius = '4px';
  toast.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
  toast.style.minWidth = '200px';
  toast.style.textAlign = 'center';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.3s ease-in-out';
  
  // Add to container
  container.appendChild(toast);
  
  // Fade in
  setTimeout(() => {
    toast.style.opacity = '1';
  }, 10);
  
  // Remove after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    
    // Remove from DOM after transition completes
    setTimeout(() => {
      if (container && container.contains(toast)) {
        container.removeChild(toast);
      }
      
      // Remove container if empty
      if (container && container.childNodes.length === 0) {
        document.body.removeChild(container);
      }
    }, 300);
  }, opts.duration);
  
  return {
    message,
    close: () => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (container && container.contains(toast)) {
          container.removeChild(toast);
        }
      }, 300);
    }
  };
}

// Success and error shortcuts
function showSuccessToast(message: string, duration?: number) {
  return showToast(message, { type: 'success', duration });
}

function showErrorToast(message: string, duration?: number) {
  return showToast(message, { type: 'error', duration });
}

// Wrapper for React hooks compatibility
export function useSimpleToast() {
  return {
    toast: showToast,
    success: showSuccessToast,
    error: showErrorToast
  };
}

// Also export directly for non-hook usage
export const toast = showToast;
export const success = showSuccessToast;
export const error = showErrorToast;