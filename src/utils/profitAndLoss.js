const finiteNumber = value => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const dateKey = value =>
  typeof value === 'string' ? value.slice(0, 10) : '';

const inPeriod = (date, startDate, endDate) =>
  date >= startDate && date <= endDate;

export const calculateProfitAndLoss = ({
  invoices = [],
  products = [],
  expenses = [],
  startDate = '0000-01-01',
  endDate = '9999-12-31'
} = {}) => {
  const productMap = new Map(
    products.map(product => [product.id, product])
  );

  let revenue = 0;
  let gst = 0;
  let recordedCOGS = 0;
  let operatingExpenses = 0;
  let missingCostLines = 0;
  let invalidRecords = 0;
  let invoiceCount = 0;

  const warnings = [];

  for (const invoice of invoices) {
    const date = dateKey(invoice.date);

    if (!inPeriod(date, startDate, endDate)) continue;

    if (
      ['CANCELLED', 'VOID'].includes(
        String(invoice.status || '').toUpperCase()
      )
    ) continue;

    const total = finiteNumber(invoice.total);
    const tax = finiteNumber(invoice.taxTotal) ?? 0;

    if (total === null || total < 0 || tax < 0 || tax > total) {
      invalidRecords++;
      continue;
    }

    revenue += total - tax;
    gst += tax;
    invoiceCount++;

    if (!Array.isArray(invoice.items) || invoice.items.length === 0) {
      invalidRecords++;
      warnings.push(
        'An invoice has missing or empty item details.'
      );
      continue;
    }

    for (const item of invoice.items) {
      const qty = finiteNumber(item.qty);

      if (qty === null || qty <= 0) {
        invalidRecords++;
        continue;
      }

      // Service revenue has no tracked product inventory cost.
      // Labour and other service expenses are handled separately.
      if (item.itemType === 'SERVICE') {
        warnings.push(
          'Service costs are not fully tracked; profit is provisional.'
        );
        continue;
      }

      // Prefer historical invoice cost when explicitly recorded.
      // Current product cost is only a provisional fallback.
      const snapshotCost = finiteNumber(item.costPrice);
      const currentCost = finiteNumber(
        productMap.get(item.productId)?.costPrice
      );

      const cost = snapshotCost ?? currentCost;

      if (cost === null || cost < 0) {
        missingCostLines++;
        continue;
      }

      if (snapshotCost === null) {
        warnings.push(
          'Current product cost used for an older invoice item.'
        );
      }

      recordedCOGS += cost * qty;
    }
  }

  for (const expense of expenses) {
    const date = dateKey(expense.date);

    if (!inPeriod(date, startDate, endDate)) continue;

    const amount = finiteNumber(expense.amount);

    if (amount === null || amount <= 0) {
      invalidRecords++;
      continue;
    }

    operatingExpenses += amount;
  }

  const grossProfit = revenue - recordedCOGS;
  const provisionalNetProfit =
    grossProfit - operatingExpenses;

  const reliable =
    missingCostLines === 0 &&
    invalidRecords === 0 &&
    warnings.length === 0;

  return {
    revenue,
    gst,
    recordedCOGS,
    operatingExpenses,
    grossProfit: reliable ? grossProfit : null,
    netProfit: reliable ? provisionalNetProfit : null,
    provisionalNetProfit,
    invoiceCount,
    missingCostLines,
    invalidRecords,
    reliable,
    warnings: [...new Set(warnings)]
  };
};
