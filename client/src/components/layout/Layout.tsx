import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  BoxesIcon, 
  PackageOpen,
  BarChart3, 
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };
  
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
  
  // If on login page or not authenticated, render without sidebar and header
  if (location === '/login' || !user) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <main className="flex-1 bg-background">
            {children}
          </main>
        </div>
      </div>
    );
  }
  
  // Mobile navigation items
  const getNavItems = () => {
    const items = [];
    
    if (user.role === "admin") {
      items.push(
        { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { title: "Inventory", href: "/parts-inventory", icon: BoxesIcon },
        { title: "Issuance", href: "/parts-issuance", icon: PackageOpen },
        { title: "Reports", href: "/reports", icon: BarChart3 },
        { title: "Settings", href: "/settings", icon: Settings }
      );
    } else if (user.role === "technician") {
      items.push(
        { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }
      );
    } else if (user.role === "student") {
      items.push(
        { title: "Inventory", href: "/parts-inventory", icon: BoxesIcon }
      );
    }
    
    return items;
  };
  
  const navItems = getNavItems();
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        isMobile={isMobile} 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
