export const OPENING_DATE = '2026-10-26';

export const ACCOUNT_NAMES = ['Cash', 'UPI', 'Bank'];

export const normalizeAccount = (mode) => {
  const value = String(mode || '').trim().toLowerCase();

  if (/upi|gpay|google pay|phonepe|paytm/.test(value)) {
    return 'UPI';
  }

  if (/bank|neft|imps|rtgs|transfer/.test(value)) {
    return 'Bank';
  }

  if (value === 'cash') return 'Cash';

  return 'Other';
};

export const calculateAccountBalances = ({
  openingBalances = {},
  payments = [],
  asOfDate = new Date().toLocaleDateString('en-CA'),
  openingDate = OPENING_DATE
} = {}) => {
  const result = {};

  for (const account of ACCOUNT_NAMES) {
    const opening = Number(openingBalances[account] || 0);

    result[account] = {
      opening,
      received: 0,
      paid: 0,
      closing: opening
    };
  }

  for (const payment of payments) {
    const date = String(payment.date || '').slice(0, 10);
    const account = normalizeAccount(payment.mode);
    const amount = Number(payment.amount);
    const status = String(payment.status || "").trim().toUpperCase();

    // Legacy payments may not have a status field.
    // Explicitly non-posted transactions must not affect balances.
    if (status && status !== "POSTED") continue;

    if (
      date < openingDate ||
      date > asOfDate ||
      !ACCOUNT_NAMES.includes(account) ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      continue;
    }

    if (payment.type === 'IN') {
      result[account].received += amount;
      result[account].closing += amount;
    } else if (payment.type === 'OUT') {
      result[account].paid += amount;
      result[account].closing -= amount;
    }
  }

  result.Total = ACCOUNT_NAMES.reduce(
    (total, account) => ({
      opening: total.opening + result[account].opening,
      received: total.received + result[account].received,
      paid: total.paid + result[account].paid,
      closing: total.closing + result[account].closing
    }),
    { opening: 0, received: 0, paid: 0, closing: 0 }
  );

  return result;
};
