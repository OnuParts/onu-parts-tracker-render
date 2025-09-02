import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, Check, TrendingUp } from 'lucide-react';
import { cva } from 'class-variance-authority';

type InventoryStatus = 'excess' | 'good' | 'adequate' | 'warning' | 'low' | 'critical';

interface InventoryStatusIndicatorProps {
  quantity: number;
  reorderLevel: number;
  className?: string;
  showDetails?: boolean;
  cardStyle?: boolean;
}

const statusIconVariants = cva('mr-1.5', {
  variants: {
    status: {
      critical: 'text-red-600',
      low: 'text-red-500',
      warning: 'text-orange-500',
      adequate: 'text-yellow-500',
      good: 'text-green-500',
      excess: 'text-blue-500',
    }
  },
  defaultVariants: {
    status: 'adequate'
  }
});

const statusBgVariants = cva('', {
  variants: {
    status: {
      critical: 'bg-red-50 border-red-200',
      low: 'bg-red-50 border-red-200',
      warning: 'bg-orange-50 border-orange-200',
      adequate: 'bg-yellow-50 border-yellow-200',
      good: 'bg-green-50 border-green-200',
      excess: 'bg-blue-50 border-blue-200',
    }
  },
  defaultVariants: {
    status: 'adequate'
  }
});

const statusTextVariants = cva('font-medium', {
  variants: {
    status: {
      critical: 'text-red-700',
      low: 'text-red-700',
      warning: 'text-orange-700',
      adequate: 'text-yellow-700',
      good: 'text-green-700',
      excess: 'text-blue-700',
    }
  },
  defaultVariants: {
    status: 'adequate'
  }
});

/**
 * Enhanced smart color-coded inventory status indicator that shows inventory levels 
 * with visual cues and optional details
 */
export function InventoryStatusIndicator({ 
  quantity, 
  reorderLevel, 
  className,
  showDetails = false,
  cardStyle = false
}: InventoryStatusIndicatorProps) {
  // Calculate the ratio of current quantity to reorder level
  const ratio = quantity / reorderLevel;
  
  // Calculate status based on quantity and reorder level with more granularity
  const getStatus = (): InventoryStatus => {
    if (quantity <= 0) {
      return 'critical';
    } else if (ratio <= 0.3) {
      return 'low';
    } else if (ratio <= 0.5) {
      return 'warning';
    } else if (ratio <= 0.8) {
      return 'adequate';
    } else if (ratio <= 1.5) {
      return 'good';
    } else {
      return 'excess';
    }
  };

  const status = getStatus();

  // Define status labels
  const statusLabels = {
    critical: 'Out of Stock',
    low: 'Low Stock',
    warning: 'Warning',
    adequate: 'Adequate',
    good: 'Good',
    excess: 'Excess',
  };

  // Define status icons
  const StatusIcon = () => {
    switch (status) {
      case 'critical':
      case 'low':
        return <AlertCircle size={16} className={statusIconVariants({ status })} />;
      case 'warning':
        return <AlertTriangle size={16} className={statusIconVariants({ status })} />;
      case 'adequate':
      case 'good':
        return <Check size={16} className={statusIconVariants({ status })} />;
      case 'excess':
        return <TrendingUp size={16} className={statusIconVariants({ status })} />;
    }
  };

  // For non-card style (simple indicator)
  if (!cardStyle) {
    return (
      <div className={cn("flex items-center", className)}>
        <StatusIcon />
        <span className={statusTextVariants({ status })}>
          {statusLabels[status]}
        </span>
        {showDetails && (
          <span className="ml-1.5 text-xs text-gray-500">
            ({quantity}/{reorderLevel})
          </span>
        )}
      </div>
    );
  }

  // For card style (more visually prominent)
  return (
    <div className={cn(
      "border rounded-md px-3 py-2 flex items-center", 
      statusBgVariants({ status }),
      className
    )}>
      <StatusIcon />
      <div>
        <div className={statusTextVariants({ status })}>
          {statusLabels[status]}
        </div>
        {showDetails && (
          <div className="text-xs text-gray-600 mt-0.5">
            Current: <span className="font-medium">{quantity}</span> | 
            Reorder: <span className="font-medium">{reorderLevel}</span>
          </div>
        )}
      </div>
    </div>
  );
}