import { validateCashBookEntry } from './cashBookEntries';

export const CASH_BOOK_CATEGORY_CLASSIFICATION = {
  'Other Receipt': 'UNCLASSIFIED',
  'Owner Capital Introduced': 'EQUITY',
  'Customer Advance': 'LIABILITY',
  'Loan Received': 'LIABILITY',
  'Refund Received': 'REVIEW_REQUIRED',
  'Other Payment': 'UNCLASSIFIED',
  'Owner Drawings': 'EQUITY',
  'Supplier Advance': 'ASSET',
  'Loan Repayment': 'LIABILITY',
  'Refund Paid': 'REVIEW_REQUIRED'
};

export const createCashBookRecord = (entry, user) => {
  const result = validateCashBookEntry(entry);

  if (!result.valid) {
    throw new Error(result.errors.join(' '));
  }

  if (!user?.uid) {
    throw new Error('Authenticated user ID is required.');
  }

  if (typeof crypto === 'undefined' || !crypto.randomUUID) {
    throw new Error('Secure transaction ID generation is unavailable.');
  }

  const classification =
    CASH_BOOK_CATEGORY_CLASSIFICATION[result.normalized.category];

  if (!classification) {
    throw new Error('Unsupported transaction category.');
  }

  return {
    id: `CB-${crypto.randomUUID()}`,
    ...result.normalized,
    entityName: result.normalized.particulars,
    classification,
    source: 'manual_cashbook',
    status: 'POSTED',
    createdByUid: user.uid,
    createdByName: user.name || '',
    createdAt: new Date().toISOString(),
    reversalOf: null
  };
};

export const createReversalRecord = (
  original,
  user,
  reason,
  existingTransactions
) => {
  if (!Array.isArray(existingTransactions)) {
    throw new Error(
      "Current transaction history is required before reversal."
    );
  }

  if (original?.reversalOf || original?.source === "cashbook_reversal") {
    throw new Error("A reversal transaction cannot be reversed.");
  }

  if (original?.source !== "manual_cashbook") {
    throw new Error(
      "Only manual Cash Book transactions can be reversed."
    );
  }

  const alreadyReversed = existingTransactions.some(
    transaction =>
      transaction.reversalOf === original?.id &&
      transaction.status === "POSTED"
  );

  if (alreadyReversed) {
    throw new Error(
      "This transaction has already been reversed."
    );
  }

  if (!original?.id || original.status !== 'POSTED') {
    throw new Error('Only posted transactions can be reversed.');
  }

  if (!['IN', 'OUT'].includes(original.type)) {
    throw new Error('Invalid original transaction type.');
  }

  if (!user?.uid) {
    throw new Error('Authenticated user ID is required.');
  }

  if (!String(reason || '').trim()) {
    throw new Error('Reversal reason is required.');
  }

  if (typeof crypto === 'undefined' || !crypto.randomUUID) {
    throw new Error('Secure transaction ID generation is unavailable.');
  }

  return {
    id: `REV-${crypto.randomUUID()}`,
    date: new Date().toLocaleDateString('en-CA'),
    type: original.type === 'IN' ? 'OUT' : 'IN',
    mode: original.mode,
    category: original.category,
    amount: original.amount,
    entityName: `Reversal: ${original.entityName || original.id}`,
    reference: original.id,
    classification: original.classification,
    source: 'cashbook_reversal',
    status: 'POSTED',
    reversalOf: original.id,
    reversalReason: String(reason).trim(),
    createdByUid: user.uid,
    createdByName: user.name || '',
    createdAt: new Date().toISOString()
  };
};
