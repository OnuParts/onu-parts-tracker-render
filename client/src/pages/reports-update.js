// Ultra-reliable export that directly uses our fixed endpoint
  const handleExport = async (exportFormat: 'xlsx' | 'pdf') => {
    try {
      // Show export process info
      toast({
        title: "Preparing export",
        description: "Generating your report..."
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
      
      // Use our ultra-reliable fixed export endpoint
      const url = `/api/fixed-export?month=${monthStr}&type=${reportType}`;
      
      // Direct download
      window.open(url, '_blank');
      
      toast({
        title: "Export started",
        description: `Your ${reportTypeText} report is downloading`
      });
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
