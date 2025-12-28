import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { PoultryBatch, BroilerProduction, BroilerSale, Farm, BatchPerformance } from '../../../types';
import { Plus, Edit, Search, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../../contexts/AuthContext';
import TableActions from '../../../components/admin/TableActions';

interface BroilersModuleProps {
  farms: Farm[];
}

export default function BroilersModule({ farms }: BroilersModuleProps) {
  const { user } = useAuth();
  const [batches, setBatches] = useState<PoultryBatch[]>([]);
  const [productions, setProductions] = useState<BroilerProduction[]>([]);
  const [sales, setSales] = useState<BroilerSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'batches' | 'production' | 'sales' | 'performance'>('batches');
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [editingProduction, setEditingProduction] = useState<BroilerProduction | null>(null);
  const [editingSale, setEditingSale] = useState<BroilerSale | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string>('');

  const [productionFormData, setProductionFormData] = useState({
    batch_id: '',
    date: new Date(),
    average_weight_kg: '',
    total_feed_consumed_kg: '',
    mortality_count: '0',
    current_count: '',
    notes: '',
  });

  const [saleFormData, setSaleFormData] = useState({
    batch_id: '',
    sale_date: new Date(),
    quantity: '',
    average_weight_kg: '',
    unit_price: '',
    customer_id: '',
    customer_name: '',
    payment_method: 'Cash' as const,
    payment_status: 'Pending' as const,
    notes: '',
  });

  const [filter, setFilter] = useState({
    search: '',
    batch: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    fetchBatches();
    fetchProductions();
    fetchSales();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('poultry_batches')
        .select('*')
        .eq('production_type', 'Broiler')
        .order('placement_date', { ascending: false });
      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductions = async () => {
    try {
      const { data, error } = await supabase
        .from('broiler_production')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      setProductions(data || []);
    } catch (error) {
      console.error('Error fetching productions:', error);
    }
  };

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('broiler_sales')
        .select('*')
        .order('sale_date', { ascending: false });
      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const calculateFCR = (batchId: string): number | null => {
    const batchProductions = productions.filter((p) => p.batch_id === batchId);
    const totalFeed = batchProductions.reduce((sum, p) => sum + (p.total_feed_consumed_kg || 0), 0);
    const totalWeight = sales
      .filter((s) => s.batch_id === batchId)
      .reduce((sum, s) => sum + (s.total_weight_kg || 0), 0);
    
    if (totalWeight === 0) return null;
    return totalFeed / totalWeight;
  };

  const calculatePerformance = (batch: PoultryBatch): BatchPerformance | null => {
    const batchProductions = productions.filter((p) => p.batch_id === batch.id);
    const batchSales = sales.filter((s) => s.batch_id === batch.id);
    
    if (batchProductions.length === 0) return null;

    const totalMortalities = batchProductions.reduce((sum, p) => sum + p.mortality_count, 0);
    const mortalityPercentage = batch.initial_quantity > 0 
      ? (totalMortalities / batch.initial_quantity) * 100 
      : 0;

    const fcr = calculateFCR(batch.id);
    const totalRevenue = batchSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    
    // Calculate costs (simplified - would need feed costs, medication costs, etc.)
    const totalCosts = 0; // This would be calculated from feed_issuance, medications, etc.
    const netProfit = totalRevenue - totalCosts;
    const profitabilityPercentage = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      batch_id: batch.id,
      batch_flock_id: batch.batch_flock_id,
      production_type: 'Broiler',
      mortality_percentage: mortalityPercentage,
      fcr: fcr || undefined,
      total_revenue: totalRevenue,
      total_costs: totalCosts,
      net_profit: netProfit,
      profitability_percentage: profitabilityPercentage,
    };
  };

  const handleProductionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const avgWeight = parseFloat(productionFormData.average_weight_kg);
      const prevProduction = productions
        .filter((p) => p.batch_id === productionFormData.batch_id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      const dailyGain = prevProduction && prevProduction.average_weight_kg
        ? avgWeight - prevProduction.average_weight_kg
        : null;

      const productionData: any = {
        batch_id: productionFormData.batch_id,
        date: productionFormData.date.toISOString().split('T')[0],
        average_weight_kg: productionFormData.average_weight_kg ? avgWeight : null,
        daily_gain_kg: dailyGain,
        total_feed_consumed_kg: productionFormData.total_feed_consumed_kg 
          ? parseFloat(productionFormData.total_feed_consumed_kg) 
          : null,
        mortality_count: parseInt(productionFormData.mortality_count) || 0,
        current_count: parseInt(productionFormData.current_count),
        notes: productionFormData.notes || null,
        created_by: user.id,
      };

      if (editingProduction) {
        const { error } = await supabase
          .from('broiler_production')
          .update({ ...productionData, updated_at: new Date().toISOString() })
          .eq('id', editingProduction.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('broiler_production')
          .insert([productionData]);
        if (error) throw error;
      }

      setShowProductionModal(false);
      setEditingProduction(null);
      resetProductionForm();
      fetchProductions();
    } catch (error) {
      console.error('Error saving production:', error);
      alert('Error saving production record');
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const quantity = parseInt(saleFormData.quantity);
      const avgWeight = parseFloat(saleFormData.average_weight_kg);
      const totalWeight = quantity * avgWeight;
      const unitPrice = parseFloat(saleFormData.unit_price);
      const totalAmount = totalWeight * unitPrice;

      const saleData: any = {
        batch_id: saleFormData.batch_id,
        sale_date: saleFormData.sale_date.toISOString().split('T')[0],
        quantity: quantity,
        average_weight_kg: avgWeight,
        total_weight_kg: totalWeight,
        unit_price: unitPrice,
        total_amount: totalAmount,
        customer_id: saleFormData.customer_id || null,
        customer_name: saleFormData.customer_name || null,
        payment_method: saleFormData.payment_method,
        payment_status: saleFormData.payment_status,
        notes: saleFormData.notes || null,
        created_by: user.id,
      };

      if (editingSale) {
        const { error } = await supabase
          .from('broiler_sales')
          .update({ ...saleData, updated_at: new Date().toISOString() })
          .eq('id', editingSale.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('broiler_sales')
          .insert([saleData]);
        if (error) throw error;
      }

      setShowSaleModal(false);
      setEditingSale(null);
      resetSaleForm();
      fetchSales();
    } catch (error) {
      console.error('Error saving sale:', error);
      alert('Error saving sale');
    }
  };

  const resetProductionForm = () => {
    setProductionFormData({
      batch_id: selectedBatch || '',
      date: new Date(),
      average_weight_kg: '',
      total_feed_consumed_kg: '',
      mortality_count: '0',
      current_count: '',
      notes: '',
    });
  };

  const resetSaleForm = () => {
    setSaleFormData({
      batch_id: selectedBatch || '',
      sale_date: new Date(),
      quantity: '',
      average_weight_kg: '',
      unit_price: '',
      customer_id: '',
      customer_name: '',
      payment_method: 'Cash',
      payment_status: 'Pending',
      notes: '',
    });
  };

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch = filter.search === '' ||
      batch.batch_flock_id.toLowerCase().includes(filter.search.toLowerCase()) ||
      batch.breed_strain.toLowerCase().includes(filter.search.toLowerCase());
    return matchesSearch;
  });

  const filteredProductions = productions.filter((p) => {
    const matchesBatch = filter.batch === '' || p.batch_id === filter.batch;
    const matchesDateFrom = filter.dateFrom === '' || new Date(p.date) >= new Date(filter.dateFrom);
    const matchesDateTo = filter.dateTo === '' || new Date(p.date) <= new Date(filter.dateTo);
    return matchesBatch && matchesDateFrom && matchesDateTo;
  });

  const filteredSales = sales.filter((s) => {
    const matchesBatch = filter.batch === '' || s.batch_id === filter.batch;
    const matchesDateFrom = filter.dateFrom === '' || new Date(s.sale_date) >= new Date(filter.dateFrom);
    const matchesDateTo = filter.dateTo === '' || new Date(s.sale_date) <= new Date(filter.dateTo);
    return matchesBatch && matchesDateFrom && matchesDateTo;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveView('batches')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeView === 'batches'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Batches
          </button>
          <button
            onClick={() => setActiveView('production')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeView === 'production'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Production Records
          </button>
          <button
            onClick={() => setActiveView('sales')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeView === 'sales'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sales & Disposal
          </button>
          <button
            onClick={() => setActiveView('performance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeView === 'performance'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Performance Dashboard
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={filter.batch}
            onChange={(e) => {
              setFilter({ ...filter, batch: e.target.value });
              setSelectedBatch(e.target.value);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Batches</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>{batch.batch_flock_id}</option>
            ))}
          </select>
          <input
            type="date"
            value={filter.dateFrom}
            onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
            placeholder="From Date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
          <input
            type="date"
            value={filter.dateTo}
            onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
            placeholder="To Date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Batches View */}
      {activeView === 'batches' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Broiler Batches</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breed/Strain</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placement Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Initial Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBatches.map((batch) => {
                    const farm = farms.find((f) => f.id === batch.farm_id);
                    return (
                      <tr key={batch.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{batch.batch_flock_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{farm?.name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{batch.breed_strain}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(batch.placement_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{batch.initial_quantity.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            batch.status === 'Active' ? 'bg-green-100 text-green-800' :
                            batch.status === 'Planned' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {batch.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Production Records View */}
      {activeView === 'production' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingProduction(null);
                resetProductionForm();
                setShowProductionModal(true);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus size={20} />
              Add Production Record
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Production Records</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Weight (kg)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Daily Gain (kg)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Feed (kg)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Mortality</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Count</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProductions.map((production) => {
                    const batch = batches.find((b) => b.id === production.batch_id);
                    return (
                      <tr key={production.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(production.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{batch?.batch_flock_id || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {production.average_weight_kg ? `${production.average_weight_kg.toFixed(2)} kg` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {production.daily_gain_kg ? `${production.daily_gain_kg > 0 ? '+' : ''}${production.daily_gain_kg.toFixed(2)} kg` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {production.total_feed_consumed_kg ? `${production.total_feed_consumed_kg.toFixed(2)} kg` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                          {production.mortality_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{production.current_count.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => {
                              setEditingProduction(production);
                              setProductionFormData({
                                batch_id: production.batch_id,
                                date: new Date(production.date),
                                average_weight_kg: production.average_weight_kg?.toString() || '',
                                total_feed_consumed_kg: production.total_feed_consumed_kg?.toString() || '',
                                mortality_count: production.mortality_count.toString(),
                                current_count: production.current_count.toString(),
                                notes: production.notes || '',
                              });
                              setShowProductionModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sales View */}
      {activeView === 'sales' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingSale(null);
                resetSaleForm();
                setShowSaleModal(true);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus size={20} />
              Record Sale
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Sales & Disposal Records</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Weight (kg)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSales.map((sale) => {
                    const batch = batches.find((b) => b.id === sale.batch_id);
                    return (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(sale.sale_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{batch?.batch_flock_id || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{sale.quantity.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {sale.total_weight_kg ? `${sale.total_weight_kg.toFixed(2)} kg` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {sale.unit_price ? `KES ${sale.unit_price.toLocaleString()}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                          {sale.total_amount ? `KES ${sale.total_amount.toLocaleString()}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{sale.customer_name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => {
                              setEditingSale(sale);
                              setSaleFormData({
                                batch_id: sale.batch_id,
                                sale_date: new Date(sale.sale_date),
                                quantity: sale.quantity.toString(),
                                average_weight_kg: sale.average_weight_kg?.toString() || '',
                                unit_price: sale.unit_price?.toString() || '',
                                customer_id: sale.customer_id || '',
                                customer_name: sale.customer_name || '',
                                payment_method: sale.payment_method || 'Cash',
                                payment_status: sale.payment_status || 'Pending',
                                notes: sale.notes || '',
                              });
                              setShowSaleModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Performance Dashboard View */}
      {activeView === 'performance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {batches.map((batch) => {
              const performance = calculatePerformance(batch);
              if (!performance) return null;
              
              const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
                if (value >= thresholds.good) return 'bg-green-100 text-green-800';
                if (value >= thresholds.warning) return 'bg-yellow-100 text-yellow-800';
                return 'bg-red-100 text-red-800';
              };

              return (
                <div key={batch.id} className="bg-white rounded-lg shadow p-6">
                  <h4 className="font-semibold text-lg mb-4">{batch.batch_flock_id}</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Mortality %</p>
                      <p className={`text-2xl font-bold ${getStatusColor(performance.mortality_percentage, { good: 0, warning: 5 })}`}>
                        {performance.mortality_percentage.toFixed(2)}%
                      </p>
                    </div>
                    {performance.fcr && (
                      <div>
                        <p className="text-sm text-gray-600">FCR (Feed Conversion Ratio)</p>
                        <p className={`text-2xl font-bold ${getStatusColor(performance.fcr, { good: 1.5, warning: 2.0 })}`}>
                          {performance.fcr.toFixed(2)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">
                        KES {performance.total_revenue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Net Profit</p>
                      <p className={`text-2xl font-bold ${performance.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        KES {performance.net_profit.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Profitability %</p>
                      <p className={`text-2xl font-bold ${getStatusColor(performance.profitability_percentage, { good: 20, warning: 10 })}`}>
                        {performance.profitability_percentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Production Modal */}
      {showProductionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingProduction ? 'Edit Production Record' : 'Add Production Record'}
            </h2>
            <form onSubmit={handleProductionSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch *</label>
                  <select
                    value={productionFormData.batch_id}
                    onChange={(e) => setProductionFormData({ ...productionFormData, batch_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Batch</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>{batch.batch_flock_id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <DatePicker
                    selected={productionFormData.date}
                    onChange={(date: Date) => setProductionFormData({ ...productionFormData, date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Average Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productionFormData.average_weight_kg}
                    onChange={(e) => setProductionFormData({ ...productionFormData, average_weight_kg: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Feed Consumed (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productionFormData.total_feed_consumed_kg}
                    onChange={(e) => setProductionFormData({ ...productionFormData, total_feed_consumed_kg: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mortality Count</label>
                  <input
                    type="number"
                    min="0"
                    value={productionFormData.mortality_count}
                    onChange={(e) => setProductionFormData({ ...productionFormData, mortality_count: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Count *</label>
                  <input
                    type="number"
                    min="0"
                    value={productionFormData.current_count}
                    onChange={(e) => setProductionFormData({ ...productionFormData, current_count: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={productionFormData.notes}
                  onChange={(e) => setProductionFormData({ ...productionFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingProduction ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProductionModal(false);
                    setEditingProduction(null);
                    resetProductionForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingSale ? 'Edit Sale' : 'Record Sale'}
            </h2>
            <form onSubmit={handleSaleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch *</label>
                  <select
                    value={saleFormData.batch_id}
                    onChange={(e) => setSaleFormData({ ...saleFormData, batch_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Batch</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>{batch.batch_flock_id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date *</label>
                  <DatePicker
                    selected={saleFormData.sale_date}
                    onChange={(date: Date) => setSaleFormData({ ...saleFormData, sale_date: date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={saleFormData.quantity}
                    onChange={(e) => setSaleFormData({ ...saleFormData, quantity: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Average Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={saleFormData.average_weight_kg}
                    onChange={(e) => setSaleFormData({ ...saleFormData, average_weight_kg: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (KES/kg) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={saleFormData.unit_price}
                    onChange={(e) => setSaleFormData({ ...saleFormData, unit_price: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Weight (Auto-calculated)</label>
                  <div className="w-full px-4 py-2 bg-gray-50 border rounded-lg font-semibold">
                    {saleFormData.quantity && saleFormData.average_weight_kg
                      ? `${(parseFloat(saleFormData.quantity) * parseFloat(saleFormData.average_weight_kg)).toFixed(2)} kg`
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (Auto-calculated)</label>
                  <div className="w-full px-4 py-2 bg-green-50 border border-green-200 rounded-lg font-semibold text-green-700">
                    {saleFormData.quantity && saleFormData.average_weight_kg && saleFormData.unit_price
                      ? `KES ${(parseFloat(saleFormData.quantity) * parseFloat(saleFormData.average_weight_kg) * parseFloat(saleFormData.unit_price)).toLocaleString()}`
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={saleFormData.customer_name}
                    onChange={(e) => setSaleFormData({ ...saleFormData, customer_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={saleFormData.payment_method}
                    onChange={(e) => setSaleFormData({ ...saleFormData, payment_method: e.target.value as any })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                  <select
                    value={saleFormData.payment_status}
                    onChange={(e) => setSaleFormData({ ...saleFormData, payment_status: e.target.value as any })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Fully Paid">Fully Paid</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={saleFormData.notes}
                  onChange={(e) => setSaleFormData({ ...saleFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingSale ? 'Update' : 'Record Sale'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSaleModal(false);
                    setEditingSale(null);
                    resetSaleForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



