import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { Building } from '@shared/schema';

// Define types based on schema
interface PartsPickup {
  id: number;
  partName: string;
  partNumber: string | null;
  quantity: number;
  supplier: string | null;
  notes: string | null;
  status: 'pending' | 'completed';
  buildingId: number | null;
  trackingNumber: string | null;
  poNumber: string | null;
  addedById: number | null;
  addedAt: Date;
  pickedUpById: number | null;
  pickedUpAt: Date | null;
}

interface PartsPickupWithDetails extends PartsPickup {
  building?: Building;
  addedBy?: { id: number; name: string; role: string };
}

const TechnicianPickupPage: React.FC = () => {
  const { toast } = useToast();

  // Fetch pending parts pickups for technicians
  const { 
    data: pendingPickups, 
    isLoading, 
    error 
  } = useQuery<PartsPickupWithDetails[]>({
    queryKey: ['/api/parts-pickup/pending'],
    staleTime: 10000, // 10 seconds
  });

  // Mutation for acknowledging a parts pickup
  const acknowledgePickupMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/parts-pickup/${id}`, {});
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/parts-pickup/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-pickup'] });
      
      toast({
        title: "Success",
        description: "Parts pickup has been acknowledged successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to acknowledge parts pickup: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleAcknowledgePickup = (id: number) => {
    if (window.confirm('Do you confirm receipt of these parts?')) {
      acknowledgePickupMutation.mutate(id);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-destructive/15 p-4 rounded-md">
          <h2 className="text-lg font-semibold text-destructive">Error loading parts pickups</h2>
          <p>Please try again later or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Pending Parts Pickups</h1>
      <p className="text-muted-foreground">
        Review and acknowledge receipt of parts that have been delivered.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Parts Awaiting Pickup</CardTitle>
          <CardDescription>
            Acknowledge when you have picked up or received these parts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-2">Loading parts pickups...</p>
            </div>
          ) : !pendingPickups || pendingPickups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No pending parts pickups found.</p>
              <p className="text-sm mt-2">
                Check back later or contact the parts department if you are expecting a delivery.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Building</TableHead>
                  <TableHead>Added By</TableHead>
                  <TableHead>Added Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPickups.map((pickup) => (
                  <TableRow key={pickup.id}>
                    <TableCell className="font-medium">{pickup.partName}</TableCell>
                    <TableCell>{pickup.partNumber || 'N/A'}</TableCell>
                    <TableCell>{pickup.quantity}</TableCell>
                    <TableCell>{pickup.supplier || 'N/A'}</TableCell>
                    <TableCell>{pickup.building?.name || 'N/A'}</TableCell>
                    <TableCell>{pickup.addedBy?.name || 'System'}</TableCell>
                    <TableCell>
                      {pickup.addedAt 
                        ? format(new Date(pickup.addedAt), 'MMM dd, yyyy') 
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleAcknowledgePickup(pickup.id)}
                        disabled={acknowledgePickupMutation.isPending}
                        size="sm"
                        variant="default"
                      >
                        {acknowledgePickupMutation.isPending 
                          ? "Processing..." 
                          : "Acknowledge Receipt"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Information About Parts Pickup</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>What is Parts Pickup?</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                The Parts Pickup feature allows you to acknowledge receipt of parts that have been 
                delivered to ONU. When you acknowledge a parts pickup, you're confirming that the 
                parts have been received.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>What Happens After Acknowledgment?</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Once you acknowledge receipt, the system will record that you received the parts
                and when you received them. This helps with tracking parts throughout the university.
                The parts will not be automatically added to inventory - that is a separate process.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TechnicianPickupPage;