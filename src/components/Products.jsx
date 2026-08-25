import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Barcode, 
  Printer, 
  X,
  Tag
} from 'lucide-react';

export const Products = () => {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    user,
    categories,
    addCategory,
    deleteCategory
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Barcode sheet print state
  const [barcodePrintProduct, setBarcodePrintProduct] = useState(null);

  // Product Form State
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: categories[0] || 'Hardware',
    barcode: '',
    price: '',
    costPrice: '',
    gstRate: '18',
    stock: '10',
    minStock: '5',
    unit: 'Pcs'
  });

  const categoryFilterList = ['All', ...categories];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.barcode.includes(searchQuery);
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleOpenAdd = () => {
    setEditingProductId(null);
    setForm({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: categories[0] || 'Hardware',
      barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
      price: '',
      costPrice: '',
      gstRate: '18',
      stock: '10',
      minStock: '5',
      unit: 'Pcs'
    });
    setShowProductModal(true);
  };

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (addCategory(newCategoryInput)) {
      setNewCategoryInput('');
    }
  };

  const handleOpenEdit = (prod) => {
    setEditingProductId(prod.id);
    setForm({
      name: prod.name,
      sku: prod.sku,
      category: prod.category,
      barcode: prod.barcode,
      price: prod.price,
      costPrice: prod.costPrice,
      gstRate: prod.gstRate,
      stock: prod.stock,
      minStock: prod.minStock,
      unit: prod.unit
    });
    setShowProductModal(true);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;

    if (editingProductId) {
      updateProduct(editingProductId, {
        ...form,
        price: Number(form.price),
        costPrice: Number(form.costPrice),
        gstRate: Number(form.gstRate),
        stock: Number(form.stock),
        minStock: Number(form.minStock)
      });
      alert('Product updated successfully!');
    } else {
      addProduct(form);
      alert('Product created successfully!');
    }
    setShowProductModal(false);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete product "${name}"?`)) {
      deleteProduct(id);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={26} style={{ color: 'var(--accent-primary)' }} />
            <span>Products Catalog</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage product Master SKU records, barcode tags, cost & selling prices, and GST rates.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {user.role === 'admin' && (
            <button onClick={() => setShowCategoryModal(true)} className="btn btn-secondary">
              <Tag size={18} />
              <span>Manage Categories</span>
            </button>
          )}

          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={18} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Search & Categories Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
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

          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
            {categoryFilterList.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>No Products Found</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>Your product catalog is empty. Click below to add your actual store items!</p>
            <button onClick={handleOpenAdd} className="btn btn-primary">
              <Plus size={18} />
              <span>Add Your First Product</span>
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Selling Price</th>
                  {user.role === 'admin' && <th>Cost Price</th>}
                  <th>GST Rate</th>
                  <th>Current Stock</th>
                  <th>Barcode</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(prod => (
                  <tr key={prod.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {prod.sku}
                    </td>
                    <td style={{ fontWeight: 700 }}>{prod.name}</td>
                    <td><span className="badge badge-purple">{prod.category}</span></td>
                    <td style={{ fontWeight: 800, fontSize: '0.95rem' }}>₹{prod.price}</td>
                    {user.role === 'admin' && <td style={{ color: 'var(--text-muted)' }}>₹{prod.costPrice}</td>}
                    <td><span className="badge badge-blue">{prod.gstRate}%</span></td>
                    <td style={{ fontWeight: 700 }}>{prod.stock} {prod.unit}</td>
                    <td>
                      <button
                        onClick={() => setBarcodePrintProduct(prod)}
                        className="btn btn-secondary btn-sm"
                        title="Generate Barcode Tag Sheet"
                        style={{ gap: '4px' }}
                      >
                        <Barcode size={14} />
                        <span style={{ fontSize: '0.725rem', fontFamily: 'var(--font-mono)' }}>{prod.barcode}</span>
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => handleOpenEdit(prod)} className="btn-icon" title="Edit">
                          <Edit3 size={15} />
                        </button>
                        {user.role === 'admin' && (
                          <button onClick={() => handleDelete(prod.id, prod.name)} className="btn-icon" style={{ color: 'var(--danger)' }} title="Delete">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {editingProductId ? 'Edit Product Details' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bosch Power Drill 750W"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={form.sku}
                    onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                    className="form-select"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={form.price}
                    onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cost Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.costPrice}
                    onChange={(e) => setForm(f => ({ ...f, costPrice: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">GST Tax Rate (%)</label>
                  <select
                    value={form.gstRate}
                    onChange={(e) => setForm(f => ({ ...f, gstRate: e.target.value }))}
                    className="form-select"
                  >
                    <option value="0">0% (Exempted)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST (Standard)</option>
                    <option value="28">28% GST (Luxury/Heavy)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Unit of Measure</label>
                  <input
                    type="text"
                    placeholder="e.g. Pcs, Box, Kg, Liter, Meter"
                    value={form.unit}
                    onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm(f => ({ ...f, stock: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Min Stock Threshold Alert</label>
                  <input
                    type="number"
                    min="1"
                    value={form.minStock}
                    onChange={(e) => setForm(f => ({ ...f, minStock: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Barcode Number</label>
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) => setForm(f => ({ ...f, barcode: e.target.value }))}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Product</button>
                <button type="button" onClick={() => setShowProductModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Tag Print Sheet Modal */}
      {barcodePrintProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header no-print">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Barcode size={22} style={{ color: 'var(--accent-primary)' }} />
                <span>Barcode Tag Sheet</span>
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => window.print()} className="btn btn-primary btn-sm">
                  <Printer size={15} />
                  <span>Print Tags</span>
                </button>
                <button onClick={() => setBarcodePrintProduct(null)} className="btn-icon">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Printable Tag Sheet */}
            <div style={{ background: '#ffffff', color: '#000000', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '1rem', textAlign: 'center' }}>
                Shelf Barcode Tag Preview
              </div>

              <div style={{ border: '2px dashed #0f172a', padding: '1rem', textAlign: 'center', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0' }}>{barcodePrintProduct.name}</h3>
                <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 8px 0' }}>SKU: {barcodePrintProduct.sku} | Price: ₹{barcodePrintProduct.price}</p>
                
                {/* SVG Visual Barcode Simulation */}
                <div style={{ margin: '12px 0', display: 'flex', justifyContent: 'center' }}>
                  <svg width="220" height="60">
                    <rect x="0" y="0" width="220" height="60" fill="#ffffff" />
                    {/* Simulated barcode lines */}
                    {[10, 15, 22, 26, 32, 40, 44, 52, 60, 68, 74, 82, 90, 98, 106, 114, 122, 130, 138, 146, 154, 162, 170, 178, 186, 194, 202].map((x, i) => (
                      <rect key={i} x={x} y="5" width={i % 3 === 0 ? "4" : "2"} height="40" fill="#000000" />
                    ))}
                    <text x="110" y="55" textAnchor="middle" fontSize="12" fontFamily="monospace" fill="#000000">
                      {barcodePrintProduct.barcode}
                    </text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Category Manager Modal */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={20} style={{ color: 'var(--accent-primary)' }} />
                <span>Manage Product Categories</span>
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            {/* Add New Category Form */}
            <form onSubmit={handleAddCategorySubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input
                type="text"
                placeholder="Enter new category name..."
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                <Plus size={16} />
                <span>Add</span>
              </button>
            </form>

            {/* Categories List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
              {categories.map(cat => (
                <div
                  key={cat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.85rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{cat}</span>
                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete category "${cat}"?`)) {
                          deleteCategory(cat);
                        }
                      }}
                      className="btn-icon"
                      style={{ color: 'var(--danger)' }}
                      title="Delete Category"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
