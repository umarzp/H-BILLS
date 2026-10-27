const validCost = value => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) return null;

  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : null;
};

export const prepareInvoiceCostSnapshots = (
  items = [],
  productSnapshots = []
) => {
  const productMap = new Map(
    productSnapshots.map(entry => [
      entry.item.productId,
      entry.snap.data()
    ])
  );

  const warnings = [];

  const enrichedItems = items.map(item => {
    if (item.itemType === 'SERVICE') {
      return {
        ...item,
        costPrice: null,
        costSource: 'SERVICE_NOT_TRACKED'
      };
    }

    const product = productMap.get(item.productId);

    if (!product) {
      throw new Error(
        `Missing product snapshot: ${item.productId}`
      );
    }

    const costPrice = validCost(product.costPrice);

    if (costPrice === null) {
      warnings.push(
        `Missing valid cost price for ${item.name || item.productId}`
      );
    }

    return {
      ...item,
      costPrice,
      costSource: costPrice === null
        ? 'MISSING'
        : 'PRODUCT_SNAPSHOT'
    };
  });

  return {
    items: enrichedItems,
    warnings,
    hasMissingCosts: warnings.length > 0
  };
};
