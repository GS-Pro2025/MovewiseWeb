import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { fetchFunds } from '../data/RepositoryPettyCash';
import { FundStatus, HolderType, isoWeekMonday, PettyCashFund } from '../domain/PettyCashModels';
import WeekPicker from '../../components/WeekPicker';
import YearPicker from '../../components/YearPicker';
import { getISOWeek } from '../../Payroll/util/PayrollUtil';
import { Avatar } from './components/Avatar';
import { useHolderPhotos } from './useHolderPhotos';
import { OpenFundDialog } from './components/PettyCashDialogs';
import { inputCls } from './components/ModalShell';
import { fmtDay, fmtMoney } from './format';
import { usePettyCashUser } from './usePettyCashUser';

export default function PettyCashPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { personId, isSuper, loading: userLoading } = usePettyCashUser();

  const [funds, setFunds] = useState<PettyCashFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [week, setWeek] = useState(() => getISOWeek(new Date()));
  const [year, setYear] = useState(() => new Date().getFullYear());
  const photos = useHolderPhotos();
  const [status, setStatus] = useState<'' | FundStatus>('');
  const [holderType, setHolderType] = useState<'' | HolderType>('');
  const [openDialog, setOpenDialog] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setFunds(await fetchFunds({
        week: isoWeekMonday(year, week),
        ...(status ? { status } : {}),
        ...(holderType ? { holder_type: holderType } : {}),
      }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [week, year, status, holderType]);

  useEffect(() => { load(); }, [load]);

  const totalBalance = funds.reduce((s, f) => s + parseFloat(f.balance), 0);
  const debtCount = funds.filter(f => f.is_in_debt).length;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#0B2863]">{t('pettyCash.title')}</h1>
          <p className="text-sm text-gray-500">{t('pettyCash.subtitle')}</p>
        </div>
        <button
          onClick={() => setOpenDialog(true)}
          disabled={userLoading}
          className="px-4 py-2 rounded-lg bg-[#0B2863] text-white text-sm font-semibold hover:bg-[#0B2863]/90 disabled:opacity-50"
        >
          <i className="fas fa-plus mr-2" />
          {isSuper ? t('pettyCash.createFund') : t('pettyCash.createOperatorFund')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0B2863] flex items-center justify-center"><i className="fas fa-wallet" /></div>
          <div><div className="text-xs text-gray-400 uppercase">{t('pettyCash.kpi.funds')}</div><div className="text-xl font-bold text-gray-800">{funds.length}</div></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${totalBalance < 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}><i className="fas fa-dollar-sign" /></div>
          <div><div className="text-xs text-gray-400 uppercase">{t('pettyCash.kpi.balance')}</div><div className={`text-xl font-bold ${totalBalance < 0 ? 'text-red-600' : 'text-gray-800'}`}>{fmtMoney(totalBalance)}</div></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center"><i className="fas fa-exclamation-triangle" /></div>
          <div><div className="text-xs text-gray-400 uppercase">{t('pettyCash.kpi.debt')}</div><div className="text-xl font-bold text-gray-800">{debtCount}</div></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap items-end gap-4">
        <div>
          <span className="block text-xs font-semibold text-gray-600 mb-1">{t('pettyCash.filters.week')}</span>
          <div className="flex items-center gap-2">
            <WeekPicker week={week} onWeekSelect={setWeek} min={1} max={53} />
            <YearPicker year={year} onYearSelect={setYear} />
          </div>
        </div>
        <label className="block min-w-[150px]">
          <span className="block text-xs font-semibold text-gray-600 mb-1">{t('pettyCash.filters.status')}</span>
          <select className={inputCls} value={status} onChange={e => setStatus(e.target.value as '' | FundStatus)}>
            <option value="">{t('pettyCash.filters.all')}</option>
            <option value="active">{t('pettyCash.status.active')}</option>
            <option value="closed">{t('pettyCash.status.closed')}</option>
          </select>
        </label>
        <label className="block min-w-[150px]">
          <span className="block text-xs font-semibold text-gray-600 mb-1">{t('pettyCash.filters.holder')}</span>
          <select className={inputCls} value={holderType} onChange={e => setHolderType(e.target.value as '' | HolderType)}>
            <option value="">{t('pettyCash.filters.all')}</option>
            <option value="user">{t('pettyCash.holder.user')}</option>
            <option value="operator">{t('pettyCash.holder.operator')}</option>
          </select>
        </label>
      </div>

      {error && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">{t('pettyCash.fields.holder')}</th>
              <th className="text-left px-4 py-3">{t('pettyCash.fields.week')}</th>
              <th className="text-right px-4 py-3">{t('pettyCash.fields.balance')}</th>
              <th className="text-left px-4 py-3">{t('pettyCash.filters.status')}</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">…</td></tr>}
            {!loading && funds.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">{t('pettyCash.empty')}</td></tr>
            )}
            {!loading && funds.map(f => (
              <tr key={f.id_fund} onClick={() => navigate(`/app/petty-cash/${f.id_fund}`)}
                className="border-t border-gray-100 hover:bg-blue-50/40 cursor-pointer">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={f.holder_name} size={40}
                      photo={f.holder_type === 'operator' ? photos.operators[f.holder_operator ?? -1] : photos.admins[f.holder_user ?? -1]} />
                    <div>
                      <div className="font-semibold text-gray-800">{f.holder_name ?? '—'}</div>
                      <div className="text-xs text-gray-400">{t(`pettyCash.holder.${f.holder_type}`)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{fmtDay(f.week_start)} → {fmtDay(f.week_end)}</td>
                <td className={`px-4 py-3 text-right font-semibold ${f.is_in_debt ? 'text-red-600' : 'text-emerald-600'}`}>
                  {fmtMoney(f.balance)}
                  {f.is_in_debt && <span className="ml-2 text-xs bg-red-100 text-red-700 rounded px-1.5 py-0.5">{t('pettyCash.debt')}</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs rounded-full px-2 py-0.5 border ${f.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {t(`pettyCash.status.${f.status}`)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          {!loading && funds.length > 0 && (
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-4 py-3" colSpan={2}>{t('pettyCash.total')}</td>
                <td className={`px-4 py-3 text-right ${totalBalance < 0 ? 'text-red-600' : 'text-gray-800'}`}>{fmtMoney(totalBalance)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {openDialog && (
        <OpenFundDialog
          isSuper={isSuper}
          currentPersonId={personId}
          onClose={() => setOpenDialog(false)}
          onOpened={(fund, created) => {
            enqueueSnackbar(created ? t('pettyCash.open.created') : t('pettyCash.open.existed'), { variant: created ? 'success' : 'info' });
            if (!created) navigate(`/app/petty-cash/${fund.id_fund}`);
          }}
          onDone={() => { setOpenDialog(false); load(); }}
        />
      )}
    </div>
  );
}
