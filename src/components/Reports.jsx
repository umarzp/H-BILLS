import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  FileSpreadsheet, 
  DollarSign, 
  PieChart, 
  TrendingUp,
  Receipt,
  Trash2
} from 'lucide-react';

export const Reports = () => {
  const { invoices, deleteInvoice, products, settings, user } = useApp();
  const [timePeriod, setTimePeriod] = useState('ALL'); // 'ALL', 'TODAY', 'THIS_MONTH'

  // Filter invoices based on date period
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const filteredInvoices = invoices.filter(inv => {
    if (timePeriod === 'TODAY') return inv.date === todayStr;
    if (timePeriod === 'THIS_MONTH') return inv.date.startsWith(currentMonthStr);
    return true;
  });

  // Calculate totals
  const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalDiscount = filteredInvoices.reduce((sum, inv) => sum + (inv.discount || 0), 0);
  const totalGstTax = filteredInvoices.reduce((sum, inv) => sum + (inv.taxTotal || 0), 0);
  const cgstCollected = totalGstTax / 2;
  const sgstCollected = totalGstTax / 2;

  // Calculate profit margin
  let totalCostOfGoods = 0;
  filteredInvoices.forEach(inv => {
    inv.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const cPrice = prod ? prod.costPrice : (item.price * 0.7);
      totalCostOfGoods += cPrice * item.qty;
    });
  });
  const netProfit = Math.max(0, totalSales - totalCostOfGoods);
  const profitMarginPercent = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0;

  // CSV Exporter
  const exportToCSV = () => {
    let csv = 'Invoice Number,Date,Customer Name,Subtotal,Discount,GST Tax,Grand Total,Payment Mode,Status\n';
    filteredInvoices.forEach(inv => {
      csv += `"${inv.invoiceNumber}","${inv.date}","${inv.customerName || 'Walk-in'}",${inv.subtotal || inv.total},${inv.discount || 0},${inv.taxTotal || 0},${inv.total},"${inv.paymentMode}","${inv.paymentStatus}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HBills_SalesReport_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={26} style={{ color: 'var(--accent-primary)' }} />
            <span>Business Reports & GST Tax Analytics</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Comprehensive breakdown of gross sales, net profit margins, GSTR tax collections, and CSV export.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {/* Period selector */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
            <button onClick={() => setTimePeriod('ALL')} className={`btn btn-sm ${timePeriod === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}>
              All Time
            </button>
            <button onClick={() => setTimePeriod('THIS_MONTH')} className={`btn btn-sm ${timePeriod === 'THIS_MONTH' ? 'btn-primary' : 'btn-secondary'}`}>
              This Month
            </button>
            <button onClick={() => setTimePeriod('TODAY')} className={`btn btn-sm ${timePeriod === 'TODAY' ? 'btn-primary' : 'btn-secondary'}`}>
              Today
            </button>
          </div>

          <button onClick={exportToCSV} className="btn btn-success">
            <FileSpreadsheet size={18} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Summary Grid */}
      <div className="grid-stats">
        <div className="card">
          <span className="form-label" style={{ margin: 0 }}>Total Gross Revenue</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            ₹{totalSales.toLocaleString('en-IN')}
          </h2>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Across {filteredInvoices.length} invoices
          </p>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <span className="form-label" style={{ margin: 0 }}>Net Estimated Profit</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
            ₹{netProfit.toLocaleString('en-IN')}
          </h2>
          <span className="badge badge-success" style={{ marginTop: '4px' }}>
            {profitMarginPercent}% Margin
          </span>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
          <span className="form-label" style={{ margin: 0 }}>Total GST Tax Collected</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '4px' }}>
            ₹{totalGstTax.toLocaleString('en-IN')}
          </h2>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            For GST filing compliance
          </p>
        </div>

        <div className="card">
          <span className="form-label" style={{ margin: 0 }}>Total Discounts Given</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--warning)', marginTop: '4px' }}>
            ₹{totalDiscount.toLocaleString('en-IN')}
          </h2>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Item & bill promotional discounts
          </p>
        </div>
      </div>

      {/* GST Filing Tax Breakdown Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Receipt size={20} style={{ color: 'var(--accent-primary)' }} />
          <span>GST Tax Summary Report (GSTR Ready)</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Store GSTIN:</span>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{settings.gstIn || 'Not Set'}</p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CGST Collected:</span>
            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>₹{cgstCollected.toLocaleString('en-IN')}</p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SGST Collected:</span>
            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--purple)' }}>₹{sgstCollected.toLocaleString('en-IN')}</p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Tax Liabilities:</span>
            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>₹{totalGstTax.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Transaction Records Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Detailed Billing Ledger ({filteredInvoices.length} Bills)
        </h3>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Net Total (₹)</th>
                <th>GST Tax (₹)</th>
                <th>Mode</th>
                <th>Status</th>
                {user.role === 'admin' && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {inv.invoiceNumber}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{inv.date}</td>
                  <td style={{ fontWeight: 700 }}>{inv.customerName || 'Walk-in Customer'}</td>
                  <td style={{ fontWeight: 800 }}>₹{inv.total.toLocaleString('en-IN')}</td>
                  <td>₹{(inv.taxTotal || 0).toLocaleString('en-IN')}</td>
                  <td><span className="badge badge-blue">{inv.paymentMode}</span></td>
                  <td>
                    <span className={`badge ${inv.paymentStatus === 'PAID' ? 'badge-success' : 'badge-danger'}`}>
                      {inv.paymentStatus}
                    </span>
                  </td>
                  {user.role === 'admin' && (
                    <td>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete invoice #${inv.invoiceNumber}?`)) {
                            deleteInvoice(inv.id);
                          }
                        }}
                        className="btn-icon"
                        style={{ color: 'var(--danger)' }}
                        title="Delete Invoice"
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
    </div>
  );
};
