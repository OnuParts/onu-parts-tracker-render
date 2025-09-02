import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BoxesIcon, 
  PackageOpen,
  Package,
  BarChart3, 
  Settings,
  X,
  User,
  UserCog,
  LogOut,
  Building,
  Building2,
  Users,
  Map,
  Calculator,
  ShoppingBag,
  Truck,
  Wrench,
  ShoppingCart,
  Shield,
  TrendingUp,
  Scan
} from "lucide-react";
import { Button } from "@/components/ui/button";
import onuLogo from "@/assets/onu-logo.svg";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles: string[];
}

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isMobile, isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  
  // Define icon components directly to ensure they load on all devices
  const dashboardIcon = () => <LayoutDashboard className="h-5 w-5" />;
  const inventoryIcon = () => <BoxesIcon className="h-5 w-5" />;
  const issuanceIcon = () => <Wrench className="h-5 w-5" />;
  const pickupIcon = () => <ShoppingCart className="h-5 w-5" />;
  const techPickupIcon = () => <ShoppingCart className="h-5 w-5" />;
  const toolIcon = () => <Wrench className="h-5 w-5" />;
  
  // Navigation items
  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: dashboardIcon,
      roles: ["admin", "controller"],
    },
    {
      title: "Parts Inventory",
      href: "/parts-inventory",
      icon: inventoryIcon,
      roles: ["admin", "student", "controller"],
    },
    {
      title: "Bulk Inventory",
      href: "/bulk-inventory",
      icon: () => <Package className="h-5 w-5" />,
      roles: ["admin", "student", "controller"],
    },
    {
      title: "Part Charge-Outs",
      href: "/parts-issuance",
      icon: issuanceIcon,
      roles: ["admin", "technician", "student", "controller"],
    },
    {
      title: "Barcode Kiosk",
      href: "/barcode-kiosk",
      icon: () => <Scan className="h-5 w-5" />,
      roles: ["admin", "student", "technician"],
    },
    {
      title: "Parts Pickup",
      href: "/parts-pickup", // Use the same route for all roles
      icon: pickupIcon,
      roles: ["admin", "student", "technician", "controller"],
    },
    {
      title: "Tool SignOut",
      href: "/tool-signout",
      icon: () => <Wrench className="h-5 w-5" />,
      roles: ["admin", "student", "technician", "controller"],
    },
    {
      title: "Deliveries",
      href: "/deliveries",
      icon: () => <PackageOpen className="h-5 w-5" />,
      roles: ["admin", "student", "controller"],
    },
    {
      title: "Delivery Requests",
      href: "/delivery-requests-admin",
      icon: () => <Truck className="h-5 w-5" />,
      roles: ["admin", "controller"],
    },
    {
      title: "Staff Management",
      href: "/staff-management",
      icon: () => <UserCog className="h-5 w-5" />,
      roles: ["admin", "controller"],
    },
    {
      title: "Cost Centers",
      href: "/cost-centers",
      icon: () => <Building2 className="h-5 w-5" />,
      roles: ["admin", "controller"],
    },
    {
      title: "Reports",
      href: "/reports",
      icon: () => <BarChart3 className="h-5 w-5" />,
      roles: ["admin", "student", "controller"],
    },
    {
      title: "Usage Analytics",
      href: "/parts-usage-analytics",
      icon: () => <TrendingUp className="h-5 w-5" />,
      roles: ["admin", "controller"],
    },
    {
      title: "Performance Dashboard",
      href: "/performance-dashboard",
      icon: () => <Shield className="h-5 w-5" />,
      roles: ["admin"],
    },
    {
      title: "Manual Parts Review",
      href: "/manual-parts-review",
      icon: () => <Package className="h-5 w-5" />,
      roles: ["admin", "student"],
    },
    {
      title: "Buildings",
      href: "/buildings",
      icon: () => <Building className="h-5 w-5" />,
      roles: ["admin", "controller"],
    },
    {
      title: "Locations",
      href: "/locations",
      icon: () => <Map className="h-5 w-5" />,
      roles: ["admin", "controller"],
    },
    {
      title: "Technicians",
      href: "/technicians",
      icon: () => <Users className="h-5 w-5" />,
      roles: ["admin", "controller"],
    },
    {
      title: "Quick Count",
      href: "/quick-count",
      icon: () => <Calculator className="h-5 w-5" />,
      roles: ["admin", "student", "controller"],
    },
    {
      title: "Tool SignOut",
      href: "/tool-signout",
      icon: toolIcon,
      roles: ["admin", "technician", "controller"],
    },
    {
      title: "Barcode Kiosk",
      href: "/barcode-kiosk",
      icon: () => <Scan className="h-5 w-5" />,
      roles: ["admin", "student", "technician"],
    },
    {
      title: "Settings",
      href: "/settings",
      icon: () => <Settings className="h-5 w-5" />,
      roles: ["admin", "controller"],
    },
    {
      title: "System Admin",
      href: "/system-admin",
      icon: () => <Shield className="h-5 w-5" />,
      roles: ["admin"],
    },
  ];
  
  // Even if it's mobile and the sidebar is not open, we shouldn't return null
  // because that would prevent the sidebar from being openable
  // Instead, we'll use CSS to hide it

  // If no user is authenticated, don't show sidebar
  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the system",
      });
    } catch (error) {
      // Error already handled in mutation
    }
  };

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));
  
  return (
    <div 
      className={cn(
        "bg-background w-64 h-screen border-r shadow-sm z-30 transition-transform",
        isMobile ? "fixed inset-y-0 left-0" : "relative",
        isMobile && !isOpen && "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <img src="/external-logo.png" alt="Logo" className="h-24" />
        </div>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <div className="p-4 flex flex-col h-[calc(100%-64px)]">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
            <User className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <p className="font-medium">{user.name}</p>
            <div className="flex items-center">
              <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
              <button 
                onClick={handleLogout}
                className="text-sm text-primary hover:underline ml-2"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {filteredNavItems.map((item, index) => {
              const isActive = location === item.href || 
                              (item.href === "/dashboard" && location === "/");
              
              return (
                <li key={index}>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex items-center p-2 rounded-md",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      <div className="mr-3">
                        <item.icon />
                      </div>
                      {item.title}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Using the Sign Out link next to username instead of a button at the bottom */}
      </div>
    </div>
  );
}
