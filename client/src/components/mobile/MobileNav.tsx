import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { 
  Home,
  Package,
  PackageOpen,
  Truck,
  ShoppingBag,
  Settings,
  LayoutDashboard,
  Building,
  Users,
  BarChart4,
  BarChart3,
  Calculator,
  Wrench,
  ShoppingCart,
  Hammer,
  Map,
  Warehouse,
  Scan
} from 'lucide-react';

export function MobileBottomNav() {
  const { user } = useAuth();
  const [location] = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  if (!user) return null;
  
  // Define navigation items based on user role
  const getNavItems = () => {
    if (user.role === 'admin' || user.role === 'controller') {
      return [
        { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { href: '/parts-inventory', label: 'Inventory', icon: <Package size={20} /> },
        { href: '/bulk-inventory', label: 'Bulk Inventory', icon: <Warehouse size={20} /> },
        { href: '/parts-issuance', label: 'Charge-Outs', icon: <Wrench size={20} /> },
        { href: '/barcode-kiosk', label: 'Kiosk', icon: <Scan size={20} /> },
        { href: '/parts-pickup', label: 'Pickup', icon: <ShoppingCart size={20} /> },
        { href: '/tool-signout', label: 'Tools', icon: <Hammer size={20} /> },
        { href: '/deliveries', label: 'Deliveries', icon: <PackageOpen size={20} /> },
        { href: '/staff-management', label: 'Staff', icon: <Users size={20} /> },
        { href: '/cost-centers', label: 'Cost Centers', icon: <BarChart4 size={20} /> },
        { href: '/buildings', label: 'Buildings', icon: <Building size={20} /> },
        { href: '/locations', label: 'Locations', icon: <Map size={20} /> },
        { href: '/reports', label: 'Reports', icon: <BarChart3 size={20} /> },
        { href: '/inventory-aging', label: 'Inventory Aging', icon: <BarChart3 size={20} /> },
        { href: '/manual-parts-review', label: 'Manual Review', icon: <Package size={20} /> },
        { href: '/technicians', label: 'Technicians', icon: <Users size={20} /> },
        { href: '/settings', label: 'Settings', icon: <Settings size={20} /> }
      ];
    } else if (user.role === 'technician') {
      return [
        { href: '/dashboard', label: 'Home', icon: <Home size={20} /> },
        { href: '/parts-issuance', label: 'Charge-Outs', icon: <Wrench size={20} /> },
        { href: '/barcode-kiosk', label: 'Kiosk', icon: <Scan size={20} /> },
        { href: '/parts-pickup', label: 'Pickup', icon: <ShoppingCart size={20} /> },
        { href: '/tool-signout', label: 'Tools', icon: <Hammer size={20} /> }
      ];
    } else if (user.role === 'student') {
      return [
        { href: '/parts-inventory', label: 'Inventory', icon: <Package size={20} /> },
        { href: '/parts-issuance', label: 'Charge-Outs', icon: <Wrench size={20} /> },
        { href: '/barcode-kiosk', label: 'Kiosk', icon: <Scan size={20} /> },
        { href: '/parts-pickup', label: 'Pickup', icon: <ShoppingCart size={20} /> },
        { href: '/tool-signout', label: 'Tools', icon: <Hammer size={20} /> },
        { href: '/deliveries', label: 'Deliveries', icon: <PackageOpen size={20} /> },
        { href: '/reports', label: 'Reports', icon: <BarChart4 size={20} /> },
        { href: '/inventory-aging', label: 'Inventory Aging', icon: <BarChart3 size={20} /> },
        { href: '/manual-parts-review', label: 'Manual Review', icon: <Package size={20} /> }
      ];
    }
    return [];
  };

  const navItems = getNavItems();
  
  // Scroll to active item when location changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeItem = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeItem) {
        const containerWidth = scrollContainerRef.current.clientWidth;
        const itemLeft = (activeItem as HTMLElement).offsetLeft;
        const itemWidth = (activeItem as HTMLElement).clientWidth;
        
        // Center the active item
        scrollContainerRef.current.scrollLeft = itemLeft - containerWidth / 2 + itemWidth / 2;
      }
    }
  }, [location]);
  
  // Create nav items with proper active state
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div 
        ref={scrollContainerRef}
        className="flex items-center h-16 overflow-x-auto overflow-y-hidden"
        style={{ 
          scrollBehavior: 'smooth'
        }}
      >
        {navItems.map((item, i) => {
          const isActive = location === item.href;
          return (
            <Link key={i} href={item.href}>
              <div 
                data-active={isActive}
                className={`flex flex-col items-center justify-center h-full min-w-[80px] flex-shrink-0 px-3 cursor-pointer ${
                  isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="mb-1">{item.icon}</div>
                <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}