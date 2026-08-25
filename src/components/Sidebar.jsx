import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Receipt, 
  Package, 
  ShoppingBag, 
  Users, 
  Factory, 
  CreditCard, 
  BarChart3, 
  Settings,
  AlertTriangle
} from 'lucide-react';

export const Sidebar = () => {
  const { activeTab, setActiveTab, products, user } = useApp();

  const lowStockCount = products.filter(p => p.stock <= (p.minStock || 5)).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, role: 'all' },
    { id: 'billing', label: '🧾 Billing & POS', icon: Receipt, role: 'all' },
    { id: 'inventory', label: '📦 Inventory', icon: Package, role: 'all', badge: lowStockCount > 0 ? lowStockCount : null },
    { id: 'products', label: '🛒 Products Catalog', icon: ShoppingBag, role: 'all' },
    { id: 'customers', label: '👥 Customers', icon: Users, role: 'all' },
    { id: 'suppliers', label: '🏭 Suppliers', icon: Factory, role: 'all' },
    { id: 'payments', label: '💰 Payments Ledger', icon: CreditCard, role: 'all' },
    { id: 'reports', label: '📊 Analytics & Reports', icon: BarChart3, role: 'admin' },
    { id: 'settings', label: '⚙️ Settings & Backup', icon: Settings, role: 'all' },
  ];

  return (
    <aside className="sidebar no-print">
      <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.5rem' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Navigation
        </p>
      </div>

      {navItems.map(item => {
        if (item.role === 'admin' && user.role !== 'admin') return null;
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{item.label}</span>
            {item.badge && (
              <span className="nav-badge" title={`${item.badge} items in low stock!`}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}

      <div style={{ marginTop: 'auto', padding: '1rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} style={{ color: lowStockCount > 0 ? 'var(--warning)' : 'var(--success)' }} />
          <div>
            <p style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {lowStockCount > 0 ? `${lowStockCount} Low Stock Items` : 'All Stock Optimal'}
            </p>
            <p style={{ fontSize: '0.675rem', color: 'var(--text-secondary)' }}>
              {lowStockCount > 0 ? 'Restock needed soon' : 'Inventory healthy'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
