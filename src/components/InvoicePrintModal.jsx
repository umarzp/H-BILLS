import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Printer, Download, X, CheckCircle, Smartphone } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const InvoicePrintModal = ({ invoice, onClose }) => {
  const { settings } = useApp();
  const [printFormat, setPrintFormat] = useState('a4'); // 'a4' or 'thermal'
  const [qrDataUrl, setQrDataUrl] = useState('');
  const invoiceRef = useRef(null);

  useEffect(() => {
    // Generate UPI QR code for the invoice total amount
    if (invoice && settings.upiId) {
      const upiUrl = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.storeName)}&am=${invoice.total}&cu=INR&tn=Bill_${invoice.invoiceNumber}`;
      QRCode.toDataURL(upiUrl, { width: 140, margin: 1 })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error(err));
    }
  }, [invoice, settings]);

  if (!invoice) return null;

  const handleWindowPrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = invoiceRef.current;
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice_${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    }
  };

  // Calculate GST Split
  const isGstBill = invoice.gstType === 'GST';
  const taxTotal = invoice.taxTotal || 0;
  const cgst = taxTotal / 2;
  const sgst = taxTotal / 2;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: printFormat === 'thermal' ? '450px' : '820px' }}>
        {/* Action Header - Excluded from Print */}
        <div className="modal-header no-print">
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} style={{ color: 'var(--success)' }} />
              <span>Invoice #{invoice.invoiceNumber} Created</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ready for printing & customer billing</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Format toggle */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '2px', borderRadius: 'var(--radius-md)', display: 'flex' }}>
              <button 
                onClick={() => setPrintFormat('a4')} 
                className={`btn btn-sm ${printFormat === 'a4' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              >
                A4 Standard
              </button>
              <button 
                onClick={() => setPrintFormat('thermal')} 
                className={`btn btn-sm ${printFormat === 'thermal' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              >
                80mm Thermal
              </button>
            </div>

            <button onClick={handleWindowPrint} className="btn btn-primary btn-sm">
              <Printer size={15} />
              <span>Print</span>
            </button>

            <button onClick={handleDownloadPDF} className="btn btn-secondary btn-sm">
              <Download size={15} />
              <span>PDF</span>
            </button>

            <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div 
          ref={invoiceRef}
          style={{
            background: '#ffffff',
            color: '#1e293b',
            padding: printFormat === 'thermal' ? '12px' : '28px',
            fontFamily: printFormat === 'thermal' ? 'Courier, monospace' : 'var(--font-sans)',
            fontSize: printFormat === 'thermal' ? '12px' : '13px',
            lineHeight: 1.4,
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 0 10px rgba(0,0,0,0.05)',
            border: '1px solid #cbd5e1'
          }}
        >
          {/* Header Store Details */}
          <div style={{ textAlign: printFormat === 'thermal' ? 'center' : 'left', borderBottom: '2px solid #0284c7', paddingBottom: '12px', marginBottom: '14px', display: printFormat === 'thermal' ? 'block' : 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: printFormat === 'thermal' ? '16px' : '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {settings.storeName}
              </h2>
              {settings.tagline && <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0' }}>{settings.tagline}</p>}
              <p style={{ fontSize: '11px', color: '#334155', margin: '2px 0' }}>{settings.address}</p>
              <p style={{ fontSize: '11px', color: '#334155', margin: '2px 0' }}>
                Phone: {settings.phone} | Email: {settings.email}
              </p>
              {isGstBill && settings.gstIn && (
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', margin: '2px 0' }}>
                  GSTIN: {settings.gstIn}
                </p>
              )}
            </div>

            <div style={{ textAlign: printFormat === 'thermal' ? 'center' : 'right', marginTop: printFormat === 'thermal' ? '8px' : 0 }}>
              <div style={{ display: 'inline-block', background: isGstBill ? '#0284c7' : '#475569', color: '#ffffff', padding: '3px 10px', borderRadius: '4px', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>
                {isGstBill ? 'TAX INVOICE' : 'RETAIL BILL'}
              </div>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>
                Invoice #: {invoice.invoiceNumber}
              </p>
              <p style={{ fontSize: '11px', color: '#475569', margin: '2px 0' }}>Date: {invoice.date}</p>
            </div>
          </div>

          {/* Customer & Payment Info Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
            <div>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>BILL TO</p>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '2px 0' }}>
                {invoice.customerName || 'Walk-in Customer'}
              </p>
              {invoice.customerGst && (
                <p style={{ fontSize: '11px', color: '#0369a1', fontWeight: 600 }}>Customer GSTIN: {invoice.customerGst}</p>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>PAYMENT DETAILS</p>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', margin: '2px 0' }}>
                Mode: {invoice.paymentMode} ({invoice.paymentStatus})
              </p>
              <p style={{ fontSize: '11px', color: '#64748b' }}>Billed by: {invoice.createdBy}</p>
            </div>
          </div>

          {/* Itemized Invoice Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: printFormat === 'thermal' ? '11px' : '12px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '6px', textAlign: 'left' }}>#</th>
                <th style={{ padding: '6px', textAlign: 'left' }}>Item Description</th>
                <th style={{ padding: '6px', textAlign: 'right' }}>Qty</th>
                <th style={{ padding: '6px', textAlign: 'right' }}>Rate (₹)</th>
                {isGstBill && <th style={{ padding: '6px', textAlign: 'right' }}>GST %</th>}
                <th style={{ padding: '6px', textAlign: 'right' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px' }}>{idx + 1}</td>
                  <td style={{ padding: '6px', fontWeight: 600 }}>
                    {item.name}
                    {item.sku && <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>SKU: {item.sku}</span>}
                  </td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>{item.qty}</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>₹{item.price}</td>
                  {isGstBill && <td style={{ padding: '6px', textAlign: 'right' }}>{item.gstRate || 18}%</td>}
                  <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700 }}>₹{item.total.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Invoice Totals Breakdown */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px solid #e2e8f0', paddingTop: '12px' }}>
            {/* UPI QR Code Box */}
            <div style={{ display: printFormat === 'thermal' ? 'none' : 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="UPI QR Code" style={{ width: '80px', height: '80px' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', background: '#e2e8f0' }} />
              )}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Smartphone size={14} />
                  <span>Scan & Pay via UPI</span>
                </p>
                <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0' }}>UPI ID: {settings.upiId}</p>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#16a34a' }}>Payable: ₹{invoice.total.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Calculations Table */}
            <div style={{ width: printFormat === 'thermal' ? '100%' : '260px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '11px', color: '#475569' }}>
                <span>Subtotal:</span>
                <span>₹{(invoice.subtotal || invoice.total).toLocaleString('en-IN')}</span>
              </div>

              {invoice.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '11px', color: '#dc2626' }}>
                  <span>Discount:</span>
                  <span>-₹{invoice.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {isGstBill && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '11px', color: '#475569' }}>
                    <span>CGST:</span>
                    <span>₹{cgst.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '11px', color: '#475569' }}>
                    <span>SGST:</span>
                    <span>₹{sgst.toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a', borderTop: '2px solid #0284c7', marginTop: '4px' }}>
                <span>Grand Total:</span>
                <span>₹{invoice.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms & Signature */}
          <div style={{ marginTop: '16px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', fontSize: '10px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontWeight: 700, color: '#334155', margin: '0 0 2px 0' }}>Terms & Conditions:</p>
              <p style={{ margin: 0, maxWidth: '350px' }}>{settings.terms}</p>
            </div>

            <div style={{ textAlign: 'center', minWidth: '130px' }}>
              <div style={{ height: '30px' }} />
              <p style={{ borderTop: '1px solid #94a3b8', paddingTop: '2px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
