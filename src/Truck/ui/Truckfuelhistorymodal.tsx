// trucks/ui/TruckFuelHistoryModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Fuel,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  TrendingUp,
  Gauge,
  DollarSign,
  Droplets,
  Calendar,
  ExternalLink,
  Truck,
} from 'lucide-react';
import {
  fetchFuelHistoryByTruck,
  FuelRecord
} from '../data/Repositoryfuelhistory';

interface TruckFuelHistoryModalProps {
  open: boolean;
  onClose: () => void;
  truckId: number;
  truckName: string;
  truckPlate: string;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatPill: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}> = ({ icon, label, value, accent }) => (
  <div
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
      accent
        ? 'bg-[#FE9844]/10 text-[#FE9844] border border-[#FE9844]/20'
        : 'bg-slate-100 text-slate-700'
    }`}
  >
    <span className={accent ? 'text-[#FE9844]' : 'text-[#092961]'}>{icon}</span>
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60">{label}</p>
      <p className="font-bold leading-none">{value}</p>
    </div>
  </div>
);

const ReceiptImage: React.FC<{ url: string }> = ({ url }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#092961] text-xs font-semibold rounded-lg transition-colors border border-blue-100"
      >
        <ImageIcon className="w-3 h-3" />
        Receipt
        <ExternalLink className="w-3 h-3 opacity-60" />
      </button>

      {expanded && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="font-semibold text-[#092961] text-sm">Fuel Receipt</span>
              <button
                onClick={() => setExpanded(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={url} alt="Fuel receipt" className="w-full object-contain max-h-[70vh]" />
          </div>
        </div>
      )}
    </>
  );
};

// ─── Main Modal ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const TruckFuelHistoryModal: React.FC<TruckFuelHistoryModalProps> = ({
  open,
  onClose,
  truckId,
  truckName,
  truckPlate,
}) => {
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // ── Totals computed from current page ──
  const totalCost   = records.reduce((s, r) => s + r.cost_fuel, 0);
  const totalGal    = records.reduce((s, r) => s + r.fuel_qty, 0);
  const totalDist   = records.reduce((s, r) => s + r.distance, 0);
  const totalOrders = records.reduce((s, r) => s + r.orders_count, 0);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFuelHistoryByTruck(truckId, page, PAGE_SIZE);
      setRecords(res.data);
      // Si el backend devuelve count úsalo, si no usamos data.length
      setTotalCount(res.count ?? res.data.length);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading records');
    } finally {
      setLoading(false);
    }
  }, [truckId, page]);

  useEffect(() => {
    if (open) {
      setPage(1);
    }
  }, [open, truckId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  if (!open) return null;

  const from = (page - 1) * PAGE_SIZE + 1;
  const to   = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-[#092961] px-6 py-4 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Fuel className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">Fuel History</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Truck className="w-3.5 h-3.5 text-white/60" />
                  <span className="text-white/80 text-sm">
                    {truckName}
                  </span>
                  <span className="px-2 py-0.5 bg-[#FE9844] text-white text-xs font-bold rounded">
                    {truckPlate}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Summary pills */}
          {!loading && records.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <StatPill
                icon={<DollarSign className="w-3.5 h-3.5" />}
                label="Total cost"
                value={`$${totalCost.toFixed(2)}`}
                accent
              />
              <StatPill
                icon={<Droplets className="w-3.5 h-3.5" />}
                label="Gallons"
                value={`${totalGal.toFixed(2)} gl`}
              />
              <StatPill
                icon={<Gauge className="w-3.5 h-3.5" />}
                label="Distance"
                value={`${totalDist.toLocaleString()} mi`}
              />
              <StatPill
                icon={<TrendingUp className="w-3.5 h-3.5" />}
                label="Orders"
                value={String(totalOrders)}
              />
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-[#092961] border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Loading fuel records...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <X className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-red-500 font-medium">{error}</p>
              <button
                onClick={load}
                className="px-4 py-2 bg-[#092961] text-white text-sm font-semibold rounded-xl hover:bg-[#051f47] transition-colors"
              >
                Retry
              </button>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                <Fuel className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No fuel records found</p>
              <p className="text-slate-400 text-sm">This truck has no fuel costs registered yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> Date
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    <div className="flex items-center justify-end gap-1.5">
                      <Droplets className="w-3 h-3" /> Gallons
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    $/gl
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    <div className="flex items-center justify-end gap-1.5">
                      <DollarSign className="w-3 h-3" /> Total
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    <div className="flex items-center justify-end gap-1.5">
                      <Gauge className="w-3 h-3" /> Miles
                    </div>
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Orders
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr
                    key={r.id_fuel}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      idx % 2 !== 0 ? 'bg-slate-50/40' : ''
                    }`}
                  >
                    {/* Date */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">
                        {new Date(r.date + 'T12:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </td>

                    {/* Gallons */}
                    <td className="px-4 py-3 text-right text-slate-700 font-medium">
                      {r.fuel_qty.toFixed(3)} gl
                    </td>

                    {/* Price/gl */}
                    <td className="px-4 py-3 text-right text-slate-500">
                      ${r.cost_gl.toFixed(3)}
                    </td>

                    {/* Total cost */}
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-[#092961]">
                        ${r.cost_fuel.toFixed(2)}
                      </span>
                    </td>

                    {/* Distance */}
                    <td className="px-4 py-3 text-right text-slate-600">
                      {r.distance.toLocaleString()} mi
                    </td>

                    {/* Orders count */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          r.orders_count > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {r.orders_count}
                      </span>
                    </td>

                    {/* Receipt */}
                    <td className="px-4 py-3 text-center">
                      {r.image_url ? (
                        <ReceiptImage url={r.image_url} />
                      ) : (
                        <span className="text-xs text-slate-300 font-medium">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ── */}
        {!loading && totalCount > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex-shrink-0 flex-wrap gap-2">
            <p className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{from}–{to}</span> of{' '}
              <span className="font-semibold text-slate-700">{totalCount}</span> records
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-[#092961]" />
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-slate-400 text-xs">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                        page === p
                          ? 'bg-[#092961] text-white'
                          : 'hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-[#092961]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TruckFuelHistoryModal;