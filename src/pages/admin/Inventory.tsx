import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { InventoryItem, StockMovement, Farm, InventoryCategory } from '../../types';
import { Plus, Edit, Trash2, Package, ArrowRight, ArrowLeft, AlertCircle, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import TableActions from '../../components/admin/TableActions';

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'movements'>('items');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemFormData, setItemFormData] = useState({
    farm_id: '',
    name: '',
    category: 'Feeds' as InventoryCategory,
    unit: '',
    quantity: '',
    min_stock_level: '',
    unit_price: '',
    supplier: '',
    notes: '',
  });
  const [movementFormData, setMovementFormData] = useState({
    inventory_id: '',
    farm_id: '',
    movement_type: 'In' as 'In' | 'Out' | 'Transfer',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    to_farm_id: '',
    notes: '',
  });
  const [itemFilters, setItemFilters] = useState({
    search: '',
    farm: '',
    category: '',
    lowStock: false,
  });
  const [movementFilters, setMovementFilters] = useState({
    search: '',
    farm: '',
    movementType: '',
    dateFrom: '',
    dateTo: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchFarms();
    if (activeTab === 'items') {
      fetchItems();
    } else {
      fetchMovements();
    }
  }, [activeTab]);

  const fetchFarms = async () => {
    const { data } = await supabase.from('farms').select('*');
    setFarms(data || []);
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const itemData = {
        farm_id: itemFormData.farm_id,
        name: itemFormData.name,
        category: itemFormData.category,
        unit: itemFormData.unit,
        quantity: parseFloat(itemFormData.quantity),
        min_stock_level: parseFloat(itemFormData.min_stock_level),
        unit_price: itemFormData.unit_price ? parseFloat(itemFormData.unit_price) : null,
        supplier: itemFormData.supplier || null,
        notes: itemFormData.notes || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('inventory_items')
          .update({ ...itemData, updated_at: new Date().toISOString() })
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('inventory_items').insert([itemData]);
        if (error) throw error;
      }

      setShowItemModal(false);
      setEditingItem(null);
      resetItemForm();
      fetchItems();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      alert('Error saving inventory item');
    }
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const movementData = {
        inventory_id: movementFormData.inventory_id,
        farm_id: movementFormData.farm_id,
        movement_type: movementFormData.movement_type,
        quantity: parseFloat(movementFormData.quantity),
        date: movementFormData.date,
        to_farm_id: movementFormData.movement_type === 'Transfer' ? movementFormData.to_farm_id : null,
        notes: movementFormData.notes || null,
        created_by: user.id,
      };

      const { error } = await supabase.from('stock_movements').insert([movementData]);
      if (error) throw error;

      // Update inventory quantity
      const item = items.find((i) => i.id === movementFormData.inventory_id);
      if (item) {
        let newQuantity = item.quantity;
        if (movementFormData.movement_type === 'In') {
          newQuantity += parseFloat(movementFormData.quantity);
        } else if (movementFormData.movement_type === 'Out') {
          newQuantity -= parseFloat(movementFormData.quantity);
        }

        await supabase
          .from('inventory_items')
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq('id', movementFormData.inventory_id);
      }

      setShowMovementModal(false);
      resetMovementForm();
      fetchMovements();
      fetchItems();
    } catch (error) {
      console.error('Error saving stock movement:', error);
      alert('Error saving stock movement');
    }
  };

  const resetItemForm = () => {
    setItemFormData({
      farm_id: '',
      name: '',
      category: 'Feeds',
      unit: '',
      quantity: '',
      min_stock_level: '',
      unit_price: '',
      supplier: '',
      notes: '',
    });
  };

  const resetMovementForm = () => {
    setMovementFormData({
      inventory_id: '',
      farm_id: '',
      movement_type: 'In',
      quantity: '',
      date: new Date().toISOString().split('T')[0],
      to_farm_id: '',
      notes: '',
    });
  };

  const isLowStock = (item: InventoryItem) => item.quantity <= item.min_stock_level;

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
        <h1 className="text-3xl font-bold text-gray-900">Inventory & Stock Management</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('items')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'items'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package size={20} />
              Inventory Items
            </div>
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'movements'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <ArrowRight size={20} />
              Stock Movements
            </div>
          </button>
        </nav>
      </div>

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by item name..."
                  value={itemFilters.search}
                  onChange={(e) => setItemFilters({ ...itemFilters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <select
                value={itemFilters.farm}
                onChange={(e) => setItemFilters({ ...itemFilters, farm: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Farms</option>
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>{farm.name}</option>
                ))}
              </select>
              <select
                value={itemFilters.category}
                onChange={(e) => setItemFilters({ ...itemFilters, category: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="Feeds">Feeds</option>
                <option value="Medicines">Medicines</option>
                <option value="Equipment">Equipment</option>
                <option value="Supplies">Supplies</option>
                <option value="Other">Other</option>
              </select>
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={itemFilters.lowStock}
                  onChange={(e) => setItemFilters({ ...itemFilters, lowStock: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Low Stock Only</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingItem(null);
                resetItemForm();
                setShowItemModal(true);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus size={20} />
              Add Inventory Item
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Inventory Items</h3>
              <TableActions
                tableId="inventory-items-table"
                title="Inventory Items"
                data={items}
                filteredData={items.filter((item) => {
                  const matchesSearch = itemFilters.search === '' || 
                    item.name.toLowerCase().includes(itemFilters.search.toLowerCase());
                  const matchesFarm = itemFilters.farm === '' || item.farm_id === itemFilters.farm;
                  const matchesCategory = itemFilters.category === '' || item.category === itemFilters.category;
                  const lowStock = isLowStock(item);
                  const matchesLowStock = !itemFilters.lowStock || lowStock;
                  return matchesSearch && matchesFarm && matchesCategory && matchesLowStock;
                })}
                columns={[
                  { key: 'name', label: 'Item' },
                  { key: 'category', label: 'Category' },
                  { key: 'quantity', label: 'Quantity' },
                  { key: 'min_stock_level', label: 'Min Level' },
                  { key: 'unit', label: 'Unit' },
                ]}
              />
            </div>
            <table id="inventory-items-table" className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.filter((item) => {
                  const matchesSearch = itemFilters.search === '' || 
                    item.name.toLowerCase().includes(itemFilters.search.toLowerCase());
                  const matchesFarm = itemFilters.farm === '' || item.farm_id === itemFilters.farm;
                  const matchesCategory = itemFilters.category === '' || item.category === itemFilters.category;
                  const lowStock = isLowStock(item);
                  const matchesLowStock = !itemFilters.lowStock || lowStock;
                  return matchesSearch && matchesFarm && matchesCategory && matchesLowStock;
                }).map((item) => {
                  const farm = farms.find((f) => f.id === item.farm_id);
                  const lowStock = isLowStock(item);
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 ${lowStock ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500">{farm?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.min_stock_level} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lowStock ? (
                          <span className="flex items-center gap-1 text-red-600 text-sm">
                            <AlertCircle size={16} />
                            Low Stock
                          </span>
                        ) : (
                          <span className="text-green-600 text-sm">In Stock</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setItemFormData({
                              farm_id: item.farm_id,
                              name: item.name,
                              category: item.category,
                              unit: item.unit,
                              quantity: item.quantity.toString(),
                              min_stock_level: item.min_stock_level.toString(),
                              unit_price: item.unit_price?.toString() || '',
                              supplier: item.supplier || '',
                              notes: item.notes || '',
                            });
                            setShowItemModal(true);
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

      {/* Movements Tab */}
      {activeTab === 'movements' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by item name..."
                  value={movementFilters.search}
                  onChange={(e) => setMovementFilters({ ...movementFilters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <select
                value={movementFilters.farm}
                onChange={(e) => setMovementFilters({ ...movementFilters, farm: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Farms</option>
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>{farm.name}</option>
                ))}
              </select>
              <select
                value={movementFilters.movementType}
                onChange={(e) => setMovementFilters({ ...movementFilters, movementType: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="In">In</option>
                <option value="Out">Out</option>
                <option value="Transfer">Transfer</option>
              </select>
              <input
                type="date"
                value={movementFilters.dateFrom}
                onChange={(e) => setMovementFilters({ ...movementFilters, dateFrom: e.target.value })}
                placeholder="From Date"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <input
                type="date"
                value={movementFilters.dateTo}
                onChange={(e) => setMovementFilters({ ...movementFilters, dateTo: e.target.value })}
                placeholder="To Date"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                resetMovementForm();
                setShowMovementModal(true);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus size={20} />
              Add Stock Movement
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Stock Movements</h3>
              <TableActions
                tableId="stock-movements-table"
                title="Stock Movements"
                data={movements}
                filteredData={movements.filter((movement) => {
                  const item = items.find((i) => i.id === movement.inventory_id);
                  const matchesSearch = movementFilters.search === '' || 
                    item?.name.toLowerCase().includes(movementFilters.search.toLowerCase());
                  const matchesFarm = movementFilters.farm === '' || movement.farm_id === movementFilters.farm;
                  const matchesType = movementFilters.movementType === '' || movement.movement_type === movementFilters.movementType;
                  const matchesDateFrom = movementFilters.dateFrom === '' || new Date(movement.date) >= new Date(movementFilters.dateFrom);
                  const matchesDateTo = movementFilters.dateTo === '' || new Date(movement.date) <= new Date(movementFilters.dateTo);
                  return matchesSearch && matchesFarm && matchesType && matchesDateFrom && matchesDateTo;
                })}
                columns={[
                  { key: 'date', label: 'Date' },
                  { key: 'inventory_id', label: 'Item' },
                  { key: 'movement_type', label: 'Type' },
                  { key: 'quantity', label: 'Quantity' },
                  { key: 'farm_id', label: 'Farm' },
                ]}
                getRowData={(movement) => {
                  const item = items.find((i) => i.id === movement.inventory_id);
                  const fromFarm = farms.find((f) => f.id === movement.farm_id);
                  const toFarm = movement.to_farm_id ? farms.find((f) => f.id === movement.to_farm_id) : null;
                  return {
                    date: movement.date,
                    'inventory_id': item?.name || 'N/A',
                    'movement_type': movement.movement_type,
                    quantity: movement.quantity,
                    'farm_id': movement.movement_type === 'Transfer' 
                      ? `${fromFarm?.name || 'N/A'} → ${toFarm?.name || 'N/A'}`
                      : fromFarm?.name || 'N/A',
                  };
                }}
              />
            </div>
            <table id="stock-movements-table" className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From/To</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.filter((movement) => {
                  const item = items.find((i) => i.id === movement.inventory_id);
                  const matchesSearch = movementFilters.search === '' || 
                    item?.name.toLowerCase().includes(movementFilters.search.toLowerCase());
                  const matchesFarm = movementFilters.farm === '' || movement.farm_id === movementFilters.farm;
                  const matchesType = movementFilters.movementType === '' || movement.movement_type === movementFilters.movementType;
                  const matchesDateFrom = movementFilters.dateFrom === '' || new Date(movement.date) >= new Date(movementFilters.dateFrom);
                  const matchesDateTo = movementFilters.dateTo === '' || new Date(movement.date) <= new Date(movementFilters.dateTo);
                  return matchesSearch && matchesFarm && matchesType && matchesDateFrom && matchesDateTo;
                }).map((movement) => {
                  const item = items.find((i) => i.id === movement.inventory_id);
                  const fromFarm = farms.find((f) => f.id === movement.farm_id);
                  const toFarm = movement.to_farm_id ? farms.find((f) => f.id === movement.to_farm_id) : null;
                  return (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(movement.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{item?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          movement.movement_type === 'In' ? 'bg-green-100 text-green-800' :
                          movement.movement_type === 'Out' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {movement.movement_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{movement.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement.movement_type === 'Transfer' ? (
                          <span>{fromFarm?.name} → {toFarm?.name}</span>
                        ) : (
                          <span>{fromFarm?.name}</span>
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

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-6xl">
            <h2 className="text-2xl font-bold mb-4">
              {editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
            </h2>
            <form onSubmit={handleItemSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
                <select
                  value={itemFormData.farm_id}
                  onChange={(e) => setItemFormData({ ...itemFormData, farm_id: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={itemFormData.name}
                  onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={itemFormData.category}
                    onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value as InventoryCategory })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Feeds">Feeds</option>
                    <option value="Drugs">Drugs</option>
                    <option value="Vaccines">Vaccines</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <input
                    type="text"
                    value={itemFormData.unit}
                    onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                    placeholder="kg, liters, pieces"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={itemFormData.quantity}
                    onChange={(e) => setItemFormData({ ...itemFormData, quantity: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={itemFormData.min_stock_level}
                    onChange={(e) => setItemFormData({ ...itemFormData, min_stock_level: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemFormData.unit_price}
                    onChange={(e) => setItemFormData({ ...itemFormData, unit_price: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={itemFormData.supplier}
                    onChange={(e) => setItemFormData({ ...itemFormData, supplier: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={itemFormData.notes}
                  onChange={(e) => setItemFormData({ ...itemFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add Stock Movement</h2>
            <form onSubmit={handleMovementSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
                <select
                  value={movementFormData.inventory_id}
                  onChange={(e) => setMovementFormData({ ...movementFormData, inventory_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
                <select
                  value={movementFormData.farm_id}
                  onChange={(e) => setMovementFormData({ ...movementFormData, farm_id: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type *</label>
                <select
                  value={movementFormData.movement_type}
                  onChange={(e) => setMovementFormData({ ...movementFormData, movement_type: e.target.value as any })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="In">In</option>
                  <option value="Out">Out</option>
                  <option value="Transfer">Transfer</option>
                </select>
              </div>
              {movementFormData.movement_type === 'Transfer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Farm *</label>
                  <select
                    value={movementFormData.to_farm_id}
                    onChange={(e) => setMovementFormData({ ...movementFormData, to_farm_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Farm</option>
                    {farms.filter((f) => f.id !== movementFormData.farm_id).map((farm) => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  step="0.1"
                  value={movementFormData.quantity}
                  onChange={(e) => setMovementFormData({ ...movementFormData, quantity: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={movementFormData.date}
                  onChange={(e) => setMovementFormData({ ...movementFormData, date: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={movementFormData.notes}
                  onChange={(e) => setMovementFormData({ ...movementFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
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

