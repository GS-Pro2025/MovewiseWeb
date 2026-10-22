import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Field, inputCls, ModalShell } from '../../pettyCash/ui/components/ModalShell';
import { registerExpense } from '../../pettyCash/data/RepositoryPettyCash';
import { isValidAmount } from '../../pettyCash/ui/format';
import { todayISO } from '../../pettyCash/domain/PettyCashModels';

interface Props {
  fundId: number;
  operatorId: number;
  operatorName: string;
  paymentId: number;
  /** Net pay left before this advance; used only for a non-blocking warning. */
  netAvailable: number;
  onClose: () => void;
  onDone: () => void;
}

export const PayrollAdvanceDialog: React.FC<Props> = ({ fundId, operatorId, operatorName, paymentId, netAvailable, onClose, onDone }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exceeds = isValidAmount(amount) && parseFloat(amount) > netAvailable;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await registerExpense(fundId, {
        amount: amount.trim(), category: 'payroll_advance', date,
        operator: operatorId, payment: paymentId,
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title={`${t('pettyCash.payroll.title')} · ${operatorName}`} onClose={onClose} onSubmit={submit}
      submitLabel={t('pettyCash.payroll.add')} submitting={busy} submitDisabled={!isValidAmount(amount)} error={error}>
      <Field label={t('pettyCash.fields.amount')} hint={t('pettyCash.payroll.amountHint')}>
        <input className={inputCls} inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
      </Field>
      {exceeds && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{t('pettyCash.payroll.exceeds')}</p>}
      <Field label={t('pettyCash.fields.date')}>
        <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} />
      </Field>
      <Field label={t('pettyCash.fields.description')}>
        <input className={inputCls} value={description} onChange={e => setDescription(e.target.value)} />
      </Field>
    </ModalShell>
  );
};
