import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { WorkOrderWithAssignee } from "@shared/schema";

export function WorkOrderStatusChart() {
  // Fetch work orders
  const { data: workOrders, isLoading } = useQuery<WorkOrderWithAssignee[]>({
    queryKey: ['/api/work-orders'],
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Process data for the chart
  const statusCount = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  };
  
  workOrders?.forEach(wo => {
    if (wo.status in statusCount) {
      statusCount[wo.status as keyof typeof statusCount]++;
    }
  });
  
  const chartData = [
    { name: "Pending", value: statusCount.pending, color: "#64748b" },
    { name: "In Progress", value: statusCount.in_progress, color: "#f59e0b" },
    { name: "Completed", value: statusCount.completed, color: "#10b981" },
    { name: "Cancelled", value: statusCount.cancelled, color: "#ef4444" },
  ].filter(item => item.value > 0); // Only show statuses with values
  
  const renderTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-md p-2 shadow-md">
          <p className="font-medium">
            {payload[0].name}: {payload[0].value} ({Math.round((payload[0].value / workOrders!.length) * 100)}%)
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          dataKey="value"
          nameKey="name"
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
            const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
            
            return percent > 0.05 ? (
              <text 
                x={x} 
                y={y} 
                fill="#fff" 
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight={600}
              >
                {name}
              </text>
            ) : null;
          }}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={renderTooltip} />
        <Legend 
          verticalAlign="bottom" 
          height={36} 
          iconType="circle"
          layout="horizontal"
          formatter={(value, entry, index) => (
            <span className="text-sm">{value} ({chartData[index].value})</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
