import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { PoultryBatch, LayerProduction, LayerSale, Farm, BatchStockMovement, FeedIssuance, LayerProductType, PaymentMethod, PaymentStatusType, ProductionType } from '../../../types';
import { Plus, Edit, Search, TrendingUp, DollarSign, BarChart3, Egg } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../../contexts/AuthContext';
import TableActions from '../../../components/admin/TableActions';

interface LayersModuleProps {
  farms: Farm[];
}

export default function LayersModule({ farms }: LayersModuleProps) {
  const { user } = useAuth();
  const [batches, setBatches] = useState<PoultryBatch[]>([]);
  const [productions, setProductions] = useState<LayerProduction[]>([]);
  const [sales, setSales] = useState<LayerSale[]>([]);
  const [stockMovements, setStockMovements] = useState<BatchStockMovement[]>([]);
  const [feedIssuances, setFeedIssuances] = useState<FeedIssuance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'flocks' | 'production' | 'sales' | 'performance'>('flocks');
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [editingProduction, setEditingProduction] = useState<LayerProduction | null>(null);
  const [editingSale, setEditingSale] = useState<LayerSale | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string>('');

  const [productionFormData, setProductionFormData] = useState({
    batch_id: '',
    date: new Date(),
    total_eggs: '',
    current_bird_count: '',
    feed_consumed_kg: '',
    notes: '',
  });

  const [saleFormData, setSaleFormData] = useState({
    batch_id: '',
    sale_date: new Date(),
    product_type: 'Eggs' as LayerProductType,
    quantity: '',
    unit: 'eggs',
    unit_price: '',
    customer_id: '',
    customer_name: '',
    payment_method: 'Cash' as PaymentMethod,
    payment_status: 'Pending' as PaymentStatusType,
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
    fetchStockMovements();
    fetchFeedIssuances();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('poultry_batches')
        .select('*')
        .eq('production_type', 'Layer')
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
        .from('layer_production')
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
        .from('layer_sales')
        .select('*')
        .order('sale_date', { ascending: false });
      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchStockMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('batch_stock_movements')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      setStockMovements(data || []);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
    }
  };

  const fetchFeedIssuances = async () => {
    try {
      const { data, error } = await supabase
        .from('feed_issuance')
        .select('*')
        .order('issuance_date', { ascending: false });
      if (error) throw error;
      setFeedIssuances(data || []);
    } catch (error) {
      console.error('Error fetching feed issuances:', error);
    }
  };

  const calculateProductionPercentage = (totalEggs: number, birdCount: number): number => {
    if (birdCount === 0) return 0;
    return (totalEggs / birdCount) * 100;
  };

  const calculateFeedCostPerEgg = (batchId: string): number | null => {
    const batchFeedIssuances = feedIssuances.filter((f) => f.batch_id === batchId);
    const totalFeedCost = batchFeedIssuances.reduce((sum, f) => sum + (f.total_cost || 0), 0);
    const batchProductions = productions.filter((p) => p.batch_id === batchId);
    const totalEggs = batchProductions.reduce((sum, p) => sum + p.total_eggs, 0);
    
    if (totalEggs === 0) return null;
    return totalFeedCost / totalEggs;
  };

  const calculatePerformance = (batch: PoultryBatch) => {
    const batchProductions = productions.filter((p) => p.batch_id === batch.id);
    const batchSales = sales.filter((s) => s.batch_id === batch.id);
    const batchMovements = stockMovements.filter((m) => m.batch_id === batch.id);
    
    if (batchProductions.length === 0) return null;

    const totalMortalities = batchMovements.reduce((sum, m) => sum + m.mortalities, 0);
    const mortalityPercentage = batch.initial_quantity > 0 
      ? (totalMortalities / batch.initial_quantity) * 100 
      : 0;

    const totalEggs = batchProductions.reduce((sum, p) => sum + p.total_eggs, 0);
    const latestProduction = batchProductions[0];
    const productionPercentage = latestProduction 
      ? calculateProductionPercentage(latestProduction.total_eggs, latestProduction.current_bird_count)
      : 0;

    const feedCostPerEgg = calculateFeedCostPerEgg(batch.id);
    const totalRevenue = batchSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    
    // Calculate costs (feed, medication, etc.)
    const totalFeedCost = feedIssuances
      .filter((f) => f.batch_id === batch.id)
      .reduce((sum, f) => sum + (f.total_cost || 0), 0);
    const totalCosts = totalFeedCost; // Add other costs as needed
    const netProfit = totalRevenue - totalCosts;
    const profitabilityPercentage = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      batch_id: batch.id,
      batch_flock_id: batch.batch_flock_id,
      production_type: 'Layer' as ProductionType,
      mortality_percentage: mortalityPercentage,
      production_percentage: productionPercentage,
      feed_cost_per_egg: feedCostPerEgg || undefined,
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
      const totalEggs = parseInt(productionFormData.total_eggs);
      const currentBirdCount = parseInt(productionFormData.current_bird_count);
      const feedConsumed = productionFormData.feed_consumed_kg ? parseFloat(productionFormData.feed_consumed_kg) : null;
      
      const eggsPerBird = currentBirdCount > 0 ? totalEggs / currentBirdCount : 0;
      const productionPercentage = calculateProductionPercentage(totalEggs, currentBirdCount);
      
      // Calculate feed cost per egg
      const batchFeedIssuances = feedIssuances.filter((f) => f.batch_id === productionFormData.batch_id);
      const totalFeedCost = batchFeedIssuances.reduce((sum, f) => sum + (f.total_cost || 0), 0);
      const totalEggsProduced = productions
        .filter((p) => p.batch_id === productionFormData.batch_id)
        .reduce((sum, p) => sum + p.total_eggs, 0) + totalEggs;
      const feedCostPerEgg = totalEggsProduced > 0 ? totalFeedCost / totalEggsProduced : null;

      const productionData: any = {
        batch_id: productionFormData.batch_id,
        date: productionFormData.date.toISOString().split('T')[0],
        total_eggs: totalEggs,
        current_bird_count: currentBirdCount,
        eggs_per_bird: eggsPerBird,
        production_percentage: productionPercentage,
        feed_consumed_kg: feedConsumed,
        feed_cost_per_egg: feedCostPerEgg,
        notes: productionFormData.notes || null,
        created_by: user.id,
      };

      if (editingProduction) {
        const { error } = await supabase
          .from('layer_production')
          .update({ ...productionData, updated_at: new Date().toISOString() })
          .eq('id', editingProduction.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('layer_production').insert([productionData]);
        if (error) throw error;
      }

      setShowProductionModal(false);
      setEditingProduction(null);
      setProductionFormData({
        batch_id: '',
        date: new Date(),
        total_eggs: '',
        current_bird_count: '',
        feed_consumed_kg: '',
        notes: '',
      });
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
      const unitPrice = saleFormData.unit_price ? parseFloat(saleFormData.unit_price) : null;
      const totalAmount = unitPrice ? quantity * unitPrice : null;

      const saleData: any = {
        batch_id: saleFormData.batch_id,
        sale_date: saleFormData.sale_date.toISOString().split('T')[0],
        product_type: saleFormData.product_type,
        quantity: quantity,
        unit: saleFormData.unit,
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
          .from('layer_sales')
          .update({ ...saleData, updated_at: new Date().toISOString() })
          .eq('id', editingSale.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('layer_sales').insert([saleData]);
        if (error) throw error;
      }

      setShowSaleModal(false);
      setEditingSale(null);
      setSaleFormData({
        batch_id: '',
        sale_date: new Date(),
        product_type: 'Eggs',
        quantity: '',
        unit: 'eggs',
        unit_price: '',
        customer_id: '',
        customer_name: '',
        payment_method: 'Cash',
        payment_status: 'Pending',
        notes: '',
      });
      fetchSales();
    } catch (error) {
      console.error('Error saving sale:', error);
      alert('Error saving sale record');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* View Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveView('flocks')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeView === 'flocks'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Egg size={20} />
              Flocks
            </div>
          </button>
          <button
            onClick={() => setActiveView('production')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeView === 'production'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={20} />
              Production
            </div>
          </button>
          <button
            onClick={() => setActiveView('sales')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeView === 'sales'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign size={20} />
              Sales
            </div>
          </button>
          <button
            onClick={() => setActiveView('performance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeView === 'performance'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 size={20} />
              Performance
            </div>
          </button>
        </nav>
      </div>

      {/* Flocks View */}
      {activeView === 'flocks' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Layer Flocks</h3>
              <TableActions
                tableId="flocks-table"
                title="Layer Flocks"
                data={filteredBatches}
                filteredData={filteredBatches}
                columns={[
                  { key: 'batch_flock_id', label: 'Flock ID' },
                  { key: 'breed_strain', label: 'Breed' },
                  { key: 'placement_date', label: 'Placement Date' },
                  { key: 'initial_quantity', label: 'Initial Qty' },
                  { key: 'status', label: 'Status' },
                ]}
                getRowData={(batch) => ({
                  'batch_flock_id': batch.batch_flock_id,
                  'breed_strain': batch.breed_strain,
                  'placement_date': batch.placement_date,
                  'initial_quantity': batch.initial_quantity,
                  'status': batch.status,
                })}
              />
            </div>
            <div className="overflow-x-auto">
              <table id="flocks-table" className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flock ID</th>
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
                            batch.status === 'Suspended' ? 'bg-yellow-100 text-yellow-800' :
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

      {/* Production View */}
      {activeView === 'production' && (
        <div className="space-y-6">
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
                onChange={(e) => setFilter({ ...filter, batch: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Flocks</option>
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

          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingProduction(null);
                setProductionFormData({
                  batch_id: selectedBatch || '',
                  date: new Date(),
                  total_eggs: '',
                  current_bird_count: '',
                  feed_consumed_kg: '',
                  notes: '',
                });
                setShowProductionModal(true);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus size={20} />
              Add Production Record
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Production Records</h3>
              <TableActions
                tableId="production-table"
                title="Layer Production"
                data={filteredProductions}
                filteredData={filteredProductions}
                columns={[
                  { key: 'date', label: 'Date' },
                  { key: 'total_eggs', label: 'Total Eggs' },
                  { key: 'current_bird_count', label: 'Bird Count' },
                  { key: 'production_percentage', label: 'Production %' },
                  { key: 'feed_cost_per_egg', label: 'Feed Cost/Egg' },
                ]}
                getRowData={(prod) => {
                  const batch = batches.find((b) => b.id === prod.batch_id);
                  return {
                    date: prod.date,
                    'total_eggs': prod.total_eggs,
                    'current_bird_count': prod.current_bird_count,
                    'production_percentage': prod.production_percentage?.toFixed(2) || '0',
                    'feed_cost_per_egg': prod.feed_cost_per_egg ? `KES ${prod.feed_cost_per_egg.toFixed(2)}` : 'N/A',
                  };
                }}
              />
            </div>
            <div className="overflow-x-auto">
              <table id="production-table" className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flock ID</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Eggs</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bird Count</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Eggs/Bird</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Production %</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Feed Cost/Egg</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProductions.map((prod) => {
                    const batch = batches.find((b) => b.id === prod.batch_id);
                    return (
                      <tr key={prod.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(prod.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{batch?.batch_flock_id || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">{prod.total_eggs}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{prod.current_bird_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {prod.eggs_per_bird?.toFixed(2) || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {prod.production_percentage?.toFixed(2) || '0'}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {prod.feed_cost_per_egg ? `KES ${prod.feed_cost_per_egg.toFixed(2)}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => {
                              setEditingProduction(prod);
                              setProductionFormData({
                                batch_id: prod.batch_id,
                                date: new Date(prod.date),
                                total_eggs: prod.total_eggs.toString(),
                                current_bird_count: prod.current_bird_count.toString(),
                                feed_consumed_kg: prod.feed_consumed_kg?.toString() || '',
                                notes: prod.notes || '',
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
        <div className="space-y-6">
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
                onChange={(e) => setFilter({ ...filter, batch: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Flocks</option>
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

          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingSale(null);
                setSaleFormData({
                  batch_id: selectedBatch || '',
                  sale_date: new Date(),
                  product_type: 'Eggs',
                  quantity: '',
                  unit: 'eggs',
                  unit_price: '',
                  customer_id: '',
                  customer_name: '',
                  payment_method: 'Cash',
                  payment_status: 'Pending',
                  notes: '',
                });
                setShowSaleModal(true);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus size={20} />
              Add Sale
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Sales & Disposal Records</h3>
              <TableActions
                tableId="sales-table"
                title="Layer Sales"
                data={filteredSales}
                filteredData={filteredSales}
                columns={[
                  { key: 'sale_date', label: 'Date' },
                  { key: 'product_type', label: 'Product' },
                  { key: 'quantity', label: 'Quantity' },
                  { key: 'total_amount', label: 'Amount' },
                ]}
                getRowData={(sale) => ({
                  'sale_date': sale.sale_date,
                  'product_type': sale.product_type,
                  'quantity': sale.quantity,
                  'total_amount': sale.total_amount || 0,
                })}
              />
            </div>
            <div className="overflow-x-auto">
              <table id="sales-table" className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flock ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Type</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Amount</th>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{sale.product_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{sale.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{sale.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {sale.unit_price ? `KES ${sale.unit_price.toFixed(2)}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                          {sale.total_amount ? `KES ${sale.total_amount.toFixed(2)}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => {
                              setEditingSale(sale);
                              setSaleFormData({
                                batch_id: sale.batch_id,
                                sale_date: new Date(sale.sale_date),
                                product_type: sale.product_type,
                                quantity: sale.quantity.toString(),
                                unit: sale.unit,
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

      {/* Performance View */}
      {activeView === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBatches.map((batch) => {
              const performance = calculatePerformance(batch);
              if (!performance) return null;
              
              return (
                <div key={batch.id} className="bg-white rounded-lg shadow p-6">
                  <h4 className="text-lg font-semibold mb-4">{batch.batch_flock_id}</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Mortality %</p>
                      <p className="text-2xl font-bold">{performance.mortality_percentage.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Production %</p>
                      <p className="text-2xl font-bold">{performance.production_percentage?.toFixed(2) || '0'}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Feed Cost/Egg</p>
                      <p className="text-2xl font-bold">
                        {performance.feed_cost_per_egg ? `KES ${performance.feed_cost_per_egg.toFixed(2)}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">KES {performance.total_revenue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Net Profit</p>
                      <p className={`text-2xl font-bold ${performance.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        KES {performance.net_profit.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Profitability %</p>
                      <p className={`text-2xl font-bold ${performance.profitability_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingProduction ? 'Edit Production Record' : 'Add Production Record'}
            </h2>
            <form onSubmit={handleProductionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flock * <span className="text-xs text-gray-500">(Select batch/flock)</span>
                </label>
                <select
                  value={productionFormData.batch_id}
                  onChange={(e) => setProductionFormData({ ...productionFormData, batch_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Flock</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>{batch.batch_flock_id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date * <span className="text-xs text-gray-500">(Date of production)</span>
                </label>
                <DatePicker
                  selected={productionFormData.date}
                  onChange={(date: Date) => setProductionFormData({ ...productionFormData, date })}
                  dateFormat="yyyy-MM-dd"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Eggs * <span className="text-xs text-gray-500">(Total eggs collected)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productionFormData.total_eggs}
                    onChange={(e) => setProductionFormData({ ...productionFormData, total_eggs: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Bird Count * <span className="text-xs text-gray-500">(Used for production % calculation)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productionFormData.current_bird_count}
                    onChange={(e) => setProductionFormData({ ...productionFormData, current_bird_count: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feed Consumed (kg) <span className="text-xs text-gray-500">(Optional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productionFormData.feed_consumed_kg}
                  onChange={(e) => setProductionFormData({ ...productionFormData, feed_consumed_kg: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
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
                  {editingProduction ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProductionModal(false);
                    setEditingProduction(null);
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingSale ? 'Edit Sale Record' : 'Add Sale Record'}
            </h2>
            <form onSubmit={handleSaleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flock * <span className="text-xs text-gray-500">(Select batch/flock)</span>
                </label>
                <select
                  value={saleFormData.batch_id}
                  onChange={(e) => setSaleFormData({ ...saleFormData, batch_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Flock</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>{batch.batch_flock_id}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sale Date * <span className="text-xs text-gray-500">(Date of sale)</span>
                  </label>
                  <DatePicker
                    selected={saleFormData.sale_date}
                    onChange={(date: Date) => setSaleFormData({ ...saleFormData, sale_date: date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Type * <span className="text-xs text-gray-500">(Eggs, Spent Hens, Manure, Other)</span>
                  </label>
                  <select
                    value={saleFormData.product_type}
                    onChange={(e) => setSaleFormData({ ...saleFormData, product_type: e.target.value as LayerProductType })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Eggs">Eggs</option>
                    <option value="Spent Hens">Spent Hens</option>
                    <option value="Manure">Manure</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity * <span className="text-xs text-gray-500">(Number of items)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={saleFormData.quantity}
                    onChange={(e) => {
                      const qty = e.target.value;
                      const price = saleFormData.unit_price ? parseFloat(saleFormData.unit_price) : 0;
                      setSaleFormData({ ...saleFormData, quantity: qty });
                    }}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit * <span className="text-xs text-gray-500">(eggs, birds, kg, etc.)</span>
                  </label>
                  <input
                    type="text"
                    value={saleFormData.unit}
                    onChange={(e) => setSaleFormData({ ...saleFormData, unit: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="eggs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price <span className="text-xs text-gray-500">(Price per unit)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={saleFormData.unit_price}
                    onChange={(e) => {
                      const price = e.target.value;
                      const qty = parseInt(saleFormData.quantity) || 0;
                      setSaleFormData({ ...saleFormData, unit_price: price });
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              {saleFormData.unit_price && saleFormData.quantity && (
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-sm text-green-700">
                    Total: KES {((parseFloat(saleFormData.unit_price) || 0) * (parseInt(saleFormData.quantity) || 0)).toLocaleString()}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={saleFormData.customer_name}
                    onChange={(e) => setSaleFormData({ ...saleFormData, customer_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={saleFormData.payment_method}
                    onChange={(e) => setSaleFormData({ ...saleFormData, payment_method: e.target.value as PaymentMethod })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="MPesa">M-Pesa</option>
                    <option value="Cheque">Cheque</option>
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
                  {editingSale ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSaleModal(false);
                    setEditingSale(null);
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

