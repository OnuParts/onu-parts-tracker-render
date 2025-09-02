import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, XCircle, Clock, Package, User, MapPin, Building } from 'lucide-react';
import type { DeliveryRequestWithDetails } from '@shared/schema';

export default function DeliveryRequestsAdmin() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['/api/delivery-requests-admin'],
    queryFn: async () => {
      const response = await fetch('/api/delivery-requests-admin');
      if (!response.ok) throw new Error('Failed to fetch requests');
      return response.json() as Promise<DeliveryRequestWithDetails[]>;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await fetch(`/api/delivery-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to approve request');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Request approved and added to deliveries' });
      queryClient.invalidateQueries({ queryKey: ['/api/delivery-requests-admin'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: number; reason: string }) => {
      const response = await fetch(`/api/delivery-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to reject request');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Request rejected' });
      queryClient.invalidateQueries({ queryKey: ['/api/delivery-requests-admin'] });
      setSelectedRequest(null);
      setRejectionReason('');
    },
  });

  const handleApprove = (requestId: number) => {
    approveMutation.mutate(requestId);
  };

  const handleReject = (requestId: number) => {
    if (!rejectionReason.trim()) {
      toast({ title: 'Please provide a rejection reason', variant: 'destructive' });
      return;
    }
    rejectMutation.mutate({ requestId, reason: rejectionReason });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'fulfilled': return <Package className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Delivery Requests Management</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading requests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Delivery Requests Management</h1>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No delivery requests found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <Card key={request.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {request.requesterName}
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1 capitalize">{request.status}</span>
                    </Badge>
                  </CardTitle>
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(request.requestDate))} ago
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {request.building?.name || 'Unknown Building'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Room {request.roomNumber}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Cost Center</h4>
                  <span className="text-sm text-gray-600">
                    {request.costCenter ? 
                      `${request.costCenter.code} - ${request.costCenter.name}` : 
                      'No cost center specified'
                    }
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Requested Items</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    {request.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-1">
                        <span className="text-sm">{item.part?.name || `Part ${item.partId}`}</span>
                        <Badge variant="outline">Qty: {item.quantity}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {request.notes && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{request.notes}</p>
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleApprove(request.id)}
                      disabled={approveMutation.isPending}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve & Add to Deliveries
                    </Button>
                    
                    {selectedRequest === request.id ? (
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder="Reason for rejection..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="min-h-[60px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleReject(request.id)}
                            disabled={rejectMutation.isPending}
                            variant="destructive"
                            size="sm"
                          >
                            Confirm Reject
                          </Button>
                          <Button
                            onClick={() => setSelectedRequest(null)}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setSelectedRequest(request.id)}
                        variant="outline"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    )}
                  </div>
                )}

                {request.status === 'fulfilled' && request.fulfilledDate && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Fulfilled {formatDistanceToNow(new Date(request.fulfilledDate))} ago
                      {request.fulfilledByUser && ` by ${request.fulfilledByUser.name}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}