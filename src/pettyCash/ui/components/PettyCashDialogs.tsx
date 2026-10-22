import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Field, inputCls, ModalShell } from './ModalShell';
import { OperatorSelect } from './OperatorSelect';
import { OrderSearchSelect } from './OrderSearchSelect';
import { ReceiptUpload } from './ReceiptUpload';
import {
  adjustFund, depositToFund, openFund, registerExpense, returnSurplus,
  reverseTransaction, transferToOperator,
} from '../../data/RepositoryPettyCash';
import { EXPENSE_CATEGORIES, PettyCashFund, TxCategory, todayISO } from '../../domain/PettyCashModels';
import { isValidAmount } from '../format';
import { fetchOperators } from '../../../operators/data/RepositoryOperators';
import { Operator } from '../../../operators/domain/OperatorsModels';
import { fetchTrucks, Truck } from '../../../Truck/data/repositoryTrucks';
import { getCompanyUsers } from '../../../adminPanel/data/RepositoryAdmin';
import { AdminUser } from '../../../adminPanel/domain/AdminDomain';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

const useOperators = () => {
  const [ops, setOps] = useState<Operator[]>([]);
  useEffect(() => { fetchOperators().then(r => setOps(r.results)).catch(() => setOps([])); }, []);
  return ops;
};

interface BaseProps { onClose: () => void; onDone: () => void; }

/* ───────────── Open fund ───────────── */
type HolderKind = 'self' | 'operator' | 'admin';

export const OpenFundDialog: React.FC<BaseProps & { isSuper: boolean; currentPersonId: number | null; onOpened: (f: PettyCashFund, created: boolean) => void }> =
  ({ onClose, onDone, isSuper, currentPersonId, onOpened }) => {
    const { t } = useTranslation();
    const operators = useOperators();
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [kind, setKind] = useState<HolderKind>(isSuper ? 'self' : 'operator');
    const [operatorId, setOperatorId] = useState('');
    const [adminId, setAdminId] = useState('');
    const [initial, setInitial] = useState('');
    const [day, setDay] = useState('');
    const [description, setDescription] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (isSuper) getCompanyUsers().then(r => setAdmins(r.data.filter(a => a.is_active_user && a.person_id !== currentPersonId))).catch(() => setAdmins([]));
    }, [isSuper, currentPersonId]);

    const needsTarget = kind === 'operator' ? !operatorId : kind === 'admin' ? !adminId : false;
    const badInitial = initial !== '' && !isValidAmount(initial);

    const submit = async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true); setError(null);
      try {
        const res = await openFund({
          ...(kind === 'operator' ? { holder_operator: Number(operatorId) } : {}),
          ...(kind === 'admin' ? { holder_user: Number(adminId) } : {}),
          ...(day ? { day } : {}),
          ...(kind !== 'self' && initial ? { initial_amount: initial } : {}),
          ...(description ? { description } : {}),
        });
        // The API rejects initial_amount on your own fund, so the amount goes in as a deposit.
        if (kind === 'self' && initial && res.created) {
          try {
            await depositToFund(res.fund.id_fund, { amount: initial.trim(), ...(description ? { description } : {}) });
          } catch (depErr) {
            onOpened(res.fund, res.created);
            setError(t('pettyCash.open.depositFailed', { error: errMsg(depErr) }));
            return;
          }
        }
        onOpened(res.fund, res.created);
        onDone();
      } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
    };

    return (
      <ModalShell title={t('pettyCash.open.title')} onClose={onClose} onSubmit={submit}
        submitLabel={t('pettyCash.open.submit')} submitting={busy} submitDisabled={needsTarget || badInitial} error={error}>
        <Field label={t('pettyCash.open.holder')}>
          <select className={inputCls} value={kind} onChange={e => setKind(e.target.value as HolderKind)}>
            {isSuper && <option value="self">{t('pettyCash.open.self')}</option>}
            <option value="operator">{t('pettyCash.open.operator')}</option>
            {isSuper && <option value="admin">{t('pettyCash.open.admin')}</option>}
          </select>
        </Field>
        {kind === 'operator' && (
          <Field label={t('pettyCash.fields.operator')}>
            <OperatorSelect operators={operators} value={operatorId} onChange={setOperatorId} />
          </Field>
        )}
        {kind === 'admin' && (
          <Field label={t('pettyCash.open.admin')}>
            <select className={inputCls} value={adminId} onChange={e => setAdminId(e.target.value)}>
              <option value="">—</option>
              {admins.map(a => <option key={a.person_id} value={a.person_id}>{a.person.first_name} {a.person.last_name}</option>)}
            </select>
          </Field>
        )}
        {(
          <Field label={t('pettyCash.open.initial')}
            hint={kind === 'self' ? t('pettyCash.open.initialSelfHint') : kind === 'operator' ? t('pettyCash.open.initialOperatorHint') : t('pettyCash.open.initialAdminHint')}>
            <input className={inputCls} inputMode="decimal" placeholder="0.00" value={initial} onChange={e => setInitial(e.target.value)} />
          </Field>
        )}
        <Field label={t('pettyCash.open.day')} hint={t('pettyCash.open.dayHint')}>
          <input type="date" className={inputCls} value={day} onChange={e => setDay(e.target.value)} />
        </Field>
        <Field label={t('pettyCash.fields.description')}>
          <input className={inputCls} value={description} onChange={e => setDescription(e.target.value)} />
        </Field>
      </ModalShell>
    );
  };

