import {
  ACCOUNT_NAMES,
  OPENING_DATE,
  calculateAccountBalances
} from "./accountBalances";

export const reconcileAccounts = ({
  openingConfig,
  payments = [],
  actualBalances = {},
  asOfDate = OPENING_DATE
} = {}) => {
  const configured =
    openingConfig?.effectiveDate === OPENING_DATE &&
    ACCOUNT_NAMES.every(account =>
      typeof openingConfig?.balances?.[account] === "number" &&
      Number.isFinite(openingConfig.balances[account])
    );

  if (!configured) {
    return {
      configured: false,
      ready: false,
      rows: [],
      message: "Opening balances must be configured before reconciliation."
    };
  }

  const calculated = calculateAccountBalances({
    openingBalances: openingConfig.balances,
    payments,
    asOfDate,
    openingDate: OPENING_DATE
  });

  const rows = ACCOUNT_NAMES.map(account => {
    const expected = calculated[account].closing;
    const raw = actualBalances[account];

    const hasActual =
      raw !== undefined &&
      raw !== null &&
      String(raw).trim() !== "";

    const actual = hasActual ? Number(raw) : null;

    const validActual =
      hasActual &&
      Number.isFinite(actual) &&
      actual >= 0;

    const difference = validActual
      ? Math.round((actual - expected) * 100) / 100
      : null;

    return {
      account,
      opening: calculated[account].opening,
      received: calculated[account].received,
      paid: calculated[account].paid,
      expected,
      actual: validActual ? actual : null,
      difference,
      status: !validActual
        ? "PENDING"
        : Math.abs(difference) < 0.005
          ? "MATCHED"
          : "DIFFERENCE"
    };
  });

  return {
    configured: true,
    ready: rows.every(row => row.status !== "PENDING"),
    rows,
    message: "Preview only. No adjustments or Firebase writes."
  };
};
