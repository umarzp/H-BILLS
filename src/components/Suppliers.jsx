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
  const [poProductSearch, setPoProductSearch] = useState('');
  const [poIsPaid, setPoIsPaid] = useState(true);
  const [poInvoiceNo, setPoInvoiceNo] = useState('');
  const [poInvoiceDate, setPoInvoiceDate] = useState(
     new Date().toISOString().split('T')[0]
    );
  const [poAmountPaid, setPoAmountPaid] = useState(0);
  const [poPaymentMode, setPoPaymentMode] = useState('Cash');
  const [poNotes, setPoNotes] = useState('');
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

  const handleRecordPaySubmit = async (e) => {
  e.preventDefault();

  if (!selectedSuppForPay || !payAmount) return;

  const success = await recordSupplierPayment(
    selectedSuppForPay.id,
    payAmount,
    payMode,
    payNote
  );

  if (!success) {
    return;
  }

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
        qty: 1,
        costPrice: prod.costPrice || (prod.price * 0.7)
      }];
    });
  };

  const handleTogglePOProduct = (prod) => {
  setPoItems(prev => {
    const alreadySelected = prev.some(
      item => item.productId === prod.id
    );

    if (alreadySelected) {
      return prev.filter(
        item => item.productId !== prod.id
      );
    }

    return [
      ...prev,
      {
        productId: prod.id,
        name: prod.name,
        qty: 1,
        costPrice:
          Number(prod.costPrice) ||
          Number(prod.price) * 0.7
      }
    ];
  });
};

const handleRemovePOProduct = (productId) => {
  setPoItems(prev =>
    prev.filter(item => item.productId !== productId)
  );
};

const handleClearPOProducts = () => {
  setPoItems([]);
};

  const handlePOSubmit = async (e) => {
  e.preventDefault();

  if (!poSupplierId || poItems.length === 0) {
    alert('Please select a supplier and add at least one item.');
    return;
  }

  const supp = suppliers.find(
    s => s.id === poSupplierId
  );

  const total = poItems.reduce(
    (sum, item) =>
      sum +
      ((Number(item.costPrice) || 0) *
        (Number(item.qty) || 0)),
    0
  );

  const amountPaid = Math.min(
    Math.max(Number(poAmountPaid) || 0, 0),
    total
  );

  const balanceDue = Math.max(
    0,
    total - amountPaid
  );

  const paymentStatus =
    balanceDue <= 0
      ? 'PAID'
      : amountPaid > 0
        ? 'PARTIAL'
        : 'UNPAID';

  const createdPurchase = await createPurchase({
    supplierId: poSupplierId,

    supplierName:
      supp?.name || 'Vendor',

    supplierCompany:
      supp?.company || '',

    supplierInvoiceNo:
      poInvoiceNo.trim(),

    supplierInvoiceDate:
      poInvoiceDate,

    items: poItems,

    total,

    amountPaid,

    balanceDue,

    paymentStatus,

    paymentMode:
      amountPaid > 0
        ? poPaymentMode
        : 'Credit',

    notes:
      poNotes.trim()
  });

  if (!createdPurchase) {
    return;
  }

  setShowPOModal(false);

  setPoItems([]);
  setPoSupplierId('');
  setPoInvoiceNo('');

  setPoInvoiceDate(
    new Date()
      .toISOString()
      .split('T')[0]
  );

  setPoAmountPaid(0);
  setPoPaymentMode('Cash');
  setPoNotes('');

  alert(
    'Purchase entry saved and inventory updated!'
  );
};

const filteredPOProducts = products.filter(product => {
  const search = poProductSearch.toLowerCase().trim();

  if (!search) return true;

  return (
    product.name?.toLowerCase().includes(search) ||
    product.sku?.toLowerCase().includes(search) ||
    String(product.barcode || '')
      .toLowerCase()
      .includes(search)
  );
});
const poGrandTotal = poItems.reduce(
  (sum, item) =>
    sum +
    (Number(item.qty) || 0) *
      (Number(item.costPrice) || 0),
  0
);

