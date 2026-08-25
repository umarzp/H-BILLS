import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Factory, 
  Plus, 
  Search, 
  CreditCard, 
  ShoppingBag, 
  X,
  CheckCircle,
  Truck,
  Edit3,
  Trash2
} from 'lucide-react';

export const Suppliers = () => {
  const { 
    suppliers, 
    addSupplier, 
    updateSupplier,
    deleteSupplier,
    recordSupplierPayment, 
    products, 
    createPurchase, 
    purchases,
    user
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedSuppForPay, setSelectedSuppForPay] = useState(null);

  // Purchase Order Entry Modal
  const [showPOModal, setShowPOModal] = useState(false);

  // Form states
  const [newSuppForm, setNewSuppForm] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    gstIn: '',
    payable: '0'
  });

  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('Bank');
  const [payNote, setPayNote] = useState('');

  // PO Form state
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poItems, setPoItems] = useState([]);
  const [poIsPaid, setPoIsPaid] = useState(true);

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.company && s.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingSupplierId(null);
    setNewSuppForm({ name: '', company: '', phone: '', email: '', address: '', gstIn: '', payable: '0' });
    setShowAddSupplierModal(true);
  };

  const handleOpenEdit = (supp) => {
    setEditingSupplierId(supp.id);
    setNewSuppForm({
      name: supp.name || '',
      company: supp.company || '',
      phone: supp.phone || '',
      email: supp.email || '',
      address: supp.address || '',
      gstIn: supp.gstIn || '',
      payable: supp.payable || '0'
    });
    setShowAddSupplierModal(true);
  };

  const handleAddSupplierSubmit = (e) => {
    e.preventDefault();
    if (!newSuppForm.name) return;
    if (editingSupplierId) {
      updateSupplier(editingSupplierId, newSuppForm);
      alert('Supplier details updated successfully!');
    } else {
      addSupplier(newSuppForm);
      alert('Supplier added successfully!');
    }
    setShowAddSupplierModal(false);
    setNewSuppForm({ name: '', company: '', phone: '', email: '', address: '', gstIn: '', payable: '0' });
  };

  const handleDeleteSupplier = (id, name) => {
    if (window.confirm(`Are you sure you want to delete supplier "${name}"?`)) {
      deleteSupplier(id);
    }
  };

  const handleRecordPaySubmit = (e) => {
    e.preventDefault();
    if (!selectedSuppForPay || !payAmount) return;

    recordSupplierPayment(selectedSuppForPay.id, payAmount, payMode, payNote);
    setShowPayModal(false);
    setSelectedSuppForPay(null);
    setPayAmount('');
    setPayNote('');
    alert('Supplier payment logged successfully!');
  };

  const handleAddItemToPO = (prodId) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    setPoItems(prev => {
      if (prev.find(i => i.productId === prodId)) return prev;
      return [...prev, {
        productId: prod.id,
        name: prod.name,
        qty: 10,
        costPrice: prod.costPrice || (prod.price * 0.7)
      }];
    });
  };

  const handlePOSubmit = (e) => {
    e.preventDefault();
    if (!poSupplierId || poItems.length === 0) {
      alert('Please select a supplier and add at least one item.');
      return;
    }

    const supp = suppliers.find(s => s.id === poSupplierId);
    const total = poItems.reduce((sum, item) => sum + (item.costPrice * item.qty), 0);

    createPurchase({
      supplierId: poSupplierId,
      supplierName: supp ? supp.name : 'Vendor',
      items: poItems,
      total,
      isPaid: poIsPaid,
      paymentMode: poIsPaid ? 'Bank' : 'Credit'
    });

    setShowPOModal(false);
    setPoItems([]);
    setPoSupplierId('');
    alert('Purchase entry saved and inventory updated!');
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Factory size={26} style={{ color: 'var(--accent-primary)' }} />
            <span>Suppliers & Purchase Entry</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage supplier vendors, log incoming stock purchase orders, and track payable balances.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowPOModal(true)} className="btn btn-primary">
            <Truck size={18} />
            <span>Record Purchase Entry</span>
          </button>
          <button onClick={() => setShowAddSupplierModal(true)} className="btn btn-secondary">
            <Plus size={18} />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search suppliers by vendor name or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Supplier Vendor</th>
                <th>Company / Phone</th>
                <th>Total Purchases</th>
                <th>Payable Balance</th>
                <th>GSTIN</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map(supp => {
                const hasPayable = supp.payable > 0;
                return (
                  <tr key={supp.id}>
                    <td style={{ fontWeight: 700 }}>{supp.name}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{supp.company || 'Distributor'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{supp.phone}</span>
                    </td>
                    <td style={{ fontWeight: 800 }}>₹{(supp.totalPurchases || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge ${hasPayable ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.85rem', padding: '0.3rem 0.75rem' }}>
                        ₹{(supp.payable || 0).toLocaleString('en-IN')} {hasPayable ? 'PAYABLE' : 'CLEAR'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {supp.gstIn || 'N/A'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        {hasPayable && (
                          <button
                            onClick={() => {
                              setSelectedSuppForPay(supp);
                              setPayAmount(supp.payable);
                              setShowPayModal(true);
                            }}
                            className="btn btn-primary btn-sm"
                          >
                            <CreditCard size={14} />
                            <span>Pay Vendor</span>
                          </button>
                        )}

                        {user.role === 'admin' && (
                          <>
                            <button onClick={() => handleOpenEdit(supp)} className="btn-icon" title="Edit Supplier">
                              <Edit3 size={15} />
                            </button>
                            <button onClick={() => handleDeleteSupplier(supp.id, supp.name)} className="btn-icon" style={{ color: 'var(--danger)' }} title="Delete Supplier">
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
      </div>

      {/* Modal: Add Supplier */}
      {showAddSupplierModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Add New Supplier</h3>
              <button onClick={() => setShowAddSupplierModal(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSupplierSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Vendor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Asian Paints Depot"
                    value={newSuppForm.name}
                    onChange={(e) => setNewSuppForm(f => ({ ...f, name: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Asian Paints Ltd"
                    value={newSuppForm.company}
                    onChange={(e) => setNewSuppForm(f => ({ ...f, company: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={newSuppForm.phone}
                    onChange={(e) => setNewSuppForm(f => ({ ...f, phone: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="32AAACA1234F1Z1"
                    value={newSuppForm.gstIn}
                    onChange={(e) => setNewSuppForm(f => ({ ...f, gstIn: e.target.value }))}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Supplier</button>
                <button type="button" onClick={() => setShowAddSupplierModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pay Supplier */}
      {showPayModal && selectedSuppForPay && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Pay Supplier - {selectedSuppForPay.name}
              </h3>
              <button onClick={() => setShowPayModal(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordPaySubmit}>
              <div className="form-group">
                <label className="form-label">Amount Paying (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedSuppForPay.payable}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select value={payMode} onChange={(e) => setPayMode(e.target.value)} className="form-select">
                  <option value="Bank">Bank Transfer (NEFT/IMPS)</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirm Payment</button>
                <button type="button" onClick={() => setShowPayModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Purchase Order Entry */}
      {showPOModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>New Stock Purchase Entry</h3>
              <button onClick={() => setShowPOModal(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePOSubmit}>
              <div className="form-group">
                <label className="form-label">Select Supplier Vendor *</label>
                <select
                  required
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.company})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Add Products to Purchase Order</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddItemToPO(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="form-select"
                >
                  <option value="">+ Click to add item to PO list...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1rem 0' }}>
                {poItems.map((item, idx) => (
                  <div key={item.productId} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, flex: 1 }}>{item.name}</span>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPoItems(items => items.map((it, i) => i === idx ? { ...it, qty: val } : it));
                      }}
                      className="form-input"
                      style={{ width: '70px', padding: '2px 4px' }}
                    />
                    <input
                      type="number"
                      placeholder="Cost ₹"
                      value={item.costPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPoItems(items => items.map((it, i) => i === idx ? { ...it, costPrice: val } : it));
                      }}
                      className="form-input"
                      style={{ width: '90px', padding: '2px 4px' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Purchase Entry & Add Stock</button>
                <button type="button" onClick={() => setShowPOModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
