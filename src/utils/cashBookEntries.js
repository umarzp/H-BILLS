export const CASH_BOOK_CATEGORIES = {
  IN: [
    'Other Receipt',
    'Owner Capital Introduced',
    'Customer Advance',
    'Loan Received',
    'Refund Received'
  ],
  OUT: [
    'Other Payment',
    'Owner Drawings',
    'Supplier Advance',
    'Loan Repayment',
    'Refund Paid'
  ]
};

export const CASH_BOOK_ACCOUNTS = ['Cash', 'UPI', 'Bank'];

export const validateCashBookEntry = (entry) => {
  const errors = [];

  if (!['IN', 'OUT'].includes(entry.type)) {
    errors.push('Invalid transaction type.');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(entry.date || ''))) {
    errors.push('Select a valid transaction date.');
  }

  if (!CASH_BOOK_ACCOUNTS.includes(entry.mode)) {
    errors.push('Select Cash, UPI or Bank.');
  }

  if (!CASH_BOOK_CATEGORIES[entry.type]?.includes(entry.category)) {
    errors.push('Select a valid transaction category.');
  }

  const amount = Number(entry.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push('Amount must be greater than zero.');
  }

  if (!String(entry.particulars || '').trim()) {
    errors.push('Enter transaction particulars.');
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized: {
      type: entry.type,
      date: entry.date,
      mode: entry.mode,
      category: entry.category,
      amount,
      particulars: String(entry.particulars || '').trim(),
      reference: String(entry.reference || '').trim(),
      notes: String(entry.notes || '').trim()
    }
  };
};
