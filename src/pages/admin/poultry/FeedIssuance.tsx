import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { FeedIssuance as FeedIssuanceType, PoultryBatch, InventoryItem } from '../../../types';
import { Plus, Edit, Search, Package } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../../contexts/AuthContext';
import TableActions from '../../../components/admin/TableActions';

export default function FeedIssuance() {
  const { user } = useAuth();
  const [feedIssuances, setFeedIssuances] = useState<FeedIssuanceType[]>([]);
  const [batches, setBatches] = useState<PoultryBatch[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIssuance, setEditingIssuance] = useState<FeedIssuanceType | null>(null);
  const [filter, setFilter] = useState({
    search: '',
    batch: '',
    dateFrom: '',
    dateTo: '',
  });

  const [formData, setFormData] = useState({
    batch_id: '',
    feed_type: '',
    supplier: '',
    issuance_date: new Date(),
    quantity_kg: '',
    quantity_bags: '',
    bags_per_kg: '50',
    unit_cost: '',
    inventory_item_id: '',
    notes: '',
  });

  useEffect(() => {
    fetchFeedIssuances();
    fetchBatches();
    fetchInventoryItems();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('poultry_batches')
        .select('*')
        .eq('status', 'Active')
        .order('placement_date', { ascending: false });
      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('category', 'Feeds')
        .order('name');
      if (error) throw error;
      setInventoryItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const quantityKg = parseFloat(formData.quantity_kg);
      const unitCost = formData.unit_cost ? parseFloat(formData.unit_cost) : null;
      const bagsPerKg = parseFloat(formData.bags_per_kg) || 50;

      const issuanceData: any = {
        batch_id: formData.batch_id,
        feed_type: formData.feed_type,
        supplier: formData.supplier || null,
        issuance_date: formData.issuance_date.toISOString().split('T')[0],
        quantity_kg: quantityKg,
        quantity_bags: formData.quantity_bags ? parseFloat(formData.quantity_bags) : (quantityKg / bagsPerKg),
        bags_per_kg: bagsPerKg,
        unit_cost: unitCost,
        total_cost: unitCost ? unitCost * quantityKg : null,
        inventory_item_id: formData.inventory_item_id || null,
        notes: formData.notes || null,
        created_by: user.id,
      };

      if (editingIssuance) {
        const { error } = await supabase
          .from('feed_issuance')
          .update({ ...issuanceData, updated_at: new Date().toISOString() })
          .eq('id', editingIssuance.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('feed_issuance')
          .insert([issuanceData]);
        if (error) throw error;

        // Deduct from inventory if inventory_item_id is provided
        if (formData.inventory_item_id) {
          const inventoryItem = inventoryItems.find((item) => item.id === formData.inventory_item_id);
          if (inventoryItem) {
            const newQuantity = inventoryItem.quantity - quantityKg;
            await supabase
              .from('inventory_items')
              .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
              .eq('id', formData.inventory_item_id);
          }
        }
      }

      setShowModal(false);
      setEditingIssuance(null);
      resetForm();
      fetchFeedIssuances();
      if (formData.inventory_item_id) {
        fetchInventoryItems();
      }
    } catch (error) {
      console.error('Error saving feed issuance:', error);
      alert('Error saving feed issuance');
    }
  };

  const resetForm = () => {
    setFormData({
      batch_id: '',
      feed_type: '',
      supplier: '',
      issuance_date: new Date(),
      quantity_kg: '',
      quantity_bags: '',
      bags_per_kg: '50',
      unit_cost: '',
      inventory_item_id: '',
      notes: '',
    });
  };

  const filteredIssuances = feedIssuances.filter((issuance) => {
    const batch = batches.find((b) => b.id === issuance.batch_id);
    const matchesSearch = filter.search === '' ||
      issuance.issuance_reference.toLowerCase().includes(filter.search.toLowerCase()) ||
      issuance.feed_type.toLowerCase().includes(filter.search.toLowerCase()) ||
      batch?.batch_flock_id.toLowerCase().includes(filter.search.toLowerCase());
    const matchesBatch = filter.batch === '' || issuance.batch_id === filter.batch;
    const matchesDateFrom = filter.dateFrom === '' || new Date(issuance.issuance_date) >= new Date(filter.dateFrom);
    const matchesDateTo = filter.dateTo === '' || new Date(issuance.issuance_date) <= new Date(filter.dateTo);
    return matchesSearch && matchesBatch && matchesDateFrom && matchesDateTo;
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
            <option value="">All Batches</option>
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

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingIssuance(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          Issue Feed to Batch
        </button>
      </div>

      {/* Feed Issuances Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Feed Issuances</h3>
          <TableActions
            tableId="feed-issuance-table"
            title="Feed Issuances"
            data={feedIssuances}
            filteredData={filteredIssuances}
            columns={[
              { key: 'issuance_reference', label: 'Reference' },
              { key: 'batch_id', label: 'Batch' },
              { key: 'feed_type', label: 'Feed Type' },
              { key: 'issuance_date', label: 'Date' },
              { key: 'quantity_kg', label: 'Quantity (kg)' },
              { key: 'total_cost', label: 'Total Cost' },
            ]}
            getRowData={(issuance) => {
              const batch = batches.find((b) => b.id === issuance.batch_id);
              return {
                'issuance_reference': issuance.issuance_reference,
                'batch_id': batch?.batch_flock_id || 'N/A',
                'feed_type': issuance.feed_type,
                'issuance_date': issuance.issuance_date,
                'quantity_kg': issuance.quantity_kg,
                'total_cost': issuance.total_cost || 0,
              };
            }}
          />
        </div>
        <div className="overflow-x-auto">
          <table id="feed-issuance-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch/Flock ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feed Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty (kg)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty (bags)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIssuances.map((issuance) => {
                const batch = batches.find((b) => b.id === issuance.batch_id);
                return (
                  <tr key={issuance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{issuance.issuance_reference}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{batch?.batch_flock_id || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{issuance.feed_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{issuance.supplier || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(issuance.issuance_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{issuance.quantity_kg.toLocaleString()} kg</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {issuance.quantity_bags ? `${issuance.quantity_bags.toFixed(1)} bags` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {issuance.unit_cost ? `KES ${issuance.unit_cost.toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                      {issuance.total_cost ? `KES ${issuance.total_cost.toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          setEditingIssuance(issuance);
                          setFormData({
                            batch_id: issuance.batch_id,
                            feed_type: issuance.feed_type,
                            supplier: issuance.supplier || '',
                            issuance_date: new Date(issuance.issuance_date),
                            quantity_kg: issuance.quantity_kg.toString(),
                            quantity_bags: issuance.quantity_bags?.toString() || '',
                            bags_per_kg: issuance.bags_per_kg?.toString() || '50',
                            unit_cost: issuance.unit_cost?.toString() || '',
                            inventory_item_id: issuance.inventory_item_id || '',
                            notes: issuance.notes || '',
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
              {editingIssuance ? 'Edit Feed Issuance' : 'Issue Feed to Batch'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch/Flock * <span className="text-xs text-gray-500">(Prevents misallocation of feed)</span>
                  </label>
                  <select
                    value={formData.batch_id}
                    onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Batch/Flock</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>{batch.batch_flock_id} - {batch.production_type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feed Type * <span className="text-xs text-gray-500">(Auto-generated reference ensures audit traceability)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.feed_type}
                    onChange={(e) => setFormData({ ...formData, feed_type: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Starter Feed, Grower Feed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issuance Date * <span className="text-xs text-gray-500">(Auto-generated reference ensures audit traceability)</span>
                  </label>
                  <DatePicker
                    selected={formData.issuance_date}
                    onChange={(date: Date) => setFormData({ ...formData, issuance_date: date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity (kg) * <span className="text-xs text-gray-500">(Conversion automatic to ensure consistency)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantity_kg}
                    onChange={(e) => {
                      const kg = e.target.value;
                      const bagsPerKg = parseFloat(formData.bags_per_kg) || 50;
                      setFormData({
                        ...formData,
                        quantity_kg: kg,
                        quantity_bags: kg ? (parseFloat(kg) / bagsPerKg).toFixed(2) : '',
                      });
                    }}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (bags)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.quantity_bags}
                      onChange={(e) => {
                        const bags = e.target.value;
                        const bagsPerKg = parseFloat(formData.bags_per_kg) || 50;
                        setFormData({
                          ...formData,
                          quantity_bags: bags,
                          quantity_kg: bags ? (parseFloat(bags) * bagsPerKg).toFixed(2) : '',
                        });
                      }}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={formData.bags_per_kg}
                      onChange={(e) => {
                        const bagsPerKg = e.target.value;
                        setFormData({
                          ...formData,
                          bags_per_kg: bagsPerKg,
                          quantity_bags: formData.quantity_kg
                            ? (parseFloat(formData.quantity_kg) / parseFloat(bagsPerKg)).toFixed(2)
                            : '',
                        });
                      }}
                      className="w-24 px-2 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="kg/bag"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">kg per bag (default: 50)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Cost (KES/kg) <span className="text-xs text-gray-500">(Automatic cost allocation and stock deduction)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  {formData.unit_cost && formData.quantity_kg && (
                    <p className="text-sm text-green-600 mt-1">
                      Total Cost: KES {(parseFloat(formData.unit_cost) * parseFloat(formData.quantity_kg)).toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue from Inventory <span className="text-xs text-gray-500">(Reduces manual errors, updates inventory)</span>
                  </label>
                  <select
                    value={formData.inventory_item_id}
                    onChange={(e) => setFormData({ ...formData, inventory_item_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select from Inventory (Optional)</option>
                    {inventoryItems
                      .filter((item) => !formData.inventory_item_id || item.quantity >= parseFloat(formData.quantity_kg || '0'))
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Available: {item.quantity} {item.unit})
                        </option>
                      ))}
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
                  {editingIssuance ? 'Update' : 'Issue Feed'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingIssuance(null);
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



