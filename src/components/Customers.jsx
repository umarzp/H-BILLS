import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  UserPlus, 
  Search, 
  CreditCard, 
  History, 
  X,
  Phone,
  Mail,
  Building,
  CheckCircle,
  Edit3,
  Trash2
} from 'lucide-react';

export const Customers = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, recordCustomerPayment, invoices, user } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCustForPay, setSelectedCustForPay] = useState(null);
  const [showHistoryCust, setShowHistoryCust] = useState(null);

  // Form states
  const [newCustForm, setNewCustForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    address: '',
    gstIn: '',
    outstanding: '0'
  });

  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('Cash');
  const [payNote, setPayNote] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery)) ||
    (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingCustomerId(null);
    setNewCustForm({ name: '', phone: '', email: '', company: '', address: '', gstIn: '', outstanding: '0' });
    setShowAddModal(true);
  };

  const handleOpenEdit = (cust) => {
    setEditingCustomerId(cust.id);
    setNewCustForm({
      name: cust.name || '',
      phone: cust.phone || '',
      email: cust.email || '',
      company: cust.company || '',
      address: cust.address || '',
      gstIn: cust.gstIn || '',
      outstanding: cust.outstanding || '0'
    });
    setShowAddModal(true);
  };

  const handleAddCustomerSubmit = (e) => {
    e.preventDefault();
    if (!newCustForm.name) return;
    if (editingCustomerId) {
      updateCustomer(editingCustomerId, newCustForm);
      alert('Customer updated successfully!');
    } else {
      addCustomer(newCustForm);
      alert('Customer created successfully!');
    }
    setShowAddModal(false);
    setNewCustForm({ name: '', phone: '', email: '', company: '', address: '', gstIn: '', outstanding: '0' });
  };

  const handleDeleteCustomer = (id, name) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}"?`)) {
      deleteCustomer(id);
    }
  };

  const handleRecordPaySubmit = (e) => {
    e.preventDefault();
    if (!selectedCustForPay || !payAmount) return;

    recordCustomerPayment(selectedCustForPay.id, payAmount, payMode, payNote);
    setShowPayModal(false);
    setSelectedCustForPay(null);
    setPayAmount('');
    setPayNote('');
    alert('Payment recorded and customer ledger updated!');
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={26} style={{ color: 'var(--accent-primary)' }} />
            <span>Customers & Outstanding Balances</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage customer directories, track credit accounts, purchase history, and log inward payment receipts.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <UserPlus size={18} />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search customers by name, phone, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="card">
        {filteredCustomers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>No Customers Added</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>Your customer directory is empty. Add a new customer or generate retail walk-in bills!</p>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              <UserPlus size={18} />
              <span>Add Your First Customer</span>
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Company / Phone</th>
                  <th>Total Spent</th>
                  <th>Outstanding Balance</th>
                  <th>GSTIN</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(cust => {
                  const hasDue = cust.outstanding > 0;
                  return (
                    <tr key={cust.id}>
                      <td style={{ fontWeight: 700 }}>
                        {cust.name}
                        {cust.email && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{cust.email}</span>}
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{cust.company || 'Individual'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{cust.phone}</span>
                      </td>
                      <td style={{ fontWeight: 800 }}>₹{(cust.totalSpent || 0).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`badge ${hasDue ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.85rem', padding: '0.3rem 0.75rem' }}>
                          ₹{(cust.outstanding || 0).toLocaleString('en-IN')} {hasDue ? 'DUE' : 'CLEAR'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {cust.gstIn || 'N/A'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {hasDue && (
                            <button
                              onClick={() => {
                                setSelectedCustForPay(cust);
                                setPayAmount(cust.outstanding);
                                setShowPayModal(true);
                              }}
                              className="btn btn-success btn-sm"
                              title="Receive Payment"
                            >
                              <CreditCard size={14} />
                              <span>Collect Payment</span>
                            </button>
                          )}

                          <button
                            onClick={() => setShowHistoryCust(cust)}
                            className="btn btn-secondary btn-sm"
                            title="View Bills History"
                          >
                            <History size={14} />
                            <span>History</span>
                          </button>

                          {user.role === 'admin' && (
                            <>
                              <button onClick={() => handleOpenEdit(cust)} className="btn-icon" title="Edit Customer">
                                <Edit3 size={15} />
                              </button>
                              <button onClick={() => handleDeleteCustomer(cust.id, cust.name)} className="btn-icon" style={{ color: 'var(--danger)' }} title="Delete Customer">
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Customer */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Add New Customer</h3>
              <button onClick={() => setShowAddModal(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={newCustForm.name}
                    onChange={(e) => setNewCustForm(f => ({ ...f, name: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newCustForm.phone}
                    onChange={(e) => setNewCustForm(f => ({ ...f, phone: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Metro Builders"
                    value={newCustForm.company}
                    onChange={(e) => setNewCustForm(f => ({ ...f, company: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    placeholder="rajesh@metro.in"
                    value={newCustForm.email}
                    onChange={(e) => setNewCustForm(f => ({ ...f, email: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="32AAPFT8606A1ZB"
                    value={newCustForm.gstIn}
                    onChange={(e) => setNewCustForm(f => ({ ...f, gstIn: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Billing Address</label>
                  <input
                    type="text"
                    placeholder="Full street address..."
                    value={newCustForm.address}
                    onChange={(e) => setNewCustForm(f => ({ ...f, address: e.target.value }))}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Customer</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Collect Payment */}
      {showPayModal && selectedCustForPay && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Receive Payment from {selectedCustForPay.name}
              </h3>
              <button onClick={() => setShowPayModal(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordPaySubmit}>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Due Balance:</p>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>
                  ₹{(selectedCustForPay.outstanding || 0).toLocaleString('en-IN')}
                </h2>
              </div>

              <div className="form-group">
                <label className="form-label">Amount Received (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedCustForPay.outstanding}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="form-select"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI Transfer</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Bank">Bank Deposit</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Note / Receipt Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Clearing Invoice #HB-1002"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
                  <CheckCircle size={16} />
                  <span>Confirm Receipt</span>
                </button>
                <button type="button" onClick={() => setShowPayModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer/Modal: Customer Bills History */}
      {showHistoryCust && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Invoice History - {showHistoryCust.name}
                </h3>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  Total Invoices: {invoices.filter(i => i.customerId === showHistoryCust.id || i.customerName === showHistoryCust.name).length}
                </p>
              </div>
              <button onClick={() => setShowHistoryCust(null)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Total (₹)</th>
                    <th>Mode</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices
                    .filter(i => i.customerId === showHistoryCust.id || i.customerName === showHistoryCust.name)
                    .map(inv => (
                      <tr key={inv.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-primary)' }}>{inv.invoiceNumber}</td>
                        <td>{inv.date}</td>
                        <td style={{ fontWeight: 800 }}>₹{inv.total.toLocaleString('en-IN')}</td>
                        <td><span className="badge badge-blue">{inv.paymentMode}</span></td>
                        <td>
                          <span className={`badge ${inv.paymentStatus === 'PAID' ? 'badge-success' : 'badge-danger'}`}>
                            {inv.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
