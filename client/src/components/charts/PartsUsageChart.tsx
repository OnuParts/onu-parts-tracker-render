import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Helper to get month name
const getMonthName = (date: Date): string => {
  return date.toLocaleString('default', { month: 'short' });
};

// Helper to create empty months data
const createEmptyMonthsData = () => {
  const data = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    data.push({
      month: getMonthName(date),
      count: 0,
    });
  }
  return data;
};

interface MonthlyUsageData {
  month: string;
  count: number;
}

export function PartsUsageChart() {
  // Fetch actual monthly parts usage data from the database
  const { data: monthlyUsageData, isLoading: usageLoading } = useQuery<MonthlyUsageData[]>({
    queryKey: ['/api/parts-issuance/monthly-usage'],
  });
  
  if (usageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Use real data from the database, fallback to empty months if no data
  const chartData = monthlyUsageData && monthlyUsageData.length > 0 
    ? monthlyUsageData 
    : createEmptyMonthsData();
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{
          top: 10,
          right: 10,
          left: 10,
          bottom: 10,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          width={30}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            borderRadius: "6px",
            fontSize: "12px",
          }}
          formatter={(value) => [`${value} parts`, "Usage"]}
          labelStyle={{ fontWeight: "bold" }}
        />
        <Legend wrapperStyle={{ paddingTop: "10px" }} />
        <Bar 
          name="Parts Used" 
          dataKey="count" 
          fill="hsl(var(--chart-1))" 
          radius={[4, 4, 0, 0]}
          barSize={30}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