const poTotalQuantity = poItems.reduce(
  (sum, item) => sum + (Number(item.qty) || 0),
  0
);

const poBalanceDue = Math.max(
  poGrandTotal - (Number(poAmountPaid) || 0),
  0
);
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
    <div
      className="modal-content"
      style={{
        maxWidth: '1180px',
        width: '95vw',
        maxHeight: '92vh',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div className="modal-header">
        <div>
          <h3
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0
            }}
          >
            New Stock Purchase Entry
          </h3>

          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              marginTop: '4px'
            }}
          >
            Add products, payment details and save to update inventory
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowPOModal(false)}
          className="btn-icon"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handlePOSubmit}>

        {/* Supplier / Invoice Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(260px, 1.4fr) minmax(180px, 0.8fr) minmax(180px, 0.8fr)',
            gap: '1rem',
            marginBottom: '1rem'
          }}
        >
          <div className="form-group">
            <label className="form-label">
              Select Supplier Vendor *
            </label>

            <select
              required
              value={poSupplierId}
              onChange={(e) =>
                setPoSupplierId(e.target.value)
              }
              className="form-select"
            >
              <option value="">
                -- Choose Supplier --
              </option>

              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.company ? ` (${s.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Supplier Invoice No.
            </label>

            <input
              type="text"
              value={poInvoiceNo}
              onChange={(e) =>
                setPoInvoiceNo(e.target.value)
              }
              placeholder="e.g. INV-4587"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Supplier Invoice Date
            </label>

            <input
              type="date"
              value={poInvoiceDate}
              onChange={(e) =>
                setPoInvoiceDate(e.target.value)
              }
              className="form-input"
            />
          </div>
        </div>

        {/* Main Two Column Area */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(340px, 0.9fr) minmax(500px, 1.4fr)',
            gap: '1rem',
            alignItems: 'stretch'
          }}
        >

          {/* LEFT - Product Selector */}
          <div
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              background: 'var(--bg-secondary)'
            }}
          >
            <div
              style={{
                padding: '0.9rem 1rem',
                borderBottom:
                  '1px solid var(--border-color)',
                fontWeight: 800,
                color: 'var(--text-primary)'
              }}
            >
              Select Products
            </div>

            {/* Search */}
            <div
              style={{
                padding: '0.75rem',
                borderBottom:
                  '1px solid var(--border-color)'
              }}
            >
              <div
                style={{
                  position: 'relative'
                }}
              >
                <Search
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none'
                  }}
                />

                <input
                  type="text"
                  value={poProductSearch}
                  onChange={(e) =>
                    setPoProductSearch(e.target.value)
                  }
                  placeholder="Search product name, SKU or barcode..."
                  className="form-input"
                  style={{
                    width: '100%',
                    paddingLeft: '38px'
                  }}
                />
              </div>
            </div>

            {/* Product Column Headings */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '28px minmax(0, 1fr) 65px 75px',
                gap: '0.5rem',
                padding: '0.55rem 0.75rem',
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
                fontWeight: 700,
                borderBottom:
                  '1px solid var(--border-color)'
              }}
            >
              <div></div>
              <div>Product</div>
              <div>Stock</div>
              <div>Cost</div>
            </div>

            {/* Product List */}
            <div
              style={{
                height: '390px',
                overflowY: 'auto'
              }}
            >
              {filteredPOProducts.length === 0 ? (
                <div
                  style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)'
                  }}
                >
                  No products found
                </div>
              ) : (
                filteredPOProducts.map(product => {
                  const selected = poItems.some(
                    item =>
                      item.productId === product.id
                  );

                  return (
                    <label
                      key={product.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          '28px minmax(0, 1fr) 65px 75px',
                        gap: '0.5rem',
                        alignItems: 'center',
                        padding: '0.7rem 0.75rem',
                        cursor: 'pointer',
                        borderBottom:
                          '1px solid var(--border-color)',
                        background: selected
                          ? 'rgba(59, 130, 246, 0.12)'
                          : 'transparent'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          handleTogglePOProduct(product)
                        }
                      />

                      <div
                        style={{
                          minWidth: 0
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={product.name}
                        >
                          {product.name}
                        </div>

                        <div
                          style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            marginTop: '3px'
                          }}
                        >
                          {product.sku || 'No SKU'}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        {Number(product.stock) || 0}
                      </div>

                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        ₹
                        {(
                          Number(product.costPrice) || 0
                        ).toLocaleString('en-IN')}
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Product Selector Footer */}
            <div
              style={{
                padding: '0.65rem 0.75rem',
                borderTop:
                  '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)'
                }}
              >
                Showing {filteredPOProducts.length} products
              </span>

              {poItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearPOProducts}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* RIGHT - Selected Products */}
          <div
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              background: 'var(--bg-secondary)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                padding: '0.9rem 1rem',
                borderBottom:
                  '1px solid var(--border-color)',
                fontWeight: 800,
                color: 'var(--text-primary)'
              }}
            >
              Selected Products ({poItems.length})
            </div>

            {/* Selected Product Headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '32px minmax(150px, 1fr) 80px 115px 100px 45px',
                gap: '0.55rem',
                padding: '0.6rem 0.75rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                borderBottom:
                  '1px solid var(--border-color)',
                alignItems: 'center'
              }}
            >
              <div>#</div>
              <div>Product</div>
              <div>Qty</div>
              <div>Price / Unit</div>
              <div style={{ textAlign: 'right' }}>
                Line Total
              </div>
              <div></div>
            </div>

            {/* Selected Products */}
            <div
              style={{
                height: '390px',
                overflowY: 'auto'
              }}
            >
              {poItems.length === 0 ? (
                <div
                  style={{
                    height: '100%',
                    minHeight: '220px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    padding: '1rem'
                  }}
                >
                  <ShoppingBag size={30} />

                  <div
                    style={{
                      fontWeight: 700
                    }}
                  >
                    No products selected
                  </div>

                  <div
                    style={{
                      fontSize: '0.75rem'
                    }}
                  >
                    Select products from the list on the left.
                  </div>
                </div>
              ) : (
                poItems.map((item, idx) => (
                  <div
                    key={item.productId}
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '32px minmax(150px, 1fr) 80px 115px 100px 45px',
                      gap: '0.55rem',
                      padding: '0.7rem 0.75rem',
                      alignItems: 'center',
                      borderBottom:
                        '1px solid var(--border-color)'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      {idx + 1}
                    </div>

                    <div
                      style={{
                        minWidth: 0
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)'
                        }}
                      >
                        {item.name}
                      </div>

                      <div
                        style={{
                          fontSize: '0.64rem',
                          color: 'var(--text-muted)',
                          marginTop: '3px'
                        }}
                      >
                        {products.find(
                          p => p.id === item.productId
                        )?.sku || 'Product'}
                      </div>
                    </div>

                    {/* Quantity */}
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => {
                        const val = Math.max(
                          1,
                          Number(e.target.value) || 1
                        );

                        setPoItems(items =>
                          items.map((it, i) =>
                            i === idx
                              ? {
                                  ...it,
                                  qty: val
                                }
                              : it
                          )
                        );
                      }}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '5px 7px'
                      }}
                    />

                    {/* Purchase Price */}
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.costPrice}
                      onChange={(e) => {
                        const val = Math.max(
                          0,
                          Number(e.target.value) || 0
                        );

                        setPoItems(items =>
                          items.map((it, i) =>
                            i === idx
                              ? {
                                  ...it,
                                  costPrice: val
                                }
                              : it
                          )
                        );
                      }}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '5px 7px'
                      }}
                    />

                    {/* Line Total */}
                    <div
                      style={{
                        textAlign: 'right',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)'
                      }}
                    >
                      ₹
                      {(
                        (Number(item.qty) || 0) *
                        (Number(item.costPrice) || 0)
                      ).toLocaleString('en-IN')}
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() =>
                        handleRemovePOProduct(
                          item.productId
                        )
                      }
                      title="Remove product"
                      style={{
                        width: '34px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border:
                          '1px solid rgba(239, 68, 68, 0.35)',
                        background:
                          'rgba(239, 68, 68, 0.08)',
                        color: '#ef4444',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Selected Products Footer */}
            <div
              style={{
                padding: '0.7rem 0.75rem',
                borderTop:
                  '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              {poItems.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearPOProducts}
                  style={{
                    border:
                      '1px solid rgba(239, 68, 68, 0.35)',
                    background:
                      'rgba(239, 68, 68, 0.08)',
                    color: '#ef4444',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 700,
                    fontSize: '0.72rem'
                  }}
                >
                  <Trash2 size={14} />
                  Clear All
                </button>
              ) : (
                <div />
              )}

              <div
                style={{
                  display: 'flex',
                  gap: '1.25rem',
                  fontSize: '0.75rem'
                }}
              >
                <div>
                  <span
                    style={{
                      color: 'var(--text-muted)'
                    }}
                  >
                    Total Items:{' '}
                  </span>

                  <strong>
                    {poItems.length}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      color: 'var(--text-muted)'
                    }}
                  >
                    Total Quantity:{' '}
                  </span>

                  <strong>
                    {poTotalQuantity}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grand Total */}
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <div
            style={{
              width: '360px',
              maxWidth: '100%',
              border:
                '1px solid var(--accent-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '0.9rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background:
                'rgba(59, 130, 246, 0.08)'
            }}
          >
            <span
              style={{
                color: 'var(--accent-primary)',
                fontWeight: 800
              }}
            >
              Grand Total
            </span>

            <span
              style={{
                fontSize: '1.4rem',
                fontWeight: 900,
                color: 'var(--text-primary)'
              }}
            >
              ₹{poGrandTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Payment */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '1fr 1fr 1fr',
            gap: '1rem',
            marginTop: '1rem'
          }}
        >
          <div className="form-group">
            <label className="form-label">
              Amount Paid
            </label>

            <input
              type="number"
              min="0"
              max={poGrandTotal || undefined}
              value={poAmountPaid}
              onChange={(e) =>
                setPoAmountPaid(
                  Number(e.target.value)
                )
              }
              className="form-input"
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Payment Mode
            </label>

            <select
              value={poPaymentMode}
              onChange={(e) =>
                setPoPaymentMode(e.target.value)
              }
              className="form-select"
            >
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
              <option value="UPI">UPI</option>
              <option value="Credit">Credit</option>
            </select>
          </div>

          {/* Balance Due */}
          <div className="form-group">
            <label className="form-label">
              Balance Due
            </label>

            <div
              style={{
                minHeight: '42px',
                border:
                  '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.65rem 0.8rem',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                fontSize: '1.05rem',
                fontWeight: 900,
                color:
                  poBalanceDue > 0
                    ? '#22c55e'
                    : 'var(--text-primary)',
                background: 'var(--bg-secondary)'
              }}
            >
              ₹
              {poBalanceDue.toLocaleString(
                'en-IN'
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label">
            Notes / Reference
          </label>

          <textarea
            value={poNotes}
            onChange={(e) =>
              setPoNotes(e.target.value)
            }
            className="form-input"
            rows="3"
            placeholder="Optional purchase notes, delivery details or reference..."
          />
        </div>

        {/* Information */}
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.7rem 0.8rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-muted)',
            fontSize: '0.72rem'
          }}
        >
          Saving this purchase will add the purchased
          quantities to the current inventory and create
          the purchase record.
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '1rem'
          }}
        >
          <button
            type="button"
            onClick={() =>
              setShowPOModal(false)
            }
            className="btn btn-secondary"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              minWidth: '300px'
            }}
          >
            <ShoppingBag size={17} />
            Save Purchase Entry & Add Stock
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
};
