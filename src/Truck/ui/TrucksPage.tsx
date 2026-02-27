// trucks/ui/TrucksPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Plus,
  Pencil,
  Trash2,
  Truck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import {
  fetchTrucks,
  createTruck,
  updateTruck,
  deleteTruck,
  Truck as TruckType,
  TruckFormData,
  TruckResponse
} from '../data/repositoryTrucks';

// ─── Constants ─────────────────────────────────────────────────────────────────

const initialFormData: TruckFormData = {
  number_truck: '',
  type: 'owned',
  name: '',
  category: 'truck_26'
};

// ─── Reusable primitives ───────────────────────────────────────────────────────

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  uppercase?: boolean;
}> = ({ label, value, onChange, placeholder, required, uppercase }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-semibold text-slate-700">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
      className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:border-[#092961] focus:outline-none transition-colors"
    />
  </div>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  helper?: string;
  required?: boolean;
}> = ({ label, value, onChange, options, helper, required }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-semibold text-slate-700">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:border-[#092961] focus:outline-none transition-colors bg-white appearance-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {helper && <p className="text-xs text-slate-500 mt-0.5">{helper}</p>}
  </div>
);

// ─── Modal overlay ─────────────────────────────────────────────────────────────

const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ open, onClose, children, maxWidth = 'max-w-lg' }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const TrucksPage: React.FC = () => {
  const { t } = useTranslation();

  const TRUCK_TYPES = [
    { value: 'owned',  label: t('trucks.types.owned') },
    { value: 'rented', label: t('trucks.types.rented') }
  ];

  const TRUCK_CATEGORIES = [
    { value: 'truck_26',  label: t('trucks.categories.truck_26') },
    { value: 'truck_49',  label: t('trucks.categories.truck_49') },
    { value: 'truck_001', label: t('trucks.categories.truck_001') },
    { value: 'vans',      label: t('trucks.categories.vans') },
    { value: 'trailer',   label: t('trucks.categories.trailer') }
  ];

  const [trucks, setTrucks] = useState<TruckType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<TruckType | null>(null);
  const [formData, setFormData] = useState<TruckFormData>(initialFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const { enqueueSnackbar } = useSnackbar();

  const loadTrucks = async () => {
    try {
      setLoading(true);
      const response: TruckResponse = await fetchTrucks(page + 1, rowsPerPage);
      if (response?.results?.data && Array.isArray(response.results.data)) {
        setTrucks(response.results.data);
        setTotalCount(response.count || response.results.data.length);
      } else {
        setTrucks([]);
        setTotalCount(0);
      }
    } catch {
      enqueueSnackbar(t('trucks.snackbar.loadError'), { variant: 'error' });
      setTrucks([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrucks(); }, [page, rowsPerPage]);

  const handleOpenModal = (truck?: TruckType) => {
    if (truck) {
      setSelectedTruck(truck);
      setFormData({
        number_truck: truck.number_truck,
        type: truck.type.toLowerCase(),
        name: truck.name,
        category: truck.category
      });
    } else {
      setSelectedTruck(null);
      setFormData(initialFormData);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTruck(null);
    setFormData(initialFormData);
  };

  const handleOpenDeleteDialog = (truck: TruckType) => {
    setSelectedTruck(truck);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedTruck(null);
  };

  const handleSubmit = async () => {
    if (!formData.number_truck || !formData.name || !formData.type || !formData.category) {
      enqueueSnackbar(t('trucks.modal.requiredFields'), { variant: 'warning' });
      return;
    }
    try {
      if (selectedTruck) {
        await updateTruck(selectedTruck.id_truck, formData);
        enqueueSnackbar(t('trucks.snackbar.updateSuccess'), { variant: 'success' });
      } else {
        await createTruck(formData);
        enqueueSnackbar(t('trucks.snackbar.createSuccess'), { variant: 'success' });
      }
      handleCloseModal();
      loadTrucks();
    } catch {
      enqueueSnackbar(
        selectedTruck ? t('trucks.snackbar.updateError') : t('trucks.snackbar.createError'),
        { variant: 'error' }
      );
    }
  };

  const handleDelete = async () => {
    if (!selectedTruck) return;
    try {
      await deleteTruck(selectedTruck.id_truck);
      enqueueSnackbar(t('trucks.snackbar.deleteSuccess'), { variant: 'success' });
      handleCloseDeleteDialog();
      loadTrucks();
    } catch {
      enqueueSnackbar(t('trucks.snackbar.deleteError'), { variant: 'error' });
    }
  };

  const getTypeLabel = (type: string) =>
    TRUCK_TYPES.find(tp => tp.value === type.toLowerCase())?.label ?? type;

  const getCategoryLabel = (category: string) =>
    TRUCK_CATEGORIES.find(c => c.value === category)?.label ?? category;

  const filteredTrucks = trucks.filter(truck =>
    [truck.number_truck, truck.name, truck.type, truck.category]
      .some(v => v.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const from = page * rowsPerPage + 1;
  const to = Math.min((page + 1) * rowsPerPage, totalCount);
  const isFormValid = !!(formData.number_truck && formData.name && formData.type && formData.category);

  return (
    <div className="p-6 min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#092961] flex items-center justify-center shadow-md">
            <Truck className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#092961]">{t('trucks.title')}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{t('trucks.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#092961] hover:bg-[#051f47] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          {t('trucks.addButton')}
        </button>
      </div>

      {/* ── Search ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#092961]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('trucks.search.placeholder')}
            className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-[#092961] focus:outline-none transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#092961] text-white">
                <th className="text-left px-5 py-3.5 font-semibold">{t('trucks.table.plate')}</th>
                <th className="text-left px-5 py-3.5 font-semibold">{t('trucks.table.name')}</th>
                <th className="text-left px-5 py-3.5 font-semibold">{t('trucks.table.type')}</th>
                <th className="text-left px-5 py-3.5 font-semibold">{t('trucks.table.category')}</th>
                <th className="text-center px-5 py-3.5 font-semibold">{t('trucks.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="inline-block w-8 h-8 border-4 border-[#092961] border-t-transparent rounded-sm animate-spin" />
                  </td>
                </tr>
              ) : filteredTrucks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                      {t('trucks.table.noResults')}
                    </span>
                  </td>
                </tr>
              ) : (
                filteredTrucks.map((truck, idx) => (
                  <tr
                    key={truck.id_truck}
                    className={`border-t border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 !== 0 ? 'bg-slate-50/50' : ''}`}
                  >
                    {/* Plate */}
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2.5 py-0.5 bg-[#FE9844] text-white text-xs font-bold rounded-sm">
                        {truck.number_truck}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="px-5 py-3.5 font-medium text-slate-800">{truck.name}</td>

                    {/* Type */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 text-white text-xs font-bold rounded-sm capitalize ${
                        truck.type.toLowerCase() === 'owned' ? 'bg-green-500' : 'bg-orange-500'
                      }`}>
                        {getTypeLabel(truck.type)}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-3.5 text-slate-700">{getCategoryLabel(truck.category)}</td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          title={t('trucks.table.editTooltip')}
                          onClick={() => handleOpenModal(truck)}
                          className="p-2 rounded-lg text-[#092961] hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          title={t('trucks.table.deleteTooltip')}
                          onClick={() => handleOpenDeleteDialog(truck)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!loading && totalCount > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-sm text-slate-600 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span>{t('trucks.pagination.rowsPerPage')}:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#092961] bg-white"
              >
                {[5, 10, 25, 50].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span>{t('trucks.pagination.displayedRows', { from, to, count: totalCount })}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      <Modal open={modalOpen} onClose={handleCloseModal}>
        <div className="bg-[#092961] px-6 py-4">
          <h2 className="text-white font-semibold text-lg">
            {selectedTruck ? t('trucks.modal.titleEdit') : t('trucks.modal.titleCreate')}
          </h2>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <InputField
            label={t('trucks.modal.plateLabel')}
            value={formData.number_truck}
            onChange={(v) => setFormData({ ...formData, number_truck: v })}
            placeholder="ABC-1234"
            required
            uppercase
          />
          <InputField
            label={t('trucks.modal.nameLabel')}
            value={formData.name}
            onChange={(v) => setFormData({ ...formData, name: v })}
            required
          />
          <SelectField
            label={t('trucks.modal.typeLabel')}
            value={formData.type}
            onChange={(v) => setFormData({ ...formData, type: v })}
            options={TRUCK_TYPES}
            helper={t('trucks.modal.typeHelper')}
            required
          />
          <SelectField
            label={t('trucks.modal.categoryLabel')}
            value={formData.category}
            onChange={(v) => setFormData({ ...formData, category: v })}
            options={TRUCK_CATEGORIES}
            helper={t('trucks.modal.categoryHelper')}
            required
          />
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleCloseModal}
            className="px-4 py-2 border-2 border-[#092961] text-[#092961] text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors"
          >
            {t('trucks.modal.cancelButton')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="px-4 py-2 bg-[#092961] hover:bg-[#051f47] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {selectedTruck ? t('trucks.modal.updateButton') : t('trucks.modal.createButton')}
          </button>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="max-w-sm">
        <div className="p-6">
          <h2 className="text-lg font-bold text-[#092961] mb-3">{t('trucks.deleteDialog.title')}</h2>
          <p className="text-slate-700 text-sm">
            {t('trucks.deleteDialog.message')}{' '}
            <strong>{selectedTruck?.number_truck} – {selectedTruck?.name}</strong>?
          </p>
          <p className="text-xs text-red-500 mt-2">{t('trucks.deleteDialog.warning')}</p>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleCloseDeleteDialog}
            className="px-4 py-2 border-2 border-[#092961] text-[#092961] text-sm font-semibold rounded-sm hover:bg-blue-50 transition-colors"
          >
            {t('trucks.deleteDialog.cancelButton')}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-sm transition-colors"
          >
            {t('trucks.deleteDialog.deleteButton')}
          </button>
        </div>
      </Modal>

    </div>
  );
};

export default TrucksPage;