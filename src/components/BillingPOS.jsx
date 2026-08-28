import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  UserPlus, 
  Check, 
  QrCode, 
  CreditCard, 
  Banknote, 
  Receipt,
  Tag,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InvoicePrintModal } from './InvoicePrintModal';

export const BillingPOS = () => {
  const { 
    products, 
    customers, 
    addCustomer, 
    createInvoice,
    getNextInvoiceNumber,
    categories: appCategories
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);

  // Billing configuration
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [gstType, setGstType] = useState('GST'); // 'GST' or 'NON_GST'
  const [paymentMode, setPaymentMode] = useState('UPI'); // 'UPI', 'Cash', 'Card', 'Credit'
  const [overallDiscount, setOverallDiscount] = useState(0);

  const currentNextBill = getNextInvoiceNumber ? getNextInvoiceNumber(gstType) : '';
  const nextTaxNum = getNextInvoiceNumber ? getNextInvoiceNumber('GST') : '';
  const nextRetailNum = getNextInvoiceNumber ? getNextInvoiceNumber('NON_GST') : '';

  // Cash payment change helper
  const [cashTendered, setCashTendered] = useState('');

  // Modals state
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustForm, setNewCustForm] = useState({ name: '', phone: '', email: '', company: '', gstIn: '' });
  const [activeInvoiceForPrint, setActiveInvoiceForPrint] = useState(null);

  // Filter Categories
  const categories = ['All', ...(appCategories || [])];

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.barcode.includes(searchQuery);
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Cart operations
  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert(`Product ${product.name} is currently out of stock!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert(`Cannot add more than available stock (${product.stock} ${product.unit})`);
          return prev;
        }
        return prev.map(item => 
          item.productId === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        return [...prev, {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          gstRate: product.gstRate || 18,
          qty: 1,
          discount: 0,
          unit: product.unit,
          maxStock: product.stock
        }];
      }
    });
  };

  const updateCartQty = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.qty + delta;
        if (newQty > item.maxStock) {
          alert(`Stock limit reached! Max available: ${item.maxStock}`);
          return item;
        }
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateItemDiscount = (productId, discountVal) => {
    setCart(prev => prev.map(item => 
      item.productId === productId ? { ...item, discount: Math.max(0, Number(discountVal) || 0) } : item
    ));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty - item.discount), 0);
  const totalItemDiscount = cart.reduce((sum, item) => sum + item.discount, 0);

  let taxTotal = 0;
  if (gstType === 'GST') {
    cart.forEach(item => {
      const itemNet = (item.price * item.qty) - item.discount;
      taxTotal += (itemNet * (item.gstRate / 100));
    });
  }

  const grandTotal = Math.round(Math.max(0, subtotal + taxTotal - overallDiscount));
  const changeAmount = Math.max(0, (Number(cashTendered) || 0) - grandTotal);

  // Handle Checkout Submit
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty! Add products to create a bill.');
      return;
    }

    const selectedCust = customers.find(c => c.id === selectedCustomerId);

    const invoiceData = {
      customerId: selectedCustomerId || 'WALK-IN',
      customerName: selectedCust ? selectedCust.name : 'Walk-in Customer',
      customerGst: selectedCust ? selectedCust.gstIn : '',
      items: cart.map(item => ({
        ...item,
        total: (item.price * item.qty) - item.discount
      })),
      subtotal,
      discount: totalItemDiscount + Number(overallDiscount),
      taxTotal: Math.round(taxTotal),
      total: grandTotal,
      paymentMode,
      paymentStatus: paymentMode === 'Credit' ? 'UNPAID' : 'PAID',
      gstType
    };

    const createdInv = createInvoice(invoiceData);

    // Confetti celebration effect
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Clear cart & open print view
    setCart([]);
    setOverallDiscount(0);
    setCashTendered('');
    setActiveInvoiceForPrint(createdInv);
  };

  // Add Customer modal submit
  const handleSaveNewCustomer = (e) => {
    e.preventDefault();
    if (!newCustForm.name) return;
    const added = addCustomer(newCustForm);
    setSelectedCustomerId(added.id);
    setShowAddCustomerModal(false);
    setNewCustForm({ name: '', phone: '', email: '', company: '', gstIn: '' });
  };

  return (
    <div className="pos-container">
      {/* LEFT: Product Catalog & Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
        {/* Search & Filters */}
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search products by Name, SKU, or Barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
              />
            </div>
          </div>

          {/* Categories Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                style={{ whiteSpace: 'nowrap', borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.85rem', alignContent: 'start' }}>
          {filteredProducts.map(prod => {
            const isLow = prod.stock <= prod.minStock;
            const isOutOfStock = prod.stock <= 0;

            return (
              <div 
                key={prod.id}
                onClick={() => !isOutOfStock && addToCart(prod)}
                className={`card card-hover`}
                style={{ 
                  padding: '0.85rem', 
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  opacity: isOutOfStock ? 0.6 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  borderLeft: isLow ? '3px solid var(--warning)' : '1px solid var(--border-color)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {prod.sku}
                    </span>
                    <span className={`badge ${isOutOfStock ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                      {prod.stock} {prod.unit}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '6px' }}>
                    {prod.name}
                  </h4>
                </div>

                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      ₹{prod.price}
                    </span>
                    <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', display: 'block' }}>
                      GST {prod.gstRate}%
                    </span>
                  </div>

                  <button 
                    disabled={isOutOfStock}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '4px 8px' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Active Billing Cart */}
      <div className="pos-cart">
        {/* Cart Header */}
        <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={20} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>New Sale Bill</h3>
              <span style={{ fontSize: '0.725rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 700 }}>
                #{currentNextBill}
              </span>
            </div>
          </div>

          {/* GST vs Non-GST Selector */}
          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '2px', borderRadius: 'var(--radius-md)' }}>
            <button 
              onClick={() => setGstType('GST')}
              className={`btn btn-sm ${gstType === 'GST' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.7rem', padding: '3px 8px' }}
              title={`Next Tax Invoice: ${nextTaxNum}`}
            >
              📄 Tax ({nextTaxNum})
            </button>
            <button 
              onClick={() => setGstType('NON_GST')}
              className={`btn btn-sm ${gstType === 'NON_GST' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.7rem', padding: '3px 8px' }}
              title={`Next Retail Bill: ${nextRetailNum}`}
            >
              🧾 Retail ({nextRetailNum})
            </button>
          </div>
        </div>

        {/* Customer Selector Bar */}
        <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select 
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.825rem', padding: '0.45rem' }}
          >
            <option value="">👤 Walk-in Customer (Retail)</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.company ? `(${c.company})` : ''} {c.outstanding > 0 ? `[Due: ₹${c.outstanding}]` : ''}
              </option>
            ))}
          </select>
          <button 
            onClick={() => setShowAddCustomerModal(true)}
            className="btn btn-secondary btn-sm"
            title="Add New Customer"
          >
            <UserPlus size={16} />
          </button>
        </div>

        {/* Cart Itemized List */}
        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <ShoppingCart size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600 }}>Cart is empty</p>
              <p style={{ fontSize: '0.775rem' }}>Click products on the left to add items to bill</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {cart.map(item => (
                <div 
                  key={item.productId}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.name}
                    </span>
                    <button 
                      onClick={() => removeFromCart(item.productId)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                    {/* Qty Counter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '2px 4px' }}>
                      <button onClick={() => updateCartQty(item.productId, -1)} className="btn-icon" style={{ width: '24px', height: '24px' }}>
                        <Minus size={12} />
                      </button>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', minWidth: '24px', textAlign: 'center' }}>
                        {item.qty}
                      </span>
                      <button onClick={() => updateCartQty(item.productId, 1)} className="btn-icon" style={{ width: '24px', height: '24px' }}>
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Item Discount Input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Disc (₹):</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={item.discount || ''}
                        onChange={(e) => updateItemDiscount(item.productId, e.target.value)}
                        className="form-input"
                        style={{ width: '55px', padding: '2px 4px', fontSize: '0.75rem', textAlign: 'right' }}
                      />
                    </div>

                    {/* Item Total */}
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      ₹{((item.price * item.qty) - item.discount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Totals & Checkout Summary */}
        <div style={{ padding: '1rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.825rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Subtotal:</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            {gstType === 'GST' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>GST Tax Breakdown:</span>
                <span>+₹{Math.round(taxTotal).toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Extra Bill Discount */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Overall Discount (₹):</span>
              <input
                type="number"
                min="0"
                value={overallDiscount || ''}
                onChange={(e) => setOverallDiscount(Number(e.target.value))}
                className="form-input"
                style={{ width: '80px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', borderTop: '1px dashed var(--border-color)', paddingTop: '6px', marginTop: '4px' }}>
              <span>Grand Total:</span>
              <span style={{ color: 'var(--accent-primary)' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment Mode Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '0.75rem' }}>
            {[
              { id: 'UPI', label: 'UPI QR', icon: QrCode },
              { id: 'Cash', label: 'Cash', icon: Banknote },
              { id: 'Card', label: 'Card', icon: CreditCard },
              { id: 'Credit', label: 'Credit', icon: Receipt },
            ].map(pm => {
              const Icon = pm.icon;
              const isSelected = paymentMode === pm.id;
              return (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMode(pm.id)}
                  className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.4rem 0.2rem', fontSize: '0.7rem', flexDirection: 'column', gap: '2px' }}
                >
                  <Icon size={14} />
                  <span>{pm.label}</span>
                </button>
              );
            })}
          </div>

          {/* Cash Change Calculator */}
          {paymentMode === 'Cash' && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', background: 'var(--bg-secondary)', padding: '6px 8px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cash Given:</span>
              <input
                type="number"
                placeholder="₹ Amount"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                className="form-input"
                style={{ flex: 1, padding: '3px 6px', fontSize: '0.8rem' }}
              />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: changeAmount >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                Return: ₹{changeAmount}
              </span>
            </div>
          )}

          {/* Submit Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="btn btn-success"
            style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', fontWeight: 800 }}
          >
            <Receipt size={20} />
            <span>Generate & Print Invoice (₹{grandTotal})</span>
          </button>
        </div>
      </div>

      {/* Modal: Add Customer Quick Modal */}
      {showAddCustomerModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Add New Customer</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="btn-icon">
                <Trash2 size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveNewCustomer}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
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
                <label className="form-label">Company / Trade Name</label>
                <input
                  type="text"
                  placeholder="e.g. Patel Builders"
                  value={newCustForm.company}
                  onChange={(e) => setNewCustForm(f => ({ ...f, company: e.target.value }))}
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
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Customer</button>
                <button type="button" onClick={() => setShowAddCustomerModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Print Modal Trigger */}
      {activeInvoiceForPrint && (
        <InvoicePrintModal
          invoice={activeInvoiceForPrint}
          onClose={() => setActiveInvoiceForPrint(null)}
        />
      )}
    </div>
  );
};
