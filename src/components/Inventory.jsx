import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Package, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  PlusCircle, 
  MinusCircle, 
  History, 
  AlertTriangle,
  X,
  Trash2
} from 'lucide-react';

export const Inventory = () => {
  const { products, adjustStock, inventoryLogs, deleteInventoryLog, user } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState('All'); // 'All', 'LowStock', 'OutOfStock'
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState('');
  const [adjustType, setAdjustType] = useState('Stock In'); // 'Stock In' or 'Stock Out'
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'history'

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStockStatus === 'LowStock') return matchesSearch && p.stock <= p.minStock && p.stock > 0;
    if (filterStockStatus === 'OutOfStock') return matchesSearch && p.stock <= 0;
    return matchesSearch;
  });

  const handleStockAdjustmentSubmit = (e) => {
    e.preventDefault();
    if (!selectedProductForAdjust || !adjustQty) return;

    const qty = Number(adjustQty);
    const finalChangeQty = adjustType === 'Stock In' ? qty : -qty;

    adjustStock(selectedProductForAdjust, finalChangeQty, adjustReason || 'Manual Inventory Adjustment', adjustType);

    setShowAdjustModal(false);
    setSelectedProductForAdjust('');
    setAdjustQty('');
    setAdjustReason('');
    alert('Stock adjusted successfully!');
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={26} style={{ color: 'var(--accent-primary)' }} />
            <span>Inventory & Stock Management</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Track real-time stock levels, record batch stock in/out adjustments, and view full movement audit history.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => setShowAdjustModal(true)}
            className="btn btn-primary"
          >
            <PlusCircle size={18} />
            <span>Stock In / Out Adjustment</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('current')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'current' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'current' ? 'var(--accent-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.925rem',
            padding: '0.65rem 0.5rem',
            cursor: 'pointer'
          }}
        >
          📦 Current Stock Levels ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'history' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'history' ? 'var(--accent-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.925rem',
            padding: '0.65rem 0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <History size={16} />
          <span>Stock Audit Trail Logs</span>
        </button>
      </div>

      {activeTab === 'current' ? (
        <>
          {/* Controls Bar */}
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search stock by product name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                />
              </div>

              {/* Status filter */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setFilterStockStatus('All')}
                  className={`btn btn-sm ${filterStockStatus === 'All' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  All ({products.length})
                </button>
                <button
                  onClick={() => setFilterStockStatus('LowStock')}
                  className={`btn btn-sm ${filterStockStatus === 'LowStock' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  ⚠️ Low Stock ({products.filter(p => p.stock <= p.minStock && p.stock > 0).length})
                </button>
                <button
                  onClick={() => setFilterStockStatus('OutOfStock')}
                  className={`btn btn-sm ${filterStockStatus === 'OutOfStock' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  🚫 Out of Stock ({products.filter(p => p.stock <= 0).length})
                </button>
              </div>
            </div>
          </div>

          {/* Stock Table */}
          <div className="card">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>SKU Code</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Min Threshold</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(prod => {
                    const isLow = prod.stock <= prod.minStock && prod.stock > 0;
                    const isOut = prod.stock <= 0;

                    return (
                      <tr key={prod.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-primary)' }}>
                          {prod.sku}
                        </td>
                        <td style={{ fontWeight: 700 }}>{prod.name}</td>
                        <td>
                          <span className="badge badge-purple">{prod.category}</span>
                        </td>
                        <td style={{ fontWeight: 800, fontSize: '1rem' }}>
                          {prod.stock} {prod.unit}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {prod.minStock} {prod.unit}
                        </td>
                        <td>
                          <span className={`badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}>
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setSelectedProductForAdjust(prod.id);
                              setShowAdjustModal(true);
                            }}
                            className="btn btn-secondary btn-sm"
                          >
                            <PlusCircle size={14} />
                            <span>Adjust</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Inventory History Audit Logs */
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Stock Audit Logs Stream
          </h3>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Movement Type</th>
                  <th>Change Qty</th>
                  <th>Previous Stock</th>
                  <th>New Stock</th>
                  <th>Reason / Ref</th>
                  {user.role === 'admin' && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {inventoryLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ color: 'var(--text-secondary)' }}>{log.date}</td>
                    <td style={{ fontWeight: 700 }}>{log.productName}</td>
                    <td>
                      <span className={`badge ${log.changeQty > 0 ? 'badge-success' : 'badge-danger'}`}>
                        {log.changeQty > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {log.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, color: log.changeQty > 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {log.changeQty > 0 ? `+${log.changeQty}` : log.changeQty}
                    </td>
                    <td>{log.previousStock}</td>
                    <td style={{ fontWeight: 700 }}>{log.newStock}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>{log.reason}</td>
                    {user.role === 'admin' && (
                      <td>
                        <button
                          onClick={() => {
                            if (window.confirm('Remove this audit log record?')) {
                              deleteInventoryLog(log.id);
                            }
                          }}
                          className="btn-icon"
                          style={{ color: 'var(--danger)' }}
                          title="Delete Audit Log"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      {showAdjustModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Adjust Stock Level</h3>
              <button onClick={() => setShowAdjustModal(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleStockAdjustmentSubmit}>
              <div className="form-group">
                <label className="form-label">Select Product *</label>
                <select
                  required
                  value={selectedProductForAdjust}
                  onChange={(e) => setSelectedProductForAdjust(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Adjustment Type</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setAdjustType('Stock In')}
                    className={`btn ${adjustType === 'Stock In' ? 'btn-success' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                  >
                    <PlusCircle size={16} />
                    <span>Stock In (+ Add)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('Stock Out')}
                    className={`btn ${adjustType === 'Stock Out' ? 'btn-danger' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                  >
                    <MinusCircle size={16} />
                    <span>Stock Out (- Deduct)</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 10"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Reference Note</label>
                <input
                  type="text"
                  placeholder="e.g. Received new shipment / Damaged stock"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Stock Update</button>
                <button type="button" onClick={() => setShowAdjustModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
