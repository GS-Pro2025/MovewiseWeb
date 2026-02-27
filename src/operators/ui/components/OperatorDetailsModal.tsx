import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X, ZoomIn } from 'lucide-react';
import { Operator } from '../../domain/OperatorsModels';
import OperatorAvatar from './OperatorAvatar';

interface OperatorDetailsModalProps {
  operator: Operator;
  isOpen: boolean;
  onClose: () => void;
}

// ─── Image Lightbox ────────────────────────────────────────────────────────────

interface LightboxProps {
  src: string;
  alt: string;
  label: string;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ src, alt, label, onClose }) => {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Works for both remote URLs and base64
      if (src.startsWith('data:')) {
        // base64 — direct link
        const a = document.createElement('a');
        a.href = src;
        a.download = `${label.replace(/\s+/g, '_')}.png`;
        a.click();
      } else {
        const res = await fetch(src);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${label.replace(/\s+/g, '_')}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // fallback: open in new tab
      window.open(src, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lightbox header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#0B2863]">
          <span className="text-white font-semibold text-sm">{label}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {downloading
                ? t('operators.detailsModal.license.downloading')
                : t('operators.detailsModal.license.download')}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="bg-gray-100 flex items-center justify-center p-4 max-h-[75vh] overflow-auto">
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[65vh] object-contain rounded shadow"
          />
        </div>
      </div>
    </div>
  );
};

// ─── License Image Card ────────────────────────────────────────────────────────

interface LicenseCardProps {
  src: string;
  label: string;
  alt: string;
  onView: () => void;
}

const LicenseCard: React.FC<LicenseCardProps> = ({ src, label, alt, onView }) => {
  const { t } = useTranslation();
  return (
    <div className="group relative">
      <h4 className="font-medium mb-2 text-gray-700">{label}</h4>
      <div className="relative overflow-hidden rounded-lg border border-gray-200 cursor-pointer" onClick={onView}>
        <img
          src={src}
          alt={alt}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white/90 text-gray-800 text-xs font-semibold rounded-lg shadow">
            <ZoomIn className="w-3.5 h-3.5" />
            {t('operators.detailsModal.license.viewFull')}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const OperatorDetailsModal: React.FC<OperatorDetailsModalProps> = ({
  operator,
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const [lightbox, setLightbox] = useState<{ src: string; alt: string; label: string } | null>(null);

  if (!isOpen) return null;

  const formatCurrency = (salary: string): string =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(salary));

  const getFullName = () => `${operator.first_name} ${operator.last_name}`;

  // ── Helper: info row ──
  const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="mb-2">
      <span className="font-medium text-gray-700">{label}:</span>{' '}
      <span className="text-gray-900">{value}</span>
    </div>
  );

  return (
    <>
      <div
        className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
            <h2 className="text-xl font-bold text-gray-800">{t('operators.detailsModal.title')}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl transition-colors duration-200"
            >
              <i className="fas fa-times" />
            </button>
          </div>

          <div className="p-6 space-y-6">

            {/* ── Personal Information ── */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-user text-blue-500 mr-2" />
                {t('operators.detailsModal.sections.personal')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-4">
                  {/* Clickable avatar — opens lightbox if photo exists */}
                  {operator.photo ? (
                    <div
                      className="group relative flex-shrink-0 cursor-pointer"
                      onClick={() => setLightbox({
                        src: operator.photo!,
                        alt: t('operators.detailsModal.license.photoAlt'),
                        label: `${getFullName()} — ${t('operators.detailsModal.license.photo')}`
                      })}
                      title={t('operators.detailsModal.license.viewPhoto')}
                    >
                      <img
                        src={operator.photo}
                        alt={t('operators.detailsModal.license.photoAlt')}
                        className="h-14 w-14 rounded-full object-cover border-2 border-gray-200 transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <ZoomIn className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <OperatorAvatar operator={operator} />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{getFullName()}</div>
                    <div className="text-gray-500">
                      {t('operators.detailsModal.fields.code')}: {operator.code}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Row label={t('operators.detailsModal.fields.birthDate')} value={operator.birth_date} />
                  <Row label={t('operators.detailsModal.fields.idType')} value={operator.type_id} />
                  <Row label={t('operators.detailsModal.fields.idNumber')} value={operator.id_number} />
                </div>
              </div>
            </div>

            {/* ── Contact Information ── */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-address-book text-green-500 mr-2" />
                {t('operators.detailsModal.sections.contact')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Row label={t('operators.detailsModal.fields.email')} value={operator.email} />
                  <Row label={t('operators.detailsModal.fields.phone')} value={operator.phone} />
                </div>
                <div>
                  <Row label={t('operators.detailsModal.fields.address')} value={operator.address} />
                </div>
              </div>
            </div>

            {/* ── Work Information ── */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-briefcase text-purple-500 mr-2" />
                {t('operators.detailsModal.sections.work')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Row label={t('operators.detailsModal.fields.licenseNumber')} value={operator.number_licence} />
                  <Row label={t('operators.detailsModal.fields.shiftName')} value={operator.name_t_shift} />
                  <Row label={t('operators.detailsModal.fields.shiftSize')} value={operator.size_t_shift} />
                </div>
                <div>
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">{t('operators.detailsModal.fields.salaryType')}:</span>
                    <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {operator.salary_type === 'hour'
                        ? t('operators.detailsModal.salaryType.hour')
                        : t('operators.detailsModal.salaryType.day')}
                    </span>
                  </div>
                  {operator.salary_type === 'hour' ? (
                    <Row
                      label={t('operators.detailsModal.fields.hourlySalary')}
                      value={`$${operator.hourly_salary || 0}`}
                    />
                  ) : (
                    <Row
                      label={t('operators.detailsModal.fields.dailySalary')}
                      value={formatCurrency(operator.salary)}
                    />
                  )}
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">{t('operators.detailsModal.fields.status')}:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                      operator.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {operator.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Family Information ── */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-users text-orange-500 mr-2" />
                {t('operators.detailsModal.sections.family')}
              </h3>
              <Row
                label={t('operators.detailsModal.fields.numChildren')}
                value={operator.n_children}
              />
              {operator.sons && operator.sons.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-gray-700">
                    {t('operators.detailsModal.children.detailsTitle')}:
                  </h4>
                  <div className="space-y-2">
                    {operator.sons.map((son, index) => (
                      <div key={index} className="bg-white p-3 rounded border border-gray-200">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">
                              {t('operators.detailsModal.children.name')}
                            </span>
                            <p className="text-gray-900 text-sm mt-0.5">{son.name}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">
                              {t('operators.detailsModal.children.birthDate')}
                            </span>
                            <p className="text-gray-900 text-sm mt-0.5">{son.birth_date}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">
                              {t('operators.detailsModal.children.gender')}
                            </span>
                            <p className="text-gray-900 text-sm mt-0.5">{son.gender}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── License Images ── */}
            {(operator.license_front || operator.license_back) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-id-card text-red-500 mr-2" />
                  {t('operators.detailsModal.sections.license')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {operator.license_front && (
                    <LicenseCard
                      src={operator.license_front}
                      label={t('operators.detailsModal.license.front')}
                      alt={t('operators.detailsModal.license.frontAlt')}
                      onView={() => setLightbox({
                        src: operator.license_front!,
                        alt: t('operators.detailsModal.license.frontAlt'),
                        label: `${getFullName()} — ${t('operators.detailsModal.license.front')}`
                      })}
                    />
                  )}
                  {operator.license_back && (
                    <LicenseCard
                      src={operator.license_back}
                      label={t('operators.detailsModal.license.back')}
                      alt={t('operators.detailsModal.license.backAlt')}
                      onView={() => setLightbox({
                        src: operator.license_back!,
                        alt: t('operators.detailsModal.license.backAlt'),
                        label: `${getFullName()} — ${t('operators.detailsModal.license.back')}`
                      })}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
            >
              {t('operators.detailsModal.closeButton')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <Lightbox
          src={lightbox.src}
          alt={lightbox.alt}
          label={lightbox.label}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
};

export default OperatorDetailsModal;