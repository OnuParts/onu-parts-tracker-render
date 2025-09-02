import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Download, TrendingDown, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { format, differenceInDays, differenceInMonths, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';

interface AgingData {
  partId: string;
  name: string;
  description: string | null;
  quantity: number;
  unitCost: string | null;
  lastIssuedDate: string | null;
  lastRestockDate: string | null;
  category: string | null;
  location: string | null;
  daysSinceLastIssued: number | null;
  daysSinceLastRestock: number | null;
  agingCategory: 'fast-moving' | 'slow-moving' | 'stagnant' | 'dead-stock';
  estimatedValue: number;
}

export default function InventoryAging() {
  const [agingFilter, setAgingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'days-issued' | 'days-restock' | 'value' | 'quantity'>('days-issued');

  // Fetch aging data
  const { data: agingData = [], isLoading } = useQuery<AgingData[]>({
    queryKey: ['/api/inventory/aging-analysis'],
  });

  // Filter and sort data
  const filteredData = (agingData || [])
    .filter((item: any) => agingFilter === 'all' || item.agingCategory === agingFilter)
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case 'days-issued':
          return (b.daysSinceLastIssued || 0) - (a.daysSinceLastIssued || 0);
        case 'days-restock':
          return (b.daysSinceLastRestock || 0) - (a.daysSinceLastRestock || 0);
        case 'value':
          return (b.estimatedValue || 0) - (a.estimatedValue || 0);
        case 'quantity':
          return (b.quantity || 0) - (a.quantity || 0);
        default:
          return 0;
      }
    });

  // Calculate summary statistics
  const summary = {
    totalParts: (agingData || []).length,
    totalValue: (agingData || []).reduce((sum: any, item: any) => sum + (item.estimatedValue || 0), 0),
    fastMoving: (agingData || []).filter((item: any) => item.agingCategory === 'fast-moving').length,
    slowMoving: (agingData || []).filter((item: any) => item.agingCategory === 'slow-moving').length,
    stagnant: (agingData || []).filter((item: any) => item.agingCategory === 'stagnant').length,
    deadStock: (agingData || []).filter((item: any) => item.agingCategory === 'dead-stock').length,
    stagnantValue: (agingData || [])
      .filter((item: any) => item.agingCategory === 'stagnant' || item.agingCategory === 'dead-stock')
      .reduce((sum: any, item: any) => sum + (item.estimatedValue || 0), 0),
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      'fast-moving': { variant: 'default' as const, label: 'Fast Moving', color: 'bg-green-500' },
      'slow-moving': { variant: 'secondary' as const, label: 'Slow Moving', color: 'bg-yellow-500' },
      'stagnant': { variant: 'destructive' as const, label: 'Stagnant', color: 'bg-orange-500' },
      'dead-stock': { variant: 'destructive' as const, label: 'Dead Stock', color: 'bg-red-500' },
    };
    
    const config = variants[category as keyof typeof variants] || variants['slow-moving'];
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const exportToExcel = () => {
    const exportData = filteredData.map(item => ({
      'Part ID': item.partId,
      'Part Name': item.name,
      'Description': item.description || '',
      'Category': item.category || '',
      'Location': item.location || '',
      'Quantity': item.quantity,
      'Unit Cost': item.unitCost || '',
      'Estimated Value': item.estimatedValue,
      'Last Issued Date': item.lastIssuedDate ? format(parseISO(item.lastIssuedDate), 'yyyy-MM-dd') : 'Never',
      'Days Since Last Issued': item.daysSinceLastIssued || 'N/A',
      'Last Restock Date': item.lastRestockDate ? format(parseISO(item.lastRestockDate), 'yyyy-MM-dd') : 'Never',
      'Days Since Last Restock': item.daysSinceLastRestock || 'N/A',
      'Aging Category': item.agingCategory.replace('-', ' ').replace(/\b\w/g, (l: any) => l.toUpperCase()),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Auto-size columns
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Aging Report');
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    XLSX.writeFile(wb, `inventory_aging_report_${timestamp}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading aging analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Aging Analysis</h2>
          <p className="text-muted-foreground">
            Analyze parts based on usage patterns and time since last activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportToExcel} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Link href="/dashboard">
            <button className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-medium shadow-sm">
              ← Back to Dashboard
            </button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalParts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ${summary.totalValue.toLocaleString()} total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fast Moving</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.fastMoving}</div>
            <p className="text-xs text-muted-foreground">
              {((summary.fastMoving / summary.totalParts) * 100).toFixed(1)}% of inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slow Moving</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.slowMoving}</div>
            <p className="text-xs text-muted-foreground">
              {((summary.slowMoving / summary.totalParts) * 100).toFixed(1)}% of inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stagnant/Dead</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.stagnant + summary.deadStock}</div>
            <p className="text-xs text-muted-foreground">
              ${summary.stagnantValue.toLocaleString()} tied up
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Sort</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Filter by Category</label>
              <Select value={agingFilter} onValueChange={setAgingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="fast-moving">Fast Moving</SelectItem>
                  <SelectItem value="slow-moving">Slow Moving</SelectItem>
                  <SelectItem value="stagnant">Stagnant</SelectItem>
                  <SelectItem value="dead-stock">Dead Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Sort by</label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sort option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days-issued">Days Since Last Issued</SelectItem>
                  <SelectItem value="days-restock">Days Since Last Restock</SelectItem>
                  <SelectItem value="value">Estimated Value</SelectItem>
                  <SelectItem value="quantity">Quantity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Aging Analysis Results</CardTitle>
          <CardDescription>
            Showing {filteredData.length} of {summary.totalParts} parts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Part ID</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Location</th>
                  <th className="text-right p-2">Qty</th>
                  <th className="text-right p-2">Value</th>
                  <th className="text-right p-2">Days Since<br/>Last Issued</th>
                  <th className="text-right p-2">Days Since<br/>Last Restock</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.partId} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono text-xs">{item.partId}</td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-xs">{item.category || 'N/A'}</td>
                    <td className="p-2 text-xs">{item.location || 'N/A'}</td>
                    <td className="p-2 text-right">{item.quantity}</td>
                    <td className="p-2 text-right">${item.estimatedValue.toFixed(2)}</td>
                    <td className="p-2 text-right">
                      {item.daysSinceLastIssued !== null ? (
                        <span className={item.daysSinceLastIssued > 365 ? 'text-red-600 font-medium' : 
                          item.daysSinceLastIssued > 180 ? 'text-yellow-600' : ''}>
                          {item.daysSinceLastIssued}
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">Never</span>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {item.daysSinceLastRestock !== null ? (
                        <span className={item.daysSinceLastRestock > 365 ? 'text-red-600 font-medium' : 
                          item.daysSinceLastRestock > 180 ? 'text-yellow-600' : ''}>
                          {item.daysSinceLastRestock}
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">Never</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {getCategoryBadge(item.agingCategory)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No parts match the selected criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}