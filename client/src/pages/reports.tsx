import { useState } from "react";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { FileDown, Calendar, FileText, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function CombinedReports() {
  const [month, setMonth] = useState(new Date(2025, 7)); // August 2025 (month is 0-indexed)
  const [showResetDialog, setShowResetDialog] = useState(false); 
  const [currentTab, setCurrentTab] = useState("all");
  const { toast } = useToast();

  // Format month for API queries
  const formattedMonth = format(month, "MM/yyyy");
  
  // Fetch deliveries for the specific month
  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ['/api/parts-delivery', formattedMonth],
    staleTime: 0, // Force fresh data
  });

  const { data: issuances = [], isLoading: issuancesLoading } = useQuery({
    queryKey: ['/api/parts-issuance', formattedMonth],
    queryFn: () => fetch(`/api/parts-issuance?month=${formattedMonth}`).then(res => res.json()),
    staleTime: 0, // Force fresh data
  });

  // Filter and combine data for the selected month
  const combinedData = React.useMemo(() => {
    try {
      console.log("REPORTS DEBUG - Deliveries loading:", deliveriesLoading, "Issuances loading:", issuancesLoading);
      console.log("REPORTS DEBUG - Deliveries data:", deliveries);
      console.log("REPORTS DEBUG - Issuances data:", issuances);
      
      if (!Array.isArray(deliveries) || !Array.isArray(issuances)) {
        console.log("Data not ready yet");
        return [];
      }

      // Filter data by selected month
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const filteredDeliveries = deliveries.filter(delivery => {
        const deliveryDate = new Date(delivery.deliveredAt);
        return deliveryDate >= monthStart && deliveryDate <= monthEnd;
      });
      
      const filteredIssuances = issuances.filter(issuance => {
        const issuanceDate = new Date(issuance.issuedAt);
        return issuanceDate >= monthStart && issuanceDate <= monthEnd;
      });
      
      console.log(`REPORTS DEBUG - Filtered deliveries: ${filteredDeliveries.length}, issuances: ${filteredIssuances.length}`);
      
      return [...filteredDeliveries, ...filteredIssuances].map(item => {
        const isDelivery = 'deliveredAt' in item;
        const date = isDelivery ? item.deliveredAt : item.issuedAt;
        const unitCost = parseFloat(String(isDelivery ? item.unitCost || item.part?.unitCost || 0 : item.part?.unitCost || 0));
        const extendedPrice = unitCost * item.quantity;

        return {
          date: new Date(date).toLocaleDateString(),
          partName: item.part?.name || '',
          unitCost: `$${unitCost.toFixed(2)}`,
          quantity: item.quantity,
          extendedPrice: `$${extendedPrice.toFixed(2)}`,
          building: isDelivery ? item.building?.name : item.buildingName,
          costCenter: isDelivery ? item.costCenter?.code : item.costCenterCode,
          type: isDelivery ? 'Delivery' : 'Charge-Out',
          id: isDelivery ? `D${item.id}` : `C${item.id}`,
          rawData: item
        };
      });
    } catch (error) {
      console.error("Error processing combined data:", error);
      return [];
    }
  }, [deliveries, issuances, month]);

  // Calculate totals
  const totalCost = combinedData.reduce((sum, item) => {
    const price = parseFloat(item.extendedPrice.replace('$', '')) || 0;
    return sum + price;
  }, 0);
  
  console.log(`REPORTS DEBUG - Combined data length: ${combinedData.length}`);
  console.log(`REPORTS DEBUG - Total cost calculation: $${totalCost.toFixed(2)}`);

  const columns = [
    { header: "Date", accessor: (row: any) => row.date },
    { header: "Part Name", accessor: (row: any) => row.partName },
    { header: "Unit Cost", accessor: (row: any) => row.unitCost },
    { header: "Quantity", accessor: (row: any) => row.quantity },
    { header: "Extended Price", accessor: (row: any) => row.extendedPrice },
    { header: "Building", accessor: (row: any) => row.building || '-' },
    { header: "Cost Center", accessor: (row: any) => row.costCenter || '-' },
    { header: "Type", accessor: (row: any) => row.type }
  ];

  // Proper Excel XLSX export (not CSV)
  const handleExport = async (exportFormat: 'xlsx' | 'pdf') => {
    try {
      // Different handling for Excel vs PDF
      if (exportFormat === 'xlsx') {
        // Show export process info
        toast({
          title: "Preparing Excel export",
          description: "Generating your Excel report..."
        });
        
        // Get report type based on current tab
        let reportType = 'all';
        if (currentTab === "deliveries") reportType = 'deliveries';
        if (currentTab === "chargeouts") reportType = 'chargeouts';
        
        const reportTypeText = currentTab === "deliveries" ? "Deliveries" : 
                              currentTab === "chargeouts" ? "Charge-Outs" : 
                              "Combined";
                              
        // Format month for the API
        const monthStr = format(month, "MM/yyyy");
        
        // Use authenticated fetch for Excel export
        const url = `/api/excel-final?month=${monthStr}&type=${reportType}`;
        
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Export failed: ${response.status}`);
        }
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${reportTypeText}-report-${monthStr.replace('/', '-')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        
        toast({
          title: "Excel export started",
          description: `Your ${reportTypeText} Excel report is downloading`
        });
      } else {
        // PDF export
        toast({
          title: "Preparing PDF export",
          description: "Generating your PDF report..."
        });
        
        // Format month for the API
        const monthStr = format(month, "MM/yyyy");
        
        // Use the proper PDF export endpoint from server/routes.ts
        const url = `/api/parts-issuance/export?format=pdf&month=${monthStr}`;
        
        // Use window.open to trigger download with proper authentication
        window.open(url, '_blank');
        
        toast({
          title: "PDF export started",
          description: "Your PDF report is downloading"
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error instanceof Error 
          ? error.message 
          : "Export failed - Please try again or contact support"
      });
    }
  };

  // Debug loading states and errors
  console.log("REPORTS DEBUG - Deliveries loading:", deliveriesLoading, "Issuances loading:", issuancesLoading);
  console.log("REPORTS DEBUG - Deliveries data:", deliveries);
  console.log("REPORTS DEBUG - Issuances data:", issuances);
  console.log("REPORTS DEBUG - Combined data length:", combinedData?.length);
  console.log("REPORTS DEBUG - Component is rendering properly");

  if (deliveriesLoading || issuancesLoading) {
    console.log("REPORTS DEBUG - Still loading, showing loading screen");
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-lg mb-4">Loading reports data...</div>
        <div className="text-sm text-muted-foreground">
          Deliveries: {deliveriesLoading ? "Loading..." : "✓ Loaded"}<br/>
          Issuances: {issuancesLoading ? "Loading..." : "✓ Loaded"}
        </div>
      </div>
    );
  }

  console.log("REPORTS DEBUG - Data loaded, rendering main component");

  return (
    <div className="min-h-screen w-full bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Combined Parts Report</h2>
          <p className="text-muted-foreground">View all parts movement from stockroom</p>
        </div>
        <div className="flex space-x-2">
          <Select 
            value={format(month, "MM/yyyy")}
            onValueChange={(value) => {
              const [month, year] = value.split('/');
              const newDate = new Date(parseInt(year), parseInt(month) - 1);
              setMonth(newDate);
            }}
          >
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="03/2025">March 2025</SelectItem>
              <SelectItem value="04/2025">April 2025</SelectItem>
              <SelectItem value="05/2025">May 2025</SelectItem>
              <SelectItem value="06/2025">June 2025</SelectItem>
              <SelectItem value="07/2025">July 2025</SelectItem>
              <SelectItem value="08/2025">August 2025</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => handleExport('xlsx')}>
            <FileDown className="h-4 w-4 mr-2" />
            Export Excel
          </Button>

          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>

          <Button variant="outline" onClick={() => setShowResetDialog(true)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Month
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Combined Movement Report</CardTitle>
              <CardDescription>
                Total Cost for {format(month, "MMMM yyyy")}: ${totalCost.toFixed(2)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Movements</TabsTrigger>
              <TabsTrigger value="deliveries">Deliveries Only</TabsTrigger>
              <TabsTrigger value="chargeouts">Charge-Outs Only</TabsTrigger>
              <TabsTrigger value="by_building">By Building</TabsTrigger>
              <TabsTrigger value="by_cost_center">By Cost Center</TabsTrigger>
            </TabsList>

            <TabsContent value={currentTab}>
              <DataTable
                data={currentTab === "deliveries" ? combinedData.filter(d => d.type === "Delivery") :
                      currentTab === "chargeouts" ? combinedData.filter(d => d.type === "Charge-Out") :
                      currentTab === "by_building" ? combinedData.sort((a, b) => (a.building || '').localeCompare(b.building || '')) :
                      currentTab === "by_cost_center" ? combinedData.sort((a, b) => (a.costCenter || '').localeCompare(b.costCenter || '')) :
                      combinedData}
                columns={columns}
                itemsPerPage={10}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Monthly Report</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the report to the current month. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setMonth(new Date());
                toast({
                  title: "Report Reset",
                  description: "Report has been reset to current month"
                });
              }}
            >
              Reset Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}