import { Card, CardContent } from "@/components/ui/card";
import { 
  LucideIcon, 
  TrendingUp, 
  TrendingDown, 
  Minus 
} from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
}

export function DashboardCard({
  title,
  value,
  icon: Icon,
  iconBgColor,
  iconColor,
  trend,
}: DashboardCardProps) {
  const getTrendIcon = () => {
    switch (trend?.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 mr-1" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 mr-1" />;
      default:
        return <Minus className="h-4 w-4 mr-1" />;
    }
  };

  const getTrendColor = () => {
    switch (trend?.direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-orange-600';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-full ${iconBgColor} bg-opacity-20 flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
        {trend && (
          <p className={`text-sm mt-2 flex items-center ${getTrendColor()}`}>
            {getTrendIcon()}
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
