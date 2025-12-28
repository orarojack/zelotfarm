import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { PoultryBatch, Farm, PoultryHouse, BatchStatus, ProductionType } from '../../../types';
import { Plus, Edit, Search, Calendar, Users } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../../contexts/AuthContext';
import TableActions from '../../../components/admin/TableActions';

interface BatchManagementProps {
  farms: Farm[];
}

export default function BatchManagement({ farms }: BatchManagementProps) {
  const { user } = useAuth();
  const [batches, setBatches] = useState<PoultryBatch[]>([]);
  const [houses, setHouses] = useState<PoultryHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<PoultryBatch | null>(null);
  const [filter, setFilter] = useState({
    search: '',
    productionType: '' as ProductionType | '',
    status: '' as BatchStatus | '',
    farm: '',
  });
  
  const [formData, setFormData] = useState({
    production_type: 'Broiler' as ProductionType,
    farm_id: '',
    house_id: '',
    breed_strain: '',
    source: '',
    placement_date: new Date(),
    initial_quantity: '',
    age_at_placement: '',
    production_phase: '',
    expected_market_date: undefined as Date | undefined,
    expected_laying_period: '',
    status: 'Planned' as BatchStatus,
    notes: '',
  });

  useEffect(() => {
    fetchBatches();
    fetchHouses();
  }, []);

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

  const fetchHouses = async () => {
    try {
      const { data, error } = await supabase
        .from('poultry_houses')
        .select('*')
        .order('name');
      if (error) throw error;
      setHouses(data || []);
    } catch (error) {
      console.error('Error fetching houses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const batchData: any = {
        production_type: formData.production_type,
        farm_id: formData.farm_id,
        house_id: formData.house_id || null,
        breed_strain: formData.breed_strain,
        source: formData.source || null,
        placement_date: formData.placement_date.toISOString().split('T')[0],
        initial_quantity: parseInt(formData.initial_quantity),
        age_at_placement: formData.age_at_placement ? parseInt(formData.age_at_placement) : null,
        production_phase: formData.production_phase || null,
        expected_market_date: formData.expected_market_date?.toISOString().split('T')[0] || null,
        expected_laying_period: formData.expected_laying_period ? parseInt(formData.expected_laying_period) : null,
        status: formData.status,
        notes: formData.notes || null,
        created_by: user.id,
      };

      if (editingBatch) {
        const { error } = await supabase
          .from('poultry_batches')
          .update({ ...batchData, updated_at: new Date().toISOString() })
          .eq('id', editingBatch.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('poultry_batches')
          .insert([batchData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingBatch(null);
      resetForm();
      fetchBatches();
    } catch (error) {
      console.error('Error saving batch:', error);
      alert('Error saving batch');
    }
  };

  const resetForm = () => {
    setFormData({
      production_type: 'Broiler',
      farm_id: '',
      house_id: '',
      breed_strain: '',
      source: '',
      placement_date: new Date(),
      initial_quantity: '',
      age_at_placement: '',
      production_phase: '',
      expected_market_date: undefined,
      expected_laying_period: '',
      status: 'Planned',
      notes: '',
    });
  };

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch = filter.search === '' || 
      batch.batch_flock_id.toLowerCase().includes(filter.search.toLowerCase()) ||
      batch.breed_strain.toLowerCase().includes(filter.search.toLowerCase());
    const matchesType = filter.productionType === '' || batch.production_type === filter.productionType;
    const matchesStatus = filter.status === '' || batch.status === filter.status;
    const matchesFarm = filter.farm === '' || batch.farm_id === filter.farm;
    return matchesSearch && matchesType && matchesStatus && matchesFarm;
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
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search batches..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={filter.productionType}
            onChange={(e) => setFilter({ ...filter, productionType: e.target.value as ProductionType | '' })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Types</option>
            <option value="Broiler">Broilers</option>
            <option value="Layer">Layers</option>
          </select>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value as BatchStatus | '' })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="Planned">Planned</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Closed">Closed</option>
          </select>
          <select
            value={filter.farm}
            onChange={(e) => setFilter({ ...filter, farm: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Farms</option>
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>{farm.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingBatch(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          Create Batch/Flock
        </button>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Batches & Flocks</h3>
          <TableActions
            tableId="batches-table"
            title="Poultry Batches"
            data={batches}
            filteredData={filteredBatches}
            columns={[
              { key: 'batch_flock_id', label: 'Batch ID' },
              { key: 'production_type', label: 'Type' },
              { key: 'farm_id', label: 'Farm' },
              { key: 'placement_date', label: 'Placement Date' },
              { key: 'initial_quantity', label: 'Initial Qty' },
              { key: 'status', label: 'Status' },
            ]}
            getRowData={(batch) => {
              const farm = farms.find((f) => f.id === batch.farm_id);
              return {
                'batch_flock_id': batch.batch_flock_id,
                'production_type': batch.production_type,
                'farm_id': farm?.name || 'N/A',
                'placement_date': batch.placement_date,
                'initial_quantity': batch.initial_quantity,
                'status': batch.status,
              };
            }}
          />
        </div>
        <div className="overflow-x-auto">
          <table id="batches-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch/Flock ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breed/Strain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placement Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Initial Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBatches.map((batch) => {
                const farm = farms.find((f) => f.id === batch.farm_id);
                const house = houses.find((h) => h.id === batch.house_id);
                return (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{batch.batch_flock_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        batch.production_type === 'Broiler' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {batch.production_type}
                      </span>
                    </td>
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
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          setEditingBatch(batch);
                          setFormData({
                            production_type: batch.production_type,
                            farm_id: batch.farm_id,
                            house_id: batch.house_id || '',
                            breed_strain: batch.breed_strain,
                            source: batch.source || '',
                            placement_date: new Date(batch.placement_date),
                            initial_quantity: batch.initial_quantity.toString(),
                            age_at_placement: batch.age_at_placement?.toString() || '',
                            production_phase: batch.production_phase || '',
                            expected_market_date: batch.expected_market_date ? new Date(batch.expected_market_date) : undefined,
                            expected_laying_period: batch.expected_laying_period?.toString() || '',
                            status: batch.status,
                            notes: batch.notes || '',
                          });
                          setShowModal(true);
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingBatch ? 'Edit Batch/Flock' : 'Create New Batch/Flock'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Production Type * <span className="text-xs text-gray-500">(Required for performance tracking)</span>
                  </label>
                  <select
                    value={formData.production_type}
                    onChange={(e) => setFormData({ ...formData, production_type: e.target.value as ProductionType })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Broiler">Broilers (short cycle)</option>
                    <option value="Layer">Layers (long cycle)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Farm Branch * <span className="text-xs text-gray-500">(Ensures location traceability)</span>
                  </label>
                  <select
                    value={formData.farm_id}
                    onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Farm</option>
                    {farms
                      .filter((f) => f.type === formData.production_type || f.type === 'Other')
                      .map((farm) => (
                        <option key={farm.id} value={farm.id}>{farm.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poultry House/Pen <span className="text-xs text-gray-500">(Optional)</span>
                  </label>
                  <select
                    value={formData.house_id}
                    onChange={(e) => setFormData({ ...formData, house_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select House/Pen</option>
                    {houses
                      .filter((h) => !formData.farm_id || h.farm_id === formData.farm_id)
                      .map((house) => (
                        <option key={house.id} value={house.id}>{house.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Breed/Strain * <span className="text-xs text-gray-500">(Critical for performance benchmarks)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.breed_strain}
                    onChange={(e) => setFormData({ ...formData, breed_strain: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Cobb 500, ISA Brown"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chick/Pullet Source <span className="text-xs text-gray-500">(Critical for performance benchmarks)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Supplier name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Placement Date * <span className="text-xs text-gray-500">(Used for age and feed calculations)</span>
                  </label>
                  <DatePicker
                    selected={formData.placement_date}
                    onChange={(date: Date) => setFormData({ ...formData, placement_date: date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Quantity * <span className="text-xs text-gray-500">(Used for age and feed calculations)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.initial_quantity}
                    onChange={(e) => setFormData({ ...formData, initial_quantity: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                {formData.production_type === 'Layer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Age at Placement (Days) <span className="text-xs text-gray-500">(Feeds into egg production targets)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.age_at_placement}
                        onChange={(e) => setFormData({ ...formData, age_at_placement: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Production Phase <span className="text-xs text-gray-500">(Feeds into egg production targets)</span>
                      </label>
                      <select
                        value={formData.production_phase}
                        onChange={(e) => setFormData({ ...formData, production_phase: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select Phase</option>
                        <option value="Pullet">Pullet</option>
                        <option value="Layer">Layer</option>
                        <option value="Molt">Molt</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expected Laying Period (Days) <span className="text-xs text-gray-500">(Used for planning and KPI tracking)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.expected_laying_period}
                        onChange={(e) => setFormData({ ...formData, expected_laying_period: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </>
                )}
                {formData.production_type === 'Broiler' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Market Date <span className="text-xs text-gray-500">(Used for planning and KPI tracking)</span>
                    </label>
                    <DatePicker
                      selected={formData.expected_market_date}
                      onChange={(date: Date | null) => setFormData({ ...formData, expected_market_date: date || undefined })}
                      dateFormat="yyyy-MM-dd"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status * <span className="text-xs text-gray-500">(Status affects which operations can be done)</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as BatchStatus })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingBatch ? 'Update' : 'Create Batch/Flock'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBatch(null);
                    resetForm();
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




