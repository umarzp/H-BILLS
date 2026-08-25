import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  QrCode, 
  Smartphone,
  Download,
  IndianRupee,
  Trash2
} from 'lucide-react';

export const Payments = () => {
  const { payments, deletePayment, settings, user } = useApp();
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'IN', 'OUT'

  // Standalone QR tool states
  const [qrAmount, setQrAmount] = useState('500');
  const [qrNote, setQrNote] = useState('Quick Store Payment');
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (settings.upiId && qrAmount) {
      const upiUrl = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.storeName)}&am=${qrAmount}&cu=INR&tn=${encodeURIComponent(qrNote)}`;
      QRCode.toDataURL(upiUrl, { width: 180, margin: 1 })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error(err));
    }
  }, [qrAmount, qrNote, settings]);

  const filteredPayments = payments.filter(p => {
    if (filterType === 'IN') return p.type === 'IN';
    if (filterType === 'OUT') return p.type === 'OUT';
    return true;
  });

  const totalInward = payments.filter(p => p.type === 'IN').reduce((sum, p) => sum + p.amount, 0);
  const totalOutward = payments.filter(p => p.type === 'OUT').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={26} style={{ color: 'var(--accent-primary)' }} />
            <span>Payments Ledger & UPI Payment Scanner</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            View inward and outward cashflow transactions, or trigger quick dynamic UPI QR code payments.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
        {/* LEFT: Payments Ledger Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
              <span className="form-label" style={{ margin: 0 }}>Total Inward Collected</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                ₹{totalInward.toLocaleString('en-IN')}
              </h2>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
              <span className="form-label" style={{ margin: 0 }}>Total Outward Paid</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)', marginTop: '4px' }}>
                ₹{totalOutward.toLocaleString('en-IN')}
              </h2>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Transaction Records</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setFilterType('ALL')} className={`btn btn-sm ${filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}>
                All
              </button>
              <button onClick={() => setFilterType('IN')} className={`btn btn-sm ${filterType === 'IN' ? 'btn-primary' : 'btn-secondary'}`}>
                Inward (Received)
              </button>
              <button onClick={() => setFilterType('OUT')} className={`btn btn-sm ${filterType === 'OUT' ? 'btn-primary' : 'btn-secondary'}`}>
                Outward (Paid)
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="card">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Direction</th>
                    <th>Party / Entity</th>
                    <th>Amount</th>
                    <th>Payment Mode</th>
                    <th>Reference</th>
                    {user.role === 'admin' && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map(pay => (
                    <tr key={pay.id}>
                      <td style={{ color: 'var(--text-secondary)' }}>{pay.date}</td>
                      <td>
                        <span className={`badge ${pay.type === 'IN' ? 'badge-success' : 'badge-warning'}`}>
                          {pay.type === 'IN' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {pay.type === 'IN' ? 'INWARD' : 'OUTWARD'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{pay.entityName}</td>
                      <td style={{ fontWeight: 800, color: pay.type === 'IN' ? 'var(--success)' : 'var(--warning)' }}>
                        ₹{pay.amount.toLocaleString('en-IN')}
                      </td>
                      <td><span className="badge badge-blue">{pay.mode}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{pay.reference}</td>
                      {user.role === 'admin' && (
                        <td>
                          <button
                            onClick={() => {
                              if (window.confirm('Delete payment record?')) {
                                deletePayment(pay.id);
                              }
                            }}
                            className="btn-icon"
                            style={{ color: 'var(--danger)' }}
                            title="Delete Payment Record"
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

        {/* RIGHT: Standalone Dynamic UPI QR Generator Tool */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <QrCode size={22} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Dynamic UPI QR Generator</h3>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Enter amount to instantly generate a custom UPI payment QR code for customers to scan using Google Pay, PhonePe, Paytm, or BHIM.
          </p>

          <div className="form-group">
            <label className="form-label">Payable Amount (₹)</label>
            <input
              type="number"
              value={qrAmount}
              onChange={(e) => setQrAmount(e.target.value)}
              className="form-input"
              style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Note / Remark</label>
            <input
              type="text"
              value={qrNote}
              onChange={(e) => setQrNote(e.target.value)}
              className="form-input"
            />
          </div>

          {/* QR Code Container */}
          <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center', marginTop: '1rem', border: '1px solid var(--border-color)' }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="UPI QR Code" style={{ width: '160px', height: '160px' }} />
            ) : (
              <div style={{ width: '160px', height: '160px', background: '#e2e8f0', margin: '0 auto' }} />
            )}
            <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Smartphone size={16} />
              <span>Scan ₹{qrAmount} via UPI</span>
            </p>
            <p style={{ fontSize: '0.725rem', color: '#64748b', margin: 0 }}>VPA: {settings.upiId}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
