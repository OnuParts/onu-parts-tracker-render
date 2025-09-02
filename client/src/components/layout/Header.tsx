import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, Search, Bell, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [location] = useLocation();
  const [searchInput, setSearchInput] = useState("");
  const { user } = useAuth();
  
  // If not authenticated, show minimal header
  if (!user) {
    return (
      <header className="bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <Link href="/">
            <div className="flex items-center">
              <img src="/external-logo.png" alt="Logo" className="h-20" />
            </div>
          </Link>
        </div>
      </header>
    );
  }
  
  // Function to get the current page title based on location
  const getPageTitle = () => {
    switch (location) {
      case "/":
      case "/dashboard":
        return "Dashboard";
      case "/parts-inventory":
        return "Parts Inventory";
      case "/parts-issuance":
        return "Part Charge-Outs";
      case "/parts-pickup":
        return "Parts Pickup";
      case "/reports":
        return "Reports";
      case "/settings":
        return "Settings";
      case "/technicians":
        return "Technicians";
      case "/buildings":
        return "Buildings";
      default:
        return "";
    }
  };
  
  // Always show hamburger menu for all roles
  const pageTitle = getPageTitle();
  
  return (
    <header className="bg-background border-b">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="bg-orange-100 hover:bg-orange-200 border border-orange-300"
          >
            <Menu className="h-6 w-6 text-orange-600" />
          </Button>
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link href="/inventory-aging">
            <Button variant="outline" size="sm" className="text-sm font-medium bg-blue-50 hover:bg-blue-100">
              Inventory Aging
            </Button>
          </Link>
          <Link href="/performance-dashboard">
            <Button variant="outline" size="sm" className="text-sm font-medium bg-green-50 hover:bg-green-100">
              Performance
            </Button>
          </Link>
          <div className="relative md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-4 h-9"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
