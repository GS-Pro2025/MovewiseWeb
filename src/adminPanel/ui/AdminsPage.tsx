/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import { AdminUser } from '../domain/adminDomain';
import { getCompanyUsers, requestDeactivation, confirmDeactivation, reactivateAdmin } from '../data/RepositoryAdmin';

interface DeactivationState {
  personId: number | null;
  userName: string;
  step: 'idle' | 'requesting' | 'confirming';
  code: string;
  isLoading: boolean;
}

const AdminsPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [reactivatingUser, setReactivatingUser] = useState<number | null>(null);
  const [deactivationState, setDeactivationState] = useState<DeactivationState>({
    personId: null,
    userName: '',
    step: 'idle',
    code: '',
    isLoading: false,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await getCompanyUsers();
      console.log('API Response:', response);
      setUsers(response.data);
      setTotalUsers(response.total_users);
      setCompanyId(response.company_id);
    } catch (error: any) {
      console.error('Error loading users:', error);
      enqueueSnackbar(error.message || 'Error loading users', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeactivation = async (user: AdminUser) => {
    setDeactivationState({
      personId: user.person_id,
      userName: user.user_name,
      step: 'requesting',
      code: '',
      isLoading: true,
    });

    try {
      await requestDeactivation(user.person_id);
      setDeactivationState(prev => ({
        ...prev,
        step: 'confirming',
        isLoading: false,
      }));
      enqueueSnackbar('Verification code sent to admin email', { variant: 'info' });
    } catch (error: any) {
      console.error('Error requesting deactivation:', error);
      enqueueSnackbar(error.message || 'Error requesting deactivation', { variant: 'error' });
      setDeactivationState(prev => ({ ...prev, step: 'idle', isLoading: false }));
    }
  };

  const handleConfirmDeactivation = async () => {
    if (!deactivationState.personId || !deactivationState.code.trim()) {
      enqueueSnackbar('Please enter the verification code', { variant: 'warning' });
      return;
    }

    setDeactivationState(prev => ({ ...prev, isLoading: true }));

    try {
      await confirmDeactivation(deactivationState.personId, deactivationState.code);
      
      // Actualizar el usuario en la lista local
      setUsers(users.map(user => 
        user.person_id === deactivationState.personId 
          ? { ...user, is_active_user: false }
          : user
      ));

      enqueueSnackbar('Admin deactivated successfully', { variant: 'success' });
      setDeactivationState({
        personId: null,
        userName: '',
        step: 'idle',
        code: '',
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Error confirming deactivation:', error);
      enqueueSnackbar(error.message || 'Error confirming deactivation', { variant: 'error' });
      setDeactivationState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleReactivateAdmin = async (user: AdminUser) => {
    setReactivatingUser(user.person_id);

    try {
      await reactivateAdmin(user.person_id);
      
      // Actualizar el usuario en la lista local
      setUsers(users.map(u => 
        u.person_id === user.person_id 
          ? { ...u, is_active_user: true }
          : u
      ));

      enqueueSnackbar('Admin reactivated successfully', { variant: 'success' });
    } catch (error: any) {
      console.error('Error reactivating admin:', error);
      enqueueSnackbar(error.message || 'Error reactivating admin', { variant: 'error' });
    } finally {
      setReactivatingUser(null);
    }
  };

  const closeModal = () => {
    setDeactivationState({
      personId: null,
      userName: '',
      step: 'idle',
      code: '',
      isLoading: false,
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.person.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.person.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.person.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active_user) ||
                         (filterStatus === 'inactive' && !user.is_active_user);
    
    return matchesSearch && matchesFilter;
  });

  const getIdTypeLabel = (typeId: string) => {
    const types: { [key: string]: string } = {
      'DL': 'Driver\'s License',
      'SI': 'State ID',
      'GC': 'Green Card',
      'PA': 'Passport',
      'driver license': 'Driver\'s License',
      'Passport': 'Passport'
    };
    return types[typeId] || typeId;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <i className="fas fa-users-cog text-white text-xl"></i>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Company Administrators
                    </h1>
                    <p className="text-gray-600">Manage your company's admin users</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Company ID: {companyId}</span>
                  <span>•</span>
                  <span>Total Users: {totalUsers}</span>
                </div>
              </div>
              
              <Link
                to="/create-admin"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
              >
                <i className="fas fa-plus"></i>
                Add New Admin
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search by username, name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="md:w-48">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user.user_name}
                className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* User Avatar */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                    <img
                      src={
                        user.photo && user.photo.trim() !== ''
                          ? user.photo
                          : 'https://ui-avatars.com/api/?name=' +
                            encodeURIComponent(`${user.person.first_name} ${user.person.last_name}`) +
                            '&background=0458AB&color=fff&size=128'
                      }
                      alt="User Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.person.first_name} {user.person.last_name}
                    </h3>
                    <p className="text-gray-600 text-sm">@{user.user_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${user.is_active_user ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={`text-xs font-medium ${user.is_active_user ? 'text-green-600' : 'text-red-600'}`}>
                        {user.is_active_user ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="fas fa-envelope w-4"></i>
                    <span className="truncate">{user.person.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="fas fa-phone w-4"></i>
                    <span>{user.person.phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="fas fa-id-card w-4"></i>
                    <span>{getIdTypeLabel(user.person.type_id)}: {user.person.id_number}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="fas fa-calendar w-4"></i>
                    <span>Born: {new Date(user.person.birth_date).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="fas fa-clock w-4"></i>
                    <span>Created: {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="fas fa-map-marker-alt w-4"></i>
                    <span className="truncate">{user.person.address}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {user.is_active_user ? (
                    <button
                      onClick={() => handleRequestDeactivation(user)}
                      disabled={deactivationState.isLoading}
                      className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="fas fa-user-slash"></i>
                      <span>Deactivate</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReactivateAdmin(user)}
                      disabled={reactivatingUser === user.person_id}
                      className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reactivatingUser === user.person_id ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          <span>Reactivating...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-user-check"></i>
                          <span>Reactivate</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredUsers.length === 0 && (
            <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <i className="fas fa-users text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No administrators have been created yet.'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Link
                  to="/create-admin"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                >
                  <i className="fas fa-plus"></i>
                  Create First Admin
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Deactivation Modal */}
      {deactivationState.step !== 'idle' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <i className="fas fa-user-slash text-red-600"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {deactivationState.step === 'requesting' ? 'Deactivate Admin' : 'Enter Verification Code'}
                </h3>
                <p className="text-gray-600 text-sm">@{deactivationState.userName}</p>
              </div>
            </div>

            {deactivationState.step === 'requesting' && (
              <div className="text-center py-8">
                {deactivationState.isLoading ? (
                  <div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Sending verification code...</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-700 mb-4">
                      Are you sure you want to deactivate this administrator?
                    </p>
                    <p className="text-sm text-gray-500">
                      A verification code will be sent to their email.
                    </p>
                  </div>
                )}
              </div>
            )}

            {deactivationState.step === 'confirming' && (
              <div className="py-4">
                <p className="text-gray-700 mb-4">
                  A 4-digit verification code has been sent to the admin's email.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="Enter 4-digit code"
                      value={deactivationState.code}
                      onChange={(e) => setDeactivationState(prev => ({ 
                        ...prev, 
                        code: e.target.value.replace(/\D/g, '').slice(0, 4) 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center text-lg font-mono"
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                disabled={deactivationState.isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              
              {deactivationState.step === 'confirming' && (
                <button
                  onClick={handleConfirmDeactivation}
                  disabled={deactivationState.isLoading || deactivationState.code.length !== 4}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deactivationState.isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Deactivating...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i>
                      <span>Confirm</span>
                    </>
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