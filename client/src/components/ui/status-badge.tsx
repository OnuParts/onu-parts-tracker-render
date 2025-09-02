import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
  {
    variants: {
      variant: {
        pending: "bg-slate-500 bg-opacity-10 text-slate-500",
        inProgress: "bg-amber-500 bg-opacity-10 text-amber-500",
        completed: "bg-green-600 bg-opacity-10 text-green-600",
        cancelled: "bg-red-600 bg-opacity-10 text-red-600",
        critical: "bg-red-600 bg-opacity-10 text-red-600",
        high: "bg-orange-500 bg-opacity-10 text-orange-500",
        medium: "bg-blue-500 bg-opacity-10 text-blue-500",
        low: "bg-green-600 bg-opacity-10 text-green-600",
      },
    },
    defaultVariants: {
      variant: "pending",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  text: string;
}

export function StatusBadge({ 
  className, 
  variant, 
  text, 
  ...props 
}: StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ variant }), className)}
      {...props}
    >
      {text}
    </span>
  );
}

export function WorkOrderStatusBadge({ status }: { status: string }) {
  let variant: 
    | "pending" 
    | "inProgress" 
    | "completed" 
    | "cancelled" = "pending";
  
  let text = "Pending";
  
  switch (status) {
    case "pending":
      variant = "pending";
      text = "Pending";
      break;
    case "in_progress":
      variant = "inProgress";
      text = "In Progress";
      break;
    case "completed":
      variant = "completed";
      text = "Completed";
      break;
    case "cancelled":
      variant = "cancelled";
      text = "Cancelled";
      break;
  }
  
  return <StatusBadge variant={variant} text={text} />;
}

export function PriorityBadge({ priority }: { priority: string }) {
  let variant: 
    | "critical" 
    | "high" 
    | "medium" 
    | "low" = "medium";
  
  let text = "Medium";
  
  switch (priority) {
    case "critical":
      variant = "critical";
      text = "Critical";
      break;
    case "high":
      variant = "high";
      text = "High";
      break;
    case "medium":
      variant = "medium";
      text = "Medium";
      break;
    case "low":
      variant = "low";
      text = "Low";
      break;
  }
  
  return <StatusBadge variant={variant} text={text} />;
}

export function InventoryStatusBadge({ 
  quantity, 
  reorderLevel 
}: { 
  quantity: number, 
  reorderLevel: number 
}) {
  // Calculate the ratio of current quantity to reorder level
  const ratio = quantity / reorderLevel;
  
  // Define the status levels with more granularity
  let variant: "cancelled" | "high" | "medium" | "low" | "completed" = "completed";
  let text = "Optimal";
  let icon = null;
  
  // Enhanced status determination logic with icons and more detailed categories
  if (ratio <= 0.1) {
    // Critical - Less than 10% of reorder level
    variant = "cancelled";
    text = "Critical";
    icon = <span className="mr-1">⚠️</span>;
  } else if (ratio <= 0.3) {
    // Low - Between 10% and 30% of reorder level
    variant = "cancelled";
    text = "Low Stock";
    icon = <span className="mr-1">⚠️</span>;
  } else if (ratio <= 0.5) {
    // Warning - Between 30% and 50% of reorder level
    variant = "high";
    text = "Warning";
    icon = <span className="mr-1">⚡</span>;
  } else if (ratio <= 0.8) {
    // Adequate - Between 50% and 80% of reorder level
    variant = "medium";
    text = "Adequate";
    icon = <span className="mr-1">✓</span>;
  } else if (ratio <= 1.5) {
    // Good - Between 80% and 150% of reorder level
    variant = "low";
    text = "Good";
    icon = <span className="mr-1">✓</span>;
  } else {
    // Excess - Above 150% of reorder level
    variant = "completed";
    text = "Excess";
    icon = <span className="mr-1">↑</span>;
  }
  
  return (
    <span className={cn(statusBadgeVariants({ variant }), "flex items-center justify-center")}>
      {icon}
      {text}
      <span className="ml-1 text-xs opacity-75">
        ({quantity}/{reorderLevel})
      </span>
    </span>
  );
}
