import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Asset, AssetCategory, DepreciationMethod } from '../../../types';
import { Plus, Edit, Search, Building } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../../contexts/AuthContext';
import TableActions from '../../../components/admin/TableActions';

export default function AssetsManagement() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [filter, setFilter] = useState({
    search: '',
    category: '' as AssetCategory | '',
    activeOnly: true,
  });

  const [formData, setFormData] = useState({
    asset_name: '',
    asset_category: '' as AssetCategory | '',
    purchase_date: new Date(),
    purchase_cost: '',
    depreciation_method: 'Straight-line' as DepreciationMethod,
    useful_life_years: '',
    depreciation_rate_percent: '',
    accumulated_depreciation: '0',
    location: '',
    assigned_department: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const generateAssetCode = async (): Promise<string> => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `AST-${dateStr}-${random}`;
  };

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('purchase_date', { ascending: false });
      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNetBookValue = (): number => {
    const purchaseCost = parseFloat(formData.purchase_cost) || 0;
    const accumulatedDep = parseFloat(formData.accumulated_depreciation) || 0;
    return purchaseCost - accumulatedDep;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const assetCode = editingAsset?.asset_code || await generateAssetCode();
      const purchaseCost = parseFloat(formData.purchase_cost);
      const accumulatedDep = parseFloat(formData.accumulated_depreciation) || 0;
      const netBookValue = purchaseCost - accumulatedDep;

      const assetData: any = {
        asset_code: assetCode,
        asset_name: formData.asset_name,
        asset_category: formData.asset_category,
        purchase_date: formData.purchase_date.toISOString().split('T')[0],
        purchase_cost: purchaseCost,
        depreciation_method: formData.depreciation_method,
        useful_life_years: formData.useful_life_years ? parseFloat(formData.useful_life_years) : null,
        depreciation_rate_percent: formData.depreciation_rate_percent ? parseFloat(formData.depreciation_rate_percent) : null,
        accumulated_depreciation: accumulatedDep,
        net_book_value: netBookValue,
        location: formData.location || null,
        assigned_department: formData.assigned_department || null,
        notes: formData.notes || null,
        is_active: formData.is_active,
        created_by: user.id,
      };

      if (editingAsset) {
        const { error } = await supabase
          .from('assets')
          .update({ ...assetData, updated_at: new Date().toISOString() })
          .eq('id', editingAsset.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('assets').insert([assetData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingAsset(null);
      resetForm();
      fetchAssets();
    } catch (error) {
      console.error('Error saving asset:', error);
      alert('Error saving asset');
    }
  };

  const resetForm = () => {
    setFormData({
      asset_name: '',
      asset_category: '' as AssetCategory | '',
      purchase_date: new Date(),
      purchase_cost: '',
      depreciation_method: 'Straight-line',
      useful_life_years: '',
      depreciation_rate_percent: '',
      accumulated_depreciation: '0',
      location: '',
      assigned_department: '',
      notes: '',
      is_active: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = filter.search === '' || 
      asset.asset_code.toLowerCase().includes(filter.search.toLowerCase()) ||
      asset.asset_name.toLowerCase().includes(filter.search.toLowerCase());
    const matchesCategory = filter.category === '' || asset.asset_category === filter.category;
    const matchesActive = !filter.activeOnly || asset.is_active;
    return matchesSearch && matchesCategory && matchesActive;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search assets..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value as AssetCategory | '' })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Categories</option>
            <option value="Land">Land</option>
            <option value="Building">Building</option>
            <option value="Equipment">Equipment</option>
            <option value="Vehicle">Vehicle</option>
            <option value="Furniture">Furniture</option>
            <option value="Other">Other</option>
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filter.activeOnly}
              onChange={(e) => setFilter({ ...filter, activeOnly: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Active Only</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingAsset(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          Register Asset
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Assets</h3>
          <TableActions
            tableId="assets-table"
            title="Assets"
            data={filteredAssets}
            filteredData={filteredAssets}
            columns={[
              { key: 'asset_code', label: 'Code' },
              { key: 'asset_name', label: 'Name' },
              { key: 'asset_category', label: 'Category' },
              { key: 'purchase_cost', label: 'Cost' },
              { key: 'net_book_value', label: 'Net Book Value' },
            ]}
            getRowData={(asset) => ({
              'asset_code': asset.asset_code,
              'asset_name': asset.asset_name,
              'asset_category': asset.asset_category,
              'purchase_cost': asset.purchase_cost,
              'net_book_value': asset.net_book_value || 0,
            })}
          />
        </div>
        <div className="overflow-x-auto">
          <table id="assets-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Purchase Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Accumulated Depreciation</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Book Value</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{asset.asset_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{asset.asset_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{asset.asset_category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(asset.purchase_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">KES {asset.purchase_cost.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">KES {asset.accumulated_depreciation.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                    KES {(asset.net_book_value || (asset.purchase_cost - asset.accumulated_depreciation)).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => {
                        setEditingAsset(asset);
                        setFormData({
                          asset_name: asset.asset_name,
                          asset_category: asset.asset_category,
                          purchase_date: new Date(asset.purchase_date),
                          purchase_cost: asset.purchase_cost.toString(),
                          depreciation_method: asset.depreciation_method,
                          useful_life_years: asset.useful_life_years?.toString() || '',
                          depreciation_rate_percent: asset.depreciation_rate_percent?.toString() || '',
                          accumulated_depreciation: asset.accumulated_depreciation.toString(),
                          location: asset.location || '',
                          assigned_department: asset.assigned_department || '',
                          notes: asset.notes || '',
                          is_active: asset.is_active,
                        });
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingAsset ? 'Edit Asset' : 'Register Asset'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {editingAsset && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset ID / Code <span className="text-xs text-gray-500">(Unique identifier for each asset)</span>
                  </label>
                  <input
                    type="text"
                    value={editingAsset.asset_code}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Name / Description * <span className="text-xs text-gray-500">(E.g., Feed Storage Silo, Egg Grading Machine)</span>
                </label>
                <input
                  type="text"
                  value={formData.asset_name}
                  onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Category * <span className="text-xs text-gray-500">(Land, Building, Equipment, Vehicle, Furniture)</span>
                  </label>
                  <select
                    value={formData.asset_category}
                    onChange={(e) => setFormData({ ...formData, asset_category: e.target.value as AssetCategory | '' })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Category</option>
                    <option value="Land">Land</option>
                    <option value="Building">Building</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Date * <span className="text-xs text-gray-500">(Date of acquisition)</span>
                  </label>
                  <DatePicker
                    selected={formData.purchase_date}
                    onChange={(date: Date) => setFormData({ ...formData, purchase_date: date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Cost * <span className="text-xs text-gray-500">(Initial cost of the asset)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchase_cost}
                    onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Depreciation Method * <span className="text-xs text-gray-500">(Straight-line, reducing balance, etc.)</span>
                  </label>
                  <select
                    value={formData.depreciation_method}
                    onChange={(e) => setFormData({ ...formData, depreciation_method: e.target.value as DepreciationMethod })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Straight-line">Straight-line</option>
                    <option value="Reducing Balance">Reducing Balance</option>
                    <option value="Units of Production">Units of Production</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>
              {formData.depreciation_method !== 'None' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Useful Life (Years)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.useful_life_years}
                      onChange={(e) => setFormData({ ...formData, useful_life_years: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  {formData.depreciation_method === 'Reducing Balance' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Depreciation Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={formData.depreciation_rate_percent}
                        onChange={(e) => setFormData({ ...formData, depreciation_rate_percent: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Accumulated Depreciation <span className="text-xs text-gray-500">(System calculates automatically based on method and period)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.accumulated_depreciation}
                  onChange={(e) => setFormData({ ...formData, accumulated_depreciation: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm text-gray-600">Net Book Value</p>
                <p className="text-lg font-semibold text-green-700">
                  KES {calculateNetBookValue().toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Calculated: Purchase Cost - Accumulated Depreciation</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location / Assigned Department <span className="text-xs text-gray-500">(Optional field for tracking usage)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.assigned_department}
                    onChange={(e) => setFormData({ ...formData, assigned_department: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Department"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes <span className="text-xs text-gray-500">(Optional additional details)</span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingAsset ? 'Update' : 'Register Asset'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAsset(null);
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