/* ───────────── Deposit / Return / Adjust ───────────── */
export const AmountDialog: React.FC<BaseProps & { fund: PettyCashFund; mode: 'deposit' | 'return' | 'adjust' }> =
  ({ onClose, onDone, fund, mode }) => {
    const { t } = useTranslation();
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(todayISO());
    const [description, setDescription] = useState('');
    const [direction, setDirection] = useState<'in' | 'out'>('in');
    const [toUser, setToUser] = useState('');
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (mode === 'return') getCompanyUsers().then(r => setAdmins(r.data.filter(a => a.is_active_user && a.person_id !== fund.holder_user))).catch(() => setAdmins([]));
    }, [mode, fund.holder_user]);

    const invalid = !isValidAmount(amount) || (mode === 'adjust' && !description.trim());

    const submit = async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true); setError(null);
      try {
        const base = { amount: amount.trim(), ...(description.trim() ? { description: description.trim() } : {}) };
        if (mode === 'deposit') await depositToFund(fund.id_fund, { ...base, date });
        else if (mode === 'return') await returnSurplus(fund.id_fund, { ...base, date, ...(toUser ? { to_user: Number(toUser) } : {}) });
        else await adjustFund(fund.id_fund, { amount: amount.trim(), direction, description: description.trim() });
        onDone();
      } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
    };

    return (
      <ModalShell title={t(`pettyCash.actions.${mode}`)} onClose={onClose} onSubmit={submit}
        submitLabel={t('pettyCash.common.confirm')} submitting={busy} submitDisabled={invalid} error={error}>
        <Field label={t('pettyCash.fields.amount')}>
          <input className={inputCls} inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
        </Field>
        {mode === 'adjust' && (
          <Field label={t('pettyCash.fields.direction')}>
            <select className={inputCls} value={direction} onChange={e => setDirection(e.target.value as 'in' | 'out')}>
              <option value="in">{t('pettyCash.direction.in')}</option>
              <option value="out">{t('pettyCash.direction.out')}</option>
            </select>
          </Field>
        )}
        {mode !== 'adjust' && (
          <Field label={t('pettyCash.fields.date')}>
            <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} />
          </Field>
        )}
        {mode === 'return' && (
          <Field label={t('pettyCash.return.to')} hint={fund.holder_type === 'user' ? t('pettyCash.return.adminHint') : t('pettyCash.return.operatorHint')}>
            <select className={inputCls} value={toUser} onChange={e => setToUser(e.target.value)}>
              <option value="">{fund.holder_type === 'user' ? t('pettyCash.return.company') : t('pettyCash.return.default')}</option>
              {admins.map(a => <option key={a.person_id} value={a.person_id}>{a.person.first_name} {a.person.last_name}</option>)}
            </select>
          </Field>
        )}
        <Field label={t('pettyCash.fields.description') + (mode === 'adjust' ? ' *' : '')}>
          <input className={inputCls} value={description} onChange={e => setDescription(e.target.value)} />
        </Field>
      </ModalShell>
    );
  };

