import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MilkingRecord, MilkingSession, Farm, Cattle } from '../../types';
import { Plus, Edit, Trash2, Milk } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../contexts/AuthContext';

export default function Milking() {
  const [records, setRecords] = useState<MilkingRecord[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [cattle, setCattle] = useState<Cattle[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MilkingRecord | null>(null);
  const [formData, setFormData] = useState({
    farm_id: '',
    cow_id: '',
    date: new Date(),
    session: 'Morning' as MilkingSession,
    milk_yield: '',
    staff_id: '',
    notes: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchFarms();
    fetchStaff();
    fetchMilkingRecords();
  }, []);

  useEffect(() => {
    if (formData.farm_id) {
      fetchCattleForFarm(formData.farm_id);
    }
  }, [formData.farm_id]);

  const fetchFarms = async () => {
    const { data } = await supabase.from('farms').select('*').eq('type', 'Dairy');
    setFarms(data || []);
  };

  const fetchCattleForFarm = async (farmId: string) => {
    const { data } = await supabase
      .from('cattle')
      .select('*')
      .eq('farm_id', farmId)
      .eq('gender', 'Female')
      .in('status', ['Cow', 'Heifer']);
    setCattle(data || []);
  };

  const fetchStaff = async () => {
    const { data } = await supabase.from('staff').select('*').eq('is_active', true);
    setStaff(data || []);
  };

  const fetchMilkingRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('milking_records')
        .select('*')
        .order('date', { ascending: false })
        .order('session', { ascending: true })
        .limit(100);

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching milking records:', error);
    } finally {
      setLoading(false);
    }
  };

  const canEditDelete = (record: MilkingRecord) => {
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
      staff_id: '',
      notes: '',
    });
    setCattle([]);
  };

  const handleEdit = (record: MilkingRecord) => {
    if (!canEditDelete(record)) {
      alert('Cannot edit record after 30 minutes. Please request approval.');
      return;
    }
    setEditingRecord(record);
    setFormData({
      farm_id: record.farm_id,
      cow_id: record.cow_id,
      date: new Date(record.date),
      session: record.session,
      milk_yield: record.milk_yield.toString(),
      staff_id: record.staff_id,
      notes: record.notes || '',
    });
    fetchCattleForFarm(record.farm_id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record || !canEditDelete(record)) {
      alert('Cannot delete record after 30 minutes. Please request approval.');
      return;
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cow Tag</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yield (L)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => {
              const cow = cattle.find((c) => c.id === record.cow_id);
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingRecord ? 'Edit Milking Record' : 'Add Milking Record'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
                <select
                  value={formData.farm_id}
                  onChange={(e) => setFormData({ ...formData, farm_id: e.target.value, cow_id: '' })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Cow *</label>
                <select
                  value={formData.cow_id}
                  onChange={(e) => setFormData({ ...formData, cow_id: e.target.value })}
                  required
                  disabled={!formData.farm_id}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                >
                  <option value="">Select Cow</option>
                  {cattle.map((c) => (
                    <option key={c.id} value={c.id}>{c.tag_id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <DatePicker
                  selected={formData.date}
                  onChange={(date: Date) => setFormData({ ...formData, date })}
                  dateFormat="yyyy-MM-dd"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session *</label>
                <select
                  value={formData.session}
                  onChange={(e) => setFormData({ ...formData, session: e.target.value as MilkingSession })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="Morning">Morning (3:00 AM - 7:00 AM)</option>
                  <option value="Afternoon">Afternoon (12:00 PM - 3:00 PM)</option>
                  <option value="Evening">Evening (5:00 PM - 8:00 PM)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Milk Yield (Liters) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.milk_yield}
                  onChange={(e) => setFormData({ ...formData, milk_yield: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff *</label>
                <select
                  value={formData.staff_id}
                  onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Staff</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
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

