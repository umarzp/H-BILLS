import {
  CASH_BOOK_CATEGORY_CLASSIFICATION
} from './cashBookAudit';

export const FINANCIAL_CLASSIFICATIONS = {
  REVENUE: 'Revenue',
  OPERATING_EXPENSE: 'Operating Expense',
  EQUITY: 'Owner Equity',
  LIABILITY: 'Liability',
  ASSET: 'Asset',
  UNCLASSIFIED: 'Unclassified',
  REVIEW_REQUIRED: 'Review Required'
};

export const classifyCashBookTransaction = (transaction) => {
  const category = String(transaction.category || '').trim();

  return (
    transaction.classification ||
    CASH_BOOK_CATEGORY_CLASSIFICATION[category] ||
    'REVIEW_REQUIRED'
  );
};

export const calculateManualCashBookSummary = (
  transactions = []
) => {
  const summary = {
    moneyIn: 0,
    moneyOut: 0,
    netCashMovement: 0,
    equityIn: 0,
    equityOut: 0,
    liabilityIn: 0,
    liabilityOut: 0,
    assetIn: 0,
    assetOut: 0,
    unclassifiedIn: 0,
    unclassifiedOut: 0,
    reviewRequired: 0,
    invalidRecords: 0
  };

  for (const transaction of transactions) {
    if (
      transaction.source !== 'manual_cashbook' &&
      transaction.source !== 'cashbook_reversal'
    ) {
      continue;
    }

    const amount = Number(transaction.amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !['IN', 'OUT'].includes(transaction.type)
    ) {
      summary.invalidRecords += 1;
      continue;
    }

    const classification =
      classifyCashBookTransaction(transaction);

    const direction = transaction.type;

    if (direction === 'IN') {
      summary.moneyIn += amount;
    } else {
      summary.moneyOut += amount;
    }

    if (classification === 'EQUITY') {
      if (direction === 'IN') {
        summary.equityIn += amount;
      } else {
        summary.equityOut += amount;
      }
    } else if (classification === 'LIABILITY') {
      if (direction === 'IN') {
        summary.liabilityIn += amount;
      } else {
        summary.liabilityOut += amount;
      }
    } else if (classification === 'ASSET') {
      if (direction === 'IN') {
        summary.assetIn += amount;
      } else {
        summary.assetOut += amount;
      }
    } else if (classification === 'UNCLASSIFIED') {
      if (direction === 'IN') {
        summary.unclassifiedIn += amount;
      } else {
        summary.unclassifiedOut += amount;
      }
    } else {
      summary.reviewRequired += 1;
    }
  }

  summary.netCashMovement =
    summary.moneyIn - summary.moneyOut;

  return summary;
};
