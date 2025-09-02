import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Trash2, CheckCircle, Clock, Package } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ManualPartsEntry {
  id: number;
  scanned_barcode: string;
  description: string;
  quantity: number;
  technician_used: string;
  date_scanned: string;
  status: string;
}

const approveSchema = z.object({
  partName: z.string().min(1, "Part name is required"),
  supplier: z.string().min(1, "Supplier is required"),
  unitCost: z.string().min(1, "Unit cost is required"),
  location: z.string().min(1, "Location is required"),
  category: z.string().optional(),
});

type ApproveFormData = z.infer<typeof approveSchema>;

export default function ManualPartsReview() {
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');
  const [selectedEntry, setSelectedEntry] = useState<ManualPartsEntry | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  
  // Fetch storage locations and shelves for dropdown
  const { data: locations = [] } = useQuery({
    queryKey: ['/api/storage-locations'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/storage-locations");
      return response.json();
    }
  });

  const { data: shelves = [] } = useQuery({
    queryKey: ['/api/shelves'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/shelves");
      return response.json();
    }
  });

  const form = useForm<ApproveFormData>({
    resolver: zodResolver(approveSchema),
    defaultValues: {
      partName: "",
      supplier: "Manual Entry",
      unitCost: "0.00",
      location: "",
      category: "manual-entry",
    },
  });

  // Fetch manual parts entries
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['/api/manual-parts-review'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/manual-parts-review");
      return response.json();
    }
  });

  // Approve entry mutation
  const approveMutation = useMutation({
    mutationFn: async ({ entryId, formData }: { entryId: number; formData: ApproveFormData }) => {
      const response = await apiRequest("POST", `/api/manual-parts-review/${entryId}/approve`, formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✓ Entry Approved",
        description: "Manual part entry has been approved and added to inventory",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/manual-parts-review'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      setShowApproveDialog(false);
      setSelectedEntry(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve entry",
        variant: "destructive",
      });
    }
  });
  
  const handleApprove = (entry: ManualPartsEntry) => {
    setSelectedEntry(entry);
    form.setValue("partName", entry.description);
    setShowApproveDialog(true);
  };
  
  const onSubmitApprove = (data: ApproveFormData) => {
    if (selectedEntry) {
      approveMutation.mutate({ entryId: selectedEntry.id, formData: data });
    }
  };

  // Delete entry mutation
  const deleteMutation = useMutation({
    mutationFn: async (entryId: number) => {
      const response = await apiRequest("DELETE", `/api/manual-parts-review/${entryId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✓ Entry Deleted",
        description: "Manual part entry has been deleted",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/manual-parts-review'] });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to delete entry",
        variant: "destructive",
      });
    }
  });

  const filteredEntries = entries.filter((entry: ManualPartsEntry) => {
    if (filter === 'pending') return true; // All entries are pending until approved/deleted
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading manual entries...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Package className="h-6 w-6" />
              Manual Parts Review
            </CardTitle>
            <p className="text-muted-foreground">
              Review and approve manually entered parts from the kiosk scanner
            </p>
          </CardHeader>
        </Card>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Pending Review ({filteredEntries.length})
          </Button>
        </div>

        {/* Entries List */}
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Manual Entries</h3>
                <p className="text-muted-foreground">
                  Manual part entries from the kiosk scanner will appear here for review
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredEntries.map((entry: ManualPartsEntry) => (
              <Card key={entry.id} className="border-l-4 border-l-orange-400">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-orange-600">
                          Pending Review
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.date_scanned).toLocaleDateString()} at{' '}
                          {new Date(entry.date_scanned).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="font-medium text-lg">{entry.description}</p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Barcode:</strong> {entry.scanned_barcode}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Quantity:</strong> {entry.quantity}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Scanned by:</strong> {entry.technician_used}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => handleApprove(entry)}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve & Add to Inventory
                      </Button>
                      
                      <Button
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(entry.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Approve & Add to Inventory</DialogTitle>
            </DialogHeader>
            
            {selectedEntry && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitApprove)} className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Scanned Barcode:</strong> {selectedEntry.scanned_barcode}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Quantity:</strong> {selectedEntry.quantity}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Scanned by:</strong> {selectedEntry.technician_used}
                    </p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="partName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Part Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter part name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter supplier" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="unitCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Cost</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="0.00" type="number" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Location</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select specific shelf location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {shelves.map((shelf: any) => (
                              <SelectItem key={shelf.id} value={shelf.name}>
                                {shelf.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowApproveDialog(false);
                        setSelectedEntry(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? "Adding..." : "Add to Inventory"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}