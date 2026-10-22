import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchOrdersReport } from '../../../Home/data/repositoryOrdersReport';
import { OrderReportResult } from '../../../Home/domain/ModelOrdersReport';
import { fmtDay } from '../format';
import { inputCls } from './ModalShell';

interface Props {
  /** Selected order key (UUID); '' when none. */
  value: string;
  onChange: (key: string) => void;
}

/** Global order search (no week/year filter) that shows each order's reference and date. */
export const OrderSearchSelect: React.FC<Props> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<OrderReportResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<OrderReportResult | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    let alive = true;
    setLoading(true);
    const timer = setTimeout(() => {
      fetchOrdersReport(1, 0, 0, 8, term)
        .then(r => { if (alive) setResults(r.results); })
        .catch(() => { if (alive) setResults([]); })
        .finally(() => { if (alive) setLoading(false); });
    }, 350);
    return () => { alive = false; clearTimeout(timer); };
  }, [q]);

  if (value && selected) {
    return (
      <div className="flex items-center gap-3 border border-[#0B2863]/30 bg-blue-50/60 rounded-lg px-3 py-2">
        <i className="fas fa-box text-[#0B2863]" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-800 truncate">{selected.key_ref}</div>
          <div className="text-xs text-gray-500">{fmtDay(selected.date)} · {selected.customer_factory_name}</div>
        </div>
        <button type="button" onClick={() => { setSelected(null); onChange(''); }} className="text-gray-400 hover:text-red-500" aria-label="clear">
          <i className="fas fa-times" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input className={`${inputCls} pl-8`} placeholder={t('pettyCash.order.search')} value={q}
          onFocus={() => setOpen(true)} onChange={e => { setQ(e.target.value); setOpen(true); }} />
      </div>
      {open && q.trim().length >= 2 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {loading && <li className="px-3 py-3 text-sm text-gray-400">…</li>}
          {!loading && results.length === 0 && <li className="px-3 py-3 text-sm text-gray-400">{t('pettyCash.order.none')}</li>}
          {results.map(o => (
            <li key={o.key}>
              <button type="button" onClick={() => { setSelected(o); onChange(o.key); setOpen(false); setQ(''); }}
                className="w-full text-left px-3 py-2 hover:bg-blue-50">
                <div className="text-sm font-semibold text-gray-800">{o.key_ref}</div>
                <div className="text-xs text-gray-500">{fmtDay(o.date)} · {o.customer_factory_name} · {o.job_name}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
