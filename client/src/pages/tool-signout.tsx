import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { 
  Hammer, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  Search 
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard-header";
import Loading from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Tool types
interface Tool {
  id: number;
  toolNumber: number; // Permanent sequential identifier
  toolName: string;
  notes: string | null;
  active: boolean;
  createdAt: string;
}

// Tool signout types
interface ToolSignout {
  id: number;
  toolId: number;
  technicianId: number;
  signedOutAt: string;
  returnedAt: string | null;
  status: 'checked_out' | 'returned' | 'damaged' | 'missing';
  condition: string | null;
  notes: string | null;
}

// Combined tool with status for display
interface ToolWithStatus extends Tool {
  status?: string;
  technicianId?: number;
  technicianName?: string;
  signedOutAt?: string;
  signoutId?: number;
}

// Tool signout with details (including technician name, tool name)
interface ToolSignoutWithDetails extends ToolSignout {
  toolName: string;
  toolNumber: number;
  technicianName: string;
}

// Schema for adding a new tool (admin only)
const addToolSchema = z.object({
  toolName: z.string().min(1, "Tool name is required"),
  notes: z.string().optional(),
});

// Schema for signing out a tool (self-signout)
const signoutToolSchema = z.object({
  toolId: z.number().min(1, "Tool selection is required"),
  notes: z.string().optional(),
});

// Schema for admin signing out tool to technician
const adminSignoutSchema = z.object({
  toolId: z.number().min(1, "Tool selection is required"),
  technicianId: z.number().min(1, "Technician selection is required"),
  notes: z.string().optional(),
});

// Schema for returning a tool
const returnToolSchema = z.object({
  condition: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['returned', 'damaged', 'missing']),
});

