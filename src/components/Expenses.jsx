
import { useMemo, useState } from 'react';
import {
  Receipt, Plus, Search, Wallet, CalendarDays,
  CreditCard, TrendingDown, X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Expenses.css';

const categories = [
  'Shop Rent',
  'Staff Salary / Wages',
  'Electricity',
  'Internet / SIM Recharge',
  'Transport',
  'Maintenance',
  'Marketing',
  'Office Supplies',
  'Other'
];

const initialForm = {
  date: new Date().toLocaleDateString('en-CA'),
  category: 'Shop Rent',
  amount: '',
  paymentMode: 'Cash',
  paidTo: '',
  reference: '',
  description: ''
};

const money = value =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

export const Expenses = () => {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [form, setForm] = useState(initialForm);

  // Read existing expenses from the shared Firebase listener.
  // This component does not write or modify financial records.
  const { expenses = [], addExpense, user } = useApp();
  const [saving, setSaving] = useState(false);

  const saveExpense = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await addExpense(form);
      setShowForm(false);
      setForm({
        ...initialForm,
        date: new Date().toLocaleDateString('en-CA')
      });
      alert('Expense saved successfully.');
    } catch (error) {
      console.error('Expense save failed:', error);
      alert(error.message || 'Failed to save expense.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => expenses.filter(item => {
    const matchesCategory =
      categoryFilter === 'All' || item.category === categoryFilter;
    const matchesSearch = JSON.stringify(item)
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [expenses, categoryFilter, search]);

  const update = (field, value) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="exp-page">
      <div className="exp-header">
        <div>
          <h1>Expense Management</h1>
          <p>Track business spending and operating costs</p>
        </div>
        <button
          className="exp-primary"
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} /> Add Expense
        </button>
      </div>

      <div className="exp-stats">
        {[
          {
            label: 'Total Expenses',
            value: money(expenses.reduce((sum, x) => sum + Number(x.amount || 0), 0)),
            icon: Receipt
          },
          {
            label: 'This Month',
            value: money(expenses.filter(x =>
              String(x.date || '').startsWith(
                new Date().toLocaleDateString('en-CA').slice(0, 7)
              )
            ).reduce((sum, x) => sum + Number(x.amount || 0), 0)),
            icon: CalendarDays
          },
          {
            label: 'Cash Expenses',
            value: money(expenses.filter(x => x.paymentMode === 'Cash')
              .reduce((sum, x) => sum + Number(x.amount || 0), 0)),
            icon: Wallet
          },
          {
            label: 'UPI / Bank Expenses',
            value: money(expenses.filter(x =>
              ['UPI', 'Bank'].includes(x.paymentMode)
            ).reduce((sum, x) => sum + Number(x.amount || 0), 0)),
            icon: CreditCard
          }
        ].map(({ label, value, icon: Icon }) => (
          <div className="exp-stat" key={label}>
            <div className="exp-stat-icon"><Icon size={22} /></div>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="exp-panel">
        <div className="exp-panel-head">
          <div>
            <h2>Expense History</h2>
            <p>Expenses will appear here after Firebase integration.</p>
          </div>
          <TrendingDown size={22} />
        </div>

        <div className="exp-filters">
          <div className="exp-search">
            <Search size={18} />
            <input
              placeholder="Search expenses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="exp-table-wrap">
          <table className="exp-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Paid To</th>
                <th>Description</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td>{item.date || '—'}</td>
                  <td>{item.category || '—'}</td>
                  <td>{item.paidTo || '—'}</td>
                  <td>{item.description || item.reference || '—'}</td>
                  <td>{item.paymentMode || '—'}</td>
                  <td>{money(item.amount)}</td>
                  <td>Recorded</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="exp-empty">
                    <Receipt size={32} />
                    <strong>No expenses recorded yet</strong>
                    <span>Expense records will appear here.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="exp-overlay" onClick={() => setShowForm(false)}>
          <div className="exp-modal" onClick={e => e.stopPropagation()}>
            <div className="exp-modal-head">
              <div>
                <h2>Add New Expense</h2>
                <p>Record an operating expense</p>
              </div>
              <button
                className="exp-close"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="exp-form-grid">
              <label>
                Expense Date
                <input type="date" value={form.date}
                  onChange={e => update('date', e.target.value)} />
              </label>
              <label>
                Category
                <select value={form.category}
                  onChange={e => update('category', e.target.value)}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label>
                Amount (₹)
                <input type="number" min="0.01" step="0.01"
                  placeholder="0.00" value={form.amount}
                  onChange={e => update('amount', e.target.value)} />
              </label>
              <label>
                Payment Method
                <select value={form.paymentMode}
                  onChange={e => update('paymentMode', e.target.value)}>
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Bank</option>
                </select>
              </label>
              <label>
                Paid To
                <input placeholder="Person or business name"
                  value={form.paidTo}
                  onChange={e => update('paidTo', e.target.value)} />
              </label>
              <label>
                Reference Number
                <input placeholder="Optional"
                  value={form.reference}
                  onChange={e => update('reference', e.target.value)} />
              </label>
              <label className="exp-full">
                Description / Notes
                <textarea rows={3} placeholder="Expense details..."
                  value={form.description}
                  onChange={e => update('description', e.target.value)} />
              </label>
            </div>

            <div className="exp-form-actions">
              <button className="exp-secondary"
                onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button
                className="exp-primary"
                disabled={saving || !['admin', 'staff'].includes(user?.role)}
                onClick={saveExpense}
              >
                {saving ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
