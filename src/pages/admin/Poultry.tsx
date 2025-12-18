import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { EggCollection, BroilerBatch, Farm } from '../../types';
import { Plus, Edit, Trash2, Egg, Circle, Search } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../contexts/AuthContext';
import { isSuperAdmin } from '../../lib/permissions';

export default function Poultry() {
  const [activeTab, setActiveTab] = useState<'layers' | 'broilers'>('layers');
  const [eggCollections, setEggCollections] = useState<EggCollection[]>([]);
  const [broilerBatches, setBroilerBatches] = useState<BroilerBatch[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEggModal, setShowEggModal] = useState(false);
  const [showBroilerModal, setShowBroilerModal] = useState(false);
  const [editingEgg, setEditingEgg] = useState<EggCollection | null>(null);
  const [editingBroiler, setEditingBroiler] = useState<BroilerBatch | null>(null);
  const [eggFormData, setEggFormData] = useState({
    farm_id: '',
    date: new Date(),
    number_of_eggs: '',
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
  });
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
    } else {
      fetchBroilerBatches();
    }
  }, [activeTab]);

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

  const handleEggSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const eggData = {
        farm_id: eggFormData.farm_id,
        date: eggFormData.date.toISOString().split('T')[0],
        number_of_eggs: parseInt(eggFormData.number_of_eggs),
        trays: eggFormData.trays ? parseInt(eggFormData.trays) : null,
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
        trays: '',
        staff_id: '',
        notes: '',
      });
      fetchEggCollections();
    } catch (error) {
      console.error('Error saving egg collection:', error);
      alert('Error saving egg collection');
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
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingEgg(null);
                setEggFormData({
                  farm_id: '',
                  date: new Date(),
                  number_of_eggs: '',
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Eggs</th>
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
                  return matchesSearch && matchesFarm && matchesDateFrom && matchesDateTo;
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {collection.trays || 'N/A'}
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
            <table className="min-w-full divide-y divide-gray-200">
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingEgg ? 'Edit Egg Collection' : 'Add Egg Collection'}
            </h2>
            <form onSubmit={handleEggSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
                <select
                  value={eggFormData.farm_id}
                  onChange={(e) => setEggFormData({ ...eggFormData, farm_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Farm</option>
                  {farms.filter((f) => f.type === 'Layer').map((farm) => (
                    <option key={farm.id} value={farm.id}>{farm.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <DatePicker
                  selected={eggFormData.date}
                  onChange={(date: Date) => setEggFormData({ ...eggFormData, date })}
                  dateFormat="yyyy-MM-dd"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Eggs *</label>
                <input
                  type="number"
                  value={eggFormData.number_of_eggs}
                  onChange={(e) => setEggFormData({ ...eggFormData, number_of_eggs: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trays</label>
                <input
                  type="number"
                  value={eggFormData.trays}
                  onChange={(e) => setEggFormData({ ...eggFormData, trays: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff *</label>
                <select
                  value={eggFormData.staff_id}
                  onChange={(e) => setEggFormData({ ...eggFormData, staff_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Staff</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={eggFormData.notes}
                  onChange={(e) => setEggFormData({ ...eggFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingBroiler ? 'Edit Broiler Batch' : 'Add Broiler Batch'}
            </h2>
            <form onSubmit={handleBroilerSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
                <select
                  value={broilerFormData.farm_id}
                  onChange={(e) => setBroilerFormData({ ...broilerFormData, farm_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Farm</option>
                  {farms.filter((f) => f.type === 'Broiler').map((farm) => (
                    <option key={farm.id} value={farm.id}>{farm.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
                <input
                  type="text"
                  value={broilerFormData.batch_number}
                  onChange={(e) => setBroilerFormData({ ...broilerFormData, batch_number: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <DatePicker
                  selected={broilerFormData.start_date}
                  onChange={(date: Date) => setBroilerFormData({ ...broilerFormData, start_date: date })}
                  dateFormat="yyyy-MM-dd"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Count *</label>
                <input
                  type="number"
                  value={broilerFormData.initial_count}
                  onChange={(e) => setBroilerFormData({ ...broilerFormData, initial_count: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avg Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={broilerFormData.average_weight}
                    onChange={(e) => setBroilerFormData({ ...broilerFormData, average_weight: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Feed (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={broilerFormData.feed_consumption}
                    onChange={(e) => setBroilerFormData({ ...broilerFormData, feed_consumption: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mortality</label>
                  <input
                    type="number"
                    value={broilerFormData.mortality}
                    onChange={(e) => setBroilerFormData({ ...broilerFormData, mortality: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={broilerFormData.notes}
                  onChange={(e) => setBroilerFormData({ ...broilerFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
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

