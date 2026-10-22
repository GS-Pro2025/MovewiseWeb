import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Operator } from '../../../operators/domain/OperatorsModels';
import { Avatar } from './Avatar';
import { inputCls } from './ModalShell';

interface Props {
  operators: Operator[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

const fullName = (o: Operator) => `${o.first_name} ${o.last_name}`;

/** Searchable operator picker that shows each operator's photo. */
export const OperatorSelect: React.FC<Props> = ({ operators, value, onChange, placeholder = '—' }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = operators.find(o => String(o.id_operator) === value);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? operators.filter(o => `${fullName(o)} ${o.code}`.toLowerCase().includes(term)) : operators;
  }, [operators, q]);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} className={`${inputCls} flex items-center gap-2 text-left bg-white`}>
        {selected ? (
          <>
            <Avatar name={fullName(selected)} photo={selected.photo} size={26} />
            <span className="flex-1 truncate">{fullName(selected)} <span className="text-gray-400">({selected.code})</span></span>
          </>
        ) : <span className="flex-1 text-gray-400">{placeholder}</span>}
        <i className={`fas fa-chevron-${open ? 'up' : 'down'} text-xs text-gray-400`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input autoFocus className={inputCls} placeholder="Buscar…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <ul className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && <li className="px-3 py-3 text-sm text-gray-400">—</li>}
            {filtered.map(o => (
              <li key={o.id_operator}>
                <button type="button" onClick={() => { onChange(String(o.id_operator)); setOpen(false); setQ(''); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-blue-50 ${String(o.id_operator) === value ? 'bg-blue-50' : ''}`}>
                  <Avatar name={fullName(o)} photo={o.photo} size={32} />
                  <span className="text-sm text-gray-800 truncate">{fullName(o)}</span>
                  <span className="ml-auto text-xs text-gray-400">{o.code}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
