import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Farm, FarmType } from '../../types';
import { Plus, Edit, Trash2, MapPin, Search } from 'lucide-react';
import { kenyaCounties, getConstituenciesByCounty, getCountyNames } from '../../data/kenyaCounties';
import TableActions from '../../components/admin/TableActions';

export default function Farms() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    location: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    type: 'Dairy' as FarmType,
    location: '',
    county: '',
    constituency: '',
  });

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFarms(data || []);
    } catch (error) {
      console.error('Error fetching farms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Build location string from county and constituency
      let locationString = '';
      if (formData.county && formData.constituency) {
        locationString = `${formData.county}, ${formData.constituency}`;
      } else if (formData.county) {
        locationString = formData.county;
      } else {
        // Fallback to old location field if county/constituency not selected
        locationString = formData.location;
      }

      if (editingFarm) {
        const { error } = await supabase
          .from('farms')
          .update({
            name: formData.name,
            type: formData.type,
            location: locationString,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingFarm.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('farms')
          .insert([{
            name: formData.name,
            type: formData.type,
            location: locationString,
          }]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingFarm(null);
      setFormData({ name: '', type: 'Dairy', location: '', county: '', constituency: '' });
      fetchFarms();
    } catch (error) {
      console.error('Error saving farm:', error);
      alert('Error saving farm');
    }
  };

  const handleEdit = (farm: Farm) => {
    setEditingFarm(farm);
    // Parse existing location if it contains county and constituency
    // Format expected: "County, Constituency" or just the old format
    let county = '';
    let constituency = '';
    
    if (farm.location) {
      const parts = farm.location.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        county = parts[0];
        constituency = parts.slice(1).join(', '); // In case there are multiple commas
      } else {
        // Check if location matches a county name
        const foundCounty = kenyaCounties.find(c => c.name === farm.location);
        if (foundCounty) {
          county = farm.location;
        }
      }
    }
    
    setFormData({
      name: farm.name,
      type: farm.type,
      location: farm.location, // Keep old location for backward compatibility
      county,
      constituency,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this farm?')) return;

    try {
      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchFarms();
    } catch (error) {
      console.error('Error deleting farm:', error);
      alert('Error deleting farm');
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
        <h1 className="text-3xl font-bold text-gray-900">Farm Locations</h1>
        <button
          onClick={() => {
            setEditingFarm(null);
            setFormData({ name: '', type: 'Dairy', location: '', county: '', constituency: '' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={20} />
          Add Farm
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by farm name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="Dairy">Dairy</option>
            <option value="Broiler">Broiler</option>
            <option value="Layer">Layer</option>
            <option value="Other">Other</option>
          </select>
          <select
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Locations</option>
            {[...new Set(farms.map(f => f.location))].map((location) => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Farms List</h3>
          <TableActions
            tableId="farms-table"
            title="Farms"
            data={farms}
            filteredData={farms.filter((farm) => {
              const matchesSearch = filters.search === '' || 
                farm.name.toLowerCase().includes(filters.search.toLowerCase());
              const matchesType = filters.type === '' || farm.type === filters.type;
              const matchesLocation = filters.location === '' || farm.location === filters.location;
              return matchesSearch && matchesType && matchesLocation;
            })}
            columns={[
              { key: 'name', label: 'Farm Name' },
              { key: 'type', label: 'Type' },
              { key: 'location', label: 'Location' },
            ]}
          />
        </div>
        <table id="farms-table" className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Farm Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {farms.filter((farm) => {
              const matchesSearch = filters.search === '' || 
                farm.name.toLowerCase().includes(filters.search.toLowerCase());
              const matchesType = filters.type === '' || farm.type === filters.type;
              const matchesLocation = filters.location === '' || farm.location === filters.location;
              return matchesSearch && matchesType && matchesLocation;
            }).map((farm) => (
              <tr key={farm.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{farm.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    farm.type === 'Dairy' ? 'bg-blue-100 text-blue-800' :
                    farm.type === 'Broiler' ? 'bg-orange-100 text-orange-800' :
                    farm.type === 'Layer' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {farm.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {farm.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(farm)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(farm.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">
              {editingFarm ? 'Edit Farm' : 'Add New Farm'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Farm Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Farm Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as FarmType })}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Dairy">Dairy</option>
                    <option value="Broiler">Broiler</option>
                    <option value="Layer">Layer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    County *
                  </label>
                  <select
                    value={formData.county}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        county: e.target.value, 
                        constituency: ''
                      });
                    }}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select County</option>
                    {getCountyNames().map((county) => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Constituency *
                  </label>
                  <select
                    value={formData.constituency}
                    onChange={(e) => setFormData({ ...formData, constituency: e.target.value })}
                    required
                    disabled={!formData.county}
                    className={`w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      !formData.county ? 'bg-gray-100 cursor-not-allowed text-gray-400' : ''
                    }`}
                  >
                    <option value="">
                      {formData.county ? 'Select Constituency' : 'Select County First'}
                    </option>
                    {formData.county && getConstituenciesByCounty(formData.county).map((constituency) => (
                      <option key={constituency} value={constituency}>{constituency}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingFarm ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingFarm(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
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

