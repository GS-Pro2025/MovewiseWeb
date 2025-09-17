import React, { useEffect, useState } from 'react';
import { ResponsivePie } from '@nivo/pie';

interface MonthlyTargetCardProps {
  percent: number;
  change: number;
  target: string;
  revenue: string;
  today: string;
  totalExpenses?: number;
  grandTotal?: number;
  previousExpenses?: number;
  previousGrandTotal?: number;
  debt?: number;
  selectedWeek: number;
  selectedYear: number;
}

interface BasicOrderData {
  key: string;
  key_ref: string;
  date: string;
  status: string;
  payStatus: number;
}

const MonthlyTargetCard: React.FC<MonthlyTargetCardProps> = ({
  change,
  totalExpenses = 0,
  grandTotal = 0,
  debt = 0,
  selectedWeek,
  selectedYear
}) => {
  const [weeklyOrders, setWeeklyOrders] = useState<BasicOrderData[]>([]);
  const [loading, setLoading] = useState(false);

  // Simple API call using fetch directly
  useEffect(() => {
    console.log('=== MonthlyTargetCard useEffect triggered ===');
    console.log('selectedWeek:', selectedWeek);
    console.log('selectedYear:', selectedYear);

    const fetchWeeklyOrders = async () => {
      try {
        setLoading(true);
        console.log('Starting API call...');
        
        const token = document.cookie.split('; ')
          .find(row => row.startsWith('authToken='))
          ?.split('=')[1];
        
        console.log('Token found:', !!token);
        if (!token) {
          console.log('No token found, skipping API call');
          return;
        }

        const baseUrl = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';
        const url = `${baseUrl}/orders-basic-data-list/?year=${selectedYear}&week=${selectedWeek}`;
        console.log('Making request to:', url);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Error response:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('=== RAW API RESPONSE ===');
        console.log(data);
        console.log('========================');
        
        // Handle different possible response structures
        if (data.data && Array.isArray(data.data)) {
          console.log('Using data.data, length:', data.data.length);
          setWeeklyOrders(data.data);
        } else if (data.orders && Array.isArray(data.orders)) {
          console.log('Using data.orders, length:', data.orders.length);
          setWeeklyOrders(data.orders);
        } else if (Array.isArray(data)) {
          console.log('Using data as array, length:', data.length);
          setWeeklyOrders(data);
        } else {
          console.log('Unexpected data structure. Keys:', Object.keys(data));
          console.log('Full data:', JSON.stringify(data, null, 2));
        }
        
      } catch (error) {
        console.error('=== API ERROR ===');
        console.error(error);
        console.error('================');
      } finally {
        setLoading(false);
        console.log('Loading finished');
      }
    };

    if (selectedWeek && selectedYear) {
      console.log('Conditions met, calling API...');
      fetchWeeklyOrders();
    } else {
      console.log('Conditions NOT met. selectedWeek:', selectedWeek, 'selectedYear:', selectedYear);
    }
  }, [selectedWeek, selectedYear]);

  // Calculate real metrics from fetched data
  const realMetrics = weeklyOrders.length > 0 ? (() => {
    console.log('Calculating metrics from orders:', weeklyOrders);
    
    // Los datos no tienen income ni client_name, pero podemos calcular métricas básicas
    const totalOrders = weeklyOrders.length;
    
    // payStatus: 0 = unpaid, 1 = paid (asumo basándome en los datos que vi)
    const paidOrders = weeklyOrders.filter(order => order.payStatus === 1);
    const unpaidOrders = weeklyOrders.filter(order => order.payStatus === 0);
    
    const paymentRate = (paidOrders.length / totalOrders) * 100;
    
    console.log('Metrics calculated:', {
      totalOrders,
      paidCount: paidOrders.length,
      unpaidCount: unpaidOrders.length,
      paymentRate
    });

    // Agrupar por key_ref (cliente) para encontrar top performer
    const clientStats = weeklyOrders.reduce((acc, order) => {
      const client = order.key_ref || 'Unknown';
      if (!acc[client]) acc[client] = { orders: 0 };
      acc[client].orders += 1;
      return acc;
    }, {} as Record<string, { orders: number }>);

    const topClient = Object.entries(clientStats)
      .sort(([,a], [,b]) => b.orders - a.orders)[0];

    return {
      totalOrders,
      paidOrders: paidOrders.length,
      unpaidOrders: unpaidOrders.length,
      paymentRate,
      topClient: topClient ? { name: topClient[0], orders: topClient[1].orders } : null
    };
  })() : null;

  // Financial calculations
  const netProfit = grandTotal - totalExpenses;
  const profitMargin = grandTotal > 0 ? ((netProfit / grandTotal) * 100) : 0;
  const expenseRatio = grandTotal > 0 ? ((totalExpenses / grandTotal) * 100) : 0;

  // Health score calculation
  const getHealthScore = () => {
    let score = 0;
    if (profitMargin > 20) score += 30;
    else if (profitMargin > 10) score += 20;
    else if (profitMargin > 0) score += 10;
    
    if (change > 15) score += 25;
    else if (change > 5) score += 15;
    else if (change > 0) score += 10;
    
    if (expenseRatio < 70) score += 25;
    else if (expenseRatio < 85) score += 15;
    
    if (realMetrics && realMetrics.paymentRate > 85) score += 20;
    else if (realMetrics && realMetrics.paymentRate > 70) score += 10;
    
    if (score >= 80) return { score, status: 'Excellent', color: '#22c55e' };
    if (score >= 60) return { score, status: 'Good', color: '#FFE67B' };
    if (score >= 40) return { score, status: 'Fair', color: '#f97316' };
    return { score, status: 'Critical', color: '#ef4444' };
  };

  const healthMetrics = getHealthScore();

  // Pie chart data - usando los datos reales disponibles
  const pieData = realMetrics ? [
    {
      id: 'Paid Orders',
      label: 'Paid Orders',
      value: realMetrics.paidOrders,
      color: '#22c55e'
    },
    {
      id: 'Unpaid Orders',
      label: 'Unpaid Orders', 
      value: realMetrics.unpaidOrders,
      color: '#F09F52'
    }
  ] : [];

  // Formatters
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const formatLargeNumber = (amount: number) => {
    if (Math.abs(amount) >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (Math.abs(amount) >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return formatCurrency(amount);
  };

  if (loading) {
    return (
      <div 
        className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg mx-auto border-2"
        style={{ borderColor: '#0B2863' }}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm text-gray-600">Loading week {selectedWeek} data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg mx-auto border-2 hover:shadow-xl transition-all duration-200"
      style={{ borderColor: '#0B2863' }}
    >
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-1" style={{ color: '#0B2863' }}>
          Week {selectedWeek} Financial Analysis
        </h2>
        <p className="text-xs text-gray-500">
          {realMetrics ? 
            `${realMetrics.totalOrders} orders • ${realMetrics.paymentRate.toFixed(1)}% paid` : 
            'Loading weekly data...'
          }
        </p>
      </div>
      
      {/* Financial Health Score */}
      <div className="text-center mb-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(11, 40, 99, 0.05)' }}>
        <div className="text-3xl font-bold" style={{ color: healthMetrics.color }}>
          {healthMetrics.score}/100
        </div>
        <div 
          className="text-sm font-semibold px-3 py-1 rounded-full inline-block mt-1"
          style={{ backgroundColor: healthMetrics.color, color: 'white' }}
        >
          {healthMetrics.status}
        </div>
        <div className="text-xs text-gray-600 mt-1">Financial Health Score</div>
      </div>

      {/* Chart or Order Count Display */}
      {realMetrics && realMetrics.totalOrders > 0 ? (
        <div className="h-48 mb-4">
          <ResponsivePie
            data={pieData}
            margin={{ top: 20, right: 60, bottom: 20, left: 60 }}
            innerRadius={0.6}
            padAngle={2}
            cornerRadius={3}
            colors={['#22c55e', '#F09F52']}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor="white"
            motionConfig="gentle"
          />
        </div>
      ) : (
        <div className="h-48 mb-4 flex items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(11, 40, 99, 0.05)' }}>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2" style={{ color: '#0B2863' }}>
              {realMetrics?.totalOrders || 0}
            </div>
            <div className="text-gray-500 text-sm">Total Orders This Week</div>
          </div>
        </div>
      )}

      {/* Weekly Metrics */}
      {realMetrics && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
            <div className="text-xs text-gray-600 font-medium mb-1">Payment Rate</div>
            <div className="text-lg font-bold" style={{ color: '#22c55e' }}>
              {realMetrics.paymentRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              {realMetrics.paidOrders}/{realMetrics.totalOrders} paid
            </div>
          </div>

          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(11, 40, 99, 0.1)' }}>
            <div className="text-xs text-gray-600 font-medium mb-1">Total Orders</div>
            <div className="text-lg font-bold" style={{ color: '#0B2863' }}>
              {realMetrics.totalOrders}
            </div>
            <div className="text-xs text-gray-500">
              Week {selectedWeek}
            </div>
          </div>

          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 230, 123, 0.3)' }}>
            <div className="text-xs text-gray-600 font-medium mb-1">Paid Orders</div>
            <div className="text-lg font-bold" style={{ color: '#22c55e' }}>
              {realMetrics.paidOrders}
            </div>
          </div>

          <div className="text-center p-3 rounded-xl bg-gray-50">
            <div className="text-xs text-gray-600 font-medium mb-1">Pending</div>
            <div className="text-lg font-bold" style={{ color: '#F09F52' }}>
              {realMetrics.unpaidOrders}
            </div>
          </div>
        </div>
      )}

      {/* Top Client */}
      {realMetrics?.topClient && (
        <div className="p-3 rounded-xl mb-4" style={{ backgroundColor: 'rgba(255, 230, 123, 0.1)' }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: '#0B2863' }}>
            Most Active Client
          </h3>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold text-sm">{realMetrics.topClient.name}</div>
              <div className="text-xs text-gray-600">{realMetrics.topClient.orders} orders</div>
            </div>
            <div className="text-right font-bold" style={{ color: '#22c55e' }}>
              {((realMetrics.topClient.orders / realMetrics.totalOrders) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Debt Alert */}
      {debt > 0 && (
        <div className="p-3 rounded-lg text-white text-center" style={{ backgroundColor: '#ef4444' }}>
          <div className="text-sm font-bold">Outstanding Debt: {formatLargeNumber(debt)}</div>
        </div>
      )}
    </div>
  );
};

export default MonthlyTargetCard;