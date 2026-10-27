import React, { useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/formatDate';
import {
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  AlertTriangle,
  PlusCircle,
  Receipt,
  PackagePlus,
  ArrowUpRight,
  ArrowDownRight,
  User,
  Clock,
  Trash2
} from 'lucide-react';

export const Dashboard = () => {
  const {
    invoices,
    products,
    purchases,
    payments,
    expenses,
    setActiveTab,
    settings,
    user,
    deleteInvoice
  } = useApp();

  const canvasRef = useRef(null);

  // Calculations
  const todayStr = new Date().toISOString().slice(0, 10);

  const todayInvoices = invoices.filter(i => i.date === todayStr);
  const todaySales = todayInvoices.reduce((sum, i) => sum + i.total, 0);

  const todayPurchasesList = purchases.filter(p => p.date === todayStr);
  const todayPurchasesTotal = todayPurchasesList.reduce((sum, p) => sum + p.total, 0);

  // Profit calculation (Revenue - Cost of items sold)
  let totalRevenue = 0;
  // Historical invoice costs only; never invent product costs.
  let totalCostOfGoods = 0;
  let missingCostLines = 0;

  const profitInvoices = invoices;

  profitInvoices
    .filter(inv => !["CANCELLED", "VOID"].includes(
      String(inv.status || "").toUpperCase()
    ))
    .forEach(inv => {
      (inv.items || []).forEach(item => {
        if (item.itemType === "SERVICE") {
          missingCostLines++;
          return;
        }

        const cost = item.costPrice === null ||
          item.costPrice === undefined ||
          item.costPrice === ""
          ? null
          : Number(item.costPrice);

        const qty = Number(item.qty);

        if (
          cost === null ||
          !Number.isFinite(cost) ||
          cost < 0 ||
          !Number.isFinite(qty) ||
          qty <= 0
        ) {
          missingCostLines++;
          return;
        }

        totalCostOfGoods += cost * qty;
      });
    });

  const profitIsProvisional = missingCostLines > 0;
  const netProfit = profitInvoices.reduce(
    (sum, inv) => {
      if (["CANCELLED", "VOID"].includes(
        String(inv.status || "").toUpperCase()
      )) return sum;

      return sum +
        Number(inv.total || 0) -
        Number(inv.taxTotal || 0);
    },
    0
  ) - totalCostOfGoods;

  // Admin dashboard inventory summary (read-only).
  const inventorySummary = products.reduce((summary, product) => {
    const stock = Number(product.stock);
    const cost = Number(product.costPrice);

    if (!Number.isFinite(stock) || stock < 0) {
      summary.invalidRecords += 1;
      return summary;
    }

    summary.quantity += stock;

    const sellingPrice = Number(product.price);
    if (
      product.price !== null &&
      product.price !== undefined &&
      product.price !== '' &&
      Number.isFinite(sellingPrice) &&
      sellingPrice >= 0
    ) {
      summary.sellingValue += stock * sellingPrice;
    } else {
      summary.missingPrices += 1;
    }

    if (
      product.costPrice === null ||
      product.costPrice === undefined ||
      product.costPrice === '' ||
      !Number.isFinite(cost) ||
      cost < 0
    ) {
      summary.missingCosts += 1;
    } else {
      summary.cost += stock * cost;
    }

    return summary;
  }, {
    quantity: 0,
    cost: 0,
    sellingValue: 0,
    missingPrices: 0,
    missingCosts: 0,
    invalidRecords: 0
  });

  // Daily financial summary from existing Firebase records.
  const todayMoneyReceived = payments
    .filter(payment =>
      payment.date === todayStr &&
      payment.type === 'IN' &&
      !['REVERSED', 'VOID', 'CANCELLED'].includes(
        String(payment.status || '').toUpperCase()
      )
    )
    .reduce((total, payment) => {
      const amount = Number(payment.amount);
      return total + (
        Number.isFinite(amount) && amount > 0 ? amount : 0
      );
    }, 0);

  const todayExpenses = expenses
    .filter(expense =>
      expense.date === todayStr &&
      !['REVERSED', 'VOID', 'CANCELLED'].includes(
        String(expense.status || '').toUpperCase()
      )
    )
    .reduce((total, expense) => {
      const amount = Number(expense.amount);
      return total + (
        Number.isFinite(amount) && amount > 0 ? amount : 0
      );
    }, 0);

  const lowStockItems = products.filter(p => p.stock <= (p.minStock || 5));

  // Render Sales Canvas Visual Chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.parentElement.clientWidth;
    const height = canvas.height = 200;

    // Generate 7-day sales data points
    const days = [];
    const salesData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dStr = d.toISOString().slice(0, 10);
      days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      const daySales = invoices
        .filter(inv => inv.date === dStr)
        .reduce((sum, inv) => sum + inv.total, 0);
      salesData.push(daySales); // Fallback mock for visual aesthetics if sparse
    }

    ctx.clearRect(0, 0, width, height);

    const maxVal = Math.max(...salesData, 10000) * 1.2;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw Smooth Line & Gradient Fill
    const points = salesData.map((val, idx) => {
      const x = padding + (chartWidth / (salesData.length - 1)) * idx;
      const y = height - padding - (val / maxVal) * chartHeight;
      return { x, y };
    });

    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const xc = (points[i].x + points[i - 1].x) / 2;
      const yc = (points[i].y + points[i - 1].y) / 2;
      ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.lineTo(points[points.length - 1].x, height - padding);
    ctx.lineTo(points[0].x, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const xc = (points[i].x + points[i - 1].x) / 2;
      const yc = (points[i].y + points[i - 1].y) / 2;
      ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Points & Labels
    points.forEach((pt, i) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Day label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(days[i], pt.x, height - 12);
    });

  }, [invoices]);

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Welcome back, {user.name}</span>
            <span style={{ fontSize: '1rem' }}>👋</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
            Here is your live retail billing & stock summary for today.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('billing')}
            className="btn btn-primary"
          >
            <IndianRupee size={18} />
