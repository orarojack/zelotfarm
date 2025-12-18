import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Cattle as CattleType, Farm, CattleGender, CattleStatus } from '../../types';
import { Plus, Edit, Trash2, Circle, Eye, Search } from 'lucide-react';
import DatePicker from 'react-datepicker';

export default function Cattle() {
  const [cattle, setCattle] = useState<CattleType[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCattle, setSelectedCattle] = useState<CattleType | null>(null);
  const [editingCattle, setEditingCattle] = useState<CattleType | null>(null);
  const [formData, setFormData] = useState({
    tag_id: '',
    farm_id: '',
    breed: '',
    gender: 'Female' as CattleGender,
    status: 'Calf' as CattleStatus,
    birth_date: new Date(),
    birth_weight: '',
    mother_tag: '',
    father_tag: '',
    notes: '',
  });
  const [filters, setFilters] = useState({
    search: '',
    farm: 'all',
    breed: '',
    gender: '',
    status: '',
  });

  useEffect(() => {
    fetchFarms();
    fetchCattle();
  }, [filters.farm]);

  const fetchFarms = async () => {
    const { data } = await supabase.from('farms').select('*').eq('type', 'Dairy');
    setFarms(data || []);
  };

  const fetchCattle = async () => {
    try {
      let query = supabase.from('cattle').select('*').order('created_at', { ascending: false });
      
      if (filters.farm !== 'all') {
        query = query.eq('farm_id', filters.farm);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCattle(data || []);
    } catch (error) {
      console.error('Error fetching cattle:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cattleData = {
        tag_id: formData.tag_id,
        farm_id: formData.farm_id,
        breed: formData.breed,
        gender: formData.gender,
        status: formData.status,
        birth_date: formData.birth_date.toISOString().split('T')[0],
        birth_weight: formData.birth_weight ? parseFloat(formData.birth_weight) : null,
        mother_tag: formData.mother_tag || null,
        father_tag: formData.father_tag || null,
        notes: formData.notes || null,
      };

      if (editingCattle) {
        const { error } = await supabase
          .from('cattle')
          .update({ ...cattleData, updated_at: new Date().toISOString() })
          .eq('id', editingCattle.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cattle').insert([cattleData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingCattle(null);
      resetForm();
      fetchCattle();
    } catch (error) {
      console.error('Error saving cattle:', error);
      alert('Error saving cattle record');
    }
  };

  const resetForm = () => {
    setFormData({
      tag_id: '',
      farm_id: '',
      breed: '',
      gender: 'Female',
      status: 'Calf',
      birth_date: new Date(),
      birth_weight: '',
      mother_tag: '',
      father_tag: '',
      notes: '',
    });
  };

  const handleEdit = (c: CattleType) => {
    setEditingCattle(c);
    setFormData({
      tag_id: c.tag_id,
      farm_id: c.farm_id,
      breed: c.breed,
      gender: c.gender,
      status: c.status,
      birth_date: new Date(c.birth_date),
      birth_weight: c.birth_weight?.toString() || '',
      mother_tag: c.mother_tag || '',
      father_tag: c.father_tag || '',
      notes: c.notes || '',
    });
    setShowModal(true);
  };

  const handleView = (c: CattleType) => {
    setSelectedCattle(c);
    setShowDetailModal(true);
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
        <h1 className="text-3xl font-bold text-gray-900">Cattle Management</h1>
        <button
          onClick={() => {
            setEditingCattle(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={20} />
          Add Cattle
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by tag ID, breed..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={filters.farm}
            onChange={(e) => setFilters({ ...filters, farm: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Farms</option>
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>{farm.name}</option>
            ))}
          </select>
          <select
            value={filters.breed}
            onChange={(e) => setFilters({ ...filters, breed: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Breeds</option>
            {[...new Set(cattle.map(c => c.breed))].map((breed) => (
              <option key={breed} value={breed}>{breed}</option>
            ))}
          </select>
          <select
            value={filters.gender}
            onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="Calf">Calf</option>
            <option value="Heifer">Heifer</option>
            <option value="Cow">Cow</option>
            <option value="Bull">Bull</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tag ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breed</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Birth Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cattle.filter((c) => {
              const matchesSearch = filters.search === '' || 
                c.tag_id.toLowerCase().includes(filters.search.toLowerCase()) ||
                c.breed.toLowerCase().includes(filters.search.toLowerCase());
              const matchesBreed = filters.breed === '' || c.breed === filters.breed;
              const matchesGender = filters.gender === '' || c.gender === filters.gender;
              const matchesStatus = filters.status === '' || c.status === filters.status;
              return matchesSearch && matchesBreed && matchesGender && matchesStatus;
            }).map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Circle className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium">{c.tag_id}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.breed}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    c.gender === 'Female' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {c.gender}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(c.birth_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleView(c)} className="text-green-600 hover:text-green-900">
                      <Eye size={18} />
                    </button>
                    <button onClick={() => handleEdit(c)} className="text-blue-600 hover:text-blue-900">
                      <Edit size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingCattle ? 'Edit Cattle' : 'Add New Cattle'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tag ID *</label>
                  <input
                    type="text"
                    value={formData.tag_id}
                    onChange={(e) => setFormData({ ...formData, tag_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
                  <select
                    value={formData.farm_id}
                    onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Farm</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Breed *</label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as CattleGender })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CattleStatus })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Calf">Calf</option>
                    <option value="Heifer">Heifer</option>
                    <option value="Cow">Cow</option>
                    <option value="Bull">Bull</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date *</label>
                  <DatePicker
                    selected={formData.birth_date}
                    onChange={(date: Date) => setFormData({ ...formData, birth_date: date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.birth_weight}
                    onChange={(e) => setFormData({ ...formData, birth_weight: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mother Tag</label>
                  <input
                    type="text"
                    value={formData.mother_tag}
                    onChange={(e) => setFormData({ ...formData, mother_tag: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Father Tag</label>
                  <input
                    type="text"
                    value={formData.father_tag}
                    onChange={(e) => setFormData({ ...formData, father_tag: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
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
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingCattle ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCattle(null);
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

      {/* Detail Modal */}
      {showDetailModal && selectedCattle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Cattle Details</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Tag ID:</strong> {selectedCattle.tag_id}</div>
                <div><strong>Breed:</strong> {selectedCattle.breed}</div>
                <div><strong>Gender:</strong> {selectedCattle.gender}</div>
                <div><strong>Status:</strong> {selectedCattle.status}</div>
                <div><strong>Birth Date:</strong> {new Date(selectedCattle.birth_date).toLocaleDateString()}</div>
                {selectedCattle.birth_weight && <div><strong>Birth Weight:</strong> {selectedCattle.birth_weight} kg</div>}
                {selectedCattle.mother_tag && <div><strong>Mother:</strong> {selectedCattle.mother_tag}</div>}
                {selectedCattle.father_tag && <div><strong>Father:</strong> {selectedCattle.father_tag}</div>}
              </div>
              {selectedCattle.notes && (
                <div><strong>Notes:</strong> {selectedCattle.notes}</div>
              )}
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              className="mt-4 w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

