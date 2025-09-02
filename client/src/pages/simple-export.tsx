import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { FileDown } from 'lucide-react';

export default function SimpleExportPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Function to trigger the simple export
  const handleExport = async (type: 'all' | 'deliveries' | 'chargeouts') => {
    try {
      // Show a loading toast
      toast({
        title: "Preparing export",
        description: "Please wait while we generate your report..."
      });
      
      // Get the current month in MM/YYYY format
      const now = new Date();
      const month = `${now.getMonth()+1}/${now.getFullYear()}`;
      
      // Build the export URL with parameters
      const url = `/api/simple-export?month=${month}&type=${type}`;
      
      // Set a timeout to abort if it takes too long
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      // Fetch the file
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }
      
      // Get the filename from headers or use a default
      let filename = `ONU-Report-${month.replace('/', '-')}.xlsx`;
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches && matches.length > 1) {
          filename = matches[1];
        }
      }
      
      // Download the file
      const blob = await response.blob();
      const url2 = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url2;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url2);
      }, 100);
      
      toast({
        title: "Export complete",
        description: "Your report has been downloaded"
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8">Simple Excel Export</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">All Parts Movement</h2>
          <p className="mb-4">Export both Charge-Outs and Deliveries in one report.</p>
          <Button onClick={() => handleExport('all')} className="w-full">
            <FileDown className="mr-2 h-4 w-4" />
            Export Combined Report
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Charge-Outs Only</h2>
          <p className="mb-4">Export only Charge-Out records from the stockroom.</p>
          <Button onClick={() => handleExport('chargeouts')} className="w-full">
            <FileDown className="mr-2 h-4 w-4" />
            Export Charge-Outs
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Deliveries Only</h2>
          <p className="mb-4">Export only Delivery records to staff members.</p>
          <Button onClick={() => handleExport('deliveries')} className="w-full">
            <FileDown className="mr-2 h-4 w-4" />
            Export Deliveries
          </Button>
        </div>
      </div>
      
      <div className="mt-8">
        <Button variant="outline" onClick={() => navigate("/reports")}>
          Back to Reports
        </Button>
      </div>
    </div>
  );
}