import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { PoultryBatch, BatchPerformance, ProductionType } from '../../../types';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function PerformanceDashboard() {
  const [batches, setBatches] = useState<PoultryBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [performanceData, setPerformanceData] = useState<Map<string, BatchPerformance>>(new Map());
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (batches.length > 0) {
      calculatePerformance();
    }
  }, [batches, selectedBatch, dateFrom, dateTo]);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('poultry_batches')
        .select('*')
        .order('placement_date', { ascending: false });
      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformance = async () => {
    const perfMap = new Map<string, BatchPerformance>();
    
    for (const batch of batches) {
      if (selectedBatch !== 'all' && batch.id !== selectedBatch) continue;

      try {
        // Fetch related data
        const [stockMovements, feedIssuances, sales, productions] = await Promise.all([
          supabase.from('batch_stock_movements').select('*').eq('batch_id', batch.id),
          supabase.from('feed_issuance').select('*').eq('batch_id', batch.id),
          batch.production_type === 'Broiler' 
            ? supabase.from('broiler_sales').select('*').eq('batch_id', batch.id)
            : supabase.from('layer_sales').select('*').eq('batch_id', batch.id),
          batch.production_type === 'Broiler'
            ? supabase.from('broiler_production').select('*').eq('batch_id', batch.id)
            : supabase.from('layer_production').select('*').eq('batch_id', batch.id),
        ]);

        const movements = stockMovements.data || [];
        const feeds = feedIssuances.data || [];
        const salesData = sales.data || [];
        const prodData = productions.data || [];

        // Calculate mortality
        const totalMortalities = movements.reduce((sum, m) => sum + m.mortalities, 0);
        const mortalityPercentage = batch.initial_quantity > 0 
          ? (totalMortalities / batch.initial_quantity) * 100 
          : 0;

        // Calculate costs
        const totalFeedCost = feeds.reduce((sum, f) => sum + (f.total_cost || 0), 0);
        const totalCosts = totalFeedCost; // Add other costs as needed

        // Calculate revenue
        const totalRevenue = salesData.reduce((sum, s) => sum + (s.total_amount || 0), 0);

        // Calculate KPIs based on production type
        let fcr: number | undefined;
        let productionPercentage: number | undefined;
        let feedCostPerEgg: number | undefined;

        if (batch.production_type === 'Broiler') {
          const totalFeed = feeds.reduce((sum, f) => sum + (f.quantity_kg || 0), 0);
          const totalWeight = salesData.reduce((sum, s) => sum + (s.total_weight_kg || 0), 0);
          if (totalWeight > 0) {
            fcr = totalFeed / totalWeight;
          }
        } else {
          const totalEggs = prodData.reduce((sum, p) => sum + (p.total_eggs || 0), 0);
          const latestProd = prodData[0];
          if (latestProd && latestProd.current_bird_count > 0) {
            productionPercentage = (latestProd.total_eggs / latestProd.current_bird_count) * 100;
          }
          if (totalEggs > 0) {
            feedCostPerEgg = totalFeedCost / totalEggs;
          }
        }

        const netProfit = totalRevenue - totalCosts;
        const profitabilityPercentage = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        perfMap.set(batch.id, {
          batch_id: batch.id,
          batch_flock_id: batch.batch_flock_id,
          production_type: batch.production_type,
          mortality_percentage: mortalityPercentage,
          fcr,
          production_percentage: productionPercentage,
          feed_cost_per_egg: feedCostPerEgg,
          total_revenue: totalRevenue,
          total_costs: totalCosts,
          net_profit: netProfit,
          profitability_percentage: profitabilityPercentage,
        });
      } catch (error) {
        console.error(`Error calculating performance for batch ${batch.id}:`, error);
      }
    }

    setPerformanceData(perfMap);
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBg = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value >= thresholds.good) return 'bg-green-100';
    if (value >= thresholds.warning) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const filteredBatches = selectedBatch === 'all' 
    ? batches 
    : batches.filter(b => b.id === selectedBatch);

  const chartData = Array.from(performanceData.values()).map(perf => ({
    name: perf.batch_flock_id,
    revenue: perf.total_revenue,
    costs: perf.total_costs,
    profit: perf.net_profit,
    mortality: perf.mortality_percentage,
    fcr: perf.fcr || 0,
    production: perf.production_percentage || 0,
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch/Flock</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Batches</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>{batch.batch_flock_id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredBatches.map((batch) => {
          const perf = performanceData.get(batch.id);
          if (!perf) return null;

          return (
            <div key={batch.id} className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-semibold mb-4">{batch.batch_flock_id}</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Mortality %</p>
                  <p className={`text-2xl font-bold ${
                    perf.mortality_percentage < 5 ? 'text-green-600' :
                    perf.mortality_percentage < 10 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {perf.mortality_percentage.toFixed(2)}%
                  </p>
                </div>
                {batch.production_type === 'Broiler' && perf.fcr !== undefined && (
                  <div>
                    <p className="text-sm text-gray-600">FCR</p>
                    <p className={`text-2xl font-bold ${
                      perf.fcr < 2 ? 'text-green-600' :
                      perf.fcr < 2.5 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {perf.fcr.toFixed(2)}
                    </p>
                  </div>
                )}
                {batch.production_type === 'Layer' && perf.production_percentage !== undefined && (
                  <div>
                    <p className="text-sm text-gray-600">Production %</p>
                    <p className={`text-2xl font-bold ${
                      perf.production_percentage >= 80 ? 'text-green-600' :
                      perf.production_percentage >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {perf.production_percentage.toFixed(2)}%
                    </p>
                  </div>
                )}
                {batch.production_type === 'Layer' && perf.feed_cost_per_egg !== undefined && (
                  <div>
                    <p className="text-sm text-gray-600">Feed Cost/Egg</p>
                    <p className="text-2xl font-bold">KES {perf.feed_cost_per_egg.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">KES {perf.total_revenue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className={`text-2xl font-bold ${perf.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    KES {perf.net_profit.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Profitability %</p>
                  <p className={`text-2xl font-bold ${perf.profitability_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {perf.profitability_percentage.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue vs Expenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                <Bar dataKey="costs" fill="#ef4444" name="Costs" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Profitability Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="Net Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Mortality Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="mortality" stroke="#ef4444" name="Mortality %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">FCR Trends (Broilers)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.filter(d => d.fcr > 0)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="fcr" stroke="#f59e0b" name="FCR" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

