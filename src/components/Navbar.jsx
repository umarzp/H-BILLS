import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  CloudCheck, 
  Sun, 
  Moon, 
  Download, 
  ShieldCheck, 
  UserCheck, 
  Receipt,
  Search,
  Trash2
} from 'lucide-react';

export const Navbar = () => {
  const { settings, toggleTheme, user, switchUserRole, cloudStatus, exportDataJSON, setActiveTab } = useApp();

  return (
    <header className="navbar no-print">
      <div className="navbar-brand">
        <div className="brand-icon">
          <Receipt size={22} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>H BILLS</span>
            <span className="brand-badge">PRO POS</span>
          </div>
          <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {settings.storeName}
          </p>
        </div>
      </div>

      <div className="navbar-actions">

        {/* Quick Cloud Sync Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          background: 'var(--success-bg)',
          color: 'var(--success)',
          fontSize: '0.775rem',
          fontWeight: 600
        }}>
          <CloudCheck size={16} />
          <span>Live Sync</span>
        </div>

        {/* Quick Backup Data Button */}
        <button 
          onClick={exportDataJSON}
          className="btn btn-secondary btn-sm"
          title="Backup Application Data (JSON)"
        >
          <Download size={15} />
          <span>Backup</span>
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="btn-icon"
          title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          {user.role === 'admin' ? (
            <ShieldCheck size={16} style={{ color: 'var(--accent-primary)' }} />
          ) : (
            <UserCheck size={16} style={{ color: 'var(--warning)' }} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 700, lineHeight: 1.1 }}>{user.name}</span>
            <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>Role: {user.role}</span>
          </div>
          <button
            onClick={() => switchUserRole(user.role === 'admin' ? 'staff' : 'admin')}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: '0.675rem',
              padding: '2px 6px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginLeft: '4px'
            }}
            title="Switch between Admin and Staff view"
          >
            Switch
          </button>
        </div>
      </div>
    </header>
  );
};
