import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  DollarSign,
  Package,
  Calendar,
  Search,
  Download
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";

interface PartsUsageData {
  id: number;
  part_id: string;
  name: string;
  description: string;
  current_stock: number;
  reorder_level: number;
  unit_cost: string;
  category: string;
  supplier: string;
  location: string;
  total_issued: number;
  issue_count: number;
  avg_quantity_per_issue: number;
  last_issued: string | null;
  days_since_last_used: number | null;
  months_of_stock_remaining: number | null;
  movement_category: 'Fast Moving' | 'Medium Moving' | 'Slow Moving' | 'No Movement';
  usage_status: 'Never Used' | 'Not Used in 1+ Years' | 'Not Used in 6+ Months' | 'Not Used in 3+ Months' | 'Not Used in 1+ Months' | 'Recently Used';
  inventory_value: number;
}

interface UsageSummary {
  total_parts: number;
  fast_moving_count: number;
  medium_moving_count: number;
  slow_moving_count: number;
  no_movement_count: number;
  never_used_count: number;
  not_used_1_year_count: number;
  not_used_6_months_count: number;
  not_used_3_months_count: number;
  total_parts_issued: number;
  total_inventory_value: number;
  stagnant_inventory_value: number;
}

export default function PartsUsageAnalytics() {
  const [timeFrame, setTimeFrame] = useState("90");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: partsData = [], isLoading: partsLoading } = useQuery<PartsUsageData[]>({
    queryKey: ["/api/parts/usage-analytics", timeFrame],
    queryFn: async () => {
      const res = await fetch(`/api/parts/usage-analytics?timeFrame=${timeFrame}`);
      if (!res.ok) throw new Error('Failed to fetch parts usage data');
      return res.json();
    }
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<UsageSummary>({
    queryKey: ["/api/parts/usage-summary", timeFrame],
    queryFn: async () => {
      const res = await fetch(`/api/parts/usage-summary?timeFrame=${timeFrame}`);
      if (!res.ok) throw new Error('Failed to fetch usage summary');
      return res.json();
    }
  });

  // Filter parts based on search and category
  const filteredParts = partsData.filter(part => {
    const matchesSearch = searchTerm === "" || 
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.part_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || part.movement_category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group parts by usage status
  const neverUsedParts = filteredParts.filter(part => part.usage_status === 'Never Used');
  const notUsed1YearParts = filteredParts.filter(part => part.usage_status === 'Not Used in 1+ Years');
  const stagnantParts = [...neverUsedParts, ...notUsed1YearParts];
  const fastMovingParts = filteredParts.filter(part => part.movement_category === 'Fast Moving');
  const slowMovingParts = filteredParts.filter(part => part.movement_category === 'Slow Moving');

  const getMovementIcon = (category: string) => {
    switch (category) {
      case 'Fast Moving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'Medium Moving': return <Minus className="h-4 w-4 text-yellow-500" />;
      case 'Slow Moving': return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case 'No Movement': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getUsageStatusBadge = (status: string) => {
    const colors = {
      'Never Used': 'bg-red-100 text-red-800',
      'Not Used in 1+ Years': 'bg-red-100 text-red-800',
      'Not Used in 6+ Months': 'bg-orange-100 text-orange-800',
      'Not Used in 3+ Months': 'bg-yellow-100 text-yellow-800',
      'Not Used in 1+ Months': 'bg-blue-100 text-blue-800',
      'Recently Used': 'bg-green-100 text-green-800'
    };
    return <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const columns = [
    {
      header: "Part ID",
      accessor: "part_id" as keyof PartsUsageData,
      className: "font-mono text-sm"
    },
    {
      header: "Name",
      accessor: "name" as keyof PartsUsageData,
      className: "font-medium"
    },
    {
      header: "Category",
      accessor: "category" as keyof PartsUsageData
    },
    {
      header: "Current Stock",
      accessor: (part: PartsUsageData) => part.current_stock.toLocaleString(),
      className: "text-right"
    },
    {
      header: "Total Issued",
      accessor: (part: PartsUsageData) => part.total_issued.toLocaleString(),
      className: "text-right"
    },
    {
      header: "Days Since Last Used",
      accessor: (part: PartsUsageData) => part.days_since_last_used ? `${part.days_since_last_used} days` : 'Never',
      className: "text-right"
    },
    {
      header: "Movement",
      accessor: (part: PartsUsageData) => (
        <div className="flex items-center gap-2">
          {getMovementIcon(part.movement_category)}
          <span className="text-sm">{part.movement_category}</span>
        </div>
      )
    },
    {
      header: "Usage Status",
      accessor: (part: PartsUsageData) => getUsageStatusBadge(part.usage_status)
    },
    {
      header: "Inventory Value",
      accessor: (part: PartsUsageData) => `$${part.inventory_value.toFixed(2)}`,
      className: "text-right font-mono"
    }
  ];

  const handleExport = () => {
    // Create CSV content
    const headers = ['Part ID', 'Name', 'Category', 'Current Stock', 'Total Issued', 'Days Since Last Used', 'Movement Category', 'Usage Status', 'Inventory Value'];
    const csvContent = [
      headers.join(','),
      ...filteredParts.map(part => [
        part.part_id,
        `"${part.name}"`,
        part.category || '',
        part.current_stock,
        part.total_issued,
        part.days_since_last_used || 'Never',
        part.movement_category,
        part.usage_status,
        part.inventory_value.toFixed(2)
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parts-usage-analytics-${timeFrame}days-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (partsLoading || summaryLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parts Usage Analytics</h1>
          <p className="text-muted-foreground">
            Analyze parts usage patterns to optimize inventory management
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="timeFrame">Time Frame:</Label>
            <Select value={timeFrame} onValueChange={setTimeFrame}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">6 months</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Parts</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_parts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {summary.total_parts_issued.toLocaleString()} total issued
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fast Moving Parts</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.fast_moving_count}</div>
              <p className="text-xs text-muted-foreground">
                {((summary.fast_moving_count / summary.total_parts) * 100).toFixed(1)}% of inventory
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stagnant Parts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.never_used_count + summary.not_used_1_year_count}
              </div>
              <p className="text-xs text-muted-foreground">
                Never used or 1+ years idle
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stagnant Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${summary.stagnant_inventory_value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {((summary.stagnant_inventory_value / summary.total_inventory_value) * 100).toFixed(1)}% of total value
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stagnant">Stagnant Inventory</TabsTrigger>
          <TabsTrigger value="fast-moving">Fast Moving</TabsTrigger>
          <TabsTrigger value="all-parts">All Parts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Movement Categories</CardTitle>
                <CardDescription>Parts categorized by usage frequency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary && [
                  { label: 'Fast Moving', count: summary.fast_moving_count, color: 'bg-green-500' },
                  { label: 'Medium Moving', count: summary.medium_moving_count, color: 'bg-yellow-500' },
                  { label: 'Slow Moving', count: summary.slow_moving_count, color: 'bg-orange-500' },
                  { label: 'No Movement', count: summary.no_movement_count, color: 'bg-red-500' }
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Timeline</CardTitle>
                <CardDescription>When parts were last used</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary && [
                  { label: 'Recently Used', count: summary.total_parts - summary.never_used_count - summary.not_used_1_year_count - summary.not_used_6_months_count - summary.not_used_3_months_count, color: 'bg-green-500' },
                  { label: 'Not Used in 3+ Months', count: summary.not_used_3_months_count, color: 'bg-yellow-500' },
                  { label: 'Not Used in 6+ Months', count: summary.not_used_6_months_count, color: 'bg-orange-500' },
                  { label: 'Not Used in 1+ Years', count: summary.not_used_1_year_count, color: 'bg-red-500' },
                  { label: 'Never Used', count: summary.never_used_count, color: 'bg-gray-500' }
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stagnant" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Stagnant Inventory - Consider Reducing Orders
              </CardTitle>
              <CardDescription>
                Parts that haven't been used in over a year or never used at all. 
                These may be candidates for reduced ordering or disposal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Total stagnant parts: <strong>{stagnantParts.length}</strong></span>
                  <span>Total value: <strong>${stagnantParts.reduce((sum, part) => sum + part.inventory_value, 0).toFixed(2)}</strong></span>
                </div>
                <DataTable
                  data={stagnantParts}
                  columns={columns}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fast-moving" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Fast Moving Parts - Consider Increasing Stock
              </CardTitle>
              <CardDescription>
                Parts with high usage rates that may need increased stock levels or more frequent reordering.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Total fast moving parts: <strong>{fastMovingParts.length}</strong></span>
                  <span>Total issued: <strong>{fastMovingParts.reduce((sum, part) => sum + part.total_issued, 0).toLocaleString()}</strong></span>
                </div>
                <DataTable
                  data={fastMovingParts}
                  columns={columns}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-parts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Parts Usage Analysis</CardTitle>
              <CardDescription>
                Complete analysis of all parts usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Search Parts</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by name, part ID, or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category">Filter by Movement</Label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Fast Moving">Fast Moving</SelectItem>
                        <SelectItem value="Medium Moving">Medium Moving</SelectItem>
                        <SelectItem value="Slow Moving">Slow Moving</SelectItem>
                        <SelectItem value="No Movement">No Movement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DataTable
                  data={filteredParts}
                  columns={columns}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}