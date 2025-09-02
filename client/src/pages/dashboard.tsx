import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { InventoryStatusBadge } from "@/components/ui/status-badge";
import { InventoryStatusIndicator } from "@/components/InventoryStatusIndicator";
import { InventoryStatusCard } from "@/components/InventoryStatusCard";
import { PartsUsageChart } from "@/components/charts/PartsUsageChart";
import { 
  Loader2, Package2, BoxesIcon, AlertTriangle, AlertCircle, Check, User, 
  Eye, PlusCircle, PackageOpen, RefreshCcw, Truck, ShoppingBag, Wrench, ShoppingCart, Hammer,
  Database, Save
} from "lucide-react";
import type { PartWithAvailability, PartsIssuanceWithDetails as PartsChargeOutWithDetails, Part } from "@shared/schema";
import { Link } from "wouter";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const [isPartDetailsOpen, setIsPartDetailsOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use manual fetch for dashboard stats to bypass potential caching
  const [stats, setStats] = useState<{
    totalParts: number;
    totalPartsInStock: number;
    // The server sends 'totalPartsIssuance' but we're mapping it to 'monthlyPartsIssuance'
    totalPartsIssuance?: number;
    monthlyPartsIssuance?: number;
    lowStockItemsCount: number;
    healthyStockCount: number;
    mediumStockCount: number;
    lowStockCount: number;
    partsWithReorderLevels: number;
    partsWithoutReorderLevels: number;
  } | null>(null);
  
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Manually fetch stats directly
  useEffect(() => {
    async function fetchStats() {
      setStatsLoading(true);
      try {
        const timestamp = new Date().getTime(); // Add cache-busting parameter
        const response = await fetch(`/api/stats?_=${timestamp}`);
        const data = await response.json();
        console.log("DIRECT STATS FETCH RESPONSE:", data);
        
        // The server already sends monthlyPartsIssuance correctly, no mapping needed
        const mappedData = {
          ...data
        };
        
        setStats(mappedData);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setStatsLoading(false);
      }
    }
    
    fetchStats();
  }, []);
  
  // Fetch low stock parts
  const { data: lowStockParts, isLoading: partsLoading } = useQuery<PartWithAvailability[]>({
    queryKey: ['/api/parts/low-stock'],
  });
  
  // Fetch recent part charge-outs
  const { data: recentIssuance, isLoading: issuanceLoading } = useQuery<PartsChargeOutWithDetails[]>({
    queryKey: ['/api/parts-issuance/recent'],
    staleTime: 0, // Force fresh data
  });
  
  // Reset charge-out count mutation
  const resetIssuanceMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await apiRequest("POST", "/api/reset-issuance-count", { password });
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate stats to refresh the dashboard counts
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: "Success",
        description: "Monthly part charge-out count has been reset to zero.",
        variant: "default",
      });
      
      // Close the dialog and reset state
      setIsResetDialogOpen(false);
      setAdminPassword("");
      setIsResetting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset charge-out count. Please verify your password.",
        variant: "destructive",
      });
      setIsResetting(false);
    }
  });
  
  // Manual database backup mutation
  const manualBackupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/manual-backup");
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Backup Successful",
        description: `Database backup completed successfully at ${new Date().toLocaleTimeString()}`,
        variant: "default",
      });
      
      // Close the dialog and reset state
      setIsBackupDialogOpen(false);
      setIsBackingUp(false);
    },
    onError: (error: any) => {
      toast({
        title: "Backup Failed",
        description: error.message || "Database backup operation failed. Please try again later.",
        variant: "destructive",
      });
      setIsBackingUp(false);
    }
  });
  
  // Handle reset request
  const handleReset = () => {
    if (!adminPassword) {
      toast({
        title: "Error",
        description: "Admin password is required",
        variant: "destructive",
      });
      return;
    }
    
    setIsResetting(true);
    resetIssuanceMutation.mutate(adminPassword);
  };
  
  // Handle backup request
  const handleBackup = () => {
    setIsBackingUp(true);
    manualBackupMutation.mutate();
  };
  
  // Parts columns
  const partsColumns = [
    {
      header: "Part ID",
      accessor: "partId",
      className: "whitespace-nowrap",
    },
    {
      header: "Description",
      accessor: "name",
    },
    {
      header: "In Stock",
      accessor: (part: PartWithAvailability) => (
        <span className={part.availability === 'low' ? 'text-red-600 font-medium' : 'text-amber-600 font-medium'}>
          {part.quantity}
        </span>
      ),
    },
    {
      header: "Reorder Level",
      accessor: "reorderLevel",
    },
    {
      header: "Status",
      accessor: (part: PartWithAvailability) => (
        <InventoryStatusIndicator 
          quantity={part.quantity} 
          reorderLevel={part.reorderLevel}
          showDetails={false}
        />
      ),
    },
    {
      header: "Actions",
      accessor: (part: PartWithAvailability) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="h-8 text-secondary-foreground" asChild>
            <Link href="/parts-issuance">
              <Wrench className="h-4 w-4 mr-1" />
              Charge Out
            </Link>
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];
  
  // Charge-out history columns
  const chargeOutColumns = [
    {
      header: "Part ID",
      accessor: (issuance: PartsChargeOutWithDetails) => issuance.part.partId,
      className: "whitespace-nowrap",
    },
    {
      header: "Part Name",
      accessor: (issuance: PartsChargeOutWithDetails) => issuance.part.name,
    },
    {
      header: "Quantity",
      accessor: "quantity",
    },
    {
      header: "Building",
      accessor: (issuance: PartsChargeOutWithDetails) => issuance.buildingName || "Other",
    },
    {
      header: "Cost Center",
      accessor: (issuance: PartsChargeOutWithDetails) => issuance.projectCode || "-",
    },
    {
      header: "Date",
      accessor: (issuance: PartsChargeOutWithDetails) => (
        new Date(issuance.issuedAt).toLocaleDateString()
      ),
      className: "whitespace-nowrap text-sm",
    },
  ];
  
  // Activity data for parts management
  const partsActivity: { name: string; color: string; action: string; partInfo: string; time: string; }[] = [];
  
  // Get the current user
  const { user } = useAuth();
  const isTechnician = user?.role === 'technician';
  
  if (statsLoading || partsLoading || issuanceLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading dashboard...</span>
      </div>
    );
  }
  
  // Render technician dashboard if user is a technician
  if (isTechnician) {
    return (
      <>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Technician Dashboard</h2>
          <p className="text-muted-foreground mb-8">Select an option below to continue:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:border-primary cursor-pointer transition-all">
              <Link href="/parts-issuance">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
                  <Wrench className="h-16 w-16 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Part Charge-Outs</h3>
                  <p className="text-center text-muted-foreground">
                    Request and charge out parts for maintenance or repairs
                  </p>
                </CardContent>
              </Link>
            </Card>
            
            <Card className="hover:border-primary cursor-pointer transition-all">
              <Link href="/parts-pickup">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
                  <ShoppingCart className="h-16 w-16 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Parts Pickup</h3>
                  <p className="text-center text-muted-foreground">
                    Record parts received from suppliers
                  </p>
                </CardContent>
              </Link>
            </Card>
            
            <Card className="hover:border-primary cursor-pointer transition-all">
              <Link href="/tool-signout">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
                  <Hammer className="h-16 w-16 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Tool SignOut</h3>
                  <p className="text-center text-muted-foreground">
                    Track tools signed out for maintenance and repairs
                  </p>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>
      </>
    );
  }
  
  // Default admin dashboard
  return (
    <>
      {/* PROFESSIONAL NAVIGATION BAR */}
      <div className="bg-white border-b border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Parts Management Dashboard</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/inventory-aging">
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border font-medium">
                Inventory Aging
              </button>
            </Link>
            <Link href="/performance-dashboard">
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border font-medium">
                Performance
              </button>
            </Link>
            <Link href="/parts-inventory">
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border font-medium">
                Inventory
              </button>
            </Link>
            <Link href="/bulk-inventory">
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border font-medium">
                Bulk Scanner
              </button>
            </Link>
            <Link href="/parts-issuance">
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border font-medium">
                Charge-Outs
              </button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            title="Total Parts"
            value={stats?.totalParts || 0}
            icon={BoxesIcon}
            iconBgColor="bg-primary"
            iconColor="text-primary"
            trend={{
              value: "2 new since last week",
              direction: "up",
            }}
          />
          
          <DashboardCard
            title="Parts In Stock"
            value={stats?.totalPartsInStock || 0}
            icon={Package2}
            iconBgColor="bg-green-500"
            iconColor="text-green-500"
            trend={{
              value: "Well supplied",
              direction: "neutral",
            }}
          />
          
          <div className="relative">
            <DashboardCard
              title="Parts Charged Out (Month)"
              value={stats?.monthlyPartsIssuance || 0}
              icon={Wrench}
              iconBgColor="bg-amber-500"
              iconColor="text-amber-500"
              trend={{
                value: stats?.monthlyPartsIssuance ? "Current month total" : "No parts charged out yet",
                direction: "neutral",
              }}
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute top-2 right-2 text-xs" 
              onClick={() => setIsResetDialogOpen(true)}
            >
              <RefreshCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
          
          <DashboardCard
            title="Critical & Low Stock"
            value={stats?.lowStockItemsCount || 0}
            icon={AlertTriangle}
            iconBgColor="bg-red-500"
            iconColor="text-red-500"
            trend={{
              value: `${stats?.partsWithoutReorderLevels || 0} parts lack reorder levels`,
              direction: "neutral",
            }}
          />
        </div>
        
        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="hover:border-primary cursor-pointer transition-all">
            <Link href="/tool-signout">
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <Hammer className="h-12 w-12 text-primary mb-2" />
                <h3 className="text-lg font-bold">Tool SignOut</h3>
                <p className="text-center text-muted-foreground text-sm">
                  Manage tool signouts
                </p>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="hover:border-primary cursor-pointer transition-all">
            <CardContent 
              className="p-6 flex flex-col items-center justify-center cursor-pointer" 
              onClick={() => setIsBackupDialogOpen(true)}
            >
              <PackageOpen className="h-12 w-12 text-primary mb-2" />
              <h3 className="text-lg font-bold">Database Backup</h3>
              <p className="text-center text-muted-foreground text-sm">
                Create a manual database backup
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="px-6 py-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium">Monthly Parts Usage</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <PartsUsageChart />
          </CardContent>
        </Card>
        
        {/* Enhanced Inventory Status Card */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Inventory Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary statistics using server stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="flex flex-col p-3 border rounded-md bg-red-50 border-red-200">
                  <div className="flex items-center">
                    <AlertCircle size={16} className="mr-1.5 text-red-600" />
                    <span className="text-sm font-medium text-red-700">Critical & Low</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-bold text-red-800">{stats?.lowStockItemsCount || 0}</span>
                    <span className="text-xs text-red-600 ml-1">parts</span>
                  </div>
                </div>
                
                <div className="flex flex-col p-3 border rounded-md bg-orange-50 border-orange-200">
                  <div className="flex items-center">
                    <AlertTriangle size={16} className="mr-1.5 text-orange-500" />
                    <span className="text-sm font-medium text-orange-700">Medium Stock</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-bold text-orange-800">{stats?.mediumStockCount || 0}</span>
                    <span className="text-xs text-orange-600 ml-1">parts</span>
                  </div>
                </div>
                
                <div className="flex flex-col p-3 border rounded-md bg-green-50 border-green-200">
                  <div className="flex items-center">
                    <Check size={16} className="mr-1.5 text-green-500" />
                    <span className="text-sm font-medium text-green-700">Healthy</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-bold text-green-800">{stats?.healthyStockCount || 0}</span>
                    <span className="text-xs text-green-600 ml-1">parts</span>
                  </div>
                </div>
              </div>
              
              {/* Status distribution bar */}
              <div className="mt-4">
                <div className="text-sm font-medium mb-1.5">Status Distribution</div>
                <div className="flex w-full h-3 rounded-full overflow-hidden">
                  {(stats?.lowStockItemsCount || 0) > 0 && (
                    <div 
                      className="bg-red-600" 
                      style={{ 
                        width: `${((stats?.lowStockItemsCount || 0) / (stats?.totalParts || 1)) * 100}%` 
                      }}
                    />
                  )}
                  {(stats?.mediumStockCount || 0) > 0 && (
                    <div 
                      className="bg-orange-500" 
                      style={{ 
                        width: `${((stats?.mediumStockCount || 0) / (stats?.totalParts || 1)) * 100}%` 
                      }}
                    />
                  )}
                  {(stats?.healthyStockCount || 0) > 0 && (
                    <div 
                      className="bg-green-500" 
                      style={{ 
                        width: `${((stats?.healthyStockCount || 0) / (stats?.totalParts || 1)) * 100}%` 
                      }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Critical/Low</span>
                  <span>Medium</span>
                  <span>Healthy</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-medium">Recent Part Charge-Outs</CardTitle>
          <Button asChild>
            <Link href="/parts-issuance">
              <Wrench className="h-4 w-4 mr-1" />
              Charge Out Parts
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <DataTable
            data={recentIssuance || []}
            columns={chargeOutColumns}
            itemsPerPage={5}
          />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="px-6 py-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium">Low Stock Parts</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/parts-inventory">View All Parts</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <DataTable
              data={lowStockParts || []}
              columns={partsColumns}
              itemsPerPage={4}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="px-6 py-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            {partsActivity.map((activity, index) => (
              <div key={index} className="flex items-start">
                <div className="mr-3 mt-1">
                  <div className={`w-8 h-8 rounded-full ${activity.color} flex items-center justify-center text-white`}>
                    <User className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <p className="font-medium">{activity.name}</p>
                  <p className="text-sm">
                    {activity.action}{" "}
                    <span className="text-primary">{activity.partInfo}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      
      {/* Admin Password Dialog for Resetting Charge-Out Count */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Monthly Charge-Out Count</DialogTitle>
            <DialogDescription>
              Enter the admin password to reset the monthly parts charge-out count to zero.
              This action will maintain the charge-out history but reset the counter.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Admin Password</Label>
              <Input
                id="adminPassword"
                type="password"
                placeholder="Enter admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsResetDialogOpen(false);
                setAdminPassword("");
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : "Reset Count"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Database Backup Confirmation Dialog */}
      <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Database Backup</DialogTitle>
            <DialogDescription>
              Create a manual database backup. This will create a local backup file of the database
              that can be used for disaster recovery.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2 text-muted-foreground">
              <p>Backups are automatically created weekly on Sundays at 2:00 AM.</p>
              <p>Use this option to create an immediate backup before making major changes.</p>
              <p className="font-semibold">Note: This will only create a local backup. Google Drive integration requires additional configuration.</p>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsBackupDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleBackup}
              disabled={isBackingUp}
            >
              {isBackingUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Backup...
                </>
              ) : "Create Backup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
