import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Receipt, 
  Package, 
  ShoppingBag, 
  BarChart3,
  Settings
} from 'lucide-react';

export const MobileNav = () => {
  const { activeTab, setActiveTab, user } = useApp();

  const mobileItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'reports', label: 'Reports', icon: BarChart3, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="mobile-nav no-print">
      {mobileItems.map(item => {
        if (item.adminOnly && user.role !== 'admin') return null;
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
