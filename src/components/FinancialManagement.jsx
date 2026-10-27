import React, { useMemo, useState } from 'react';
import {
  Wallet, Receipt, TrendingUp, TrendingDown,
  Landmark, CreditCard, CalendarDays, ArrowRight,
  LockKeyhole, Activity
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OpeningBalances } from './OpeningBalances';
import { AccountReconciliation } from './AccountReconciliation';
import { calculateProfitAndLoss } from '../utils/profitAndLoss';


const OPENING_DATE = '2026-10-26';

const money = value =>
  '₹' + Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const dateKey = value => {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (typeof value.toDate === 'function')
    return value.toDate().toLocaleDateString('en-CA');
  if (value instanceof Date)
    return value.toLocaleDateString('en-CA');
  return '';
};

const card = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 16,
  padding: 20
};

export const FinancialManagement = () => {
  const {
    user, invoices = [], payments = [],
    expenses = [], products = [], setActiveTab
  } = useApp();

  const today = new Date().toLocaleDateString('en-CA');
  const [showOpeningBalances, setShowOpeningBalances] = useState(false);
  const [showReconciliation, setShowReconciliation] = useState(false);
  const [startDate, setStartDate] = useState(OPENING_DATE);
  const [endDate, setEndDate] = useState(
    today >= OPENING_DATE ? today : OPENING_DATE
  );

  const summary = useMemo(() => {
    const inRange = item => {
      const date = dateKey(item.date);
      return date && date >= startDate && date <= endDate;
    };

    const validInvoices = invoices.filter(item =>
      inRange(item) &&
      String(item.status || '').toUpperCase() !== 'CANCELLED'
    );

    const sales = validInvoices.reduce(
      (sum, item) => sum + Number(item.total || 0), 0
    );

    const validPayments = payments.filter(item =>
      inRange(item) &&
      ['IN', 'OUT'].includes(String(item.type || '').toUpperCase())
    );

    const received = validPayments
      .filter(item => String(item.type).toUpperCase() === 'IN')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const paid = validPayments
      .filter(item => String(item.type).toUpperCase() === 'OUT')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const validExpenses = expenses.filter(inRange);

    const expenseTotal = validExpenses.reduce(
      (sum, item) => sum + Number(item.amount || 0), 0
    );

    const recent = [
      ...validPayments.map(item => ({
        id: 'payment-' + item.id,
        date: dateKey(item.date),
        description: item.entityName || item.reference || 'Payment',
        type: item.type,
        amount: Number(item.amount || 0),
        source: 'Payment'
      })),
      ...validExpenses.map(item => ({
        id: 'expense-' + item.id,
        date: dateKey(item.date),
        description: item.category || 'Expense',
        type: 'OUT',
        amount: Number(item.amount || 0),
        source: 'Expense'
      }))
    ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

    return {
      sales, received, paid, expenseTotal,
      movement: received - paid,
      invoiceCount: validInvoices.length,
      paymentCount: validPayments.length,
      recent
    };
  }, [invoices, payments, expenses, startDate, endDate]);

  const profitLoss = useMemo(
    () => calculateProfitAndLoss({
      invoices, products, expenses, startDate, endDate
    }),
    [invoices, products, expenses, startDate, endDate]
  );

  if (user?.role !== 'admin') {
    return (
      <section style={card}>
        <LockKeyhole size={24} />
        <h2>Admin access required</h2>
        <p>Financial overview is restricted to administrators.</p>
      </section>
    );
  }

  if (showReconciliation) {
    return (
      <div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setShowReconciliation(false)}
          style={{ marginBottom: 16 }}
        >
          ← Back to Financial Management
        </button>
        <AccountReconciliation />
      </div>
    );
  }

  if (showOpeningBalances) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setShowOpeningBalances(false)}
          style={{
            marginBottom: 16,
            padding: '10px 16px',
            cursor: 'pointer'
          }}
        >
          ← Back to Financial Management
        </button>
        <OpeningBalances />
      </div>
    );
  }

  const metrics = [
    {
      title: 'Invoiced Sales',
      value: money(summary.sales),
      icon: TrendingUp,
      note: `${summary.invoiceCount} invoices · Not cash received`
    },
    {
      title: 'Money Received',
      value: money(summary.received),
      icon: Wallet,
      note: 'From existing payment records'
    },
    {
      title: 'Money Paid',
      value: money(summary.paid),
      icon: TrendingDown,
      note: 'From existing payment records'
    },
    {
      title: 'Recorded Expenses',
      value: money(summary.expenseTotal),
      icon: Receipt,
      note: 'From existing expense records'
    }
  ];

  return (
    <div style={{
      color: 'var(--text-primary)',
      display: 'grid',
      gap: 20,
      paddingBottom: 24
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{
            color: 'var(--accent-primary)',
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: 1.5
          }}>
            H-BILLS / FINANCE
          </div>
          <h1 style={{ margin: '8px 0' }}>Financial Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Centralized financial overview · Live read-only data
          </p>
        </div>
        <div style={{
          ...card, padding: 12,
          display: 'flex', gap: 10, alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <CalendarDays size={18} />
          <input type="date" value={startDate}
            max={endDate}
            onChange={event => setStartDate(event.target.value)} />
          <span>to</span>
          <input type="date" value={endDate}
            min={startDate}
            onChange={event => setEndDate(event.target.value)} />
        </div>
      </header>

      <div style={{
        ...card,
        borderLeft: '4px solid var(--accent-primary)'
      }}>
        <strong>Opening balances pending configuration</strong>
        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            onClick={() => setShowOpeningBalances(true)}
            style={{
              padding: '11px 18px',
              borderRadius: 8,
              cursor: 'pointer',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              fontWeight: 600
            }}
          >
            Configure Opening Balances
          </button>
        </div>
        <p style={{
          color: 'var(--text-secondary)',
          margin: '8px 0 0'
        }}>
          Effective date: 26 October 2026. Cash, bank and UPI
          settlement balances have not been configured.
          Payment movements are not available account balances.
        </p>
      </div>

      <div style={{ marginBottom: 18 }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setShowReconciliation(true)}
        >
          <Landmark size={16} />
          Open Account Reconciliation
          <ArrowRight size={16} />
        </button>
        <p style={{
          color: "var(--text-secondary)",
          fontSize: 13,
          marginTop: 8
        }}>
          Preview only. No reconciliation data is saved.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))',
        gap: 14
      }}>
        {metrics.map(metric => {
          const Icon = metric.icon;

          const metricColors = {
            'Invoiced Sales': {
              border: '#10B981',
              background: 'rgba(16, 185, 129, 0.09)'
            },
            'Money Received': {
              border: '#3B82F6',
              background: 'rgba(59, 130, 246, 0.09)'
            },
            'Money Paid': {
              border: '#F43F5E',
              background: 'rgba(244, 63, 94, 0.09)'
            },
            'Recorded Expenses': {
              border: '#A855F7',
              background: 'rgba(168, 85, 247, 0.09)'
            }
          };

          const accent = metricColors[metric.title];

          return (
            <section
              key={metric.title}
              style={{
                ...card,
                ...(accent ? {
                  border: `1px solid ${accent.border}`,
                  background: accent.background
                } : {})
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {metric.title}
                </span>
                <Icon size={21} color="var(--accent-primary)" />
              </div>
              <h2 style={{ margin: '15px 0 7px' }}>
                {metric.value}
              </h2>
              <small style={{ color: 'var(--text-muted)' }}>
                {metric.note}
              </small>
            </section>
          );
        })}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16
      }}>
        <section style={card}>
          <h3><Activity size={18} /> Payment Movement</h3>
          <h2 style={{
            color: summary.movement < 0
              ? 'var(--danger)'
              : 'var(--success)'
          }}>
            {money(summary.movement)}
          </h2>
          <small style={{ color: 'var(--text-muted)' }}>
            {summary.paymentCount} payment records
          </small>
          <button className="btn btn-secondary"
            onClick={() => setActiveTab('cash-book')}>
            <Wallet size={16} /> Open Cash Book <ArrowRight size={16} />
          </button>
        </section>

        <section style={card}>
          <h3><Landmark size={18} /> Accounts & Profit</h3>
          <div style={{
            display: 'flex', gap: 10, flexWrap: 'wrap',
            marginTop: 18
          }}>
            <span><CreditCard size={16} /> Bank / UPI: Pending</span>
            <span><LockKeyhole size={16} /> Profit: Pending</span>
          </div>
        </section>
      </div>


      <section style={card}>
        <h3>Profit &amp; Loss</h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 14
        }}>
          {[
            ["Sales excluding GST", profitLoss.revenue],
            ["Cost of Goods Sold", profitLoss.recordedCOGS],
            ["Operating Expenses", profitLoss.operatingExpenses],
            [
              profitLoss.reliable ? "Net Profit / Loss" : "Provisional Profit / Loss",
              profitLoss.reliable
                ? profitLoss.netProfit
                : profitLoss.provisionalNetProfit
            ]
          ].map(([label, value]) => (
            <div key={label} style={{
              padding: 16,
              border: "1px solid var(--border-color)",
              borderRadius: 10
            }}>
              <small>{label}</small>
              <h3>{money(value)}</h3>
            </div>
          ))}
        </div>
        <small style={{ color: "var(--text-muted)" }}>
          {profitLoss.reliable ? "Validation pending" : "Provisional"}
        </small>
        {!profitLoss.reliable && (
          <div>
            <p>Missing cost lines: {profitLoss.missingCostLines}</p>
            <p>Invalid records: {profitLoss.invalidRecords}</p>
            {profitLoss.warnings.map(warning => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        )}
      </section>

      <section style={card}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <h3>Recent Financial Activity</h3>
          <button className="btn btn-secondary"
            onClick={() => setActiveTab('expenses')}>
            <Receipt size={16} /> Expenses <ArrowRight size={16} />
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left'
          }}>
            <thead>
              <tr>
                {['Date', 'Source', 'Particulars', 'Type', 'Amount']
                  .map(label => (
                    <th key={label} style={{
                      padding: 12,
                      borderBottom: '1px solid var(--border-color)'
                    }}>{label}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {summary.recent.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: 12 }}>{item.date}</td>
                  <td style={{ padding: 12 }}>{item.source}</td>
                  <td style={{ padding: 12 }}>{item.description}</td>
                  <td style={{ padding: 12 }}>{item.type}</td>
                  <td style={{ padding: 12 }}>{money(item.amount)}</td>
                </tr>
              ))}
              {summary.recent.length === 0 && (
                <tr>
                  <td colSpan={5} style={{
                    padding: 20,
                    color: 'var(--text-muted)'
                  }}>
                    No financial activity in this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