<span>Create Invoice</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className="btn btn-secondary"
          >
            <PlusCircle size={18} />
            <span>Add Product</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className="btn btn-secondary"
          >
            <PackagePlus size={18} />
            <span>Adjust Stock</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-stats">
        {/* Today's Sales */}
        <div className="card card-hover">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span className="form-label" style={{ margin: 0 }}>Today's Sales</span>
            <div style={{ background: 'var(--accent-glow)', color: 'var(--accent-primary)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ₹{todaySales.toLocaleString('en-IN')}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.5rem', fontSize: '0.775rem', color: 'var(--success)' }}>
            <ArrowUpRight size={16} />
            <span>{todayInvoices.length} invoices generated today</span>
          </div>
        </div>

        {/* Today's Purchases */}
        <div className="card card-hover">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span className="form-label" style={{ margin: 0 }}>Today's Purchases</span>
            <div style={{ background: 'var(--purple-bg)', color: 'var(--purple)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
              <ShoppingBag size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ₹{todayPurchasesTotal.toLocaleString('en-IN')}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.5rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            <span>{todayPurchasesList.length} stock receipts recorded</span>
          </div>
        </div>

        {/* Net Profit (Admin view) */}
        {user.role === 'admin' && (
          <div className="card card-hover">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span className="form-label" style={{ margin: 0 }}>Provisional Gross Profit / Loss</span>
              <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
               <IndianRupee size={20} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
              ₹{netProfit.toLocaleString('en-IN')}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.5rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
              <span>Excludes GST and operating expenses; missing costs may apply</span>
            </div>
          </div>
        )}

        {/* Admin-only Inventory Summary */}
        {user.role === 'admin' && (
          <div className="card card-hover" style={{
            borderLeft: '4px solid #10B981'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem'
            }}>
              <span className="form-label" style={{ margin: 0 }}>
                Total Inventory Value
              </span>
              <PackagePlus size={20} color="#10B981" />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              <div>
                <div style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem'
                }}>
                  Stock Quantity
                </div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#60A5FA'
                }}>
                  {inventorySummary.quantity.toLocaleString('en-IN')}
                </h2>
              </div>

              <div>
                <div style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem'
                }}>
                  Total Purchase Cost
                </div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#34D399'
                }}>
                  ₹{inventorySummary.cost.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </h2>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid var(--border-color)',
              paddingTop: '0.75rem',
              marginTop: '0.75rem'
            }}>
              <div style={{
                color: 'var(--text-secondary)',
                fontSize: '0.75rem'
              }}>
                Total Selling Value
              </div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#FBBF24'
              }}>
                ₹{inventorySummary.sellingValue.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </h2>
            </div>

            {(inventorySummary.missingCosts > 0 ||
              inventorySummary.missingPrices > 0 ||
              inventorySummary.invalidRecords > 0) && (
              <div style={{
                color: 'var(--warning)',
                fontSize: '0.75rem',
                marginTop: '0.75rem'
              }}>
                Valuation incomplete: missing costs or invalid stock records.
              </div>
            )}
          </div>
        )}

        {/* Today's Money Received - Admin only */}
        {user.role === 'admin' && (
          <div className="card card-hover" style={{
            borderLeft: '4px solid #06B6D4'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem'
            }}>
              <span className="form-label" style={{ margin: 0 }}>
                Today's Money Received
              </span>
              <IndianRupee size={20} color="#22D3EE" />
            </div>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#22D3EE'
            }}>
              ₹{todayMoneyReceived.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </h2>
            <div style={{
              fontSize: '0.775rem',
              color: 'var(--text-muted)',
              marginTop: '0.5rem'
            }}>
              Payments collected today
            </div>
          </div>
        )}

        {/* Today's Expenses - Admin only */}
        {user.role === 'admin' && (
          <div className="card card-hover" style={{
            borderLeft: '4px solid #F97316'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem'
            }}>
              <span className="form-label" style={{ margin: 0 }}>
                Today's Expenses
              </span>
              <Receipt size={20} color="#FB923C" />
            </div>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#FB923C'
            }}>
              ₹{todayExpenses.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </h2>
            <div style={{
              fontSize: '0.775rem',
              color: 'var(--text-muted)',
              marginTop: '0.5rem'
            }}>
              Operating expenses recorded today
            </div>
          </div>
        )}

        {/* Low Stock Alerts Count */}
        <div className="card card-hover" style={{ borderLeft: lowStockItems.length > 0 ? '4px solid var(--warning)' : '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span className="form-label" style={{ margin: 0 }}>Low Stock Alert</span>
            <div style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: lowStockItems.length > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
            {lowStockItems.length} Products
          </h2>
          <button
            onClick={() => setActiveTab('inventory')}
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.775rem', fontWeight: 700, padding: 0, marginTop: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>View Stock Table & Restock</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* Main Analytics & Low Stock Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
        {/* Sales Trend Chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Weekly Revenue Trend</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily billing totals (₹)</p>
            </div>
            <span className="badge badge-blue">Real-Time</span>
          </div>

          <div style={{ width: '100%', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '200px', display: 'block' }} />
          </div>
        </div>

        {/* Low Stock Items Drawer */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Stock Warnings</h3>
            <span className="badge badge-warning">{lowStockItems.length} Items</span>
          </div>

          {lowStockItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>🎉 All stock levels are sufficient!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '220px', overflowY: 'auto' }}>
              {lowStockItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</p>
                    <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>SKU: {item.sku} | Min: {item.minStock} {item.unit}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-danger" style={{ marginBottom: '2px' }}>
                      {item.stock} {item.unit} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices Table Stream */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Invoices</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest billing sales transactions</p>
          </div>
          <button onClick={() => setActiveTab('billing')} className="btn btn-secondary btn-sm">
            <Receipt size={15} />
            <span>New Bill</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items Count</th>
                <th>Total (₹)</th>
                <th>Payment Mode</th>
                <th>Status</th>
                {user.role === 'admin' && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 5).map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                    {inv.invoiceNumber}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatDate(inv.date)}</td>
                  <td style={{ fontWeight: 600 }}>{inv.customerName || 'Walk-in Customer'}</td>
                  <td>{inv.items.length} Items</td>
                  <td style={{ fontWeight: 700 }}>₹{inv.total.toLocaleString('en-IN')}</td>
                  <td>
                    <span className="badge badge-blue">{inv.paymentMode}</span>
                  </td>
                  <td>
                    <span className={`badge ${inv.paymentStatus === 'PAID' ? 'badge-success' : 'badge-danger'}`}>
                      {inv.paymentStatus}
                    </span>
                  </td>
                  {user.role === 'admin' && (
                    <td>
                      <button
                        onClick={() => {
  alert('Invoice deletion is disabled. Admin-only cancellation is being implemented.');
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