export default function ToolSignout() {
  const { isLoading: authLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // UI state
  const [isAddToolDialogOpen, setIsAddToolDialogOpen] = useState(false);
  const [isSignoutDialogOpen, setIsSignoutDialogOpen] = useState(false);
  const [isAdminSignoutDialogOpen, setIsAdminSignoutDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolWithStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // User roles
  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician';
  const isStudent = user?.role === 'student';
  const canSignOutTools = isTechnician || isStudent;
  const canAddTools = isAdmin || isStudent;

  // Form for adding a new tool (admin and student)
  const addToolForm = useForm<z.infer<typeof addToolSchema>>({
    resolver: zodResolver(addToolSchema),
    defaultValues: {
      toolName: "",
      notes: "",
    },
  });

  // Form for signing out a tool (self-signout)
  const signoutToolForm = useForm<z.infer<typeof signoutToolSchema>>({
    resolver: zodResolver(signoutToolSchema),
    defaultValues: {
      toolId: undefined,
      notes: "",
    },
  });

  // Form for admin signing out tool to technician
  const adminSignoutForm = useForm<z.infer<typeof adminSignoutSchema>>({
    resolver: zodResolver(adminSignoutSchema),
    defaultValues: {
      toolId: undefined,
      technicianId: undefined,
      notes: "",
    },
  });

  // Form for returning a tool
  const returnToolForm = useForm<z.infer<typeof returnToolSchema>>({
    resolver: zodResolver(returnToolSchema),
    defaultValues: {
      condition: "",
      status: "returned",
      notes: "",
    },
  });

  // Fetch all tools with their current status
  const { 
    data: tools, 
    isLoading: isToolsLoading,
    refetch: refetchTools
  } = useQuery<ToolWithStatus[]>({
    queryKey: ["/api/tools"],
    refetchOnWindowFocus: true,
  });

  // Fetch only available tools for signout
  const { 
    data: availableTools, 
    isLoading: isAvailableToolsLoading 
  } = useQuery<Tool[]>({
    queryKey: ["/api/tools/status/available"],
    refetchOnWindowFocus: true,
  });

  // Fetch users list for admin signout (only admins)
  const { 
    data: users, 
    isLoading: isUsersLoading 
  } = useQuery<Array<{id: number; name: string; role: string; username: string}>>({
    queryKey: ["/api/users"],
    enabled: isAdmin,
    refetchOnWindowFocus: false,
  });

  // Filter to get technicians and students (and admin for testing)
  const availableUsers = users?.filter(u => u.role === 'technician' || u.role === 'student' || u.role === 'admin') || [];

  // Mutation for adding a new tool (admin only)
  const addToolMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addToolSchema>) => {
      const res = await apiRequest("POST", "/api/tools/add", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tools/status/available"] });
      toast({
        title: "Success",
        description: "New tool added successfully",
        variant: "default",
      });
      setIsAddToolDialogOpen(false);
      addToolForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add new tool",
        variant: "destructive",
      });
    },
  });

  // Mutation for signing out a tool
  const signoutToolMutation = useMutation({
    mutationFn: async (data: z.infer<typeof signoutToolSchema>) => {
      // The technician ID is retrieved from session server-side
      const res = await apiRequest("POST", "/api/tools/signout", {
        toolId: data.toolId,
        notes: data.notes
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tools/status/available"] });
      toast({
        title: "Success",
        description: "Tool signed out successfully",
        variant: "default",
      });
      setIsSignoutDialogOpen(false);
      signoutToolForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out tool",
        variant: "destructive",
      });
    },
  });

  // Mutation for admin signing out tool to technician
  const adminSignoutMutation = useMutation({
    mutationFn: async (data: z.infer<typeof adminSignoutSchema>) => {
      const res = await apiRequest("POST", "/api/tools/admin-signout", {
        toolId: data.toolId,
        technicianId: data.technicianId,
        notes: data.notes
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tools/status/available"] });
      toast({
        title: "Success",
        description: "Tool signed out to technician successfully",
        variant: "default",
      });
      setIsAdminSignoutDialogOpen(false);
      adminSignoutForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out tool to technician",
        variant: "destructive",
      });
    },
  });

  // Mutation for returning a tool
  const returnToolMutation = useMutation({
    mutationFn: async (data: z.infer<typeof returnToolSchema>) => {
      if (!selectedTool?.id) throw new Error("No tool selected");
      
      try {
        // Use the correct endpoint path format with the signout ID - not the tool ID
        // We need the signout record ID - some tools have signoutId property if they're checked out
        const signoutId = selectedTool.signoutId || selectedTool.id;
        console.log("Making API request: PATCH /api/tools/return/" + signoutId);
        
        const res = await apiRequest("PATCH", `/api/tools/return/${signoutId}`, data);
        console.log("API response status:", res.status);
        
        if (!res.ok) {
          // This should never run because apiRequest already checks for !res.ok
          throw new Error("Failed to return tool: " + res.statusText);
        }
        
        return await res.json();
      } catch (error) {
        console.error("Tool return error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tools/status/available"] });
      toast({
        title: "Success",
        description: "Tool returned successfully",
        variant: "default",
      });
      setIsReturnDialogOpen(false);
      setSelectedTool(null);
      returnToolForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to return tool",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for deleting a tool (admin only)
  const deleteToolMutation = useMutation({
    mutationFn: async (toolId: number) => {
      if (!toolId) throw new Error("No tool selected");
      
      try {
        const res = await apiRequest("DELETE", `/api/tools/${toolId}`);
        return await res.json();
      } catch (error) {
        console.error("Tool delete error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tools/status/available"] });
      toast({
        title: "Success",
        description: data.message || "Tool deleted successfully",
        variant: "default",
      });
      setIsDeleteDialogOpen(false);
      setSelectedTool(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tool",
        variant: "destructive",
      });
    },
  });

  // Refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchTools();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refetchTools]);

  // Form submission handlers
  const onAddToolSubmit = (data: z.infer<typeof addToolSchema>) => {
    addToolMutation.mutate(data);
  };

  const onSignoutToolSubmit = (data: z.infer<typeof signoutToolSchema>) => {
    signoutToolMutation.mutate(data);
  };

  const onAdminSignoutSubmit = (data: z.infer<typeof adminSignoutSchema>) => {
    adminSignoutMutation.mutate(data);
  };

  const onReturnToolSubmit = (data: z.infer<typeof returnToolSchema>) => {
    returnToolMutation.mutate(data);
  };

  // Open the return dialog for a specific tool
  const handleReturnTool = (tool: ToolWithStatus) => {
    setSelectedTool(tool);
    setIsReturnDialogOpen(true);
  };

  // Filter tools based on search term
  const filteredTools = tools?.filter(tool => 
    tool.toolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tool.technicianName && tool.technicianName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    String(tool.toolNumber).includes(searchTerm)
  ) || [];

  // Check if the logged-in user is the technician for a tool
  const isUsersTool = (tool: ToolWithStatus) => 
    canSignOutTools && tool.technicianId === user?.id;

  // DataTable columns
  const columns = [
    {
      header: "Tool #",
      accessor: (tool: ToolWithStatus) => String(tool.toolNumber),
      className: "whitespace-nowrap",
    },
    {
      header: "Tool Name",
      accessor: (tool: ToolWithStatus) => tool.toolName,
    },
    {
      header: "Technician",
      accessor: (tool: ToolWithStatus) => tool.technicianName || 'Available',
    },
    {
      header: "Status",
      accessor: (tool: ToolWithStatus) => {
        if (!tool.status || tool.status === 'available') {
          return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">Available</Badge>;
        }
        
        switch (tool.status) {
          case "checked_out":
            return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">Checked Out</Badge>;
          case "returned":
            return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">Returned</Badge>;
          case "damaged":
            return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">Damaged</Badge>;
          case "missing":
            return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">Missing</Badge>;
          default:
            return <Badge variant="outline">Unknown</Badge>;
        }
      },
    },
    {
      header: "Actions",
      accessor: (tool: ToolWithStatus) => {
        const actions = [];
        
        // Show the sign out button if the tool is available
        if (!tool.status || tool.status === 'available') {
          // Regular self-signout for technicians/students
          if (canSignOutTools) {
            actions.push(
              <Button 
                key="signout"
                variant="outline" 
                size="sm"
                className="mr-2" 
                onClick={() => {
                  setSelectedTool(tool);
                  signoutToolForm.setValue('toolId', tool.id);
                  setIsSignoutDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            );
          }
          
          // Admin sign out to technician
          if (isAdmin) {
            actions.push(
              <Button 
                key="admin-signout"
                variant="default" 
                size="sm"
                className="mr-2" 
                onClick={() => {
                  setSelectedTool(tool);
                  adminSignoutForm.setValue('toolId', tool.id);
                  setIsAdminSignoutDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Assign to Tech
              </Button>
            );
          }
        }
        
        // Show the return button if tool is checked out and belongs to user (if technician)
        // Admins can return any tool that's checked out
        if ((isAdmin || isUsersTool(tool)) && tool.status === 'checked_out') {
          actions.push(
            <Button 
              key="return"
              variant="outline" 
              size="sm"
              className="mr-2"
              onClick={() => handleReturnTool(tool)}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Return
            </Button>
          );
        }
        
        // Show delete button for admins if the tool is available (not checked out)
        if (isAdmin && (!tool.status || tool.status === 'available' || tool.status === 'returned')) {
          actions.push(
            <Button 
              key="delete"
              variant="outline" 
              size="sm"
              className="text-red-600 hover:text-red-700" 
              onClick={() => {
                setSelectedTool(tool);
                setIsDeleteDialogOpen(true);
              }}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Delete
            </Button>
          );
        }
        
        return <div className="flex flex-wrap justify-end gap-2">{actions}</div>;
      },
      className: "text-right",
    },
  ];

  if (authLoading) {
    return <Loading />;
  }

  // For technicians and students, only show their tools and available tools
  const displayTools = canSignOutTools && !isAdmin
    ? filteredTools.filter(tool => !tool.status || tool.status === 'available' || isUsersTool(tool))
    : filteredTools;

  return (
    <>
      <Helmet>
        <title>Tool Signout | ONU Parts Tracker</title>
      </Helmet>

      <DashboardHeader
        title="Tool SignOut System"
        subtitle="Track tools signed out to technicians"
        icon={<Hammer className="h-6 w-6 text-muted-foreground" />}
      />

      <div className="container mx-auto py-6">
        <Card className="border shadow mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Tools SignOut Management</CardTitle>
              <CardDescription>Manage tools signed out to technicians</CardDescription>
            </div>
            <div className="flex space-x-2">
              {canAddTools && (
                <Button onClick={() => setIsAddToolDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add New Tool
                </Button>
              )}
              {/* Technicians and students can only sign out tools if there are available tools */}
              {canSignOutTools && availableTools && availableTools.length > 0 && (
                <Button variant="outline" onClick={() => setIsSignoutDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Sign Out Tool
                </Button>
              )}
              {/* Admin signout to technician */}
              {isAdmin && availableTools && availableTools.length > 0 && (
                <Button onClick={() => setIsAdminSignoutDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Assign to Technician
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tools or technicians..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {isToolsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading tools...</span>
              </div>
            ) : displayTools.length === 0 ? (
              <div className="text-center py-12 border rounded-md bg-muted/20">
                <Hammer className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No tools found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                  ? "No tools match your search criteria." 
                  : canAddTools 
                    ? "No tools have been added yet. Add a tool to get started."
                    : "No tools have been added yet. Please contact an administrator to add tools."
                }
                </p>
                {canAddTools && (
                  <Button variant="outline" onClick={() => setIsAddToolDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add New Tool
                  </Button>
                )}
              </div>
            ) : (
              <DataTable
                data={displayTools}
                columns={columns}
                itemsPerPage={10}
              />
            )}
          </CardContent>
          {displayTools.length > 0 && (
            <CardFooter className="border-t px-6 py-4 bg-muted/20">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                  <span>Checked Out</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                  <span>Damaged</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span>Missing</span>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Statistics cards for admins */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-muted/10">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tools</p>
                  <p className="text-2xl font-bold">{tools?.length || 0}</p>
                </div>
                <Hammer className="h-8 w-8 text-primary opacity-70" />
              </CardContent>
            </Card>
            <Card className="bg-muted/10">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Checked Out</p>
                  <p className="text-2xl font-bold">
                    {tools?.filter(t => t.status === 'checked_out').length || 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500 opacity-70" />
              </CardContent>
            </Card>
            <Card className="bg-muted/10">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold">
                    {tools?.filter(t => !t.status || t.status === 'available').length || 0}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500 opacity-70" />
              </CardContent>
            </Card>
            <Card className="bg-muted/10">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Damaged/Missing</p>
                  <p className="text-2xl font-bold">
                    {(tools?.filter(t => 
                      t.status === 'damaged' || t.status === 'missing'
                    ).length || 0)}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-500 opacity-70" />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add New Tool Dialog (Admin and Student) */}
      {canAddTools && (
        <Dialog open={isAddToolDialogOpen} onOpenChange={setIsAddToolDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Tool</DialogTitle>
              <DialogDescription>
                Create a new tool to add to the system inventory. A sequential tool number will be automatically assigned.
              </DialogDescription>
            </DialogHeader>
            <Form {...addToolForm}>
              <form onSubmit={addToolForm.handleSubmit(onAddToolSubmit)} className="space-y-4 py-4">
                <FormField
                  control={addToolForm.control}
                  name="toolName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tool Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter tool name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addToolForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any notes about the tool"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddToolDialogOpen(false)}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={addToolMutation.isPending}
                  >
                    {addToolMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : "Create Tool"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Sign Out Tool Dialog */}
      <Dialog open={isSignoutDialogOpen} onOpenChange={setIsSignoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign Out a Tool</DialogTitle>
            <DialogDescription>
              Select a tool you want to borrow. Your name will be automatically recorded.
            </DialogDescription>
          </DialogHeader>
          <Form {...signoutToolForm}>
            <form onSubmit={signoutToolForm.handleSubmit(onSignoutToolSubmit)} className="space-y-4 py-4">
              <FormField
                control={signoutToolForm.control}
                name="toolId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Tool</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a tool" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isAvailableToolsLoading ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Loading...</span>
                          </div>
                        ) : (
                          availableTools?.map(tool => (
                            <SelectItem key={tool.id} value={tool.id.toString()}>
                              #{tool.toolNumber} - {tool.toolName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      You are signing out this tool as {user?.name}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={signoutToolForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any notes about how you'll use this tool"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsSignoutDialogOpen(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={signoutToolMutation.isPending}
                >
                  {signoutToolMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing Out...
                    </>
                  ) : "Sign Out Tool"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Return Tool Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Return Tool</DialogTitle>
            <DialogDescription>
              {selectedTool && (
                <>Recording return of {selectedTool.toolName} (Tool #{selectedTool.toolNumber})</>
              )}
            </DialogDescription>
          </DialogHeader>
          <Form {...returnToolForm}>
            <form onSubmit={returnToolForm.handleSubmit(onReturnToolSubmit)} className="space-y-4 py-4">
              <FormField
                control={returnToolForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tool Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="returned">Returned (Good Condition)</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="missing">Missing</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={returnToolForm.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition Details</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Describe the tool's condition"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={returnToolForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional information about the return"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsReturnDialogOpen(false);
                    setSelectedTool(null);
                  }}
                  type="button"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={returnToolMutation.isPending}
                >
                  {returnToolMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : "Confirm Return"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Admin Signout Tool to Technician Dialog */}
      {isAdmin && (
        <Dialog open={isAdminSignoutDialogOpen} onOpenChange={setIsAdminSignoutDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Tool to Technician</DialogTitle>
              <DialogDescription>
                Sign out this tool to a specific technician.
              </DialogDescription>
            </DialogHeader>
            <Form {...adminSignoutForm}>
              <form onSubmit={adminSignoutForm.handleSubmit(onAdminSignoutSubmit)} className="space-y-4 py-4">
                <FormField
                  control={adminSignoutForm.control}
                  name="technicianId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Technician</FormLabel>
                      <FormControl>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a technician" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableUsers?.map((person) => (
                              <SelectItem key={person.id} value={person.id.toString()}>
                                {person.name} ({person.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={adminSignoutForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any notes about this assignment"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAdminSignoutDialogOpen(false)}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={adminSignoutMutation.isPending}
                  >
                    {adminSignoutMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Assigning...
                      </>
                    ) : "Assign Tool"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Tool Confirmation Dialog (Admin Only) */}
      {isAdmin && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Tool</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this tool? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {selectedTool && (
              <div className="py-4">
                <div className="mb-4 p-4 border rounded-md bg-muted">
                  <p className="font-medium">Tool #{selectedTool.toolNumber}</p>
                  <p className="text-muted-foreground">{selectedTool.toolName}</p>
                </div>
                
                <div className="text-amber-600 mb-4 flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Warning</p>
                    <p className="text-sm">Deleting this tool will permanently remove it from the system along with all its sign-out history.</p>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => selectedTool && deleteToolMutation.mutate(selectedTool.id)}
                disabled={deleteToolMutation.isPending}
              >
                {deleteToolMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : "Delete Tool"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}