import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { EggCollectionEnhanced, PoultryBatch, Farm, Staff } from '../../../types';
import { Plus, Edit, Search, Egg } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../../contexts/AuthContext';
import TableActions from '../../../components/admin/TableActions';

interface EggGradingProps {
  farms: Farm[];
}

export default function EggGrading({ farms }: EggGradingProps) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<EggCollectionEnhanced[]>([]);
  const [batches, setBatches] = useState<PoultryBatch[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<EggCollectionEnhanced | null>(null);
  const [filter, setFilter] = useState({
    search: '',
    batch: '',
    farm: '',
    dateFrom: '',
    dateTo: '',
  });

  const [formData, setFormData] = useState({
    batch_id: '',
    farm_id: '',
    branch: '',
    collection_date: new Date(),
    collection_time: '',
    total_eggs_collected: '',
    grade_a_quantity: '0',
    grade_b_quantity: '0',
    grade_c_quantity: '0',
    dirty_eggs_quantity: '0',
    average_egg_weight_g: '',
    storage_temperature_c: '',
    staff_id: '',
    notes: '',
  });

  useEffect(() => {
    fetchCollections();
    fetchBatches();
    fetchStaff();
  }, []);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('egg_collections_enhanced')
        .select('*')
        .order('collection_date', { ascending: false });
      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching egg collections:', error);
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const validateGrades = (): boolean => {
    const total = parseInt(formData.total_eggs_collected) || 0;
    const gradeA = parseInt(formData.grade_a_quantity) || 0;
    const gradeB = parseInt(formData.grade_b_quantity) || 0;
    const gradeC = parseInt(formData.grade_c_quantity) || 0;
    const dirty = parseInt(formData.dirty_eggs_quantity) || 0;
    const sum = gradeA + gradeB + gradeC + dirty;
    
    return sum === total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const totalEggs = parseInt(formData.total_eggs_collected);
      const gradeA = parseInt(formData.grade_a_quantity) || 0;
      const gradeB = parseInt(formData.grade_b_quantity) || 0;
      const gradeC = parseInt(formData.grade_c_quantity) || 0;
      const dirty = parseInt(formData.dirty_eggs_quantity) || 0;

      // Validation
      if (totalEggs <= 0) {
        alert('Total eggs collected must be greater than 0');
        return;
      }

      if (gradeA + gradeB + gradeC + dirty !== totalEggs) {
        alert(`Grade quantities (${gradeA + gradeB + gradeC + dirty}) must equal total eggs collected (${totalEggs})`);
        return;
      }

      const collectionData: any = {
        batch_id: formData.batch_id || null,
        farm_id: formData.farm_id,
        branch: formData.branch || null,
        collection_date: formData.collection_date.toISOString().split('T')[0],
        collection_time: formData.collection_time || null,
        total_eggs_collected: totalEggs,
        grade_a_quantity: gradeA,
        grade_b_quantity: gradeB,
        grade_c_quantity: gradeC,
        dirty_eggs_quantity: dirty,
        average_egg_weight_g: formData.average_egg_weight_g ? parseFloat(formData.average_egg_weight_g) : null,
        storage_temperature_c: formData.storage_temperature_c ? parseFloat(formData.storage_temperature_c) : null,
        staff_id: formData.staff_id || null,
        notes: formData.notes || null,
        created_by: user.id,
      };

      if (editingCollection) {
        const { error } = await supabase
          .from('egg_collections_enhanced')
          .update({ ...collectionData, updated_at: new Date().toISOString() })
          .eq('id', editingCollection.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('egg_collections_enhanced').insert([collectionData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingCollection(null);
      resetForm();
      fetchCollections();
    } catch (error) {
      console.error('Error saving egg collection:', error);
      alert('Error saving egg collection');
    }
  };

  const resetForm = () => {
    setFormData({
      batch_id: '',
      farm_id: '',
      branch: '',
      collection_date: new Date(),
      collection_time: '',
      total_eggs_collected: '',
      grade_a_quantity: '0',
      grade_b_quantity: '0',
      grade_c_quantity: '0',
      dirty_eggs_quantity: '0',
      average_egg_weight_g: '',
      storage_temperature_c: '',
      staff_id: '',
      notes: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const filteredCollections = collections.filter((collection) => {
    const batch = batches.find((b) => b.id === collection.batch_id);
    const farm = farms.find((f) => f.id === collection.farm_id);
    const matchesSearch = filter.search === '' || 
      batch?.batch_flock_id.toLowerCase().includes(filter.search.toLowerCase()) ||
      farm?.name.toLowerCase().includes(filter.search.toLowerCase());
    const matchesBatch = filter.batch === '' || collection.batch_id === filter.batch;
    const matchesFarm = filter.farm === '' || collection.farm_id === filter.farm;
    const matchesDateFrom = filter.dateFrom === '' || new Date(collection.collection_date) >= new Date(filter.dateFrom);
    const matchesDateTo = filter.dateTo === '' || new Date(collection.collection_date) <= new Date(filter.dateTo);
    return matchesSearch && matchesBatch && matchesFarm && matchesDateFrom && matchesDateTo;
  });

  const totalGradeA = filteredCollections.reduce((sum, c) => sum + c.grade_a_quantity, 0);
  const totalGradeB = filteredCollections.reduce((sum, c) => sum + c.grade_b_quantity, 0);
  const totalGradeC = filteredCollections.reduce((sum, c) => sum + c.grade_c_quantity, 0);
  const totalDirty = filteredCollections.reduce((sum, c) => sum + c.dirty_eggs_quantity, 0);
  const totalEggs = filteredCollections.reduce((sum, c) => sum + c.total_eggs_collected, 0);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
          <select
            value={filter.farm}
            onChange={(e) => setFilter({ ...filter, farm: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Farms</option>
            {farms.filter(f => f.type === 'Layer').map((farm) => (
              <option key={farm.id} value={farm.id}>{farm.name}</option>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Eggs</p>
          <p className="text-2xl font-bold">{totalEggs.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border-2 border-green-200">
          <p className="text-sm text-gray-600">Grade A</p>
          <p className="text-2xl font-bold text-green-700">{totalGradeA.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Large, clean, perfect</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 border-2 border-blue-200">
          <p className="text-sm text-gray-600">Grade B</p>
          <p className="text-2xl font-bold text-blue-700">{totalGradeB.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Medium, minor defect</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4 border-2 border-yellow-200">
          <p className="text-sm text-gray-600">Grade C</p>
          <p className="text-2xl font-bold text-yellow-700">{totalGradeC.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Small, irregular</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4 border-2 border-red-200">
          <p className="text-sm text-gray-600">Dirty</p>
          <p className="text-2xl font-bold text-red-700">{totalDirty.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Unsuitable for premium</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingCollection(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          Add Egg Collection with Grading
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Egg Collections with Grading</h3>
          <TableActions
            tableId="egg-grading-table"
            title="Egg Grading"
            data={filteredCollections}
            filteredData={filteredCollections}
            columns={[
              { key: 'collection_date', label: 'Date' },
              { key: 'total_eggs_collected', label: 'Total' },
              { key: 'grade_a_quantity', label: 'Grade A' },
              { key: 'grade_b_quantity', label: 'Grade B' },
              { key: 'grade_c_quantity', label: 'Grade C' },
              { key: 'dirty_eggs_quantity', label: 'Dirty' },
            ]}
            getRowData={(collection) => ({
              'collection_date': collection.collection_date,
              'total_eggs_collected': collection.total_eggs_collected,
              'grade_a_quantity': collection.grade_a_quantity,
              'grade_b_quantity': collection.grade_b_quantity,
              'grade_c_quantity': collection.grade_c_quantity,
              'dirty_eggs_quantity': collection.dirty_eggs_quantity,
            })}
          />
        </div>
        <div className="overflow-x-auto">
          <table id="egg-grading-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flock ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Eggs</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Grade A</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Grade B</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Grade C</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Dirty</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Weight (g)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCollections.map((collection) => {
                const batch = batches.find((b) => b.id === collection.batch_id);
                const farm = farms.find((f) => f.id === collection.farm_id);
                return (
                  <tr key={collection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(collection.collection_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{batch?.batch_flock_id || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{farm?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                      {collection.total_eggs_collected}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                      {collection.grade_a_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                      {collection.grade_b_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-yellow-600">
                      {collection.grade_c_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {collection.dirty_eggs_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {collection.average_egg_weight_g ? `${collection.average_egg_weight_g}g` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          setEditingCollection(collection);
                          setFormData({
                            batch_id: collection.batch_id || '',
                            farm_id: collection.farm_id,
                            branch: collection.branch || '',
                            collection_date: new Date(collection.collection_date),
                            collection_time: collection.collection_time || '',
                            total_eggs_collected: collection.total_eggs_collected.toString(),
                            grade_a_quantity: collection.grade_a_quantity.toString(),
                            grade_b_quantity: collection.grade_b_quantity.toString(),
                            grade_c_quantity: collection.grade_c_quantity.toString(),
                            dirty_eggs_quantity: collection.dirty_eggs_quantity.toString(),
                            average_egg_weight_g: collection.average_egg_weight_g?.toString() || '',
                            storage_temperature_c: collection.storage_temperature_c?.toString() || '',
                            staff_id: collection.staff_id || '',
                            notes: collection.notes || '',
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingCollection ? 'Edit Egg Collection' : 'Add Egg Collection with Grading'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Farm * <span className="text-xs text-gray-500">(Ensures location traceability)</span>
                  </label>
                  <select
                    value={formData.farm_id}
                    onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Farm</option>
                    {farms.filter(f => f.type === 'Layer').map((farm) => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Flock ID <span className="text-xs text-gray-500">(Select batch/flock)</span>
                  </label>
                  <select
                    value={formData.batch_id}
                    onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Flock (Optional)</option>
                    {batches
                      .filter((b) => !formData.farm_id || b.farm_id === formData.farm_id)
                      .map((batch) => (
                        <option key={batch.id} value={batch.id}>{batch.batch_flock_id}</option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collection Date * <span className="text-xs text-gray-500">(Ensures traceability of eggs)</span>
                  </label>
                  <DatePicker
                    selected={formData.collection_date}
                    onChange={(date: Date) => setFormData({ ...formData, collection_date: date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collection Time <span className="text-xs text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="time"
                    value={formData.collection_time}
                    onChange={(e) => setFormData({ ...formData, collection_time: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch/Warehouse <span className="text-xs text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Branch/warehouse location"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Eggs Collected * <span className="text-xs text-gray-500">(System ensures total = collected eggs)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.total_eggs_collected}
                  onChange={(e) => {
                    const total = e.target.value;
                    setFormData({ ...formData, total_eggs_collected: total });
                  }}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Grading Distribution *</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade A <span className="text-xs text-gray-500">(Large, clean, perfect - Retail standard eggs)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.grade_a_quantity}
                      onChange={(e) => setFormData({ ...formData, grade_a_quantity: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade B <span className="text-xs text-gray-500">(Medium, minor defect - Acceptable quality)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.grade_b_quantity}
                      onChange={(e) => setFormData({ ...formData, grade_b_quantity: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade C <span className="text-xs text-gray-500">(Small, irregular - Lower quality)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.grade_c_quantity}
                      onChange={(e) => setFormData({ ...formData, grade_c_quantity: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirty <span className="text-xs text-gray-500">(Unsuitable for premium sale - Requires handling)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.dirty_eggs_quantity}
                      onChange={(e) => setFormData({ ...formData, dirty_eggs_quantity: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="mt-3 p-3 bg-white rounded">
                  <p className="text-sm">
                    <span className="font-medium">Total Grades: </span>
                    <span className={validateGrades() ? 'text-green-600' : 'text-red-600'}>
                      {(parseInt(formData.grade_a_quantity) || 0) + 
                       (parseInt(formData.grade_b_quantity) || 0) + 
                       (parseInt(formData.grade_c_quantity) || 0) + 
                       (parseInt(formData.dirty_eggs_quantity) || 0)}
                    </span>
                    {' / '}
                    <span className="font-medium">Total Collected: {formData.total_eggs_collected || 0}</span>
                    {!validateGrades() && formData.total_eggs_collected && (
                      <span className="text-red-600 ml-2">⚠ Must match!</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Average Egg Weight (g) <span className="text-xs text-gray-500">(Supports quality and compliance)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.average_egg_weight_g}
                    onChange={(e) => setFormData({ ...formData, average_egg_weight_g: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., 60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Storage Temperature (°C) <span className="text-xs text-gray-500">(Supports quality and compliance)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.storage_temperature_c}
                    onChange={(e) => setFormData({ ...formData, storage_temperature_c: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., 4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Staff <span className="text-xs text-gray-500">(Staff accountable for collection)</span>
                  </label>
                  <select
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Staff</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes/Observations <span className="text-xs text-gray-500">(Optional remarks for abnormalities)</span>
                </label>
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
                  {editingCollection ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCollection(null);
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