/* ───────────── Transfer ───────────── */
export const TransferDialog: React.FC<BaseProps & { fund: PettyCashFund }> = ({ onClose, onDone, fund }) => {
  const { t } = useTranslation();
  const operators = useOperators();
  const [operatorId, setOperatorId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await transferToOperator(fund.id_fund, {
        amount: amount.trim(), to_operator: Number(operatorId), date,
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      onDone();
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <ModalShell title={t('pettyCash.actions.transfer')} onClose={onClose} onSubmit={submit}
      submitLabel={t('pettyCash.common.confirm')} submitting={busy} submitDisabled={!operatorId || !isValidAmount(amount)} error={error}>
      <Field label={t('pettyCash.fields.operator')} hint={t('pettyCash.transfer.hint')}>
        <OperatorSelect operators={operators} value={operatorId} onChange={setOperatorId} />
      </Field>
      <Field label={t('pettyCash.fields.amount')}>
        <input className={inputCls} inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
      </Field>
      <Field label={t('pettyCash.fields.date')}>
        <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} />
      </Field>
      <Field label={t('pettyCash.fields.description')}>
        <input className={inputCls} value={description} onChange={e => setDescription(e.target.value)} />
      </Field>
    </ModalShell>
  );
};

/* ───────────── Expense ───────────── */
export const ExpenseDialog: React.FC<BaseProps & { fund: PettyCashFund }> = ({ onClose, onDone, fund }) => {
  const { t } = useTranslation();
  const operators = useOperators();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [category, setCategory] = useState<TxCategory>('other');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [truckId, setTruckId] = useState('');
  const [order, setOrder] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchTrucks(1, 1000).then(r => setTrucks(r.results.data)).catch(() => setTrucks([])); }, []);

  const needsOperator = category === 'payroll_advance' || category === 'loan';
  const invalid = !isValidAmount(amount) || (needsOperator && !operatorId);
  const categories = useMemo(() => EXPENSE_CATEGORIES, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await registerExpense(fund.id_fund, {
        amount: amount.trim(), category, date,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(needsOperator ? { operator: Number(operatorId) } : {}),
        ...(category === 'fuel' && truckId ? { truck: Number(truckId) } : {}),
        ...(order.trim() ? { order: order.trim() } : {}),
        receipt,
      });
      onDone();
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <ModalShell title={t('pettyCash.actions.expense')} onClose={onClose} onSubmit={submit}
      submitLabel={t('pettyCash.common.confirm')} submitting={busy} submitDisabled={invalid} error={error}>
      <Field label={t('pettyCash.fields.category')}>
        <select className={inputCls} value={category} onChange={e => setCategory(e.target.value as TxCategory)}>
          {categories.map(c => <option key={c} value={c}>{t(`pettyCash.category.${c}`)}</option>)}
        </select>
      </Field>
      <Field label={t('pettyCash.fields.amount')}>
        <input className={inputCls} inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
      </Field>
      <Field label={t('pettyCash.fields.date')}>
        <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} />
      </Field>
      {needsOperator && (
        <Field label={t('pettyCash.fields.operator') + ' *'}
          hint={category === 'loan' ? t('pettyCash.expense.loanHint') : t('pettyCash.expense.advanceHint')}>
          <OperatorSelect operators={operators} value={operatorId} onChange={setOperatorId} />
        </Field>
      )}
      {category === 'fuel' && (
        <Field label={t('pettyCash.fields.truck')}>
          <select className={inputCls} value={truckId} onChange={e => setTruckId(e.target.value)}>
            <option value="">—</option>
            {trucks.map(tr => <option key={tr.id_truck} value={tr.id_truck}>{tr.number_truck} {tr.name}</option>)}
          </select>
        </Field>
      )}
      <Field label={t('pettyCash.fields.order')}>
        <OrderSearchSelect value={order} onChange={setOrder} />
      </Field>
      <Field label={t('pettyCash.fields.receipt')}>
        <ReceiptUpload file={receipt} onChange={setReceipt} />
      </Field>
      <Field label={t('pettyCash.fields.description')}>
        <input className={inputCls} value={description} onChange={e => setDescription(e.target.value)} />
      </Field>
    </ModalShell>
  );
};

/* ───────────── Reverse ───────────── */
export const ReverseDialog: React.FC<BaseProps & { transactionId: number }> = ({ onClose, onDone, transactionId }) => {
  const { t } = useTranslation();
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await reverseTransaction(transactionId, description.trim() || undefined); onDone(); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <ModalShell title={t('pettyCash.reverse.title')} onClose={onClose} onSubmit={submit}
      submitLabel={t('pettyCash.reverse.confirm')} submitting={busy} error={error}>
      <p className="text-sm text-gray-600">{t('pettyCash.reverse.warning')}</p>
      <Field label={t('pettyCash.fields.description')}>
        <input className={inputCls} value={description} onChange={e => setDescription(e.target.value)} />
      </Field>
    </ModalShell>
  );
};
