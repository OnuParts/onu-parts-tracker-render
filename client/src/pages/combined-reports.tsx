
import { useState } from "react";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
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

// Updated to include June 2025 dropdown option
export default function CombinedReports() {
  const [month, setMonth] = useState(new Date());
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState("all");
  const { toast } = useToast();

  // Fetch both datasets
  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ['/api/parts-delivery/recent/25', format(month, "MM/yyyy")],
  });

  const { data: issuances = [], isLoading: issuancesLoading } = useQuery({
    queryKey: ['/api/parts-issuance/recent', format(month, "MM/yyyy")],
  });

  // Combine and format the data
  const combinedData = [...(deliveries || []), ...(issuances || [])].map(item => {
    const isDelivery = 'deliveredAt' in item;
    const date = isDelivery ? item.deliveredAt : item.issuedAt;
    const unitCost = isDelivery ? item.unitCost || item.part?.unitCost : item.part?.unitCost;
    const extendedPrice = (unitCost || 0) * item.quantity;

    return {
      date: new Date(date).toLocaleDateString(),
      partName: item.part?.name || '',
      unitCost: unitCost ? `$${parseFloat(String(unitCost)).toFixed(2)}` : '-',
      quantity: item.quantity,
      extendedPrice: `$${extendedPrice.toFixed(2)}`,
      building: isDelivery ? item.building?.name : item.buildingName,
      costCenter: isDelivery ? item.costCenter?.code : item.costCenterCode,
      type: isDelivery ? 'Delivery' : 'Charge-Out',
      id: isDelivery ? `D${item.id}` : `C${item.id}`,
      rawData: item
    };
  });

  // Calculate totals
  const totalCost = combinedData.reduce((sum, item) => {
    return sum + (parseFloat(item.extendedPrice.replace('$', '')) || 0);
  }, 0);

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

  const handleExport = async (exportFormat: 'xlsx' | 'pdf') => {
    try {
      const monthStr = format(month, "MM/yyyy");
      const response = await fetch(`/api/combined-report/export?month=${monthStr}&format=${exportFormat}`);
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `combined-report-${monthStr}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Export successful",
        description: `Report exported as ${exportFormat?.toUpperCase() || 'file'}`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  if (deliveriesLoading || issuancesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
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
    </>
  );
}
