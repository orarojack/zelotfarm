import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { EggCollection, BroilerBatch, Farm, EggSale, EggStockInitial, EggStockAnalysis, EggStatus } from '../../types';
import { Plus, Edit, Trash2, Egg, Circle, Search, BarChart3, DollarSign, Settings } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../contexts/AuthContext';
import { isSuperAdmin } from '../../lib/permissions';
import TableActions from '../../components/admin/TableActions';

export default function Poultry() {
  const [activeTab, setActiveTab] = useState<'layers' | 'analysis' | 'broilers'>('layers');
  const [eggCollections, setEggCollections] = useState<EggCollection[]>([]);
  const [broilerBatches, setBroilerBatches] = useState<BroilerBatch[]>([]);
  const [eggSales, setEggSales] = useState<EggSale[]>([]);
  const [eggStockInitial, setEggStockInitial] = useState<EggStockInitial[]>([]);
  const [stockAnalysis, setStockAnalysis] = useState<EggStockAnalysis[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEggModal, setShowEggModal] = useState(false);
  const [showBroilerModal, setShowBroilerModal] = useState(false);
  const [showInitialStockModal, setShowInitialStockModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [editingEgg, setEditingEgg] = useState<EggCollection | null>(null);
  const [editingBroiler, setEditingBroiler] = useState<BroilerBatch | null>(null);
  const [editingSale, setEditingSale] = useState<EggSale | null>(null);
  const [initialStockFormData, setInitialStockFormData] = useState({
    farm_id: '',
    initial_stock: '',
    start_date: new Date(),
    notes: '',
  });
  const [saleFormData, setSaleFormData] = useState({
    farm_id: '',
    date: new Date(),
    quantity: '',
    unit_price: '',
    customer: '',
    notes: '',
  });
  const [selectedFarmForAnalysis, setSelectedFarmForAnalysis] = useState<string>('all');
  const [eggFormData, setEggFormData] = useState({
    farm_id: '',
    date: new Date(),
    number_of_eggs: '',
    egg_status: 'Good' as EggStatus,
    trays: '',
    staff_id: '',
    notes: '',
  });
  const [broilerFormData, setBroilerFormData] = useState({
    farm_id: '',
    batch_number: '',
    start_date: new Date(),
    initial_count: '',
    average_weight: '',
    feed_consumption: '',
    mortality: '',
    notes: '',
  });
  const [eggFilters, setEggFilters] = useState({
    search: '',
    farm: '',
    dateFrom: '',
    dateTo: '',
    dateFilter: '' as 'today' | 'yesterday' | 'last7days' | 'thisWeek' | 'thisMonth' | 'custom' | '',
  });

  // Date filter functions
  const getDateRange = (filter: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (filter) {
      case 'today':
        return { from: today.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { from: yesterday.toISOString().split('T')[0], to: yesterday.toISOString().split('T')[0] };
      case 'last7days':
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 6);
        return { from: last7Days.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
      case 'thisWeek':
        const thisWeek = new Date(today);
        const day = thisWeek.getDay();
        const diff = thisWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
        const monday = new Date(thisWeek.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 6);
        return { from: monday.toISOString().split('T')[0], to: sunday.toISOString().split('T')[0] };
      case 'thisMonth':
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { from: firstDay.toISOString().split('T')[0], to: lastDay.toISOString().split('T')[0] };
      default:
        return { from: '', to: '' };
    }
  };

  const handleDateFilter = (filter: string) => {
    if (filter === 'custom') {
      setEggFilters({ ...eggFilters, dateFilter: 'custom', dateFrom: '', dateTo: '' });
    } else {
      const range = getDateRange(filter);
      setEggFilters({ ...eggFilters, dateFilter: filter as any, dateFrom: range.from, dateTo: range.to });
    }
  };
  const [broilerFilters, setBroilerFilters] = useState({
    search: '',
    farm: '',
    status: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchFarms();
    fetchStaff();
    if (activeTab === 'layers') {
      fetchEggCollections();
    } else if (activeTab === 'analysis') {
      fetchEggCollections();
      fetchEggSales();
      fetchEggStockInitial();
    } else {
      fetchBroilerBatches();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'analysis' && eggCollections.length >= 0 && eggSales.length >= 0) {
      calculateStockAnalysis();
    }
  }, [activeTab, selectedFarmForAnalysis, eggCollections, eggSales, eggStockInitial]);

  const fetchFarms = async () => {
    const { data } = await supabase
      .from('farms')
      .select('*')
      .in('type', ['Layer', 'Broiler']);
    setFarms(data || []);
  };

  const fetchStaff = async () => {
    const { data } = await supabase.from('staff').select('*').eq('is_active', true);
    setStaff(data || []);
  };

  const fetchEggCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('egg_collections')
        .select('*')
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEggCollections(data || []);
    } catch (error) {
      console.error('Error fetching egg collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBroilerBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('broiler_batches')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setBroilerBatches(data || []);
    } catch (error) {
      console.error('Error fetching broiler batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEggSales = async () => {
    try {
      const { data, error } = await supabase
        .from('egg_sales')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setEggSales(data || []);
    } catch (error) {
      console.error('Error fetching egg sales:', error);
    }
  };

  const fetchEggStockInitial = async () => {
    try {
      const { data, error } = await supabase
        .from('egg_stock_initial')
        .select('*');

      if (error) throw error;
      setEggStockInitial(data || []);
    } catch (error) {
      console.error('Error fetching initial stock:', error);
    }
  };

  const calculateStockAnalysis = () => {
    if (!eggCollections.length) {
      setStockAnalysis([]);
      return;
    }

    // Get all unique dates from collections and sales
    const allDates = new Set<string>();
    eggCollections.forEach(c => allDates.add(c.date));
    eggSales.forEach(s => allDates.add(s.date));
    
    const sortedDates = Array.from(allDates).sort();

    if (sortedDates.length === 0) {
      setStockAnalysis([]);
      return;
    }

    // Get initial stock for the selected farm (or all farms if 'all')
    const initialStockMap = new Map<string, number>();
    eggStockInitial.forEach(stock => {
      if (selectedFarmForAnalysis === 'all' || stock.farm_id === selectedFarmForAnalysis) {
        initialStockMap.set(stock.farm_id, stock.initial_stock);
      }
    });

    // Group collections and sales by date and farm
    const collectionsByDate = new Map<string, Map<string, { total: number; broken: number; spoiled: number }>>();
    const salesByDate = new Map<string, Map<string, number>>();

    eggCollections.forEach(collection => {
      if (selectedFarmForAnalysis !== 'all' && collection.farm_id !== selectedFarmForAnalysis) return;
      
      const date = collection.date;
      if (!collectionsByDate.has(date)) {
        collectionsByDate.set(date, new Map());
      }
      const farmMap = collectionsByDate.get(date)!;
      if (!farmMap.has(collection.farm_id)) {
        farmMap.set(collection.farm_id, { total: 0, broken: 0, spoiled: 0 });
      }
      const stats = farmMap.get(collection.farm_id)!;
      stats.total += collection.number_of_eggs;
      if (collection.egg_status === 'Broken') stats.broken += collection.number_of_eggs;
      if (collection.egg_status === 'Spoiled') stats.spoiled += collection.number_of_eggs;
    });

    eggSales.forEach(sale => {
      if (selectedFarmForAnalysis !== 'all' && sale.farm_id !== selectedFarmForAnalysis) return;
      
      const date = sale.date;
      if (!salesByDate.has(date)) {
        salesByDate.set(date, new Map());
      }
      const farmMap = salesByDate.get(date)!;
      farmMap.set(sale.farm_id, (farmMap.get(sale.farm_id) || 0) + sale.quantity);
    });

    // Calculate daily analysis in chronological order (oldest first)
    const analysis: EggStockAnalysis[] = [];
    let previousBalance = 0;

    // Get initial stock
    const totalInitialStock = selectedFarmForAnalysis === 'all'
      ? Array.from(initialStockMap.values()).reduce((sum, val) => sum + val, 0)
      : (initialStockMap.get(selectedFarmForAnalysis) || 0);

    // Aggregate across all farms if 'all' is selected, otherwise use single farm
    sortedDates.forEach((date, index) => {
      let totalCollection = 0;
      let totalBroken = 0;
      let totalSpoiled = 0;
      let totalSold = 0;

      if (selectedFarmForAnalysis === 'all') {
        // Sum across all farms for each date
        const collections = collectionsByDate.get(date) || new Map();
        const sales = salesByDate.get(date) || new Map();

        collections.forEach((stats) => {
          totalCollection += stats.total;
          totalBroken += stats.broken;
          totalSpoiled += stats.spoiled;
        });

        sales.forEach((quantity) => {
          totalSold += quantity;
        });
      } else {
        // Single farm analysis
        const farmId = selectedFarmForAnalysis;
        const collections = collectionsByDate.get(date)?.get(farmId) || { total: 0, broken: 0, spoiled: 0 };
        const sold = salesByDate.get(date)?.get(farmId) || 0;

        totalCollection = collections.total;
        totalBroken = collections.broken;
        totalSpoiled = collections.spoiled;
        totalSold = sold;
      }

      // Opening stock is previous day's balance (or initial stock for first day)
      const openingStock = index === 0 ? totalInitialStock : previousBalance;

      // Calculate totals
      const total = openingStock + totalCollection;
      const balance = total - totalBroken - totalSpoiled - totalSold;
      
      // Update previous balance for next iteration
      previousBalance = balance;

      analysis.push({
        date,
        opening_stock: openingStock,
        daily_collection: totalCollection,
        total,
        broken: totalBroken,
        spoiled: totalSpoiled,
        sold: totalSold,
        balance,
      });
    });

    // Reverse to show most recent first
    // Note: The opening_stock values are already correct because they were calculated
    // in chronological order. When reversed, each day's opening_stock correctly
    // represents the balance from the previous chronological day.
    const reversedAnalysis = [...analysis].reverse();
    
    // However, we need to ensure opening stocks are correct after reversal
    // The last item in reversed array is the oldest date (first chronological day)
    // We'll recalculate from the oldest to newest (which is backwards in reversed array)
    if (reversedAnalysis.length > 0) {
      // Start from the oldest date (last in reversed array)
      for (let i = reversedAnalysis.length - 1; i >= 0; i--) {
        if (i === reversedAnalysis.length - 1) {
          // This is the oldest date - use initial stock
          reversedAnalysis[i].opening_stock = totalInitialStock;
        } else {
          // This is a later date - opening stock = previous day's balance
          // Previous day in chronological order is the next item (i+1) in reversed array
          reversedAnalysis[i].opening_stock = reversedAnalysis[i + 1].balance;
        }
        // Recalculate total and balance with correct opening stock
        reversedAnalysis[i].total = reversedAnalysis[i].opening_stock + reversedAnalysis[i].daily_collection;
        reversedAnalysis[i].balance = reversedAnalysis[i].total - reversedAnalysis[i].broken - reversedAnalysis[i].spoiled - reversedAnalysis[i].sold;
      }
    }

    setStockAnalysis(reversedAnalysis); // Show most recent first
  };

  const canEditDelete = (createdAt: string) => {
    // Super Admin can always edit/delete
    if (isSuperAdmin(user?.role)) {
      return true;
    }
    const recordDate = new Date(createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - recordDate.getTime()) / (1000 * 60);
    return diffMinutes <= 30;
  };

  // Calculate trays from eggs (1 tray = 30 eggs)
  const calculateTrays = (eggs: number): string => {
    if (!eggs || eggs === 0) return '';
    const fullTrays = Math.floor(eggs / 30);
    const remainingEggs = eggs % 30;
    if (fullTrays === 0) {
      return `${remainingEggs} eggs`;
    } else if (remainingEggs === 0) {
      return `${fullTrays} tray${fullTrays > 1 ? 's' : ''}`;
    } else {
      return `${fullTrays} tray${fullTrays > 1 ? 's' : ''}, ${remainingEggs} eggs`;
    }
  };

  const handleEggSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const eggs = parseInt(eggFormData.number_of_eggs);
      const fullTrays = Math.floor(eggs / 30);
      const remainingEggs = eggs % 30;
      
      const eggData = {
        farm_id: eggFormData.farm_id,
        date: eggFormData.date.toISOString().split('T')[0],
        number_of_eggs: eggs,
        egg_status: eggFormData.egg_status,
        trays: fullTrays + (remainingEggs > 0 ? 1 : 0), // Total trays needed
        staff_id: eggFormData.staff_id,
        notes: eggFormData.notes || null,
        created_by: user.id,
      };

      if (editingEgg) {
        if (!canEditDelete(editingEgg.created_at)) {
          if (!isSuperAdmin(user?.role)) {
            alert('Cannot edit record after 30 minutes. Please request approval.');
            return;
          }
        }
        const { error } = await supabase
          .from('egg_collections')
          .update({ ...eggData, updated_at: new Date().toISOString() })
          .eq('id', editingEgg.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('egg_collections').insert([eggData]);
        if (error) throw error;
      }

      setShowEggModal(false);
      setEditingEgg(null);
      setEggFormData({
        farm_id: '',
        date: new Date(),
        number_of_eggs: '',
        egg_status: 'Good',
        trays: '',
        staff_id: '',
        notes: '',
      });
      fetchEggCollections();
      if (activeTab === 'analysis') {
        calculateStockAnalysis();
      }
    } catch (error) {
      console.error('Error saving egg collection:', error);
      alert('Error saving egg collection');
    }
  };

  const handleInitialStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const stockData = {
        farm_id: initialStockFormData.farm_id,
        initial_stock: parseInt(initialStockFormData.initial_stock),
        start_date: initialStockFormData.start_date.toISOString().split('T')[0],
        notes: initialStockFormData.notes || null,
        created_by: user.id,
      };

      // Check if initial stock already exists for this farm
      const existing = eggStockInitial.find(s => s.farm_id === initialStockFormData.farm_id);
      if (existing) {
        const { error } = await supabase
          .from('egg_stock_initial')
          .update({ ...stockData, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('egg_stock_initial').insert([stockData]);
        if (error) throw error;
      }

      setShowInitialStockModal(false);
      setInitialStockFormData({
        farm_id: '',
        initial_stock: '',
        start_date: new Date(),
        notes: '',
      });
      fetchEggStockInitial();
      calculateStockAnalysis();
    } catch (error) {
      console.error('Error saving initial stock:', error);
      alert('Error saving initial stock');
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const quantity = parseInt(saleFormData.quantity);
      const unitPrice = saleFormData.unit_price ? parseFloat(saleFormData.unit_price) : null;
      const totalAmount = unitPrice ? quantity * unitPrice : null;

      const saleData = {
        farm_id: saleFormData.farm_id,
        date: saleFormData.date.toISOString().split('T')[0],
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        customer: saleFormData.customer || null,
        notes: saleFormData.notes || null,
        created_by: user.id,
      };

      if (editingSale) {
        const { error } = await supabase
          .from('egg_sales')
          .update({ ...saleData, updated_at: new Date().toISOString() })
          .eq('id', editingSale.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('egg_sales').insert([saleData]);
        if (error) throw error;
      }

      setShowSaleModal(false);
      setEditingSale(null);
      setSaleFormData({
        farm_id: '',
        date: new Date(),
        quantity: '',
        unit_price: '',
        customer: '',
        notes: '',
      });
      await fetchEggSales();
      // Recalculate after a short delay to ensure state is updated
      setTimeout(() => calculateStockAnalysis(), 100);
    } catch (error) {
      console.error('Error saving egg sale:', error);
      alert('Error saving egg sale');
    }
  };

  const handleBroilerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const broilerData = {
        farm_id: broilerFormData.farm_id,
        batch_number: broilerFormData.batch_number,
        start_date: broilerFormData.start_date.toISOString().split('T')[0],
        initial_count: parseInt(broilerFormData.initial_count),
        current_count: parseInt(broilerFormData.initial_count),
        average_weight: broilerFormData.average_weight ? parseFloat(broilerFormData.average_weight) : null,
        feed_consumption: broilerFormData.feed_consumption ? parseFloat(broilerFormData.feed_consumption) : null,
        mortality: broilerFormData.mortality ? parseInt(broilerFormData.mortality) : null,
        notes: broilerFormData.notes || null,
      };

      if (editingBroiler) {
        const { error } = await supabase
          .from('broiler_batches')
          .update({ ...broilerData, updated_at: new Date().toISOString() })
          .eq('id', editingBroiler.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('broiler_batches').insert([broilerData]);
        if (error) throw error;
      }

      setShowBroilerModal(false);
      setEditingBroiler(null);
      setBroilerFormData({
        farm_id: '',
        batch_number: '',
        start_date: new Date(),
        initial_count: '',
        average_weight: '',
        feed_consumption: '',
        mortality: '',
        notes: '',
      });
      fetchBroilerBatches();
    } catch (error) {
      console.error('Error saving broiler batch:', error);
      alert('Error saving broiler batch');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Poultry Management</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('layers')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'layers'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Egg size={20} />
              Layers (Egg Collection)
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analysis'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 size={20} />
              Layers Analysis
            </div>
          </button>
          <button
            onClick={() => setActiveTab('broilers')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'broilers'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Circle size={20} />
              Broilers
            </div>
          </button>
        </nav>
      </div>

      {/* Layers Tab */}
      {activeTab === 'layers' && (
        <div className="space-y-6">
          {/* Date Filter Buttons */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => handleDateFilter('today')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  eggFilters.dateFilter === 'today'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleDateFilter('yesterday')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  eggFilters.dateFilter === 'yesterday'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yesterday
              </button>
              <button
                onClick={() => handleDateFilter('last7days')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  eggFilters.dateFilter === 'last7days'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => handleDateFilter('thisWeek')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  eggFilters.dateFilter === 'thisWeek'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => handleDateFilter('thisMonth')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  eggFilters.dateFilter === 'thisMonth'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => handleDateFilter('custom')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  eggFilters.dateFilter === 'custom'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom Range
              </button>
            </div>
            
            {/* Custom Date Range */}
            {eggFilters.dateFilter === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={eggFilters.search}
                    onChange={(e) => setEggFilters({ ...eggFilters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={eggFilters.farm}
                  onChange={(e) => setEggFilters({ ...eggFilters, farm: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Farms</option>
                  {farms.filter(f => f.type === 'Layer').map((farm) => (
                    <option key={farm.id} value={farm.id}>{farm.name}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={eggFilters.dateFrom}
                    onChange={(e) => setEggFilters({ ...eggFilters, dateFrom: e.target.value })}
                    placeholder="From Date"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="date"
                    value={eggFilters.dateTo}
                    onChange={(e) => setEggFilters({ ...eggFilters, dateTo: e.target.value })}
                    placeholder="To Date"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
            
            {/* Regular Filters (when not custom) */}
            {eggFilters.dateFilter !== 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={eggFilters.search}
                    onChange={(e) => setEggFilters({ ...eggFilters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={eggFilters.farm}
                  onChange={(e) => setEggFilters({ ...eggFilters, farm: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Farms</option>
                  {farms.filter(f => f.type === 'Layer').map((farm) => (
                    <option key={farm.id} value={farm.id}>{farm.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingEgg(null);
                setEggFormData({
                  farm_id: '',
                  date: new Date(),
                  number_of_eggs: '',
                  egg_status: 'Good',
                  trays: '',
                  staff_id: '',
                  notes: '',
                });
                setShowEggModal(true);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus size={20} />
              Add Egg Collection
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Egg Collections</h3>
              <TableActions
                tableId="egg-collections-table"
                title="Egg Collections"
                data={eggCollections}
                filteredData={eggCollections.filter((collection) => {
                  const farm = farms.find((f) => f.id === collection.farm_id);
                  const matchesSearch = eggFilters.search === '' || 
                    farm?.name.toLowerCase().includes(eggFilters.search.toLowerCase());
                  const matchesFarm = eggFilters.farm === '' || collection.farm_id === eggFilters.farm;
                  const matchesDateFrom = eggFilters.dateFrom === '' || new Date(collection.date) >= new Date(eggFilters.dateFrom);
                  const matchesDateTo = eggFilters.dateTo === '' || new Date(collection.date) <= new Date(eggFilters.dateTo);
                  return matchesSearch && matchesFarm && matchesDateFrom && matchesDateTo;
                })}
                columns={[
                  { key: 'date', label: 'Date' },
                  { key: 'farm_id', label: 'Farm' },
                  { key: 'number_of_eggs', label: 'Eggs' },
                  { key: 'egg_status', label: 'Status' },
                  { key: 'trays', label: 'Trays' },
                  { key: 'staff_id', label: 'Staff' },
                ]}
                getRowData={(collection) => {
                  const farm = farms.find((f) => f.id === collection.farm_id);
                  const staffMember = staff.find((s) => s.id === collection.staff_id);
                  return {
                    date: collection.date,
                    'farm_id': farm?.name || 'N/A',
                    'number_of_eggs': collection.number_of_eggs,
                    'egg_status': collection.egg_status || 'Good',
                    'trays': collection.number_of_eggs ? calculateTrays(collection.number_of_eggs) : 'N/A',
                    'staff_id': staffMember?.name || 'N/A',
                  };
                }}
              />
            </div>
            <table id="egg-collections-table" className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Eggs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trays</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {eggCollections.filter((collection) => {
                  const farm = farms.find((f) => f.id === collection.farm_id);
                  const matchesSearch = eggFilters.search === '' || 
                    farm?.name.toLowerCase().includes(eggFilters.search.toLowerCase());
                  const matchesFarm = eggFilters.farm === '' || collection.farm_id === eggFilters.farm;
                  const matchesDateFrom = eggFilters.dateFrom === '' || new Date(collection.date) >= new Date(eggFilters.dateFrom);
                  const matchesDateTo = eggFilters.dateTo === '' || new Date(collection.date) <= new Date(eggFilters.dateTo);
                  const matchesDate = eggFilters.dateFrom === '' || (matchesDateFrom && matchesDateTo);
                  return matchesSearch && matchesFarm && matchesDate;
                }).map((collection) => {
                  const farm = farms.find((f) => f.id === collection.farm_id);
                  const staffMember = staff.find((s) => s.id === collection.staff_id);
                  const canEdit = canEditDelete(collection.created_at);

                  return (
                    <tr key={collection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(collection.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{farm?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {collection.number_of_eggs}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          collection.egg_status === 'Good' ? 'bg-green-100 text-green-800' :
                          collection.egg_status === 'Broken' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {collection.egg_status || 'Good'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {collection.number_of_eggs ? calculateTrays(collection.number_of_eggs) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {staffMember?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {canEdit ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingEgg(collection);
                                setEggFormData({
                                  farm_id: collection.farm_id,
                                  date: new Date(collection.date),
                                  number_of_eggs: collection.number_of_eggs.toString(),
                                  egg_status: collection.egg_status || 'Good',
                                  trays: collection.trays?.toString() || '',
                                  staff_id: collection.staff_id,
                                  notes: collection.notes || '',
                                });
                                setShowEggModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit size={18} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Locked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Layers Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Header with Actions */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Layers Stock Analysis</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowInitialStockModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Settings size={20} />
                Set Initial Stock
              </button>
              <button
                onClick={() => {
                  setEditingSale(null);
                  setSaleFormData({
                    farm_id: selectedFarmForAnalysis !== 'all' ? selectedFarmForAnalysis : '',
                    date: new Date(),
                    quantity: '',
                    unit_price: '',
                    customer: '',
                    notes: '',
                  });
                  setShowSaleModal(true);
                }}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <DollarSign size={20} />
                Add Sale
              </button>
            </div>
          </div>

          {/* Farm Filter */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Farm:</label>
            <select
              value={selectedFarmForAnalysis}
              onChange={(e) => {
                setSelectedFarmForAnalysis(e.target.value);
              }}
              className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Farms</option>
              {farms.filter(f => f.type === 'Layer').map((farm) => (
                <option key={farm.id} value={farm.id}>{farm.name}</option>
              ))}
            </select>
          </div>

          {/* Analysis Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Daily Stock Analysis</h3>
              <TableActions
                tableId="stock-analysis-table"
                title="Stock Analysis"
                data={stockAnalysis}
                filteredData={stockAnalysis}
                columns={[
                  { key: 'date', label: 'Date' },
                  { key: 'opening_stock', label: 'Opening Stock' },
                  { key: 'daily_collection', label: 'Daily Collection' },
                  { key: 'total', label: 'Total' },
                  { key: 'broken', label: 'Broken' },
                  { key: 'spoiled', label: 'Spoiled' },
                  { key: 'sold', label: 'Sold' },
                  { key: 'balance', label: 'Balance' },
                ]}
              />
            </div>
            <table id="stock-analysis-table" className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Opening Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Daily Collection</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Broken</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Spoiled</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sold</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockAnalysis.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      {eggStockInitial.length === 0
                        ? 'Please set initial stock first by clicking "Set Initial Stock" button'
                        : 'No data available. Add egg collections and sales to see analysis.'}
                    </td>
                  </tr>
                ) : (
                  stockAnalysis.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(row.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {row.opening_stock.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                        +{row.daily_collection.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                        {row.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        -{row.broken.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                        -{row.spoiled.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                        -{row.sold.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-700">
                        {row.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Initial Stock Modal */}
          {showInitialStockModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-5 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Set Initial Stock</h2>
                <form onSubmit={handleInitialStockSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Farm *</label>
                    <select
                      value={initialStockFormData.farm_id}
                      onChange={(e) => setInitialStockFormData({ ...initialStockFormData, farm_id: e.target.value })}
                      required
                      className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Farm</option>
                      {farms.filter(f => f.type === 'Layer').map((farm) => (
                        <option key={farm.id} value={farm.id}>{farm.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Initial Stock (eggs) *</label>
                    <input
                      type="number"
                      min="0"
                      value={initialStockFormData.initial_stock}
                      onChange={(e) => setInitialStockFormData({ ...initialStockFormData, initial_stock: e.target.value })}
                      required
                      className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Enter number of eggs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
                    <DatePicker
                      selected={initialStockFormData.start_date}
                      onChange={(date: Date) => setInitialStockFormData({ ...initialStockFormData, start_date: date })}
                      dateFormat="yyyy-MM-dd"
                      className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={initialStockFormData.notes}
                      onChange={(e) => setInitialStockFormData({ ...initialStockFormData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowInitialStockModal(false);
                        setInitialStockFormData({
                          farm_id: '',
                          initial_stock: '',
                          start_date: new Date(),
                          notes: '',
                        });
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
              <div className="bg-white rounded-lg p-5 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">
                  {editingSale ? 'Edit Egg Sale' : 'Add Egg Sale'}
                </h2>
                <form onSubmit={handleSaleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Farm *</label>
                    <select
                      value={saleFormData.farm_id}
                      onChange={(e) => setSaleFormData({ ...saleFormData, farm_id: e.target.value })}
                      required
                      className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Farm</option>
                      {farms.filter(f => f.type === 'Layer').map((farm) => (
                        <option key={farm.id} value={farm.id}>{farm.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                    <DatePicker
                      selected={saleFormData.date}
                      onChange={(date: Date) => setSaleFormData({ ...saleFormData, date })}
                      dateFormat="yyyy-MM-dd"
                      className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Quantity (eggs) *</label>
                    <input
                      type="number"
                      min="1"
                      value={saleFormData.quantity}
                      onChange={(e) => setSaleFormData({ ...saleFormData, quantity: e.target.value })}
                      required
                      className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Number of eggs sold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price (KES)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={saleFormData.unit_price}
                      onChange={(e) => {
                        const unitPrice = e.target.value;
                        const quantity = parseInt(saleFormData.quantity) || 0;
                        setSaleFormData({ ...saleFormData, unit_price: unitPrice });
                      }}
                      className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Price per egg"
                    />
                  </div>
                  {saleFormData.unit_price && saleFormData.quantity && (
                    <div className="bg-green-50 p-2 rounded">
                      <p className="text-sm text-green-700">
                        Total: KES {((parseFloat(saleFormData.unit_price) || 0) * (parseInt(saleFormData.quantity) || 0)).toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Customer</label>
                    <input
                      type="text"
                      value={saleFormData.customer}
                      onChange={(e) => setSaleFormData({ ...saleFormData, customer: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Customer name (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={saleFormData.notes}
                      onChange={(e) => setSaleFormData({ ...saleFormData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
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
                        setSaleFormData({
                          farm_id: '',
                          date: new Date(),
                          quantity: '',
                          unit_price: '',
                          customer: '',
                          notes: '',
                        });
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
      )}

      {/* Broilers Tab */}
      {activeTab === 'broilers' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by batch number..."
                  value={broilerFilters.search}
                  onChange={(e) => setBroilerFilters({ ...broilerFilters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <select
                value={broilerFilters.farm}
                onChange={(e) => setBroilerFilters({ ...broilerFilters, farm: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Farms</option>
                {farms.filter(f => f.type === 'Broiler').map((farm) => (
                  <option key={farm.id} value={farm.id}>{farm.name}</option>
                ))}
              </select>
              <select
                value={broilerFilters.status}
                onChange={(e) => setBroilerFilters({ ...broilerFilters, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingBroiler(null);
                setBroilerFormData({
                  farm_id: '',
                  batch_number: '',
                  start_date: new Date(),
                  initial_count: '',
                  average_weight: '',
                  feed_consumption: '',
                  mortality: '',
                  notes: '',
                });
                setShowBroilerModal(true);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus size={20} />
              Add Broiler Batch
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Broiler Batches</h3>
              <TableActions
                tableId="broiler-batches-table"
                title="Broiler Batches"
                data={broilerBatches}
                filteredData={broilerBatches.filter((batch) => {
                  const farm = farms.find((f) => f.id === batch.farm_id);
                  const matchesSearch = broilerFilters.search === '' || 
                    batch.batch_number.toLowerCase().includes(broilerFilters.search.toLowerCase());
                  const matchesFarm = broilerFilters.farm === '' || batch.farm_id === broilerFilters.farm;
                  const isActive = !batch.end_date;
                  const matchesStatus = broilerFilters.status === '' || 
                    (broilerFilters.status === 'active' && isActive) ||
                    (broilerFilters.status === 'completed' && !isActive);
                  return matchesSearch && matchesFarm && matchesStatus;
                })}
                columns={[
                  { key: 'batch_number', label: 'Batch #' },
                  { key: 'farm_id', label: 'Farm' },
                  { key: 'start_date', label: 'Start Date' },
                  { key: 'initial_count', label: 'Initial Count' },
                  { key: 'current_count', label: 'Current Count' },
                  { key: 'average_weight', label: 'Avg Weight' },
                ]}
                getRowData={(batch) => {
                  const farm = farms.find((f) => f.id === batch.farm_id);
                  return {
                    'batch_number': batch.batch_number,
                    'farm_id': farm?.name || 'N/A',
                    'start_date': batch.start_date,
                    'initial_count': batch.initial_count,
                    'current_count': batch.current_count,
                    'average_weight': batch.average_weight || 'N/A',
                  };
                }}
              />
            </div>
            <table id="broiler-batches-table" className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Initial Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Weight</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {broilerBatches.filter((batch) => {
                  const farm = farms.find((f) => f.id === batch.farm_id);
                  const matchesSearch = broilerFilters.search === '' || 
                    batch.batch_number.toLowerCase().includes(broilerFilters.search.toLowerCase());
                  const matchesFarm = broilerFilters.farm === '' || batch.farm_id === broilerFilters.farm;
                  const isActive = !batch.end_date;
                  const matchesStatus = broilerFilters.status === '' || 
                    (broilerFilters.status === 'active' && isActive) ||
                    (broilerFilters.status === 'completed' && !isActive);
                  return matchesSearch && matchesFarm && matchesStatus;
                }).map((batch) => {
                  const farm = farms.find((f) => f.id === batch.farm_id);
                  return (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{batch.batch_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{farm?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(batch.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{batch.initial_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{batch.current_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {batch.average_weight ? `${batch.average_weight} kg` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => {
                            setEditingBroiler(batch);
                            setBroilerFormData({
                              farm_id: batch.farm_id,
                              batch_number: batch.batch_number,
                              start_date: new Date(batch.start_date),
                              initial_count: batch.initial_count.toString(),
                              average_weight: batch.average_weight?.toString() || '',
                              feed_consumption: batch.feed_consumption?.toString() || '',
                              mortality: batch.mortality?.toString() || '',
                              notes: batch.notes || '',
                            });
                            setShowBroilerModal(true);
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
      )}

      {/* Egg Collection Modal */}
      {showEggModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">
              {editingEgg ? 'Edit Egg Collection' : 'Add Egg Collection'}
            </h2>
            <form onSubmit={handleEggSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Farm *</label>
                  <select
                    value={eggFormData.farm_id}
                    onChange={(e) => setEggFormData({ ...eggFormData, farm_id: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Farm</option>
                    {farms.filter((f) => f.type === 'Layer').map((farm) => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                  <DatePicker
                    selected={eggFormData.date}
                    onChange={(date: Date) => setEggFormData({ ...eggFormData, date })}
                    dateFormat="yyyy-MM-dd"
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                    maxDate={new Date()}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Number of Eggs *</label>
                  <input
                    type="number"
                    value={eggFormData.number_of_eggs}
                    onChange={(e) => {
                      const eggs = e.target.value;
                      setEggFormData({ 
                        ...eggFormData, 
                        number_of_eggs: eggs,
                        trays: eggs ? Math.ceil(parseInt(eggs) / 30).toString() : ''
                      });
                    }}
                    required
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Egg Status *</label>
                  <select
                    value={eggFormData.egg_status}
                    onChange={(e) => setEggFormData({ ...eggFormData, egg_status: e.target.value as EggStatus })}
                    required
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Good">Good</option>
                    <option value="Broken">Broken</option>
                    <option value="Spoiled">Spoiled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Trays (Auto-calculated)</label>
                  <div className="w-full px-3 py-1.5 text-sm bg-gray-50 border rounded-lg text-gray-700">
                    {eggFormData.number_of_eggs 
                      ? calculateTrays(parseInt(eggFormData.number_of_eggs))
                      : 'Enter number of eggs'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Staff *</label>
                  <select
                    value={eggFormData.staff_id}
                    onChange={(e) => setEggFormData({ ...eggFormData, staff_id: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Staff</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={eggFormData.notes}
                  onChange={(e) => setEggFormData({ ...eggFormData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingEgg ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEggModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broiler Batch Modal */}
      {showBroilerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-6xl">
            <h2 className="text-2xl font-bold mb-4">
              {editingBroiler ? 'Edit Broiler Batch' : 'Add Broiler Batch'}
            </h2>
            <form onSubmit={handleBroilerSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Farm *</label>
                  <select
                    value={broilerFormData.farm_id}
                    onChange={(e) => setBroilerFormData({ ...broilerFormData, farm_id: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Farm</option>
                    {farms.filter((f) => f.type === 'Broiler').map((farm) => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    value={broilerFormData.batch_number}
                    onChange={(e) => setBroilerFormData({ ...broilerFormData, batch_number: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
                  <DatePicker
                    selected={broilerFormData.start_date}
                    onChange={(date: Date) => setBroilerFormData({ ...broilerFormData, start_date: date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Initial Count *</label>
                  <input
                    type="number"
                    value={broilerFormData.initial_count}
                    onChange={(e) => setBroilerFormData({ ...broilerFormData, initial_count: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Avg Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={broilerFormData.average_weight}
                    onChange={(e) => setBroilerFormData({ ...broilerFormData, average_weight: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Feed (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={broilerFormData.feed_consumption}
                    onChange={(e) => setBroilerFormData({ ...broilerFormData, feed_consumption: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mortality</label>
                  <input
                    type="number"
                    value={broilerFormData.mortality}
                    onChange={(e) => setBroilerFormData({ ...broilerFormData, mortality: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={broilerFormData.notes}
                  onChange={(e) => setBroilerFormData({ ...broilerFormData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingBroiler ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBroilerModal(false)}
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

