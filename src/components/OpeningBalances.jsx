import React, { useEffect, useState } from 'react';
import { Wallet, Smartphone, Landmark, LockKeyhole } from 'lucide-react';
import { useApp } from '../context/AppContext';

const OPENING_DATE = '2026-10-26';

const accounts = [
  { id: 'Cash', label: 'Cash in Hand', Icon: Wallet },
  { id: 'UPI', label: 'UPI Settlement Balance', Icon: Smartphone },
  { id: 'Bank', label: 'Bank Account Balance', Icon: Landmark }
];

export const OpeningBalances = () => {
  const { user, settings = {}, saveOpeningBalances } = useApp();

  const [balances, setBalances] = useState({
    Cash: '',
    UPI: '',
    Bank: ''
  });

  const [saving, setSaving] = useState(false);

  const savedConfig = settings?.financialOpeningBalances;
  const isConfigured =
    savedConfig?.effectiveDate === OPENING_DATE &&
    ['Cash', 'UPI', 'Bank'].every(
      account => typeof savedConfig?.balances?.[account] === 'number'
    );

  useEffect(() => {
    if (!isConfigured) return;

    setBalances({
      Cash: String(savedConfig.balances.Cash),
      UPI: String(savedConfig.balances.UPI),
      Bank: String(savedConfig.balances.Bank)
    });
  }, [
    isConfigured,
    savedConfig?.balances?.Cash,
    savedConfig?.balances?.UPI,
    savedConfig?.balances?.Bank
  ]);

  const handleSave = async () => {
    if (saving || isConfigured || savedConfig != null || user?.role !== 'admin') return;

    const parsed = {};

    for (const account of ['Cash', 'UPI', 'Bank']) {
      const value = balances[account];

      if (value === '' || !Number.isFinite(Number(value))) {
        alert('Enter a valid opening balance for ' + account);
        return;
      }

      parsed[account] = Number(value);
    }

    if (!window.confirm(
      'Save opening balances for 26 October 2026?'
    )) return;

    setSaving(true);

    try {
      const success = await saveOpeningBalances(parsed);

      if (success) {
        alert('Opening balances saved successfully.');
      }
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  if (!isAdmin && !isStaff) {
    return (
      <div style={{ padding: 24 }}>
        <LockKeyhole size={28} />
        <h2>Access denied</h2>
        <p>Sign in with an authorized account.</p>
      </div>
    );
  }

  const update = (account, value) => {
    if (value !== '' && !/^\d*(\.\d{0,2})?$/.test(value)) {
      return;
    }

    setBalances(prev => ({
      ...prev,
      [account]: value
    }));
  };

  const total = Object.values(balances).reduce(
    (sum, amount) => sum + (Number(amount) || 0),
    0
  );

  return (
    <div style={{
      padding: 24,
      maxWidth: 820,
      color: 'var(--text-primary)'
    }}>
      <h1>Opening Balance Management</h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Configure the starting balances for H-BILLS accounts.
      </p>

      <div style={{
        padding: 18,
        margin: '20px 0',
        borderRadius: 12,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)'
      }}>
        <strong>Opening Date: 26 October 2026</strong>
        <p style={{ marginBottom: 0 }}>
          These are starting account balances, not sales income
          or business profit.
        </p>
      </div>

      {accounts.map(({ id, label, Icon }) => (
        <div key={id} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          padding: 18,
          marginBottom: 12,
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <Icon size={22} />
            <strong>{label}</strong>
          </div>

          <input
            type="text"
            inputMode="decimal"
            aria-label={label}
            placeholder="0.00"
            value={isAdmin ? balances[id] : (
              isConfigured ? String(savedConfig.balances[id]) : ''
            )}
            readOnly={!isAdmin || isConfigured || savedConfig != null || saving}
            onChange={event => {
              if (isAdmin && !isConfigured && savedConfig == null && !saving) update(id, event.target.value);
            }}
            style={{
              width: 160,
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--border-color)'
            }}
          />
        </div>
      ))}

      <div style={{
        padding: 20,
        marginTop: 20,
        borderRadius: 12,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)'
      }}>
        <p>Total Opening Balance</p>
        <h2>
          ₹{total.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </h2>
      </div>

      <div style={{ marginTop: 18 }}>
        {isAdmin && <button
          type="button"
          disabled={saving || isConfigured || savedConfig != null}
          onClick={handleSave}
          style={{
            padding: '12px 20px',
            borderRadius: 8,
            opacity: saving || isConfigured || savedConfig != null ? 0.55 : 1,
            cursor: saving || isConfigured || savedConfig != null ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Save Opening Balances'}
        </button>}

        <p style={{
          color: 'var(--text-secondary)',
          marginTop: 12
        }}>
          {savedConfig != null
            ? 'Opening balances are saved and locked against accidental changes.'
            : 'Admin can configure opening balances once. Please verify all three amounts before saving.'}
        </p>
      </div>
    </div>
  );
};

export default OpeningBalances;
