import React, { ReactNode } from "react";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export const DashboardHeader = ({ title, subtitle, icon }: DashboardHeaderProps) => {
  return (
    <div className="flex items-center justify-between py-4 px-8 border-b">
      <div className="flex items-center space-x-4">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};