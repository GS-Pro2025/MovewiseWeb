import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchOrdersBasicDataList } from '../data/repositoryStatistics';
import { OrdersBasicDataResponse } from '../domain/BasicOrdersDataModels';

interface ZoneStats {
  zone: string;
  count: number;
  percentage: number;
  avgWeight: number;
  totalWeight: number;
}

interface JobTypeStats {
  jobType: string;
  count: number;
  percentage: number;
  avgWeight: number;
  totalWeight: number;
}

interface WeightRangeStats {
  range: string;
  count: number;
  percentage: number;
  avgIncome: number;
  totalIncome: number;
}

interface CustomerStats {
  customer: string;
  count: number;
  percentage: number;
  avgWeight: number;
  totalWeight: number;
  totalIncome: number;
  avgIncome: number;
}

const OrderBreakdownPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ordersData, setOrdersData] = useState<OrdersBasicDataResponse | null>(null);

  // NUEVO: Estados para filtros y búsquedas
  const [zoneSearchTerm, setZoneSearchTerm] = useState<string>('');
  const [jobSearchTerm, setJobSearchTerm] = useState<string>('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('');
  const [selectedWeightRange, setSelectedWeightRange] = useState<string>('all');
  const [showAllZones, setShowAllZones] = useState<boolean>(false);
  const [showAllJobs, setShowAllJobs] = useState<boolean>(false);
  const [showAllCustomers, setShowAllCustomers] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'zones' | 'jobs' | 'weights' | 'customers'>('zones');

  // NUEVO: Constante para el límite máximo de elementos
  const MAX_DISPLAY_ITEMS = 15;

  const year = parseInt(searchParams.get('year') || '2025');
  const week = parseInt(searchParams.get('week') || '1');

  useEffect(() => {
    const loadOrdersData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchOrdersBasicDataList(year, week);
        setOrdersData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading orders data');
        console.error('Error loading orders data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOrdersData();
  }, [year, week]);

  const { zoneStats, jobTypeStats, weightRangeStats, customerStats, filteredZoneStats, filteredJobStats, filteredCustomerStats } = useMemo(() => {
    if (!ordersData?.data || ordersData.data.length === 0) {
      return { 
        zoneStats: [], 
        jobTypeStats: [], 
        weightRangeStats: [], 
        customerStats: [],
        filteredZoneStats: [], 
        filteredJobStats: [],
        filteredCustomerStats: []
      };
    }

    const orders = ordersData.data;

    // 1. Análisis por zonas
    const zoneMap = new Map<string, { count: number; totalWeight: number }>();
    orders.forEach(order => {
      const zone = order.state_usa || 'Unknown';
      if (!zoneMap.has(zone)) {
        zoneMap.set(zone, { count: 0, totalWeight: 0 });
      }
      const zoneData = zoneMap.get(zone)!;
      zoneData.count += 1;
      zoneData.totalWeight += order.weight || 0;
    });

    const zoneStats: ZoneStats[] = Array.from(zoneMap.entries()).map(([zone, data]) => ({
      zone,
      count: data.count,
      percentage: (data.count / orders.length) * 100,
      avgWeight: data.totalWeight / data.count,
      totalWeight: data.totalWeight
    })).sort((a, b) => b.count - a.count);

    // NUEVO: Filtrar zonas por búsqueda
    const filteredZoneStats = zoneStats.filter(zone =>
      zone.zone.toLowerCase().includes(zoneSearchTerm.toLowerCase())
    );

    // 2. Análisis por tipo de trabajo
    const jobMap = new Map<string, { count: number; totalWeight: number }>();
    orders.forEach(order => {
      const jobType = order.job_name?.trim() || 'Unknown';
      if (!jobMap.has(jobType)) {
        jobMap.set(jobType, { count: 0, totalWeight: 0 });
      }
      const jobData = jobMap.get(jobType)!;
      jobData.count += 1;
      jobData.totalWeight += order.weight || 0;
    });

    const jobTypeStats: JobTypeStats[] = Array.from(jobMap.entries()).map(([jobType, data]) => ({
      jobType,
      count: data.count,
      percentage: (data.count / orders.length) * 100,
      avgWeight: data.totalWeight / data.count,
      totalWeight: data.totalWeight
    })).sort((a, b) => b.count - a.count);

    // NUEVO: Filtrar jobs por búsqueda
    const filteredJobStats = jobTypeStats.filter(job =>
      job.jobType.toLowerCase().includes(jobSearchTerm.toLowerCase())
    );

    // 3. NUEVO: Análisis por customer factory
    const customerMap = new Map<string, { count: number; totalWeight: number; totalIncome: number }>();
    orders.forEach(order => {
      const customer = order.customer_factory_name?.trim() || 'Unknown';
      if (!customerMap.has(customer)) {
        customerMap.set(customer, { count: 0, totalWeight: 0, totalIncome: 0 });
      }
      const customerData = customerMap.get(customer)!;
      customerData.count += 1;
      customerData.totalWeight += order.weight || 0;
      customerData.totalIncome += order.income || 0;
    });

    const customerStats: CustomerStats[] = Array.from(customerMap.entries()).map(([customer, data]) => ({
      customer,
      count: data.count,
      percentage: (data.count / orders.length) * 100,
      avgWeight: data.totalWeight / data.count,
      totalWeight: data.totalWeight,
      totalIncome: data.totalIncome,
      avgIncome: data.totalIncome / data.count
    })).sort((a, b) => b.count - a.count);

    // NUEVO: Filtrar customers por búsqueda
    const filteredCustomerStats = customerStats.filter(customer =>
      customer.customer.toLowerCase().includes(customerSearchTerm.toLowerCase())
    );

    // 4. Análisis por rango de peso (mejorado con más rangos)
    const weightRanges = [
      { min: 0, max: 30, label: '0-30 lbs' },
      { min: 30, max: 100, label: '30-100 lbs' },
      { min: 100, max: 500, label: '100-500 lbs' },
      { min: 500, max: 2000, label: '500-2000 lbs' },
      { min: 2000, max: 5000, label: '2000-5000 lbs' },
      { min: 5000, max: 10000, label: '5000-10000 lbs' },
      { min: 10000, max: 15000, label: '10000-15000 lbs' },
      { min: 15000, max: 20000, label: '15000-20000 lbs' },
      { min: 20000, max: Infinity, label: '20000+ lbs' }
    ];

    let weightRangeStats: WeightRangeStats[] = weightRanges.map(range => {
      const ordersInRange = orders.filter(order => {
        const weight = order.weight || 0;
        return weight >= range.min && weight < range.max;
      });

      const totalIncome = ordersInRange.reduce((sum, order) => sum + (order.income || 0), 0);
      const avgIncome = ordersInRange.length > 0 ? totalIncome / ordersInRange.length : 0;

      return {
        range: range.label,
        count: ordersInRange.length,
        percentage: (ordersInRange.length / orders.length) * 100,
        avgIncome,
        totalIncome
      };
    }).filter(stat => stat.count > 0);

    // NUEVO: Filtrar por rango de peso seleccionado
    if (selectedWeightRange !== 'all') {
      weightRangeStats = weightRangeStats.filter(stat => stat.range === selectedWeightRange);
    }

    return { 
      zoneStats, 
      jobTypeStats, 
      weightRangeStats, 
      customerStats, 
      filteredZoneStats, 
      filteredJobStats, 
      filteredCustomerStats 
    };
  }, [ordersData, zoneSearchTerm, jobSearchTerm, customerSearchTerm, selectedWeightRange]);

  // ACTUALIZADO: Función para limpiar filtros según el tab activo
  const clearFilters = () => {
    if (activeTab === 'zones') {
      setZoneSearchTerm('');
      setShowAllZones(false);
    } else if (activeTab === 'jobs') {
      setJobSearchTerm('');
      setShowAllJobs(false);
    } else if (activeTab === 'customers') {
      setCustomerSearchTerm('');
      setShowAllCustomers(false);
    } else if (activeTab === 'weights') {
      setSelectedWeightRange('all');
    }
  };

  // NUEVO: Función para cambiar de tab y limpiar filtros no relacionados
  const handleTabChange = (tab: 'zones' | 'jobs' | 'weights' | 'customers') => {
    setActiveTab(tab);
    // Limpiar filtros de otros tabs
    if (tab !== 'zones') {
      setZoneSearchTerm('');
      setShowAllZones(false);
    }
    if (tab !== 'jobs') {
      setJobSearchTerm('');
      setShowAllJobs(false);
    }
    if (tab !== 'customers') {
      setCustomerSearchTerm('');
      setShowAllCustomers(false);
    }
    if (tab !== 'weights') {
      setSelectedWeightRange('all');
    }
  };

  // NUEVO: Función para obtener si hay filtros activos
  const hasActiveFilters = () => {
    switch (activeTab) {
      case 'zones':
        return zoneSearchTerm !== '';
      case 'jobs':
        return jobSearchTerm !== '';
      case 'customers':
        return customerSearchTerm !== '';
      case 'weights':
        return selectedWeightRange !== 'all';
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <i className="fas fa-spinner animate-spin text-blue-600 text-2xl"></i>
          <span className="text-gray-600 text-lg">Loading order breakdown...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <i className="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/statistics')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Statistics
          </button>
        </div>
      </div>
    );
  }

  const orders = ordersData?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Order Breakdown Analysis</h1>
              <p className="text-gray-600 mt-1">
                Detailed analysis for Week {week}, {year} • {orders.length} orders
              </p>
            </div>
            <button
              onClick={() => navigate('/statistics')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
              Back to Statistics
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{orders.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total Orders</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{zoneStats.length}</div>
            <div className="text-sm text-gray-600 mt-1">Active Zones</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{jobTypeStats.length}</div>
            <div className="text-sm text-gray-600 mt-1">Job Types</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600">{customerStats.length}</div>
            <div className="text-sm text-gray-600 mt-1">Customers</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">
              {orders.length > 0 ? (orders.reduce((sum, o) => sum + (o.weight || 0), 0) / orders.length).toFixed(1) : '0'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Avg Weight (lbs)</div>
          </div>
        </div>
      </div>

      {/* ACTUALIZADO: Filters and Tabs */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {/* Tabs */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleTabChange('zones')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'zones'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <i className="fas fa-map-marker-alt mr-2"></i>
                Zones ({filteredZoneStats.length})
              </button>
              <button
                onClick={() => handleTabChange('jobs')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'jobs'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <i className="fas fa-briefcase mr-2"></i>
                Jobs ({filteredJobStats.length})
              </button>
              <button
                onClick={() => handleTabChange('customers')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'customers'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <i className="fas fa-building mr-2"></i>
                Customers ({filteredCustomerStats.length})
              </button>
              <button
                onClick={() => handleTabChange('weights')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'weights'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <i className="fas fa-weight mr-2"></i>
                Weights ({weightRangeStats.length})
              </button>
            </div>

            {/* Clear Filters Button - Solo mostrar si hay filtros activos */}
            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <i className="fas fa-times"></i>
                Clear Filters
              </button>
            )}
          </div>

          {/* ACTUALIZADO: Filter Controls - Solo mostrar filtros del tab activo */}
          <div className="mb-6">
            {activeTab === 'zones' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Zones</label>
                  <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Search zones..."
                      value={zoneSearchTerm}
                      onChange={(e) => setZoneSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {zoneSearchTerm && (
                    <div className="text-xs text-gray-500 mt-1">
                      Found {filteredZoneStats.length} of {zoneStats.length} zones
                    </div>
                  )}
                </div>
                <div className="flex items-end">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Options</label>
                    <button
                      onClick={() => setShowAllZones(!showAllZones)}
                      className="w-full px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      {showAllZones ? `Show Top ${MAX_DISPLAY_ITEMS}` : 'Show All'}
                      <span className="ml-2 text-xs">
                        ({showAllZones ? filteredZoneStats.length : Math.min(filteredZoneStats.length, MAX_DISPLAY_ITEMS)})
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Job Types</label>
                  <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Search job types..."
                      value={jobSearchTerm}
                      onChange={(e) => setJobSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  {jobSearchTerm && (
                    <div className="text-xs text-gray-500 mt-1">
                      Found {filteredJobStats.length} of {jobTypeStats.length} job types
                    </div>
                  )}
                </div>
                <div className="flex items-end">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Options</label>
                    <button
                      onClick={() => setShowAllJobs(!showAllJobs)}
                      className="w-full px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      {showAllJobs ? `Show Top ${MAX_DISPLAY_ITEMS}` : 'Show All'}
                      <span className="ml-2 text-xs">
                        ({showAllJobs ? filteredJobStats.length : Math.min(filteredJobStats.length, MAX_DISPLAY_ITEMS)})
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'customers' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Company Customers</label>
                  <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  {customerSearchTerm && (
                    <div className="text-xs text-gray-500 mt-1">
                      Found {filteredCustomerStats.length} of {customerStats.length} customers
                    </div>
                  )}
                </div>
                <div className="flex items-end">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Options</label>
                    <button
                      onClick={() => setShowAllCustomers(!showAllCustomers)}
                      className="w-full px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      {showAllCustomers ? `Show Top ${MAX_DISPLAY_ITEMS}` : 'Show All'}
                      <span className="ml-2 text-xs">
                        ({showAllCustomers ? filteredCustomerStats.length : Math.min(filteredCustomerStats.length, MAX_DISPLAY_ITEMS)})
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'weights' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight Range Filter</label>
                  <select
                    value={selectedWeightRange}
                    onChange={(e) => setSelectedWeightRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Weight Ranges</option>
                    {weightRangeStats.map((range, index) => (
                      <option key={index} value={range.range}>
                        {range.range} ({range.count} orders)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Info</label>
                    <div className="px-4 py-2 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg text-sm">
                      {selectedWeightRange === 'all' 
                        ? `Showing all ${weightRangeStats.length} weight ranges`
                        : `Filtered to: ${selectedWeightRange}`
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'zones' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                <i className="fas fa-map-marker-alt text-blue-600 mr-3"></i>
                Orders by Zone
                {zoneSearchTerm && (
                  <span className="text-sm text-gray-500 ml-2">
                    (filtered: {filteredZoneStats.length} of {zoneStats.length})
                  </span>
                )}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(showAllZones ? filteredZoneStats : filteredZoneStats.slice(0, MAX_DISPLAY_ITEMS)).map((zone, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-800 text-sm">{zone.zone}</span>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {zone.count} orders
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${zone.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{zone.percentage.toFixed(1)}%</span>
                    <span>{zone.avgWeight.toFixed(1)} lbs avg</span>
                  </div>
                </div>
              ))}
            </div>
            {!showAllZones && filteredZoneStats.length > MAX_DISPLAY_ITEMS && (
              <div className="text-center mt-4">
                <span className="text-sm text-gray-500">
                  Showing {MAX_DISPLAY_ITEMS} of {filteredZoneStats.length} zones
                </span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                <i className="fas fa-briefcase text-green-600 mr-3"></i>
                Orders by Job Type
                {jobSearchTerm && (
                  <span className="text-sm text-gray-500 ml-2">
                    (filtered: {filteredJobStats.length} of {jobTypeStats.length})
                  </span>
                )}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(showAllJobs ? filteredJobStats : filteredJobStats.slice(0, MAX_DISPLAY_ITEMS)).map((job, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-800 capitalize text-sm">{job.jobType}</span>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {job.count} orders
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${job.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{job.percentage.toFixed(1)}%</span>
                    <span>{job.avgWeight.toFixed(1)} lbs avg</span>
                  </div>
                </div>
              ))}
            </div>
            {!showAllJobs && filteredJobStats.length > MAX_DISPLAY_ITEMS && (
              <div className="text-center mt-4">
                <span className="text-sm text-gray-500">
                  Showing {MAX_DISPLAY_ITEMS} of {filteredJobStats.length} job types
                </span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                <i className="fas fa-building text-indigo-600 mr-3"></i>
                Orders by Company Customers
                {customerSearchTerm && (
                  <span className="text-sm text-gray-500 ml-2">
                    (filtered: {filteredCustomerStats.length} of {customerStats.length})
                  </span>
                )}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(showAllCustomers ? filteredCustomerStats : filteredCustomerStats.slice(0, MAX_DISPLAY_ITEMS)).map((customer, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-800 text-sm">{customer.customer}</span>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {customer.count} orders
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${customer.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{customer.percentage.toFixed(1)}%</span>
                    <span>${customer.avgIncome.toFixed(0)} avg</span>
                  </div>
                </div>
              ))}
            </div>
            {!showAllCustomers && filteredCustomerStats.length > MAX_DISPLAY_ITEMS && (
              <div className="text-center mt-4">
                <span className="text-sm text-gray-500">
                  Showing {MAX_DISPLAY_ITEMS} of {filteredCustomerStats.length} customers
                </span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'weights' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              <i className="fas fa-weight text-purple-600 mr-3"></i>
              Orders by Weight Range
              {selectedWeightRange !== 'all' && (
                <span className="text-sm text-gray-500 ml-2">
                  (filtered: {selectedWeightRange})
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {weightRangeStats.map((range, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-800 text-sm">{range.range}</span>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {range.count} orders
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${range.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{range.percentage.toFixed(1)}%</span>
                    <span>${range.avgIncome.toFixed(0)} avg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Orders Table */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            <i className="fas fa-table text-gray-600 mr-3"></i>
            All Orders Details
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Client</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Zone</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Job Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Weight</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Income</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-mono text-blue-600">
                      {order.key_ref}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {order.person_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {order.state_usa}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                      {order.job_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {order.customer_factory_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {order.weight} lbs
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      ${order.income || 0}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBreakdownPage;