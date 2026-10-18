
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Receipt,
  IndianRupee,
  ShoppingBag,
  CreditCard,
  Package
} from 'lucide-react';
import { formatDate } from '../utils/formatDate';
import { InvoicePrintModal } from './InvoicePrintModal';

const money = (value) =>
  `₹${(Number(value) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const panel = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '14px',
  padding: '1.25rem'
};

export const SalesHistory = () => {
  const { invoices = [] } = useApp();

  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState(null);
  const [printInvoice, setPrintInvoice] = useState(null);
  const [showMore, setShowMore] = useState(false);

  const sortedInvoices = useMemo(
    () =>
      [...invoices].sort(
        (a, b) =>
          String(b.date || '').localeCompare(String(a.date || '')) ||
          String(b.id || '').localeCompare(String(a.id || ''))
      ),
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sortedInvoices.filter((invoice) => {
      const matchesPayment =
        paymentFilter === 'ALL' ||
        String(invoice.paymentMode || '').toUpperCase() === paymentFilter ||
        String(invoice.paymentStatus || '').toUpperCase() === paymentFilter;

      const searchable = [
        invoice.invoiceNumber,
        invoice.customerName,
        invoice.customerId,
        ...(invoice.items || []).flatMap((item) => [
          item.name,
          item.sku
        ])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesPayment && (!query || searchable.includes(query));
    });
  }, [sortedInvoices, search, paymentFilter]);

  const selectedInvoice =
    filteredInvoices.find((invoice) => invoice.id === selectedId) ||
    filteredInvoices[0] ||
    null;

  const totalSales = filteredInvoices.reduce(
    (sum, invoice) => sum + (Number(invoice.total) || 0),
    0
  );

  const totalItems = filteredInvoices.reduce(
    (sum, invoice) =>
      sum +
      (invoice.items || []).reduce(
        (itemSum, item) => itemSum + (Number(item.qty) || 0),
        0
      ),
    0
  );

  const totalReceived = filteredInvoices.reduce(
    (sum, invoice) => sum + (Number(invoice.amountPaid) || 0),
    0
  );

  const field = (label, value) => (
    <div>
      <div
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          marginBottom: 5
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontWeight: 650,
          color: 'var(--text-primary)'
        }}
      >
        {value || 'Not recorded'}
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: 'grid',
        gap: '1.25rem',
        color: 'var(--text-primary)'
      }}
    >
      <div>
        <h1
          style={{
            fontSize: '1.7rem',
            fontWeight: 800,
            margin: 0
          }}
        >
          Sales History
        </h1>

        <p
          style={{
            color: 'var(--text-secondary)',
            marginTop: 6
          }}
        >
          Explore invoices, purchased products and payment details.
        </p>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem'
        }}
      >
        {[
          {
            label: 'Total Sales',
            value: money(totalSales),
            icon: IndianRupee
          },
          {
            label: 'Invoices',
            value: filteredInvoices.length,
            icon: Receipt
          },
          {
            label: 'Items Sold',
            value: totalItems,
            icon: ShoppingBag
          },
          {
            label: 'Amount Received',
            value: money(totalReceived),
            icon: CreditCard
          }
        ].map((metric) => {
          const Icon = metric.icon;

          return (
            <div key={metric.label} style={panel}>
              <Icon
                size={20}
                style={{
                  color: 'var(--accent-primary, #3b82f6)'
                }}
              />

              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  margin: '10px 0 5px'
                }}
              >
                {metric.label}
              </p>

              <strong style={{ fontSize: '1.45rem' }}>
                {metric.value}
              </strong>
            </div>
          );
        })}
      </div>

      {/* Sales List and Invoice Details */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: '1rem',
          alignItems: 'start'
        }}
      >
        {/* Left Panel */}
        <section style={panel}>
          <h2
            style={{
              fontSize: '1.05rem',
              marginTop: 0
            }}
          >
            All Sales ({filteredInvoices.length})
          </h2>

          <div
            style={{
              position: 'relative',
              marginBottom: '1rem'
            }}
          >
            <Search
              size={17}
              style={{
                position: 'absolute',
                left: 12,
                top: 13,
                color: 'var(--text-muted)'
              }}
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Invoice, customer, product or SKU"
              aria-label="Search sales"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 9
              }}
            />
          </div>

          {/* Filters */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              marginBottom: '1rem'
            }}
          >
            {[
              'ALL',
              'UPI',
              'CASH',
              'CREDIT',
              'UNPAID',
              'PARTIAL'
            ].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setPaymentFilter(filter)}
                className={`btn btn-sm ${
                  paymentFilter === filter
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                {filter === 'ALL' ? 'All Sales' : filter}
              </button>
            ))}
          </div>

          {/* Invoice List */}
          <div
            style={{
              display: 'grid',
              gap: 8,
              maxHeight: 650,
              overflowY: 'auto'
            }}
          >
            {filteredInvoices.map((invoice) => {
              const selected =
                selectedInvoice?.id === invoice.id;

              const itemCount = (invoice.items || []).reduce(
                (sum, item) => sum + (Number(item.qty) || 0),
                0
              );

              return (
                <button
                  key={invoice.id}
                  type="button"
                  onClick={() => setSelectedId(invoice.id)}
                  style={{
                    textAlign: 'left',
                    padding: '1rem',
                    cursor: 'pointer',
                    borderRadius: 10,
                    border: selected
                      ? '1px solid #3b82f6'
                      : '1px solid var(--border-color)',
                    background: selected
                      ? 'var(--bg-tertiary)'
                      : 'transparent',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10
                    }}
                  >
                    <strong>
                      {invoice.invoiceNumber}
                    </strong>

                    <strong>
                      {money(invoice.total)}
                    </strong>
                  </div>

                  <p
                    style={{
                      margin: '7px 0',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {invoice.customerName || 'Walk-in Customer'}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 10,
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <span>
                      {formatDate(invoice.date)}
                    </span>

                    <span>
                      {itemCount} items
                    </span>

                    <span>
                      {invoice.paymentMode || 'Unknown mode'}
                    </span>

                    <span>
                      {invoice.paymentStatus || 'Unknown status'}
                    </span>
                  </div>
                </button>
              );
            })}

            {!filteredInvoices.length && (
              <p style={{ color: 'var(--text-secondary)' }}>
                No invoices match your search or filter.
              </p>
            )}
          </div>
        </section>

        {/* Right Panel */}
        <section style={panel}>
          {!selectedInvoice ? (
            <p style={{ color: 'var(--text-secondary)' }}>
              Select an invoice to view its details.
            </p>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '1rem'
                }}
              >
                <div>
                  <p
                    style={{
                      margin: '0 0 6px',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem'
                    }}
                  >
                    INVOICE DETAILS
                  </p>

                  <h2 style={{ margin: 0 }}>
                    {selectedInvoice.invoiceNumber}
                  </h2>
                  <div
  style={{
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '14px'
  }}
>
  <button
    type="button"
    className="btn btn-primary btn-sm"
    onClick={() => setPrintInvoice(selectedInvoice)}
  >
    Print
  </button>

  <button
    type="button"
    className="btn btn-secondary btn-sm"
    onClick={() => setPrintInvoice(selectedInvoice)}
  >
    Download PDF
  </button>

  <button
    type="button"
    className="btn btn-secondary btn-sm"
    onClick={() => setShowMore(!showMore)}
  >
    More ⋮
  </button>
</div>

{showMore && (
  <div
    style={{
      marginTop: '10px',
      padding: '12px',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      background: 'var(--bg-tertiary)'
    }}
  >
    <p style={{ margin: 0, fontSize: '0.85rem' }}>
      Additional invoice actions coming soon.
    </p>
  </div>
)}

                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      marginBottom: 0
                    }}
                  >
                    {formatDate(selectedInvoice.date)}
                  </p>
                </div>

                <strong style={{ color: 'var(--success)' }}>
                  {selectedInvoice.paymentStatus || 'Unknown status'}
                </strong>
              </div>

              {/* Customer and Payment Information */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '1rem',
                  padding: '1.25rem 0'
                }}
              >
                {field(
                  'Customer',
                  selectedInvoice.customerName
                )}

                {field(
                  'Invoice Type',
                  selectedInvoice.gstType === 'GST'
                    ? 'Tax Invoice'
                    : 'Retail Bill'
                )}

                {field(
                  'Payment Mode',
                  selectedInvoice.paymentMode
                )}

                {field(
                  'Billed By',
                  selectedInvoice.createdBy
                )}
              </div>

              <h3 style={{ fontSize: '1rem' }}>
                <Package
                  size={17}
                  style={{
                    verticalAlign: 'middle',
                    marginRight: 8
                  }}
                />
                Purchased Products
              </h3>

              {/* Product Table */}
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.85rem'
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom:
                          '1px solid var(--border-color)'
                      }}
                    >
                      {[
                        'Product',
                        'Qty',
                        'Rate',
                        'Discount',
                        'Total'
                      ].map((header) => (
                        <th
                          key={header}
                          style={{
                            textAlign:
                              header === 'Product'
                                ? 'left'
                                : 'right',
                            padding: '10px 6px'
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {(selectedInvoice.items || []).map(
                      (item, index) => (
                        <tr
                          key={`${item.productId || 'item'}-${index}`}
                          style={{
                            borderBottom:
                              '1px solid var(--border-color)'
                          }}
                        >
                          <td style={{ padding: '12px 6px' }}>
                            <strong>
                              {item.name || 'Unnamed product'}
                            </strong>

                            {item.sku && (
                              <div
                                style={{
                                  fontSize: '0.72rem',
                                  color: 'var(--text-muted)'
                                }}
                              >
                                SKU: {item.sku}
                              </div>
                            )}
                          </td>

                          <td
                            style={{
                              textAlign: 'right',
                              padding: '12px 6px'
                            }}
                          >
                            {item.qty}
                          </td>

                          <td
                            style={{
                              textAlign: 'right',
                              padding: '12px 6px'
                            }}
                          >
                            {money(item.price)}
                          </td>

                          <td
                            style={{
                              textAlign: 'right',
                              padding: '12px 6px'
                            }}
                          >
                            {money(item.discount)}
                          </td>

                          <td
                            style={{
                              textAlign: 'right',
                              padding: '12px 6px'
                            }}
                          >
                            {money(item.total)}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Invoice Totals */}
              <div
                style={{
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'grid',
                  gap: 10
                }}
              >
                {[
                  ['Subtotal', selectedInvoice.subtotal],
                  ['Total Discount', selectedInvoice.discount],
                  ['GST', selectedInvoice.taxTotal],
                  ['Grand Total', selectedInvoice.total],
                  ['Amount Paid', selectedInvoice.amountPaid],
                  ['Balance Due', selectedInvoice.balanceDue]
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight:
                        label === 'Grand Total' ? 800 : 500,
                      fontSize:
                        label === 'Grand Total'
                          ? '1.15rem'
                          : '0.9rem'
                    }}
                  >
                    <span>{label}</span>
                    <span>{money(value)}</span>
                  </div>
                ))}
                            </div>
            </>
          )}
        </section>
      </div>

      {/* Existing Invoice Print / PDF Modal */}
      {printInvoice && (
        <InvoicePrintModal
          invoice={printInvoice}
          onClose={() => setPrintInvoice(null)}
        />
      )}

    </div>
  );
};