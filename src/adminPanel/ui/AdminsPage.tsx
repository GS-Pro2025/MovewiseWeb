/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { AdminUser } from '../domain/AdminDomain';
import { getCompanyUsers, requestDeactivation, confirmDeactivation, reactivateAdmin, grantSuperuser, revokeSuperuser } from '../data/RepositoryAdmin';
import { decodeJWTAsync } from '../../service/tokenDecoder';
import Cookies from 'js-cookie';

interface DeactivationState {
  personId: number | null;
  userName: string;
  step: 'idle' | 'requesting' | 'confirming';
  code: string;
  isLoading: boolean;
}

const AdminsPage: React.FC = () => {
  const { t } = useTranslation();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [reactivatingUser, setReactivatingUser] = useState<number | null>(null);
  const [grantingSuperuser, setGrantingSuperuser] = useState<number | null>(null);
  const [revokingSuperuser, setRevokingSuperuser] = useState<number | null>(null);
  const [currentUserPersonId, setCurrentUserPersonId] = useState<number | null>(null);
  const [deactivationState, setDeactivationState] = useState<DeactivationState>({
    personId: null,
    userName: '',
    step: 'idle',
    code: '',
    isLoading: false,
  });

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const token = Cookies.get('authToken');
      if (!token) return;
      const decoded = await decodeJWTAsync(token);
      if (decoded && typeof decoded === 'object' && 'person_id' in decoded) {
        setCurrentUserPersonId(decoded.person_id as number);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await getCompanyUsers();
      setUsers(response.data);
      setTotalUsers(response.total_users);
      setCompanyId(response.company_id);
    } catch (error: any) {
      enqueueSnackbar(error.message || t('admins.snackbar.loadError'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeactivation = async (user: AdminUser) => {
    setDeactivationState({ personId: user.person_id, userName: user.user_name, step: 'requesting', code: '', isLoading: true });
    try {
      const result = await requestDeactivation(user.person_id);
      if (!result.success) {
        enqueueSnackbar(result.errorMessage || t('admins.snackbar.deactivateRequestError'), { variant: 'error' });
        setDeactivationState(prev => ({ ...prev, step: 'idle', isLoading: false }));
        return;
      }
      setDeactivationState(prev => ({ ...prev, step: 'confirming', isLoading: false }));
      enqueueSnackbar(t('admins.snackbar.codeSent'), { variant: 'info' });
    } catch (error: any) {
      enqueueSnackbar(error.message || t('admins.snackbar.deactivateRequestError'), { variant: 'error' });
      setDeactivationState(prev => ({ ...prev, step: 'idle', isLoading: false }));
    }
  };

  const handleConfirmDeactivation = async () => {
    if (!deactivationState.personId || !deactivationState.code.trim()) {
      enqueueSnackbar(t('admins.snackbar.codeRequired'), { variant: 'warning' });
      return;
    }
    setDeactivationState(prev => ({ ...prev, isLoading: true }));
    try {
      const result = await confirmDeactivation(deactivationState.personId, deactivationState.code);
      if (!result.success) {
        enqueueSnackbar(result.errorMessage || t('admins.snackbar.deactivateConfirmError'), { variant: 'error' });
        setDeactivationState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      setUsers(users.map(u => u.person_id === deactivationState.personId ? { ...u, is_active_user: false } : u));
      enqueueSnackbar(t('admins.snackbar.deactivateSuccess'), { variant: 'success' });
      closeModal();
    } catch (error: any) {
      enqueueSnackbar(error.message || t('admins.snackbar.deactivateConfirmError'), { variant: 'error' });
      setDeactivationState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleReactivateAdmin = async (user: AdminUser) => {
    setReactivatingUser(user.person_id);
    try {
      const result = await reactivateAdmin(user.person_id);
      if (!result.success) {
        enqueueSnackbar(result.errorMessage || t('admins.snackbar.reactivateError'), { variant: 'error' });
        return;
      }
      setUsers(users.map(u => u.person_id === user.person_id ? { ...u, is_active_user: true } : u));
      enqueueSnackbar(t('admins.snackbar.reactivateSuccess'), { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error.message || t('admins.snackbar.reactivateError'), { variant: 'error' });
    } finally {
      setReactivatingUser(null);
    }
  };

  const handleGrantSuperuser = async (user: AdminUser) => {
    if (user.is_superUser === 1) {
      enqueueSnackbar(t('admins.snackbar.alreadySuperuser'), { variant: 'warning' });
      return;
    }
    setGrantingSuperuser(user.person_id);
    try {
      const result = await grantSuperuser(user.person_id);
      if (!result.success) {
        enqueueSnackbar(result.errorMessage || t('admins.snackbar.grantError'), { variant: 'error' });
        return;
      }
      setUsers(users.map(u => u.person_id === user.person_id ? { ...u, is_superUser: 1 } : u));
      enqueueSnackbar(t('admins.snackbar.grantSuccess'), { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error.message || t('admins.snackbar.grantError'), { variant: 'error' });
    } finally {
      setGrantingSuperuser(null);
    }
  };

  const handleRevokeSuperuser = async (user: AdminUser) => {
    if (user.is_superUser === 0) {
      enqueueSnackbar(t('admins.snackbar.notSuperuser'), { variant: 'warning' });
      return;
    }
    setRevokingSuperuser(user.person_id);
    try {
      const result = await revokeSuperuser(user.person_id);
      if (!result.success) {
        enqueueSnackbar(result.errorMessage || t('admins.snackbar.revokeError'), { variant: 'error' });
        return;
      }
      setUsers(users.map(u => u.person_id === user.person_id ? { ...u, is_superUser: 0 } : u));
      enqueueSnackbar(t('admins.snackbar.revokeSuccess'), { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error.message || t('admins.snackbar.revokeError'), { variant: 'error' });
    } finally {
      setRevokingSuperuser(null);
    }
  };

  const closeModal = () => {
    setDeactivationState({ personId: null, userName: '', step: 'idle', code: '', isLoading: false });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.person.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.person.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.person.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active_user) ||
      (filterStatus === 'inactive' && !user.is_active_user);
    return matchesSearch && matchesFilter;
  });

  // Translate known ID type codes; fallback to raw value
  const getIdTypeLabel = (typeId: string) => {
    const key = `admins.idTypes.${typeId}`;
    const translated = t(key);
    return translated === key ? typeId : translated;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B2863]" />
      </div>
    );
  }

  // ── Shared btn ──
  const isSelf = (u: AdminUser) => u.person_id === currentUserPersonId;

  return (
    <>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">

          {/* ── Header ── */}
          <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#0B2863' }}
                  >
                    <i className="fas fa-users-cog text-white text-xl" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold" style={{ color: '#0B2863' }}>
                      {t('admins.title')}
                    </h1>
                    <p className="text-gray-600">{t('admins.subtitle')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{t('admins.companyId', { id: companyId })}</span>
                  <span>•</span>
                  <span>{t('admins.totalUsers', { count: totalUsers })}</span>
                </div>
              </div>

              <Link
                to="/app/create-admin"
                className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ backgroundColor: '#0B2863' }}
              >
                <i className="fas fa-plus" />
                {t('admins.addAdmin')}
              </Link>
            </div>
          </div>

          {/* ── Filters ── */}
          <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('admins.filters.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2863] focus:border-[#0B2863]"
                />
              </div>
              <div className="md:w-48">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2863] focus:border-[#0B2863]"
                >
                  <option value="all">{t('admins.filters.statusAll')}</option>
                  <option value="active">{t('admins.filters.statusActive')}</option>
                  <option value="inactive">{t('admins.filters.statusInactive')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Users Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user.user_name}
                className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                    <img
                      src={
                        user.photo?.trim()
                          ? user.photo
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(`${user.person.first_name} ${user.person.last_name}`)}&background=0B2863&color=fff&size=128`
                      }
                      alt={`${user.person.first_name} ${user.person.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {user.person.first_name} {user.person.last_name}
                    </h3>
                    <p className="text-gray-500 text-sm">@{user.user_name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <div className={`w-2 h-2 rounded-full ${user.is_active_user ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className={`text-xs font-medium ${user.is_active_user ? 'text-green-600' : 'text-red-600'}`}>
                        {user.is_active_user ? t('admins.card.active') : t('admins.card.inactive')}
                      </span>
                      {user.is_superUser === 1 && (
                        <>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center gap-1">
                            <i className="fas fa-crown text-yellow-500 text-xs" />
                            <span className="text-xs font-medium text-yellow-600">{t('admins.card.superuser')}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-5">
                  {[
                    { icon: 'fa-envelope', text: user.person.email, truncate: true },
                    { icon: 'fa-phone',    text: user.person.phone },
                    { icon: 'fa-id-card',  text: `${getIdTypeLabel(user.person.type_id)}: ${user.person.id_number}` },
                    { icon: 'fa-calendar', text: t('admins.card.born', { date: new Date(user.person.birth_date).toLocaleDateString() }) },
                    { icon: 'fa-clock',    text: t('admins.card.created', { date: new Date(user.created_at).toLocaleDateString() }) },
                    { icon: 'fa-map-marker-alt', text: user.person.address, truncate: true },
                  ].map(({ icon, text, truncate }, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <i className={`fas ${icon} w-4 flex-shrink-0 text-gray-400`} />
                      <span className={truncate ? 'truncate' : ''}>{text}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {/* Activate / Deactivate */}
                  <div className="flex gap-2">
                    {user.is_active_user ? (
                      <button
                        onClick={() => handleRequestDeactivation(user)}
                        disabled={deactivationState.isLoading || isSelf(user)}
                        title={isSelf(user) ? t('admins.actions.tooltipSelf') : ''}
                        className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        <i className="fas fa-user-slash" />
                        {t('admins.actions.deactivate')}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivateAdmin(user)}
                        disabled={reactivatingUser === user.person_id || isSelf(user)}
                        title={isSelf(user) ? t('admins.actions.tooltipSelf') : ''}
                        className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {reactivatingUser === user.person_id ? (
                          <><i className="fas fa-spinner fa-spin" />{t('admins.actions.reactivating')}</>
                        ) : (
                          <><i className="fas fa-user-check" />{t('admins.actions.reactivate')}</>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Superuser controls — only for active users */}
                  {user.is_active_user && (
                    <div className="flex gap-2">
                      {user.is_superUser === 1 ? (
                        <button
                          onClick={() => handleRevokeSuperuser(user)}
                          disabled={revokingSuperuser === user.person_id || isSelf(user)}
                          title={isSelf(user) ? t('admins.actions.tooltipSelf') : ''}
                          className="flex-1 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium hover:bg-orange-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {revokingSuperuser === user.person_id ? (
                            <><i className="fas fa-spinner fa-spin" />{t('admins.actions.revoking')}</>
                          ) : (
                            <><i className="fas fa-crown" />{t('admins.actions.revokeSuperuser')}</>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGrantSuperuser(user)}
                          disabled={grantingSuperuser === user.person_id || isSelf(user)}
                          title={isSelf(user) ? t('admins.actions.tooltipSelf') : ''}
                          className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium hover:bg-yellow-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {grantingSuperuser === user.person_id ? (
                            <><i className="fas fa-spinner fa-spin" />{t('admins.actions.granting')}</>
                          ) : (
                            <><i className="fas fa-crown" />{t('admins.actions.grantSuperuser')}</>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Empty state ── */}
          {filteredUsers.length === 0 && (
            <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <i className="fas fa-users text-gray-400 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('admins.empty.title')}</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterStatus !== 'all'
                  ? t('admins.empty.withFilter')
                  : t('admins.empty.noAdmins')}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Link
                  to="/app/create-admin"
                  className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ backgroundColor: '#0B2863' }}
                >
                  <i className="fas fa-plus" />
                  {t('admins.createFirstAdmin')}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Deactivation Modal ── */}
      {deactivationState.step !== 'idle' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <i className="fas fa-user-slash text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {deactivationState.step === 'requesting'
                    ? t('admins.deactivationModal.titleDeactivate')
                    : t('admins.deactivationModal.titleVerify')}
                </h3>
                <p className="text-gray-500 text-sm">@{deactivationState.userName}</p>
              </div>
            </div>

            {/* Requesting step */}
            {deactivationState.step === 'requesting' && (
              <div className="text-center py-8">
                {deactivationState.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4" />
                    <p className="text-gray-600">{t('admins.deactivationModal.sendingCode')}</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-700 mb-3">{t('admins.deactivationModal.confirmQuestion')}</p>
                    <p className="text-sm text-gray-500">{t('admins.deactivationModal.codeSentNote')}</p>
                  </>
                )}
              </div>
            )}

            {/* Confirming step */}
            {deactivationState.step === 'confirming' && (
              <div className="py-4">
                <p className="text-gray-700 mb-4">{t('admins.deactivationModal.codeReceivedNote')}</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admins.deactivationModal.codeLabel')}
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder={t('admins.deactivationModal.codePlaceholder')}
                    value={deactivationState.code}
                    onChange={(e) =>
                      setDeactivationState(prev => ({
                        ...prev,
                        code: e.target.value.replace(/\D/g, '').slice(0, 4),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center text-lg font-mono"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                disabled={deactivationState.isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('admins.deactivationModal.cancel')}
              </button>

              {deactivationState.step === 'confirming' && (
                <button
                  onClick={handleConfirmDeactivation}
                  disabled={deactivationState.isLoading || deactivationState.code.length !== 4}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deactivationState.isLoading ? (
                    <><i className="fas fa-spinner fa-spin" />{t('admins.deactivationModal.deactivating')}</>
                  ) : (
                    <><i className="fas fa-check" />{t('admins.deactivationModal.confirm')}</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminsPage;