import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { BatchStockMovement, PoultryBatch } from '../../../types';
import { Plus, Edit, Search, TrendingDown } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../../contexts/AuthContext';
import TableActions from '../../../components/admin/TableActions';

export default function DailyStockMovements() {
  const { user } = useAuth();
  const [movements, setMovements] = useState<BatchStockMovement[]>([]);
  const [batches, setBatches] = useState<PoultryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMovement, setEditingMovement] = useState<BatchStockMovement | null>(null);
  const [filter, setFilter] = useState({
    search: '',
    batch: '',
    dateFrom: '',
    dateTo: '',
  });

  const [formData, setFormData] = useState({
    batch_id: '',
    date: new Date(),
    opening_stock: '',
    mortalities: '0',
    culls: '0',
    notes: '',
  });

  useEffect(() => {
    fetchMovements();
    fetchBatches();
  }, []);

  const fetchMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('batch_stock_movements')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('poultry_batches')
        .select('*')
        .in('status', ['Active', 'Planned'])
        .order('placement_date', { ascending: false });
      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const getPreviousClosingStock = async (batchId: string, currentDate: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('batch_stock_movements')
        .select('closing_stock')
        .eq('batch_id', batchId)
        .lt('date', currentDate)
        .order('date', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.closing_stock || 0;
    } catch (error) {
      console.error('Error fetching previous stock:', error);
      return 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const openingStock = parseInt(formData.opening_stock);
      const mortalities = parseInt(formData.mortalities) || 0;
      const culls = parseInt(formData.culls) || 0;
      const closingStock = openingStock - mortalities - culls;

      if (closingStock < 0) {
        alert('Closing stock cannot be negative. Please check your mortalities and culls.');
        return;
      }

      // If creating new record, check if record exists for this date
      if (!editingMovement) {
        const { data: existing } = await supabase
          .from('batch_stock_movements')
          .select('id')
          .eq('batch_id', formData.batch_id)
          .eq('date', formData.date.toISOString().split('T')[0])
          .single();

        if (existing) {
          alert('A stock movement record already exists for this batch and date. Please edit the existing record.');
          return;
        }

        // Auto-fill opening stock from previous day if not provided
        let finalOpeningStock = openingStock;
        if (!formData.opening_stock || formData.opening_stock === '') {
          const previousClosing = await getPreviousClosingStock(
            formData.batch_id,
            formData.date.toISOString().split('T')[0]
          );
          finalOpeningStock = previousClosing;
          
          // Get initial quantity if no previous records
          if (finalOpeningStock === 0) {
            const batch = batches.find((b) => b.id === formData.batch_id);
            finalOpeningStock = batch?.initial_quantity || 0;
          }
        }
      }

      const movementData: any = {
        batch_id: formData.batch_id,
        date: formData.date.toISOString().split('T')[0],
        opening_stock: parseInt(formData.opening_stock) || 0,
        mortalities: mortalities,
        culls: culls,
        closing_stock: (parseInt(formData.opening_stock) || 0) - mortalities - culls,
        notes: formData.notes || null,
        created_by: user.id,
      };

      if (editingMovement) {
        const { error } = await supabase
          .from('batch_stock_movements')
          .update({ ...movementData, updated_at: new Date().toISOString() })
          .eq('id', editingMovement.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('batch_stock_movements')
          .insert([movementData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingMovement(null);
      resetForm();
      fetchMovements();
    } catch (error) {
      console.error('Error saving stock movement:', error);
      alert('Error saving stock movement');
    }
  };

  const resetForm = () => {
    setFormData({
      batch_id: '',
      date: new Date(),
      opening_stock: '',
      mortalities: '0',
      culls: '0',
      notes: '',
    });
  };

  const filteredMovements = movements.filter((movement) => {
    const batch = batches.find((b) => b.id === movement.batch_id);
    const matchesSearch = filter.search === '' ||
      batch?.batch_flock_id.toLowerCase().includes(filter.search.toLowerCase());
    const matchesBatch = filter.batch === '' || movement.batch_id === filter.batch;
    const matchesDateFrom = filter.dateFrom === '' || new Date(movement.date) >= new Date(filter.dateFrom);
    const matchesDateTo = filter.dateTo === '' || new Date(movement.date) <= new Date(filter.dateTo);
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
              placeholder="Search batches..."
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
            setEditingMovement(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          Record Daily Stock Movement
        </button>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Daily Stock Movements</h3>
          <TableActions
            tableId="stock-movements-table"
            title="Stock Movements"
            data={movements}
            filteredData={filteredMovements}
            columns={[
              { key: 'batch_id', label: 'Batch' },
              { key: 'date', label: 'Date' },
              { key: 'opening_stock', label: 'Opening' },
              { key: 'mortalities', label: 'Mortalities' },
              { key: 'culls', label: 'Culls' },
              { key: 'closing_stock', label: 'Closing' },
            ]}
            getRowData={(movement) => {
              const batch = batches.find((b) => b.id === movement.batch_id);
              return {
                'batch_id': batch?.batch_flock_id || 'N/A',
                'date': movement.date,
                'opening_stock': movement.opening_stock,
                'mortalities': movement.mortalities,
                'culls': movement.culls,
                'closing_stock': movement.closing_stock,
              };
            }}
          />
        </div>
        <div className="overflow-x-auto">
          <table id="stock-movements-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch/Flock ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Opening Stock</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Mortalities</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Culls</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Closing Stock</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMovements.map((movement) => {
                const batch = batches.find((b) => b.id === movement.batch_id);
                const mortalityRate = movement.opening_stock > 0 
                  ? ((movement.mortalities / movement.opening_stock) * 100).toFixed(2) 
                  : '0.00';
                return (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{batch?.batch_flock_id || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(movement.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{movement.opening_stock.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {movement.mortalities} 
                      {movement.opening_stock > 0 && (
                        <span className="text-xs text-gray-500 ml-1">({mortalityRate}%)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                      {movement.culls}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                      {movement.closing_stock.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          setEditingMovement(movement);
                          setFormData({
                            batch_id: movement.batch_id,
                            date: new Date(movement.date),
                            opening_stock: movement.opening_stock.toString(),
                            mortalities: movement.mortalities.toString(),
                            culls: movement.culls.toString(),
                            notes: movement.notes || '',
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
          <div className="bg-white rounded-lg p-5 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingMovement ? 'Edit Stock Movement' : 'Record Daily Stock Movement'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch/Flock ID * <span className="text-xs text-gray-500">(Auto-calculated fields can be locked)</span>
                  </label>
                  <select
                    value={formData.batch_id}
                    onChange={(e) => {
                      setFormData({ ...formData, batch_id: e.target.value });
                    }}
                    required
                    disabled={!!editingMovement}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  >
                    <option value="">Select Batch/Flock</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>{batch.batch_flock_id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date * <span className="text-xs text-gray-500">(Daily stock movement tracking)</span>
                  </label>
                  <DatePicker
                    selected={formData.date}
                    onChange={(date: Date) => setFormData({ ...formData, date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                    disabled={!!editingMovement}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opening Stock * <span className="text-xs text-gray-500">(Auto-calculated from previous day if not provided)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.opening_stock}
                    onChange={(e) => setFormData({ ...formData, opening_stock: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mortalities <span className="text-xs text-gray-500">(Mortality % auto-calculated)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.mortalities}
                    onChange={(e) => setFormData({ ...formData, mortalities: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Culls</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.culls}
                    onChange={(e) => setFormData({ ...formData, culls: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Closing Stock (Auto-calculated)</label>
                  <div className="w-full px-4 py-2 bg-gray-50 border rounded-lg font-semibold">
                    {(() => {
                      const opening = parseInt(formData.opening_stock) || 0;
                      const mortalities = parseInt(formData.mortalities) || 0;
                      const culls = parseInt(formData.culls) || 0;
                      const closing = opening - mortalities - culls;
                      return closing >= 0 ? closing.toLocaleString() : 'Invalid';
                    })()}
                  </div>
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
                  {editingMovement ? 'Update' : 'Save Record'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingMovement(null);
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



