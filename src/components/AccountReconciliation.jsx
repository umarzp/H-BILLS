import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { reconcileAccounts } from "../utils/accountReconciliation";
import { OPENING_DATE } from "../utils/accountBalances";

const money = value =>
  "₹" + Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const panel = {
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-color)",
  borderRadius: 14,
  padding: 20
};

export const AccountReconciliation = () => {
  const { user, payments = [], settings = {} } = useApp();

  const today = new Date().toLocaleDateString("en-CA");
  const [asOfDate, setAsOfDate] = useState(
    today >= OPENING_DATE ? today : OPENING_DATE
  );

  const [actualBalances, setActualBalances] = useState({
    Cash: "",
    UPI: "",
    Bank: ""
  });

  const result = useMemo(
    () => reconcileAccounts({
      openingConfig: settings.financialOpeningBalances,
      payments,
      actualBalances,
      asOfDate
    }),
    [settings.financialOpeningBalances, payments, actualBalances, asOfDate]
  );

  if (user?.role !== "admin") {
    return (
      <section style={panel}>
        <h3>Admin access required</h3>
        <p>Account reconciliation is restricted to administrators.</p>
      </section>
    );
  }

  return (
    <section style={panel}>
      <h2>Account Reconciliation</h2>

      <p style={{ color: "var(--text-secondary)" }}>
        Compare recorded account movements with actual balances.
        This is a read-only preview. No adjustments are posted.
      </p>

      <label style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 20
      }}>
        Reconciliation date
        <input
          type="date"
          min={OPENING_DATE}
          max={today >= OPENING_DATE ? today : OPENING_DATE}
          value={asOfDate}
          onChange={event => setAsOfDate(event.target.value)}
        />
      </label>

      {!result.configured ? (
        <div style={{
          padding: 16,
          border: "1px solid var(--border-color)",
          borderRadius: 10
        }}>
          <strong>Opening balances not configured</strong>
          <p>{result.message}</p>
          <p>
            Opening balance saving remains locked pending
            Firebase security validation.
          </p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left"
            }}>
              <thead>
                <tr>
                  {[
                    "Account",
                    "Opening",
                    "Money In",
                    "Money Out",
                    "Expected",
                    "Actual Balance",
                    "Difference",
                    "Status"
                  ].map(label => (
                    <th key={label} style={{
                      padding: 10,
                      borderBottom: "1px solid var(--border-color)"
                    }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {result.rows.map(row => (
                  <tr key={row.account}>
                    <td style={{ padding: 10 }}>{row.account}</td>
                    <td style={{ padding: 10 }}>{money(row.opening)}</td>
                    <td style={{ padding: 10 }}>{money(row.received)}</td>
                    <td style={{ padding: 10 }}>{money(row.paid)}</td>
                    <td style={{ padding: 10 }}>
                      <strong>{money(row.expected)}</strong>
                    </td>
                    <td style={{ padding: 10 }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={actualBalances[row.account]}
                        placeholder="Enter actual"
                        aria-label={row.account + " actual balance"}
                        onChange={event =>
                          setActualBalances(previous => ({
                            ...previous,
                            [row.account]: event.target.value
                          }))
                        }
                        style={{ width: 130, padding: 8 }}
                      />
                    </td>
                    <td style={{ padding: 10 }}>
                      {row.difference === null
                        ? "—"
                        : money(row.difference)}
                    </td>
                    <td style={{ padding: 10 }}>
                      <strong style={{
                        color: row.status === "MATCHED"
                          ? "var(--success)"
                          : row.status === "DIFFERENCE"
                            ? "var(--danger)"
                            : "var(--text-secondary)"
                      }}>
                        {row.status}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: 18 }}>
            {result.ready
              ? result.rows.every(row => row.status === "MATCHED")
                ? "All accounts match for the selected date."
                : "Differences detected. Review payment records and statements."
              : "Enter actual balances for all accounts to complete the preview."}
          </p>
        </>
      )}

      <p style={{
        marginTop: 20,
        color: "var(--text-secondary)",
        fontSize: 13
      }}>
        Preview only. Actual balances are held in this screen
        temporarily and are not saved to Firebase.
        UPI settlement timing and bank transfers require
        separate verification before final sign-off.
      </p>
    </section>
  );
};
