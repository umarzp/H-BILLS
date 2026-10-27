
import React, { useMemo, useState } from 'react';
import {
  Wallet, Smartphone, Landmark, Coins, Search,
  CalendarDays, Plus, ArrowDownLeft, ArrowUpRight,
  Download, FileText, ArrowLeftRight, ClipboardCheck,
  ChevronLeft, ChevronRight, LockKeyhole
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './CashBook.css';
import { calculateAccountBalances } from '../utils/accountBalances';
import {
  CASH_BOOK_CATEGORIES,
  CASH_BOOK_ACCOUNTS,
  validateCashBookEntry
} from '../utils/cashBookEntries';


const money = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  })}`;

const todayISO = () => {
  const now = new Date();
  const local = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );
  return local.toISOString().slice(0, 10);
};

const displayDate = (value) => {
  const match = String(value || '').match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );
  return match
    ? `${match[3]}/${match[2]}/${match[1]}`
    : String(value || '—');
};

const accountOf = (mode) => {
  const text = String(mode || '').toLowerCase();

  if (/upi|gpay|google pay|phonepe|paytm/.test(text)) {
    return 'UPI';
  }
  if (/bank|neft|imps|rtgs|transfer/.test(text)) {
    return 'Bank';
  }
  if (text.trim() === 'cash') return 'Cash';
  return 'Other';
};

const newTotals = () => ({
  received: 0,
  paid: 0
});

const calculateTotals = (rows) => {
  const totals = {
    Cash: newTotals(),
    UPI: newTotals(),
    Bank: newTotals(),
    Other: newTotals()
  };

  rows.forEach((row) => {
    const status = String(row.status || '')
      .trim()
      .toUpperCase();

    // Match accountBalances.js:
    // Legacy records without status remain included.
    if (status && status !== 'POSTED') return;

    if (row.type === 'IN') {
      totals[row.account].received += row.amount;
    } else if (row.type === 'OUT') {
      totals[row.account].paid += row.amount;
    }
  });

  return totals;
};

const netOf = (item) => item.received - item.paid;

export const CashBook = () => {
  const { payments = [], settings = {} } = useApp();

  const today = todayISO();
  const monthStart = `${today.slice(0, 7)}-01`;

  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);

  const openingConfig = settings?.financialOpeningBalances;
  const openingConfigured =
    openingConfig?.effectiveDate === '2026-10-26' &&
    ['Cash', 'UPI', 'Bank'].every(
      account =>
        typeof openingConfig?.balances?.[account] === 'number' &&
        Number.isFinite(openingConfig.balances[account])
    );

  const accountBalances = useMemo(
    () => calculateAccountBalances({
      openingBalances: openingConfigured
        ? openingConfig.balances
        : {},
      payments,
      asOfDate: endDate
    }),
    [openingConfigured, openingConfig, payments, endDate]
  );


  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [accountFilter, setAccountFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [entryType, setEntryType] = useState('IN');

  const [entryForm, setEntryForm] = useState({
    date: today,
    category: 'Other Receipt',
    reference: '',
    particulars: '',
    mode: 'Cash',
    amount: '',
    notes: ''
  });

  const [entryErrors, setEntryErrors] = useState([]);

  const updateEntryField = (field, value) => {
    setEntryForm(prev => ({ ...prev, [field]: value }));
    setEntryErrors([]);
  };

  const previewEntry = () => {
    const result = validateCashBookEntry({
      ...entryForm,
      type: entryType
    });

    setEntryErrors(result.errors);

    if (result.valid) {
      alert(
        'Entry validated successfully.\n\n' +
        'Type: ' + result.normalized.type + '\n' +
        'Category: ' + result.normalized.category + '\n' +
        'Amount: ₹' + result.normalized.amount.toFixed(2) +
        '\n\nPreview only — nothing saved to Firebase.'
      );
    }
  };


  const transactions = useMemo(() => {
    return payments
      .filter((p) =>
        Number(p.amount) > 0 &&
        ['IN', 'OUT'].includes(p.type)
      )
      .map((p) => ({
        ...p,
        amount: Number(p.amount),
        account: accountOf(p.mode),
        dateKey: String(p.date || '').slice(0, 10)
      }))
      .sort((a, b) =>
        b.dateKey.localeCompare(a.dateKey) ||
        String(b.id || '').localeCompare(String(a.id || ''))
      );
  }, [payments]);

  const periodRows = useMemo(() => {
    return transactions.filter((row) =>
      row.dateKey >= startDate && row.dateKey <= endDate
    );
  }, [transactions, startDate, endDate]);

  const totals = useMemo(
    () => calculateTotals(periodRows),
    [periodRows]
  );

  const totalReceived = Object.values(totals)
    .reduce((sum, item) => sum + item.received, 0);

  const totalPaid = Object.values(totals)
    .reduce((sum, item) => sum + item.paid, 0);

  const filteredRows = useMemo(() => {
    const query = search.toLowerCase().trim();

    return periodRows.filter((row) => {
      const matchesText = [
        row.entityName,
        row.reference,
        row.mode,
        row.id
      ].some((value) =>
        String(value || '').toLowerCase().includes(query)
      );

      return matchesText &&
        (typeFilter === 'ALL' || row.type === typeFilter) &&
        (accountFilter === 'ALL' ||
          row.account === accountFilter);
    });
  }, [periodRows, search, typeFilter, accountFilter]);

  const pageSize = 10;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / pageSize)
  );
  const currentPage = Math.min(page, totalPages);

  const visibleRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const dailyRows = useMemo(
    () => transactions.filter((row) => row.dateKey === today),
    [transactions, today]
  );

  const dailyTotals = useMemo(
    () => calculateTotals(dailyRows),
    [dailyRows]
  );

  const monthlyTrend = useMemo(() => {
    const month = today.slice(0, 7);
    const days = new Date(
      Number(month.slice(0, 4)),
      Number(month.slice(5, 7)),
      0
    ).getDate();

    const monthlyRows = transactions.filter(
      (row) => row.dateKey.startsWith(month)
    );

    let cash = 0;
    let upi = 0;
    let bank = 0;

    return Array.from({ length: days }, (_, index) => {
      const date = `${month}-${String(index + 1).padStart(2, '0')}`;

      monthlyRows
        .filter((row) => row.dateKey === date)
        .forEach((row) => {
          const amount = row.type === 'IN'
            ? row.amount
            : -row.amount;

          if (row.account === 'Cash') cash += amount;
          if (row.account === 'UPI') upi += amount;
          if (row.account === 'Bank') bank += amount;
        });

      return { day: index + 1, cash, upi, bank };
    });
  }, [transactions, today]);

  const chartMax = Math.max(
    1,
    ...monthlyTrend.flatMap((row) =>
      [Math.abs(row.cash), Math.abs(row.upi), Math.abs(row.bank)]
    )
  );

  const chartLine = (key) =>
    monthlyTrend.map((point, index) => {
      const x = (index / Math.max(monthlyTrend.length - 1, 1)) * 100;
      const y = 50 - (point[key] / chartMax) * 44;
      return `${x},${y}`;
    }).join(' ');

  const summaryCards = [
    {
      title: 'Cash Balance / Movement',
      key: 'Cash',
      icon: Wallet,
      color: 'green'
    },
    {
      title: 'UPI Balance / Movement',
      key: 'UPI',
      icon: Smartphone,
      color: 'blue'
    },
    {
      title: 'Bank Balance / Movement',
      key: 'Bank',
      icon: Landmark,
      color: 'purple'
    },
    {
      title: 'Total Balance / Movement',
      key: 'Total',
      icon: Coins,
      color: 'slate'
    }
  ];

  const exportCSV = () => {
    const headers = [
      'Date', 'Type', 'Reference', 'Particulars',
      'Payment Method', 'Account', 'Money In', 'Money Out'
    ];

    const csvCell = (value) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    const rows = filteredRows.map((row) => [
      row.dateKey,
      row.type,
      row.reference,
      row.entityName,
      row.mode,
      row.account,
      row.type === 'IN' ? row.amount : 0,
      row.type === 'OUT' ? row.amount : 0
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(','))
      .join('\r\n');

    const blob = new Blob(
      ['\uFEFF', csv],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `H-BILLS-CashBook-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cb-page">
      <div className="cb-heading">
        <div>
          <h1>Cash Book</h1>
          <p>
            Track cash and payment method movements
            across all transactions.
          </p>
        </div>

        <div className="cb-heading-actions">
          <div className="cb-date-range">
            <CalendarDays size={17} />
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
            <span>–</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <button className="cb-primary" disabled
            title="Manual entries will be enabled in the next phase">
            <Plus size={18} /> Add Entry
          </button>
        </div>
      </div>

      <div className="cb-notice">
        <LockKeyhole size={15} />
        Live payment data · {openingConfigured
          ? 'Account balances include opening amounts and movements through the selected end date.'
          : 'Amounts show net movement, not available balances. Opening balances are not configured.'}
      </div>

      <div className="cb-stat-grid">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const data = card.key === 'Total'
            ? { received: totalReceived, paid: totalPaid }
            : totals[card.key];

          return (
            <div
              key={card.key}
              className={`cb-stat cb-${card.color}`}
            >
              <div className="cb-stat-top">
                <div className="cb-stat-icon">
                  <Icon size={26} />
                </div>
                <div>
                  <span>{card.title}</span>
                  <strong>
                    {openingConfigured
                      ? money(accountBalances[card.key]?.closing)
                      : money(netOf(data))}
                  </strong>
                </div>
              </div>
              <div className="cb-stat-line">
                <span>Opening Balance</span>
                <span>
                  {openingConfigured
                    ? money(accountBalances[card.key]?.opening)
                    : 'Not configured'}
                </span>
              </div>
              <div className="cb-stat-line">
                <span>Total Received</span>
                <span>{money(data.received)}</span>
              </div>
              <div className="cb-stat-line">
                <span>Total Paid</span>
                <span>{money(data.paid)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="cb-main-grid">
        <section className="cb-panel cb-transactions">
          <div className="cb-panel-heading">
            <h2>Cash Book Transactions</h2>
            <span className="cb-small-label">
              {filteredRows.length} records
            </span>
          </div>

          <div className="cb-filters">
            <select value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}>
              <option value="ALL">All Types</option>
              <option value="IN">Money In</option>
              <option value="OUT">Money Out</option>
            </select>

            <select value={accountFilter}
              onChange={(e) => {
                setAccountFilter(e.target.value);
                setPage(1);
              }}>
              <option value="ALL">All Payment Methods</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank">Bank</option>
              <option value="Other">Other</option>
            </select>

            <div className="cb-search">
              <Search size={16} />
              <input
                value={search}
                placeholder="Search transactions..."
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="cb-table-wrap">
            <table className="cb-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Particulars</th>
                  <th>Payment Method</th>
                  <th>Audit Details</th>
                  <th>In (₹)</th>
                  <th>Out (₹)</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td>{displayDate(row.date)}</td>
                    <td>
                      <span className={
                        `cb-tag ${row.type === 'IN'
                          ? 'cb-tag-in'
                          : 'cb-tag-out'}`
                      }>
                        {row.type === 'IN'
                          ? 'Money In'
                          : 'Money Out'}
                      </span>
                    </td>
                    <td>{row.reference || '—'}</td>
                    <td>{row.entityName || '—'}</td>
                    <td>
                      <span className="cb-method">
                        {row.mode || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      {row.source === 'cashbook_reversal' ? (
                        <div>
                          <strong>Reversal</strong>
                          <div>Original: {row.reversalOf || '—'}</div>
                          <div>Reason: {row.reversalReason || '—'}</div>
                          <div>By: {row.createdByName || row.createdByUid || '—'}</div>
                        </div>
                      ) : row.source === 'manual_cashbook' ? (
                        <div>
                          <strong>Manual Entry</strong>
                          <div>Status: {row.status || '—'}</div>
                          <div>By: {row.createdByName || row.createdByUid || '—'}</div>
                        </div>
                      ) : (
                        <span>{row.source === 'expense' ? 'Expense Payment' : row.invoiceId ? 'Invoice Payment' : 'Payment Record'}</span>
                      )}
                    </td>
                    <td className="cb-money-in">
                      {row.type === 'IN'
                        ? money(row.amount)
                        : '—'}
                    </td>
                    <td className="cb-money-out">
                      {row.type === 'OUT'
                        ? money(row.amount)
                        : '—'}
                    </td>
                  </tr>
                ))}
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="cb-empty">
                      No transactions found for this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="cb-table-footer">
            <span>
              Showing {filteredRows.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
              –{Math.min(currentPage * pageSize, filteredRows.length)}
              {' '}of {filteredRows.length}
            </span>

            <div className="cb-pagination">
              <button disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}>
                <ChevronLeft size={16} />
              </button>
              <span>{currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}>
                <ChevronRight size={16} />
              </button>
            </div>

            <button className="cb-export" onClick={exportCSV}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </section>

        <section className="cb-panel cb-entry">
          <div className="cb-panel-heading">
            <h2>Add Cash Book Entry</h2>
            <span className="cb-coming">Coming next</span>
          </div>

          <div className="cb-entry-tabs">
            <button
              className={entryType === 'IN' ? 'selected-in' : ''}
              onClick={() => {
                setEntryType('IN');
                updateEntryField('category', 'Other Receipt');
              }}
            >
              <ArrowDownLeft size={18} /> Money In
            </button>
            <button
              className={entryType === 'OUT' ? 'selected-out' : ''}
              onClick={() => {
                setEntryType('OUT');
                updateEntryField('category', 'Other Payment');
              }}
            >
              <ArrowUpRight size={18} /> Money Out
            </button>
          </div>

          <div className="cb-entry-fields">
            <label>Date
              <input
                type="date"
                value={entryForm.date}
                onChange={e => updateEntryField('date', e.target.value)}
              />
            </label>

            <label>Transaction Category
              <select
                value={entryForm.category}
                onChange={e => updateEntryField('category', e.target.value)}
              >
                {CASH_BOOK_CATEGORIES[entryType].map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>Reference No.
              <input
                value={entryForm.reference}
                onChange={e => updateEntryField('reference', e.target.value)}
                placeholder="Optional reference"
              />
            </label>

            <label>Particulars
              <input
                value={entryForm.particulars}
                onChange={e => updateEntryField('particulars', e.target.value)}
                placeholder="Enter transaction details"
              />
            </label>

            <label>Payment Method
              <select
                value={entryForm.mode}
                onChange={e => updateEntryField('mode', e.target.value)}
              >
                {CASH_BOOK_ACCOUNTS.map(account => (
                  <option key={account} value={account}>
                    {account}
                  </option>
                ))}
              </select>
            </label>

            <label>Amount (₹)
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={entryForm.amount}
                onChange={e => updateEntryField('amount', e.target.value)}
                placeholder="0.00"
              />
            </label>

            <label>Notes
              <textarea
                rows={3}
                value={entryForm.notes}
                onChange={e => updateEntryField('notes', e.target.value)}
                placeholder="Optional notes"
              />
            </label>

            {entryErrors.length > 0 && (
              <div role="alert" style={{ color: '#dc2626' }}>
                {entryErrors.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}

            <button
              type="button"
              className="cb-primary cb-save"
              onClick={previewEntry}
            >
              Preview / Validate Entry
            </button>

            <p className="cb-small-label">
              Saving is locked. Preview does not change Firebase data.
            </p>
          </div>
        </section>
      </div>

      <div className="cb-bottom-grid">
        <section className="cb-panel">
          <div className="cb-panel-heading">
            <h2>Daily Summary</h2>
            <span className="cb-small-label">
              {displayDate(today)}
            </span>
          </div>

          <div className="cb-daily-grid">
            {['Cash', 'UPI', 'Bank', 'Other'].map((key) => {
              const item = dailyTotals[key];

              return (
                <div key={key} className="cb-daily-card">
                  <strong>{key}</strong>
                  <div>
                    <span>Received</span>
                    <span>{money(item.received)}</span>
                  </div>
                  <div>
                    <span>Paid</span>
                    <span>{money(item.paid)}</span>
                  </div>
                  <div className="cb-daily-net">
                    <span>Net</span>
                    <span className={
                      netOf(item) < 0
                        ? 'cb-money-out'
                        : 'cb-money-in'
                    }>
                      {money(netOf(item))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="cb-panel">
          <div className="cb-panel-heading">
            <h2>Monthly Trend</h2>
            <span className="cb-small-label">
              Net movements
            </span>
          </div>

          <div className="cb-chart-legend">
            <span><i className="cb-dot cash" /> Cash</span>
            <span><i className="cb-dot upi" /> UPI</span>
            <span><i className="cb-dot bank" /> Bank</span>
          </div>

          <div className="cb-chart">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-label="Monthly payment movements chart"
              role="img"
            >
              {[10, 30, 50, 70, 90].map((y) => (
                <line key={y}
                  x1="0" y1={y} x2="100" y2={y}
                  stroke="rgba(148,163,184,.14)"
                  strokeWidth=".5"
                />
              ))}
              <polyline
                points={chartLine('cash')}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                points={chartLine('upi')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                points={chartLine('bank')}
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          <div className="cb-chart-labels">
            <span>1 {today.slice(5, 7)}</span>
            <span>Mid-month</span>
            <span>Month end</span>
          </div>
        </section>

        <section className="cb-panel">
          <div className="cb-panel-heading">
            <h2>Quick Actions</h2>
          </div>

          <div className="cb-quick-grid">
            {[
              { label: 'Opening Balance', icon: FileText },
              { label: 'Daily Closing', icon: ClipboardCheck },
              { label: 'Transfer Funds', icon: ArrowLeftRight },
              { label: 'Bank Reconciliation', icon: Landmark }
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                disabled
                title="Available in a later development phase"
              >
                <Icon size={24} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <p className="cb-small-label cb-quick-note">
            Financial actions will be enabled after
            account and audit safeguards are implemented.
          </p>
        </section>
      </div>
    </div>
  );
};
