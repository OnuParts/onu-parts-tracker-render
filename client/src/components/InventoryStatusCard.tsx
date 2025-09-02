import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InventoryStatusIndicator } from './InventoryStatusIndicator';
import { AlertCircle, AlertTriangle, Check, TrendingUp, PackageX } from 'lucide-react';

interface InventoryStatusCardProps {
  title: string;
  parts: Array<{
    id: number;
    name: string;
    partId: string;
    quantity: number;
    reorderLevel: number;
  }>;
  className?: string;
}

/**
 * A card component that displays inventory status information
 * for multiple parts with color-coded indicators
 */
export function InventoryStatusCard({ title, parts, className }: InventoryStatusCardProps) {
  // Handle empty parts array
  if (!parts || parts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <PackageX className="h-16 w-16 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-center">No parts data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Group parts by status
  const groupedParts = parts.reduce((acc: {
    critical: typeof parts;
    low: typeof parts;
    warning: typeof parts;
    adequate: typeof parts;
    good: typeof parts;
    excess: typeof parts;
  }, part) => {
    if (part.quantity <= 0) {
      acc.critical.push(part);
    } else if (part.reorderLevel && part.quantity <= part.reorderLevel * 0.3) {
      acc.low.push(part);
    } else if (part.reorderLevel && part.quantity <= part.reorderLevel * 0.8) {
      acc.warning.push(part);
    } else if (part.reorderLevel && part.quantity <= part.reorderLevel * 1.2) {
      acc.adequate.push(part);
    } else {
      acc.good.push(part);
    }
    
    return acc;
  }, {
    critical: [] as typeof parts,
    low: [] as typeof parts,
    warning: [] as typeof parts,
    adequate: [] as typeof parts,
    good: [] as typeof parts,
    excess: [] as typeof parts
  });

  const totalParts = parts.length;
  const criticalCount = groupedParts.critical.length;
  const lowCount = groupedParts.low.length;
  const warningCount = groupedParts.warning.length;
  const adequateCount = groupedParts.adequate.length;
  const goodCount = groupedParts.good.length;
  const excessCount = groupedParts.excess.length;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary statistics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex flex-col p-3 border rounded-md bg-red-50 border-red-200">
              <div className="flex items-center">
                <AlertCircle size={16} className="mr-1.5 text-red-600" />
                <span className="text-sm font-medium text-red-700">Critical</span>
              </div>
              <div className="mt-1">
                <span className="text-2xl font-bold text-red-800">{criticalCount}</span>
                <span className="text-xs text-red-600 ml-1">parts</span>
              </div>
            </div>
            
            <div className="flex flex-col p-3 border rounded-md bg-orange-50 border-orange-200">
              <div className="flex items-center">
                <AlertTriangle size={16} className="mr-1.5 text-orange-500" />
                <span className="text-sm font-medium text-orange-700">Low</span>
              </div>
              <div className="mt-1">
                <span className="text-2xl font-bold text-orange-800">{lowCount + warningCount}</span>
                <span className="text-xs text-orange-600 ml-1">parts</span>
              </div>
            </div>
            
            <div className="flex flex-col p-3 border rounded-md bg-green-50 border-green-200">
              <div className="flex items-center">
                <Check size={16} className="mr-1.5 text-green-500" />
                <span className="text-sm font-medium text-green-700">Healthy</span>
              </div>
              <div className="mt-1">
                <span className="text-2xl font-bold text-green-800">{adequateCount + goodCount}</span>
                <span className="text-xs text-green-600 ml-1">parts</span>
              </div>
            </div>
          </div>
          
          {/* Status distribution bar */}
          <div className="mt-4">
            <div className="text-sm font-medium mb-1.5">Status Distribution</div>
            <div className="flex w-full h-3 rounded-full overflow-hidden">
              {criticalCount > 0 && (
                <div 
                  className="bg-red-600" 
                  style={{ 
                    width: `${(criticalCount / totalParts) * 100}%` 
                  }}
                />
              )}
              {lowCount > 0 && (
                <div 
                  className="bg-red-400" 
                  style={{ 
                    width: `${(lowCount / totalParts) * 100}%` 
                  }}
                />
              )}
              {warningCount > 0 && (
                <div 
                  className="bg-orange-500" 
                  style={{ 
                    width: `${(warningCount / totalParts) * 100}%` 
                  }}
                />
              )}
              {adequateCount > 0 && (
                <div 
                  className="bg-yellow-400" 
                  style={{ 
                    width: `${(adequateCount / totalParts) * 100}%` 
                  }}
                />
              )}
              {goodCount > 0 && (
                <div 
                  className="bg-green-500" 
                  style={{ 
                    width: `${(goodCount / totalParts) * 100}%` 
                  }}
                />
              )}
              {excessCount > 0 && (
                <div 
                  className="bg-blue-500" 
                  style={{ 
                    width: `${(excessCount / totalParts) * 100}%` 
                  }}
                />
              )}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Critical ({criticalCount})</span>
              <span>Low ({lowCount + warningCount})</span>
              <span>Adequate ({adequateCount + goodCount})</span>
              <span>Excess ({excessCount})</span>
            </div>
          </div>
          
          {/* Critical items section */}
          {criticalCount > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2 text-red-700 flex items-center">
                <AlertCircle size={14} className="mr-1.5" />
                Critical Items
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {groupedParts.critical.map(part => (
                  <div key={part.id} className="border border-red-200 rounded-md p-2 bg-red-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{part.name}</div>
                        <div className="text-xs text-gray-500">{part.partId}</div>
                      </div>
                      <InventoryStatusIndicator
                        quantity={part.quantity}
                        reorderLevel={part.reorderLevel}
                        showDetails={true}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Low stock items section if there are any */}
          {lowCount > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2 text-orange-700 flex items-center">
                <AlertTriangle size={14} className="mr-1.5" />
                Low Stock Items
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {groupedParts.low.slice(0, 5).map(part => (
                  <div key={part.id} className="border border-orange-200 rounded-md p-2 bg-orange-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{part.name}</div>
                        <div className="text-xs text-gray-500">{part.partId}</div>
                      </div>
                      <InventoryStatusIndicator
                        quantity={part.quantity}
                        reorderLevel={part.reorderLevel}
                        showDetails={true}
                      />
                    </div>
                  </div>
                ))}
                {groupedParts.low.length > 5 && (
                  <div className="text-center text-xs text-orange-600 font-medium pt-1">
                    + {groupedParts.low.length - 5} more low stock items
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}