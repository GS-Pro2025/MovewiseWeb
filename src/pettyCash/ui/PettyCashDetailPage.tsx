import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { fetchFund, fetchFundTransactions } from '../data/RepositoryPettyCash';
import { PettyCashFund, PettyCashTransaction } from '../domain/PettyCashModels';
import { AmountDialog, ExpenseDialog, ReverseDialog, TransferDialog } from './components/PettyCashDialogs';
import { fmtDay, fmtMoney } from './format';
import { usePettyCashUser } from './usePettyCashUser';
import { Avatar } from './components/Avatar';
import { useHolderPhotos } from './useHolderPhotos';

const ACTION_ICON = { deposit: 'fa-hand-holding-usd', expense: 'fa-receipt', return: 'fa-undo', transfer: 'fa-exchange-alt', adjust: 'fa-sliders-h' } as const;

type Dialog = null | 'deposit' | 'expense' | 'return' | 'adjust' | 'transfer' | { reverse: number };

export default function PettyCashDetailPage() {
  const { id } = useParams();
  const fundId = Number(id);
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { personId, isSuper } = usePettyCashUser();
  const photos = useHolderPhotos();

  const [fund, setFund] = useState<PettyCashFund | null>(null);
  const [txs, setTxs] = useState<PettyCashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  const load = useCallback(async () => {
    try {
      const [f, list] = await Promise.all([fetchFund(fundId), fetchFundTransactions(fundId)]);
      setFund(f); setTxs(list); setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [fundId]);

  useEffect(() => { load(); }, [load]);

  const done = (msg: string) => { setDialog(null); enqueueSnackbar(msg, { variant: 'success' }); load(); };

  if (loading) return <div className="p-8 text-center text-gray-400">…</div>;
  if (error || !fund) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Link to="/app/petty-cash" className="text-sm text-[#0B2863]">← {t('pettyCash.title')}</Link>
        <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      </div>
    );
  }

  const active = fund.status === 'active';
  const ownFund = fund.holder_type === 'user' && fund.holder_user === personId;
  const canTransfer = active && fund.holder_type === 'user' && (isSuper || ownFund);

  const actions: { key: Exclude<Dialog, null | { reverse: number }>; show: boolean }[] = [
    { key: 'deposit', show: active && isSuper },
    { key: 'expense', show: active },
    { key: 'return', show: active },
    { key: 'transfer', show: canTransfer },
    { key: 'adjust', show: active && isSuper },
  ];

  const typeLabel = (tx: PettyCashTransaction) =>
    tx.category ? `${t(`pettyCash.type.${tx.type}`)} · ${t(`pettyCash.category.${tx.category}`)}` : t(`pettyCash.type.${tx.type}`);

  return (
    <div className="container mx-auto py-8 px-4">
      <Link to="/app/petty-cash" className="text-sm text-[#0B2863] hover:underline">← {t('pettyCash.title')}</Link>

      <div className="mt-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={fund.holder_name} size={64}
            photo={fund.holder_type === 'operator' ? photos.operators[fund.holder_operator ?? -1] : photos.admins[fund.holder_user ?? -1]} />
          <div>
          <div className="text-lg font-bold text-gray-800">{fund.holder_name ?? '—'}</div>
          <div className="text-sm text-gray-500">
            {t(`pettyCash.holder.${fund.holder_type}`)} · {fmtDay(fund.week_start)} → {fmtDay(fund.week_end)}
          </div>
          <span className={`inline-block mt-2 text-xs rounded-full px-2 py-0.5 border ${active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {t(`pettyCash.status.${fund.status}`)}
          </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase text-gray-400">{t('pettyCash.fields.balance')}</div>
          <div className={`text-3xl font-bold ${fund.is_in_debt ? 'text-red-600' : 'text-emerald-600'}`}>{fmtMoney(fund.balance)}</div>
          {fund.is_in_debt && <div className="text-xs text-red-600">{t('pettyCash.debtLong')}</div>}
        </div>
      </div>

      {!active && <div className="mt-3 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{t('pettyCash.closedNotice')}</div>}

      <div className="mt-4 flex flex-wrap gap-2">
        {actions.filter(a => a.show).map(a => (
          <button key={a.key} onClick={() => setDialog(a.key)}
            className="px-3 py-2 rounded-lg border border-[#0B2863] text-[#0B2863] text-sm font-semibold hover:bg-[#0B2863] hover:text-white transition-colors">
            <i className={`fas ${ACTION_ICON[a.key]} mr-2`} />{t(`pettyCash.actions.${a.key}`)}
          </button>
        ))}
      </div>

      <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">{t('pettyCash.fields.date')}</th>
              <th className="text-left px-4 py-3">{t('pettyCash.fields.type')}</th>
              <th className="text-left px-4 py-3">{t('pettyCash.fields.description')}</th>
              <th className="text-right px-4 py-3">{t('pettyCash.fields.amount')}</th>
              <th className="text-right px-4 py-3">{t('pettyCash.fields.balance')}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {txs.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t('pettyCash.noMovements')}</td></tr>}
            {txs.map(tx => {
              const canReverse = active && tx.type !== 'reversal' && !tx.is_reversed;
              return (
                <tr key={tx.id_transaction} className={`border-t border-gray-100 ${tx.is_reversed ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 whitespace-nowrap">{fmtDay(tx.date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {tx.operator != null && <Avatar name={tx.operator_name} photo={photos.operators[tx.operator]} size={30} />}
                      <div>
                        <div className="font-medium text-gray-800">{typeLabel(tx)}</div>
                        <div className="text-xs text-gray-400">
                          {[tx.operator_name, tx.created_by_name].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    </div>
                    {tx.is_reversed && <span className="text-xs bg-gray-200 text-gray-700 rounded px-1.5 py-0.5">{t('pettyCash.reversed')}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {tx.description || '—'}
                    {tx.receipt && (
                      <a href={tx.receipt} target="_blank" rel="noreferrer" className="ml-2 text-[#0B2863]" title={t('pettyCash.fields.receipt')}>
                        <i className="fas fa-receipt" />
                      </a>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${tx.direction === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tx.direction === 'in' ? '+' : '−'} {fmtMoney(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{fmtMoney(tx.balance_after)}</td>
                  <td className="px-4 py-3 text-right">
                    {canReverse && (
                      <button onClick={() => setDialog({ reverse: tx.id_transaction })} className="text-xs text-red-600 hover:underline">
                        {t('pettyCash.reverse.action')}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(dialog === 'deposit' || dialog === 'return' || dialog === 'adjust') && (
        <AmountDialog fund={fund} mode={dialog} onClose={() => setDialog(null)} onDone={() => done(t('pettyCash.saved'))} />
      )}
      {dialog === 'expense' && <ExpenseDialog fund={fund} onClose={() => setDialog(null)} onDone={() => done(t('pettyCash.saved'))} />}
      {dialog === 'transfer' && <TransferDialog fund={fund} onClose={() => setDialog(null)} onDone={() => done(t('pettyCash.saved'))} />}
      {dialog && typeof dialog === 'object' && (
        <ReverseDialog transactionId={dialog.reverse} onClose={() => setDialog(null)} onDone={() => done(t('pettyCash.reverse.done'))} />
      )}
    </div>
  );
}
