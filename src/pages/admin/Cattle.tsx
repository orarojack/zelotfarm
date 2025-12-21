import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Cattle as CattleType, Farm, CattleGender, CattleStatus } from '../../types';
import { Plus, Edit, Trash2, Circle, Eye, Search, Upload, X, Camera } from 'lucide-react';
import DatePicker from 'react-datepicker';
import TableActions from '../../components/admin/TableActions';

export default function Cattle() {
  const [activeTab, setActiveTab] = useState<'active' | 'deceased' | 'sold'>('active');
  const [cattle, setCattle] = useState<CattleType[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showDeceasedModal, setShowDeceasedModal] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [cattleToSell, setCattleToSell] = useState<CattleType | null>(null);
  const [cattleToMarkDeceased, setCattleToMarkDeceased] = useState<CattleType | null>(null);
  const [selectedCattle, setSelectedCattle] = useState<CattleType | null>(null);
  const [editingCattle, setEditingCattle] = useState<CattleType | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    tag_id: '',
    farm_id: '',
    cow_name: '',
    breed: '',
    gender: 'Female' as CattleGender,
    status: 'Calf' as CattleStatus,
    birth_date: new Date(),
    birth_weight: '',
    mother_tag: '',
    father_tag: '',
    notes: '',
    image_url: '',
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
  }, []);

  const fetchFarms = async () => {
    const { data } = await supabase.from('farms').select('*').eq('type', 'Dairy');
    setFarms(data || []);
  };

  const fetchCattle = async () => {
    try {
      let query = supabase.from('cattle').select('*').order('created_at', { ascending: false });
      
      // Filter by tab (active, deceased, or sold)
      if (activeTab === 'deceased') {
        query = query.not('death_date', 'is', null);
      } else if (activeTab === 'sold') {
        query = query.not('sale_date', 'is', null);
      } else {
        // Active: no death_date and no sale_date
        query = query.is('death_date', null).is('sale_date', null);
      }
      
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

  useEffect(() => {
    fetchCattle();
  }, [activeTab, filters.farm]);

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `cattle/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cattle-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('cattle-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = formData.image_url;

      // Upload new image if selected
      if (selectedImage) {
        const uploadedUrl = await uploadImage(selectedImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const cattleData = {
        tag_id: formData.tag_id,
        farm_id: formData.farm_id,
        cow_name: formData.cow_name || null,
        breed: formData.breed,
        gender: formData.gender,
        status: formData.status,
        birth_date: formData.birth_date.toISOString().split('T')[0],
        birth_weight: formData.birth_weight ? Math.max(0, parseFloat(formData.birth_weight)) : null,
        mother_tag: formData.mother_tag || null,
        father_tag: formData.father_tag || null,
        image_url: imageUrl || null,
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
      setSelectedImage(null);
      setImagePreview(null);
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
      cow_name: '',
      breed: '',
      gender: 'Female',
      status: 'Calf',
      birth_date: new Date(),
      birth_weight: '',
      mother_tag: '',
      father_tag: '',
      notes: '',
      image_url: '',
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleEdit = (c: CattleType) => {
    setEditingCattle(c);
    setFormData({
      tag_id: c.tag_id,
      farm_id: c.farm_id,
      cow_name: c.cow_name || '',
      breed: c.breed,
      gender: c.gender,
      status: c.status,
      birth_date: new Date(c.birth_date),
      birth_weight: c.birth_weight?.toString() || '',
      mother_tag: c.mother_tag || '',
      father_tag: c.father_tag || '',
      notes: c.notes || '',
      image_url: c.image_url || '',
    });
    setImagePreview(c.image_url || null);
    setSelectedImage(null);
    setShowModal(true);
  };

  const handleView = (c: CattleType) => {
    setSelectedCattle(c);
    setShowDetailModal(true);
  };

  const handleMarkDeceased = (c: CattleType) => {
    setCattleToMarkDeceased(c);
    setShowDeceasedModal(true);
  };

  const confirmDeceased = async () => {
    if (!cattleToMarkDeceased) return;
    
    try {
      const { error } = await supabase
        .from('cattle')
        .update({ 
          status: 'Deceased',
          death_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', cattleToMarkDeceased.id);
      
      if (error) throw error;
      setShowDeceasedModal(false);
      setCattleToMarkDeceased(null);
      fetchCattle();
    } catch (error) {
      console.error('Error marking cattle as deceased:', error);
      alert('Error updating cattle record');
    }
  };

  const handleMarkSold = (c: CattleType) => {
    setCattleToSell(c);
    setSalePrice('');
    setShowSaleModal(true);
  };

  const confirmSale = async () => {
    if (!cattleToSell) return;
    
    const price = parseFloat(salePrice);
    if (isNaN(price) || price < 0) {
      alert('Please enter a valid sale price');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('cattle')
        .update({ 
          status: 'Sold',
          sale_date: new Date().toISOString().split('T')[0],
          sale_price: price,
          updated_at: new Date().toISOString()
        })
        .eq('id', cattleToSell.id);
      
      if (error) throw error;
      setShowSaleModal(false);
      setCattleToSell(null);
      setSalePrice('');
      fetchCattle();
    } catch (error) {
      console.error('Error marking cattle as sold:', error);
      alert('Error updating cattle record');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(formData.image_url || null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Filter cattle based on active tab
  const filteredCattle = cattle.filter((c) => {
    const matchesSearch = filters.search === '' || 
      c.tag_id.toLowerCase().includes(filters.search.toLowerCase()) ||
      c.breed.toLowerCase().includes(filters.search.toLowerCase()) ||
      (c.cow_name && c.cow_name.toLowerCase().includes(filters.search.toLowerCase()));
    const matchesBreed = filters.breed === '' || c.breed === filters.breed;
    const matchesGender = filters.gender === '' || c.gender === filters.gender;
    const matchesStatus = filters.status === '' || c.status === filters.status;
    return matchesSearch && matchesBreed && matchesGender && matchesStatus;
  });

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

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <nav className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Circle size={20} />
              Active
            </div>
          </button>
          <button
            onClick={() => setActiveTab('deceased')}
            className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'deceased'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Circle size={20} />
              Deceased
            </div>
          </button>
          <button
            onClick={() => setActiveTab('sold')}
            className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sold'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Circle size={20} />
              Sold
            </div>
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by insurance, name, breed..."
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
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Cattle List</h3>
          <TableActions
            tableId="cattle-table"
            title={`Cattle - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
            data={cattle}
            filteredData={filteredCattle}
            columns={[
              { key: 'tag_id', label: 'Insurance' },
              { key: 'cow_name', label: 'Cow Name' },
              { key: 'breed', label: 'Breed' },
              { key: 'gender', label: 'Gender' },
              { key: 'status', label: 'Status' },
              { key: 'birth_date', label: 'Birth Date' },
            ]}
          />
        </div>
        <table id="cattle-table" className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Insurance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cow Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breed</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Birth Date</th>
              {activeTab === 'deceased' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Death Date</th>
              )}
              {activeTab === 'sold' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale Info</th>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCattle.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Circle className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium">{c.tag_id}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.cow_name || 'N/A'}</td>
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
                {activeTab === 'deceased' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {c.death_date ? new Date(c.death_date).toLocaleDateString() : 'N/A'}
                  </td>
                )}
                {activeTab === 'sold' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {c.sale_date && (
                      <>
                        <div className="text-sm text-blue-600">{new Date(c.sale_date).toLocaleDateString()}</div>
                        {c.sale_price && (
                          <div className="text-xs text-gray-500">KES {c.sale_price.toLocaleString()}</div>
                        )}
                      </>
                    )}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleView(c)} className="text-green-600 hover:text-green-900" title="View Details">
                      <Eye size={18} />
                    </button>
                    {activeTab === 'active' && (
                      <>
                        <button 
                          onClick={() => handleMarkDeceased(c)} 
                          className="text-red-600 hover:text-red-900"
                          title="Mark as Deceased"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleMarkSold(c)} 
                          className="text-orange-600 hover:text-orange-900"
                          title="Mark as Sold"
                        >
                          <Circle size={18} />
                        </button>
                      </>
                    )}
                    <button onClick={() => handleEdit(c)} className="text-blue-600 hover:text-blue-900" title="Edit">
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
          <div className="bg-white rounded-lg p-5 w-full max-w-6xl">
            <h2 className="text-2xl font-bold mb-4">
              {editingCattle ? 'Edit Cattle' : 'Add New Cattle'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* First Row: Insurance, Cow Name, Farm */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Insurance *</label>
                  <input
                    type="text"
                    value={formData.tag_id}
                    onChange={(e) => setFormData({ ...formData, tag_id: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cow Name</label>
                  <input
                    type="text"
                    value={formData.cow_name}
                    onChange={(e) => setFormData({ ...formData, cow_name: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Farm *</label>
                  <select
                    value={formData.farm_id}
                    onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Farm</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Second Row: Breed, Gender, Status */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Breed *</label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as CattleGender })}
                    required
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CattleStatus })}
                    required
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Calf">Calf</option>
                    <option value="Heifer">Heifer</option>
                    <option value="Cow">Cow</option>
                    <option value="Bull">Bull</option>
                  </select>
                </div>
              </div>
              
              {/* Third Row: Birth Date, Birth Weight, Mother Tag */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Birth Date *</label>
                  <DatePicker
                    selected={formData.birth_date}
                    onChange={(date: Date) => setFormData({ ...formData, birth_date: date })}
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">Birth Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.birth_weight}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                        setFormData({ ...formData, birth_weight: value });
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value && parseFloat(e.target.value) < 0) {
                        setFormData({ ...formData, birth_weight: '0' });
                      }
                    }}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mother Tag</label>
                  <input
                    type="text"
                    value={formData.mother_tag}
                    onChange={(e) => setFormData({ ...formData, mother_tag: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              {/* Fourth Row: Father Tag, Notes */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Father Tag</label>
                  <input
                    type="text"
                    value={formData.father_tag}
                    onChange={(e) => setFormData({ ...formData, father_tag: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              {/* Image Upload - Compact Layout */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cow Image</label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${
                    imagePreview ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-500'
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Cow preview"
                        className="max-h-32 mx-auto rounded-lg shadow-md"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <div className="text-left">
                        <p className="text-xs text-gray-600 mb-1">
                          Drag and drop an image here, or click to select
                        </p>
                        <label className="inline-flex items-center px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                          <Camera size={14} className="mr-1.5" />
                          Choose Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                            capture="environment"
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
                      </div>
                    </div>
                  )}
                  {uploadingImage && (
                    <div className="mt-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                      <p className="text-xs text-gray-600 mt-1">Uploading...</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
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

      {/* Detail Modal */}
      {showDetailModal && selectedCattle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-5xl">
            <h2 className="text-2xl font-bold mb-4">Cattle Details</h2>
            <div className="space-y-6">
              {/* Image Section */}
              {selectedCattle.image_url && (
                <div className="w-full">
                  <img
                    src={selectedCattle.image_url}
                    alt={selectedCattle.cow_name || selectedCattle.tag_id}
                    className="w-full max-h-96 object-cover rounded-lg shadow-lg"
                  />
                </div>
              )}
              
              {/* Details Section */}
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Insurance:</strong> {selectedCattle.tag_id}</div>
                {selectedCattle.cow_name && <div><strong>Cow Name:</strong> {selectedCattle.cow_name}</div>}
                <div><strong>Breed:</strong> {selectedCattle.breed}</div>
                <div><strong>Gender:</strong> {selectedCattle.gender}</div>
                <div><strong>Status:</strong> {selectedCattle.status}</div>
                <div><strong>Birth Date:</strong> {new Date(selectedCattle.birth_date).toLocaleDateString()}</div>
                {selectedCattle.birth_weight && <div><strong>Birth Weight:</strong> {selectedCattle.birth_weight} kg</div>}
                {selectedCattle.mother_tag && <div><strong>Mother:</strong> {selectedCattle.mother_tag}</div>}
                {selectedCattle.father_tag && <div><strong>Father:</strong> {selectedCattle.father_tag}</div>}
                {selectedCattle.death_date && (
                  <div className="text-red-600"><strong>Death Date:</strong> {new Date(selectedCattle.death_date).toLocaleDateString()}</div>
                )}
                {selectedCattle.sale_date && (
                  <>
                    <div className="text-blue-600"><strong>Sale Date:</strong> {new Date(selectedCattle.sale_date).toLocaleDateString()}</div>
                    {selectedCattle.sale_price && (
                      <div className="text-blue-600"><strong>Sale Price:</strong> KES {selectedCattle.sale_price.toLocaleString()}</div>
                    )}
                  </>
                )}
              </div>
              {selectedCattle.notes && (
                <div>
                  <strong>Notes:</strong>
                  <p className="mt-1 text-gray-700">{selectedCattle.notes}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              className="mt-6 w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Sale Price Modal */}
      {showSaleModal && cattleToSell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Mark as Sold</h2>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Enter sale price for <span className="font-semibold">{cattleToSell.cow_name || cattleToSell.tag_id}</span>
              </p>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price (KES) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="Enter sale price"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmSale}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Confirm Sale
              </button>
              <button
                onClick={() => {
                  setShowSaleModal(false);
                  setCattleToSell(null);
                  setSalePrice('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Deceased Modal */}
      {showDeceasedModal && cattleToMarkDeceased && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Mark as Deceased</h2>
            <div className="mb-4">
              <p className="text-gray-700 mb-4">
                Are you sure you want to mark <span className="font-semibold">{cattleToMarkDeceased.cow_name || cattleToMarkDeceased.tag_id}</span> as deceased?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Note:</strong> This action will set the death date to today's date and move this cattle to the "Deceased" tab.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmDeceased}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
              >
                Confirm Deceased
              </button>
              <button
                onClick={() => {
                  setShowDeceasedModal(false);
                  setCattleToMarkDeceased(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

