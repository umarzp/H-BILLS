import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings, 
  Download, 
  Upload, 
  RotateCcw, 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  Save, 
  QrCode,
  FileText,
  Trash2
} from 'lucide-react';

export const SettingsBackup = () => {
  const { 
    settings, 
    updateSettings, 
    user, 
    switchUserRole, 
    exportDataJSON, 
    importDataJSON 
  } = useApp();

  const [form, setForm] = useState({
    storeName: settings.storeName || '',
    tagline: settings.tagline || '',
    gstIn: settings.gstIn || '',
    phone: settings.phone || '',
    email: settings.email || '',
    address: settings.address || '',
    upiId: settings.upiId || '',
    terms: settings.terms || ''
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateSettings(form);
    alert('Business Profile & Billing settings updated successfully!');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      importDataJSON(event.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={26} style={{ color: 'var(--accent-primary)' }} />
            <span>Store Profile & Data Backup</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Configure your business receipt details, UPI payment ID, user roles, and export/import full system backups.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
        {/* LEFT: Business Profile Form */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} style={{ color: 'var(--accent-primary)' }} />
            <span>Business Profile & Invoice Details</span>
          </h3>

          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Store / Company Name *</label>
                <input
                  type="text"
                  required
                  value={form.storeName}
                  onChange={(e) => setForm(f => ({ ...f, storeName: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Tagline / Business Description</label>
                <input
                  type="text"
                  placeholder="e.g. Quality Building Hardware & Trade Mart"
                  value={form.tagline}
                  onChange={(e) => setForm(f => ({ ...f, tagline: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">GSTIN Number</label>
                <input
                  type="text"
                  placeholder="32AAPFT8606A1ZB"
                  value={form.gstIn}
                  onChange={(e) => setForm(f => ({ ...f, gstIn: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">UPI VPA Payment ID *</label>
                <input
                  type="text"
                  placeholder="hbills@upi"
                  value={form.upiId}
                  onChange={(e) => setForm(f => ({ ...f, upiId: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 98765 00000"
                  value={form.phone}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Support Email</label>
                <input
                  type="email"
                  placeholder="support@store.com"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Store Address</label>
                <input
                  type="text"
                  placeholder="Full address printed on invoices..."
                  value={form.address}
                  onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Invoice Terms & Conditions</label>
                <textarea
                  rows="3"
                  value={form.terms}
                  onChange={(e) => setForm(f => ({ ...f, terms: e.target.value }))}
                  className="form-textarea"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              <Save size={18} />
              <span>Save Business Settings</span>
            </button>
          </form>
        </div>

        {/* RIGHT: User Auth Roles & Data Backup Exporter/Importer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* User Account Role Switcher */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} style={{ color: 'var(--accent-primary)' }} />
              <span>Account Role Switcher</span>
            </h3>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Switch current user mode between <strong>Admin</strong> (full reports & cost access) and <strong>Staff Cashier</strong> (POS & stock view).
            </p>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => switchUserRole('admin')}
                className={`btn ${user.role === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
              >
                <ShieldCheck size={16} />
                <span>Admin</span>
              </button>

              <button
                onClick={() => switchUserRole('staff')}
                className={`btn ${user.role === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
              >
                <UserCheck size={16} />
                <span>Staff Cashier</span>
              </button>
            </div>
          </div>

          {/* Backup & Restore Panel */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={20} style={{ color: 'var(--success)' }} />
              <span>Data Backup & Restore</span>
            </h3>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Export a full offline JSON copy of your store's items, bills, customer accounts, and logs, or restore from a backup file.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Export JSON Button */}
              <button onClick={exportDataJSON} className="btn btn-success" style={{ width: '100%' }}>
                <Download size={18} />
                <span>Export Full Backup (JSON)</span>
              </button>

              {/* Import JSON File Input */}
              <label className="btn btn-secondary" style={{ width: '100%', cursor: 'pointer', textAlign: 'center' }}>
                <Upload size={18} />
                <span>Restore Data from Backup JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
