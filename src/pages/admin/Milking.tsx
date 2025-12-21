import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MilkingRecord, MilkingSession, MilkStatus, Farm, Cattle } from '../../types';
import { Plus, Edit, Trash2, Milk, Search } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../contexts/AuthContext';
import { isSuperAdmin } from '../../lib/permissions';
import TableActions from '../../components/admin/TableActions';

export default function Milking() {
  const [records, setRecords] = useState<MilkingRecord[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [cattle, setCattle] = useState<Cattle[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MilkingRecord | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    farm: '',
    session: '',
    dateFrom: '',
    dateTo: '',
  });
  const [formData, setFormData] = useState({
    farm_id: '',
    cow_id: '',
    date: new Date(),
    session: 'Morning' as MilkingSession,
    milk_yield: '',
    milk_status: 'Consumption' as MilkStatus,
    staff_id: '',
    notes: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchFarms();
    fetchStaff();
    fetchMilkingRecords();
    fetchAllCattle(); // Fetch all cattle for table display
  }, []);

  // Removed useEffect for fetchCattleForFarm - we now fetch all cattle on mount

  const fetchFarms = async () => {
    const { data } = await supabase.from('farms').select('*').eq('type', 'Dairy');
    setFarms(data || []);
  };

  const fetchAllCattle = async () => {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/3c3bc49c-291b-47aa-aa58-ddb9ba3590ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Milking.tsx:fetchAllCattle',message:'fetchAllCattle entry',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Fetch all female cattle (Cow/Heifer) from all dairy farms for table display
      const { data, error } = await supabase
        .from('cattle')
        .select('*')
        .eq('gender', 'Female')
        .in('status', ['Cow', 'Heifer']);
      
      // #region agent log
      if (error) fetch('http://127.0.0.1:7244/ingest/3c3bc49c-291b-47aa-aa58-ddb9ba3590ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Milking.tsx:fetchAllCattle',message:'fetchAllCattle error',data:{error:JSON.stringify(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/3c3bc49c-291b-47aa-aa58-ddb9ba3590ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Milking.tsx:fetchAllCattle',message:'fetchAllCattle success',data:{cattleCount:data?.length||0,cattleIds:data?.map(c=>c.id)||[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      if (error) throw error;
      setCattle(data || []);
    } catch (error) {
      console.error('Error fetching all cattle:', error);
    }
  };

  const fetchCattleForFarm = async (farmId: string) => {
    // This function is kept for backward compatibility but no longer needed
    // since we now fetch all cattle on mount. The form will filter from the full array.
    // We could remove this, but keeping it in case it's called elsewhere.
  };

  const fetchStaff = async () => {
    const { data } = await supabase.from('staff').select('*').eq('is_active', true);
    setStaff(data || []);
  };

  const fetchMilkingRecords = async () => {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/3c3bc49c-291b-47aa-aa58-ddb9ba3590ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Milking.tsx:fetchMilkingRecords',message:'fetchMilkingRecords entry',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const { data, error } = await supabase
        .from('milking_records')
        .select('*')
        .order('date', { ascending: false })
        .order('session', { ascending: true })
        .limit(100);

      // #region agent log
      if (error) fetch('http://127.0.0.1:7244/ingest/3c3bc49c-291b-47aa-aa58-ddb9ba3590ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Milking.tsx:fetchMilkingRecords',message:'fetchMilkingRecords error',data:{error:JSON.stringify(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      if (error) throw error;
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/3c3bc49c-291b-47aa-aa58-ddb9ba3590ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Milking.tsx:fetchMilkingRecords',message:'fetchMilkingRecords success',data:{recordsCount:data?.length||0,cowIds:data?.map(r=>r.cow_id).filter(Boolean)||[],uniqueCowIds:Array.from(new Set(data?.map(r=>r.cow_id).filter(Boolean)||[]))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching milking records:', error);
    } finally {
      setLoading(false);
    }
  };

  const canEditDelete = (record: MilkingRecord) => {
    // Super Admin can always edit/delete
    if (isSuperAdmin(user?.role)) {
      return true;
    }
    const recordDate = new Date(record.created_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - recordDate.getTime()) / (1000 * 60);
    return diffMinutes <= 30;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const recordData = {
        farm_id: formData.farm_id,
        cow_id: formData.cow_id,
        date: formData.date.toISOString().split('T')[0],
        session: formData.session,
        milk_yield: parseFloat(formData.milk_yield),
        milk_status: formData.milk_status,
        staff_id: formData.staff_id,
        notes: formData.notes || null,
        created_by: user.id,
      };

      if (editingRecord) {
        if (!canEditDelete(editingRecord)) {
          alert('Cannot edit record after 30 minutes. Please request approval.');
          return;
        }
        const { error } = await supabase
          .from('milking_records')
          .update({ ...recordData, updated_at: new Date().toISOString() })
          .eq('id', editingRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('milking_records').insert([recordData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingRecord(null);
      resetForm();
      fetchMilkingRecords();
    } catch (error) {
      console.error('Error saving milking record:', error);
      alert('Error saving milking record');
    }
  };

  const resetForm = () => {
    setFormData({
      farm_id: '',
      cow_id: '',
      date: new Date(),
      session: 'Morning',
      milk_yield: '',
      milk_status: 'Consumption',
      staff_id: '',
      notes: '',
    });
    // Don't clear cattle - we need it for the table display
  };

  const handleEdit = (record: MilkingRecord) => {
    if (!canEditDelete(record)) {
      if (!isSuperAdmin(user?.role)) {
        alert('Cannot edit record after 30 minutes. Please request approval.');
        return;
      }
    }
    setEditingRecord(record);
    setFormData({
      farm_id: record.farm_id,
      cow_id: record.cow_id,
      date: new Date(record.date),
      session: record.session,
      milk_yield: record.milk_yield.toString(),
      milk_status: record.milk_status || 'Consumption',
      staff_id: record.staff_id,
      notes: record.notes || '',
    });
    // No need to fetch cattle - we already have all cattle loaded
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record || !canEditDelete(record)) {
      if (!isSuperAdmin(user?.role)) {
        alert('Cannot delete record after 30 minutes. Please request approval.');
        return;
      }
    }

    if (!confirm('Are you sure you want to delete this milking record?')) return;

    try {
      const { error } = await supabase.from('milking_records').delete().eq('id', id);
      if (error) throw error;
      fetchMilkingRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Error deleting record');
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
        <h1 className="text-3xl font-bold text-gray-900">Dairy Milking Records</h1>
        <button
          onClick={() => {
            setEditingRecord(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={20} />
          Add Milking Record
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by insurance..."
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
            <option value="">All Farms</option>
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>{farm.name}</option>
            ))}
          </select>
          <select
            value={filters.session}
            onChange={(e) => setFilters({ ...filters, session: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Sessions</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Evening">Evening</option>
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            placeholder="From Date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            placeholder="To Date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Milking Records</h3>
          <TableActions
            tableId="milking-table"
            title="Milking Records"
            data={records}
            filteredData={records.filter((record) => {
              const cow = cattle.find((c) => c.id === record.cow_id);
              const farm = farms.find((f) => f.id === record.farm_id);
              const matchesSearch = filters.search === '' || 
                cow?.tag_id.toLowerCase().includes(filters.search.toLowerCase());
              const matchesFarm = filters.farm === '' || record.farm_id === filters.farm;
              const matchesSession = filters.session === '' || record.session === filters.session;
              const matchesDateFrom = filters.dateFrom === '' || new Date(record.date) >= new Date(filters.dateFrom);
              const matchesDateTo = filters.dateTo === '' || new Date(record.date) <= new Date(filters.dateTo);
              return matchesSearch && matchesFarm && matchesSession && matchesDateFrom && matchesDateTo;
            })}
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'cow_id', label: 'Insurance' },
              { key: 'session', label: 'Session' },
              { key: 'milk_yield', label: 'Yield (L)' },
              { key: 'milk_status', label: 'Status' },
              { key: 'staff_id', label: 'Staff' },
            ]}
            getRowData={(record) => {
              const cow = cattle.find((c) => c.id === record.cow_id);
              const staffMember = staff.find((s) => s.id === record.staff_id);
              return {
                date: record.date,
                'cow_id': cow?.tag_id || 'N/A',
                session: record.session,
                'milk_yield': record.milk_yield,
                'milk_status': record.milk_status || 'Consumption',
                'staff_id': staffMember?.name || 'N/A',
              };
            }}
          />
        </div>
        <table id="milking-table" className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Insurance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yield (L)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.filter((record) => {
              const cow = cattle.find((c) => c.id === record.cow_id);
              const farm = farms.find((f) => f.id === record.farm_id);
              const matchesSearch = filters.search === '' || 
                cow?.tag_id.toLowerCase().includes(filters.search.toLowerCase());
              const matchesFarm = filters.farm === '' || record.farm_id === filters.farm;
              const matchesSession = filters.session === '' || record.session === filters.session;
              const matchesDateFrom = filters.dateFrom === '' || new Date(record.date) >= new Date(filters.dateFrom);
              const matchesDateTo = filters.dateTo === '' || new Date(record.date) <= new Date(filters.dateTo);
              return matchesSearch && matchesFarm && matchesSession && matchesDateFrom && matchesDateTo;
            }).map((record) => {
              const cow = cattle.find((c) => c.id === record.cow_id);
              // #region agent log
              if (!cow && record.cow_id) {
                fetch('http://127.0.0.1:7244/ingest/3c3bc49c-291b-47aa-aa58-ddb9ba3590ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Milking.tsx:tableRow',message:'cow not found in cattle array',data:{recordCowId:record.cow_id,recordId:record.id,cattleArrayLength:cattle.length,cattleIds:cattle.map(c=>c.id),cattleTagIds:cattle.map(c=>c.tag_id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              } else if (cow) {
                fetch('http://127.0.0.1:7244/ingest/3c3bc49c-291b-47aa-aa58-ddb9ba3590ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Milking.tsx:tableRow',message:'cow found in cattle array',data:{recordCowId:record.cow_id,cowTagId:cow.tag_id,cowId:cow.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              }
              // #endregion
              const staffMember = staff.find((s) => s.id === record.staff_id);
              const canEdit = canEditDelete(record);

              return (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Milk className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium">{cow?.tag_id || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      record.session === 'Morning' ? 'bg-yellow-100 text-yellow-800' :
                      record.session === 'Afternoon' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {record.session}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {record.milk_yield} L
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      record.milk_status === 'Consumption' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {record.milk_status || 'Consumption'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {staffMember?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      {canEdit ? (
                        <>
                          <button onClick={() => handleEdit(record)} className="text-blue-600 hover:text-blue-900">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-900">
                            <Trash2 size={18} />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">Locked</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">
              {editingRecord ? 'Edit Milking Record' : 'Add Milking Record'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Farm *</label>
                  <select
                    value={formData.farm_id}
                    onChange={(e) => setFormData({ ...formData, farm_id: e.target.value, cow_id: '' })}
                    required
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Farm</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cow *</label>
                  <select
                    value={formData.cow_id}
                    onChange={(e) => setFormData({ ...formData, cow_id: e.target.value })}
                    required
                    disabled={!formData.farm_id}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  >
                    <option value="">Select Cow</option>
                    {cattle.filter((c) => c.farm_id === formData.farm_id).map((c) => (
                      <option key={c.id} value={c.id}>{c.tag_id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                  <DatePicker
                    selected={formData.date}
                    onChange={(date: Date) => setFormData({ ...formData, date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Session *</label>
                  <select
                    value={formData.session}
                    onChange={(e) => setFormData({ ...formData, session: e.target.value as MilkingSession })}
                    required
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Milk Yield (L) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.milk_yield}
                    onChange={(e) => setFormData({ ...formData, milk_yield: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    value={formData.milk_status}
                    onChange={(e) => setFormData({ ...formData, milk_status: e.target.value as MilkStatus })}
                    required
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Consumption">Consumption (for dairy)</option>
                    <option value="Colostrum">Colostrum (not for dairy)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Staff *</label>
                  <select
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Staff</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingRecord ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRecord(null);
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

