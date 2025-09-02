import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Shield, 
  Settings as SettingsIcon, 
  Bell, 
  Database, 
  Save,
  Users,
  HardDrive,
  Loader2,
  PlusCircle,
  Check,
  X,
  Building as BuildingIcon,
  Download,
  Upload,
  File,
  Edit,
  Trash,
  Cloud,
  RefreshCw
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import type { User as UserType } from "@shared/schema";
import type { Building } from "@shared/schema";

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Password form schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function Settings() {
  const [activeTab, setActiveTab] = useState("account");
  const { toast } = useToast();
  
  // Fetch users for user management tab
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery<UserType[]>({
    queryKey: ['/api/technicians'],
  });
  
  // Fetch buildings for buildings management tab
  const { data: buildings, isLoading: buildingsLoading, refetch: refetchBuildings } = useQuery<Building[]>({
    queryKey: ['/api/buildings'],
  });
  
  // Define profile type
  type ProfileType = {
    id: number;
    name: string;
    email: string;
  };
  
  // Get current user profile
  const { data: profile, isLoading: profileLoading } = useQuery<ProfileType>({
    queryKey: ['/api/profile'],
    queryFn: getQueryFn<ProfileType>({ on401: "returnNull" })
  });
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });
  
  // Update form values when profile data changes
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name,
        email: profile.email
      });
    }
  }, [profile, profileForm]);
  
  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Define response type for profile update
  type ProfileUpdateResponse = {
    success: boolean;
    user: ProfileType;
  };
  
  // Profile update mutation
  const profileUpdateMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      console.log("Updating profile:", data);
      return await apiRequest("PATCH", "/api/profile", data);
    },
    onSuccess: (result, variables) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      
      // Invalidate and refetch the profile data
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update profile: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  });
  
  // Password change mutation
  const passwordChangeMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      return await apiRequest("POST", "/api/change-password", data);
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      });
      
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to change password: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  });
  
  // Notification settings state
  const [newWorkOrders, setNewWorkOrders] = useState(true);
  const [statusChanges, setStatusChanges] = useState(true);
  const [comments, setComments] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [partIssuance, setPartIssuance] = useState(false);
  
  // Type for notification settings
  type NotificationSettings = {
    system?: {
      companyName: string;
      systemEmail: string;
    };
    workOrders: {
      newWorkOrders: boolean;
      statusChanges: boolean;
      comments: boolean;
    };
    inventory: {
      lowStockAlerts: boolean;
      partIssuance: boolean;
    };
  };
  
  // Fetch notification settings
  const { data: notificationSettings } = useQuery<NotificationSettings>({
    queryKey: ['/api/notification-settings'],
  });
  
  // Update state when notification settings data changes
  useEffect(() => {
    if (notificationSettings) {
      setNewWorkOrders(notificationSettings.workOrders?.newWorkOrders ?? true);
      setStatusChanges(notificationSettings.workOrders?.statusChanges ?? true);
      setComments(notificationSettings.workOrders?.comments ?? false);
      setLowStockAlerts(notificationSettings.inventory?.lowStockAlerts ?? true);
      setPartIssuance(notificationSettings.inventory?.partIssuance ?? false);
    }
  }, [notificationSettings]);
  
  // Notification settings mutation
  const notificationSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      console.log("Updating notification settings:", settings);
      return await apiRequest("PATCH", "/api/notification-settings", settings);
    },
    onSuccess: () => {
      // Invalidate notification settings query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/notification-settings'] });
      
      toast({
        title: "Settings Updated",
        description: "Your notification settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update notification settings: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  });
  
  // System settings mutation
  const systemSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      return await apiRequest("PATCH", "/api/system-settings", settings);
    },
    onSuccess: () => {
      // Invalidate notification settings to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/notification-settings'] });
      
      toast({
        title: "System Settings Updated",
        description: "Your system settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update system settings: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  });
  
  // Database backup mutation
  const backupDatabaseMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/backup");
    },
    onSuccess: (response) => {
      toast({
        title: "Backup Completed",
        description: "Database backup was created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Backup Failed",
        description: `Failed to create database backup: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle save notification settings
  const handleSaveNotificationSettings = () => {
    const settings = {
      workOrders: {
        newWorkOrders,
        statusChanges,
        comments,
      },
      inventory: {
        lowStockAlerts,
        partIssuance,
      }
    };
    
    notificationSettingsMutation.mutate(settings);
  };
  
  // Handle save system settings
  const handleSaveSystemSettings = () => {
    const companyName = document.getElementById('company-name') instanceof HTMLInputElement ? 
      (document.getElementById('company-name') as HTMLInputElement).value : "Ohio Northern University";
      
    const systemEmail = document.getElementById('system-email') instanceof HTMLInputElement ? 
      (document.getElementById('system-email') as HTMLInputElement).value : "m-gierhart@onu.edu";
      
    const workOrderPrefix = document.getElementById('work-order-prefix') instanceof HTMLInputElement ? 
      (document.getElementById('work-order-prefix') as HTMLInputElement).value : "WO-";
      
    const defaultMessage = document.getElementById('default-message') instanceof HTMLTextAreaElement ? 
      (document.getElementById('default-message') as HTMLTextAreaElement).value : "";
    
    // Update the system settings portion of the notification settings
    const settings = {
      system: {
        companyName,
        systemEmail
      },
      workOrderPrefix,
      defaultMessage
    };
    
    systemSettingsMutation.mutate(settings);
  };
  
  // Form submission handlers
  const handleProfileSubmit = (data: ProfileFormValues) => {
    profileUpdateMutation.mutate(data);
  };
  
  const handlePasswordSubmit = (data: PasswordFormValues) => {
    passwordChangeMutation.mutate(data);
  };
  
  // Technician mutations
  const updateTechnician = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return await apiRequest("PATCH", `/api/technicians/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Technician Updated",
        description: "The technician has been updated successfully."
      });
      setTechnicianToEdit(null);
      refetchUsers();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update technician. " + (error instanceof Error ? error.message : ""),
        variant: "destructive"
      });
    }
  });
  
  const deleteTechnician = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/technicians/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Technician Deleted",
        description: "The technician has been deleted successfully."
      });
      refetchUsers();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete technician. " + (error instanceof Error ? error.message : ""),
        variant: "destructive"
      });
    }
  });

  // Dialog and edit states
  const [technicianToDelete, setTechnicianToDelete] = useState<number | null>(null);
  const [buildingToDelete, setBuildingToDelete] = useState<number | null>(null);
  const [technicianToEdit, setTechnicianToEdit] = useState<UserType | null>(null);
  const [buildingToEdit, setBuildingToEdit] = useState<Building | null>(null);
  
  // Form schemas for editing
  const technicianSchema = z.object({
    name: z.string().min(1, "Name is required"),
    username: z.string().min(1, "Username is required"),
    department: z.string().optional(),
    role: z.enum(["admin", "technician", "student"])
  });
  
  const buildingSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    address: z.string().optional(),
    contactPerson: z.string().optional()
  });
  
  // Form for editing technician
  const technicianForm = useForm<z.infer<typeof technicianSchema>>({
    resolver: zodResolver(technicianSchema),
    defaultValues: {
      name: "",
      username: "",
      department: "",
      role: "technician"
    }
  });
  
  // Form for editing building
  const buildingForm = useForm<z.infer<typeof buildingSchema>>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      contactPerson: ""
    }
  });
  
  // Building mutations
  const updateBuilding = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return await apiRequest("PATCH", `/api/buildings/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Building Updated",
        description: "The building has been updated successfully."
      });
      setBuildingToEdit(null);
      refetchBuildings();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update building. " + (error instanceof Error ? error.message : ""),
        variant: "destructive"
      });
    }
  });
  
  const deleteBuilding = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/buildings/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Building Deleted",
        description: "The building has been deleted successfully."
      });
      refetchBuildings();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete building. " + (error instanceof Error ? error.message : ""),
        variant: "destructive"
      });
    }
  });
  
  // Columns type definitions
  type UserColumn = {
    header: string;
    accessor: keyof UserType | ((user: UserType) => React.ReactNode);
    className?: string;
  };
  
  type BuildingColumn = {
    header: string;
    accessor: keyof Building | ((building: Building) => React.ReactNode);
    className?: string;
  };

  // User columns for the data table
  const userColumns: UserColumn[] = [
    {
      header: "Name",
      accessor: (user: UserType) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mr-2">
            <User className="h-4 w-4" />
          </div>
          {user.name}
        </div>
      ),
    },
    {
      header: "Username",
      accessor: "username",
    },
    {
      header: "Role",
      accessor: (user: UserType) => (
        <span className="capitalize">{user.role}</span>
      ),
    },
    {
      header: "Department",
      accessor: (user: UserType) => user.department || "-",
    },
    {
      header: "Actions",
      accessor: (user: UserType) => (
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              // Set the technician to edit
              setTechnicianToEdit(user);
              
              // Reset form with values
              technicianForm.reset({
                name: user.name,
                username: user.username,
                department: user.department || "",
                role: user.role
              });
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive"
            onClick={() => {
              // Don't allow deleting admin users
              if (user.role === 'admin') {
                toast({
                  title: "Cannot Delete Admin",
                  description: "Administrator users cannot be deleted.",
                  variant: "destructive"
                });
                return;
              }
              
              setTechnicianToDelete(user.id);
            }}
            disabled={user.role === 'admin'}
          >
            Delete
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];
  
  // Building columns for the data table
  const buildingColumns: BuildingColumn[] = [
    {
      header: "Name",
      accessor: (building: Building) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2">
            <BuildingIcon className="h-4 w-4" />
          </div>
          {building.name}
        </div>
      ),
    },
    {
      header: "Description",
      accessor: (building: Building) => building.description || "-",
    },
    {
      header: "Address",
      accessor: (building: Building) => building.address || "-",
    },
    {
      header: "Contact Person",
      accessor: (building: Building) => building.contactPerson || "-",
    },
    {
      header: "Actions",
      accessor: (building: Building) => (
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              // Set the building to edit
              setBuildingToEdit(building);
              
              // Reset form with values
              buildingForm.reset({
                name: building.name,
                description: building.description || "",
                address: building.address || "",
                contactPerson: building.contactPerson || ""
              });
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive"
            onClick={() => setBuildingToDelete(building.id)}
          >
            Delete
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];
  
  return (
    <>
      {/* Delete Technician Confirmation Dialog */}
      <AlertDialog open={technicianToDelete !== null} onOpenChange={() => setTechnicianToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the technician
              account and all related data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (technicianToDelete) {
                  deleteTechnician.mutate(technicianToDelete);
                }
                setTechnicianToDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTechnician.isPending ? 
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : 
                <><Trash className="mr-2 h-4 w-4" /> Delete</>
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Building Confirmation Dialog */}
      <AlertDialog open={buildingToDelete !== null} onOpenChange={() => setBuildingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the building
              and all related data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (buildingToDelete) {
                  deleteBuilding.mutate(buildingToDelete);
                }
                setBuildingToDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBuilding.isPending ? 
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : 
                <><Trash className="mr-2 h-4 w-4" /> Delete</>
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Technician Dialog */}
      <Dialog open={technicianToEdit !== null} onOpenChange={(open) => !open && setTechnicianToEdit(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Technician</DialogTitle>
            <DialogDescription>
              Update technician information and permissions.
            </DialogDescription>
          </DialogHeader>
          <Form {...technicianForm}>
            <form onSubmit={technicianForm.handleSubmit((data) => {
              if (technicianToEdit) {
                updateTechnician.mutate({ 
                  id: technicianToEdit.id, 
                  data: data 
                });
              }
            })} className="space-y-4">
              <FormField
                control={technicianForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={technicianForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={technicianForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={technicianForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="technician">Technician</SelectItem>
                          <SelectItem value="student">Student Worker</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setTechnicianToEdit(null)} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={updateTechnician.isPending}>
                  {updateTechnician.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" />Save Changes</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Building Dialog */}
      <Dialog open={buildingToEdit !== null} onOpenChange={(open) => !open && setBuildingToEdit(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Building</DialogTitle>
            <DialogDescription>
              Update building information.
            </DialogDescription>
          </DialogHeader>
          <Form {...buildingForm}>
            <form onSubmit={buildingForm.handleSubmit((data) => {
              if (buildingToEdit) {
                updateBuilding.mutate({ 
                  id: buildingToEdit.id, 
                  data: data 
                });
              }
            })} className="space-y-4">
              <FormField
                control={buildingForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={buildingForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={buildingForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={buildingForm.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setBuildingToEdit(null)} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={updateBuilding.isPending}>
                  {updateBuilding.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" />Save Changes</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Manage your account and application settings</p>
        </div>
      </div>
      
      <div className="flex flex-col space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="w-full overflow-x-auto pb-3">
            <TabsList className="inline-flex w-full md:w-auto">
              <TabsTrigger value="account" className="whitespace-nowrap">
                <User className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
              <TabsTrigger value="notifications" className="whitespace-nowrap">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="users" className="whitespace-nowrap">
                <Users className="h-4 w-4 mr-2" />
                Technicians
              </TabsTrigger>
              <TabsTrigger value="buildings" className="whitespace-nowrap">
                <BuildingIcon className="h-4 w-4 mr-2" />
                Buildings
              </TabsTrigger>
              <TabsTrigger value="system" className="whitespace-nowrap">
                <SettingsIcon className="h-4 w-4 mr-2" />
                System
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Account Settings */}
          <TabsContent value="account">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account profile information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit">
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to maintain security
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit">
                        <Shield className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Work Order Notifications</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="new-work-orders">New Work Orders</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications when new work orders are created
                      </p>
                    </div>
                    <Switch 
                      id="new-work-orders" 
                      checked={newWorkOrders} 
                      onCheckedChange={setNewWorkOrders} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="work-order-status">Status Changes</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications when work order status changes
                      </p>
                    </div>
                    <Switch 
                      id="work-order-status" 
                      checked={statusChanges} 
                      onCheckedChange={setStatusChanges} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="work-order-comments">Comments</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications for new comments on work orders
                      </p>
                    </div>
                    <Switch 
                      id="work-order-comments" 
                      checked={comments} 
                      onCheckedChange={setComments} 
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Inventory Notifications</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="low-stock">Low Stock Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications when parts reach low stock levels
                      </p>
                    </div>
                    <Switch 
                      id="low-stock" 
                      checked={lowStockAlerts} 
                      onCheckedChange={setLowStockAlerts} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="part-issuance">Part Issuance</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications when parts are issued to work orders
                      </p>
                    </div>
                    <Switch 
                      id="part-issuance" 
                      checked={partIssuance} 
                      onCheckedChange={setPartIssuance} 
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveNotificationSettings} disabled={notificationSettingsMutation.isPending}>
                  {notificationSettingsMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" />Save Preferences</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Technician Management */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Technician Management</CardTitle>
                    <CardDescription>
                      Manage technicians and users
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.open('/api/technicians/template', '_blank')}>
                      <File className="h-4 w-4 mr-2" />
                      Template
                    </Button>
                    <Button variant="outline" onClick={() => window.open('/api/technicians/export', '_blank')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <a href="#" className="hidden">
                      <input
                        type="file"
                        id="technicians-import-file"
                        className="hidden"
                        accept=".xlsx"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            const formData = new FormData();
                            formData.append('file', file);
                            
                            fetch('/api/technicians/import', {
                              method: 'POST',
                              body: formData,
                            })
                              .then(res => res.json())
                              .then(data => {
                                if (data.success) {
                                  toast({
                                    title: 'Import Successful',
                                    description: `Imported ${data.importedRows} technicians out of ${data.totalRows} rows.`,
                                  });
                                  refetchUsers();
                                } else {
                                  toast({
                                    title: 'Import Partially Successful',
                                    description: `Imported ${data.importedRows} technicians. ${data.errors.length} errors encountered.`,
                                    variant: 'destructive',
                                  });
                                }
                              })
                              .catch(err => {
                                toast({
                                  title: 'Import Failed',
                                  description: 'Failed to import technicians.',
                                  variant: 'destructive',
                                });
                              });
                          }
                          
                          // Reset the input
                          e.target.value = '';
                        }}
                      />
                    </a>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        document.getElementById('technicians-import-file')?.click();
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                    <Button>
                      <User className="h-4 w-4 mr-2" />
                      Add Technician
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Loading technicians...</span>
                  </div>
                ) : (
                  <DataTable
                    data={users || []}
                    columns={userColumns}
                    itemsPerPage={10}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Buildings Management */}
          <TabsContent value="buildings">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Buildings Management</CardTitle>
                      <CardDescription>
                        Manage building information and locations
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => window.open('/api/buildings/template', '_blank')}>
                        <File className="h-4 w-4 mr-2" />
                        Template
                      </Button>
                      <Button variant="outline" onClick={() => window.open('/api/buildings/export', '_blank')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <a href="#" className="hidden">
                        <input
                          type="file"
                          id="buildings-import-file"
                          className="hidden"
                          accept=".xlsx"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const file = e.target.files[0];
                              const formData = new FormData();
                              formData.append('file', file);
                              
                              fetch('/api/buildings/import', {
                                method: 'POST',
                                body: formData,
                              })
                                .then(res => res.json())
                                .then(data => {
                                  if (data.success) {
                                    toast({
                                      title: 'Import Successful',
                                      description: `Imported ${data.importedRows} buildings out of ${data.totalRows} rows.`,
                                    });
                                    refetchBuildings();
                                  } else {
                                    toast({
                                      title: 'Import Partially Successful',
                                      description: `Imported ${data.importedRows} buildings. ${data.errors.length} errors encountered.`,
                                      variant: 'destructive',
                                    });
                                  }
                                })
                                .catch(err => {
                                  toast({
                                    title: 'Import Failed',
                                    description: 'Failed to import buildings.',
                                    variant: 'destructive',
                                  });
                                });
                            }
                            
                            // Reset the input
                            e.target.value = '';
                          }}
                        />
                      </a>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          document.getElementById('buildings-import-file')?.click();
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                      <Button>
                        <BuildingIcon className="h-4 w-4 mr-2" />
                        Add Building
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {buildingsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">Loading buildings...</span>
                    </div>
                  ) : (
                    <DataTable
                      data={buildings || []}
                      columns={buildingColumns}
                      itemsPerPage={10}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* System Settings */}
          <TabsContent value="system">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>
                    View system details and configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Application Name</p>
                      <p className="text-sm text-muted-foreground">ONU Parts Tracker</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Version</p>
                      <p className="text-sm text-muted-foreground">1.0.0</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Server Status</p>
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                        <p className="text-sm text-muted-foreground">Online</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Database Management</CardTitle>
                  <CardDescription>
                    Database settings and operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Database Status</p>
                      <p className="text-sm text-muted-foreground">Connected</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <HardDrive className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Storage Usage</p>
                      <p className="text-sm text-muted-foreground">45.2 MB</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Cloud className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Backup Schedule</p>
                      <p className="text-sm text-muted-foreground">Weekly (Sundays 2:00 AM)</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">Export Data</Button>
                  <Button
                    onClick={() => backupDatabaseMutation.mutate()}
                    disabled={backupDatabaseMutation.isPending}
                  >
                    {backupDatabaseMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating Backup...</>
                    ) : (
                      <><RefreshCw className="h-4 w-4 mr-2" />Create Backup</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>
                    Configure global system settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input 
                      id="company-name" 
                      defaultValue={notificationSettings?.system?.companyName || "Ohio Northern University"} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="system-email">System Email</Label>
                    <Input 
                      id="system-email" 
                      defaultValue={notificationSettings?.system?.systemEmail || "m-gierhart@onu.edu"} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="work-order-prefix">Work Order ID Prefix</Label>
                    <Input id="work-order-prefix" defaultValue="WO-" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="default-message">Default Email Message</Label>
                    <Textarea 
                      id="default-message" 
                      rows={4}
                      defaultValue="This is an automated message from the ONU Parts Tracker System. Please do not reply to this email."
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveSystemSettings}
                    disabled={systemSettingsMutation.isPending}
                  >
                    {systemSettingsMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" />Save Settings</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
