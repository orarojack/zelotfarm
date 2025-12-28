import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { PoultryMedication, PoultryBatch } from '../../../types';
import { Plus, Edit, Search, Pill } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../../contexts/AuthContext';
import TableActions from '../../../components/admin/TableActions';

export default function MedicationManagement() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<PoultryMedication[]>([]);
  const [batches, setBatches] = useState<PoultryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<PoultryMedication | null>(null);
  const [filter, setFilter] = useState({
    search: '',
    batch: '',
    dateFrom: '',
    dateTo: '',
  });

  const [formData, setFormData] = useState({
    batch_id: '',
    treatment_date: new Date(),
    medication_name: '',
    disease_condition: '',
    administration_method: '',
    dosage: '',
    number_of_birds: '',
    withdrawal_period_days: '',
    cost: '',
    veterinary_name: '',
    notes: '',
  });

  useEffect(() => {
    fetchMedications();
    fetchBatches();
  }, []);

  const fetchMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('poultry_medications')
        .select('*')
        .order('treatment_date', { ascending: false });
      if (error) throw error;
      setMedications(data || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('poultry_batches')
        .select('*')
        .order('placement_date', { ascending: false });
      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const medicationData: any = {
        batch_id: formData.batch_id,
        treatment_date: formData.treatment_date.toISOString().split('T')[0],
        medication_name: formData.medication_name,
        disease_condition: formData.disease_condition || null,
        administration_method: formData.administration_method || null,
        dosage: formData.dosage || null,
        number_of_birds: formData.number_of_birds ? parseInt(formData.number_of_birds) : null,
        withdrawal_period_days: formData.withdrawal_period_days ? parseInt(formData.withdrawal_period_days) : null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        veterinary_name: formData.veterinary_name || null,
        notes: formData.notes || null,
        created_by: user.id,
      };

      if (editingMedication) {
        const { error } = await supabase
          .from('poultry_medications')
          .update({ ...medicationData, updated_at: new Date().toISOString() })
          .eq('id', editingMedication.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('poultry_medications').insert([medicationData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingMedication(null);
      resetForm();
      fetchMedications();
    } catch (error) {
      console.error('Error saving medication:', error);
      alert('Error saving medication record');
    }
  };

  const resetForm = () => {
    setFormData({
      batch_id: '',
      treatment_date: new Date(),
      medication_name: '',
      disease_condition: '',
      administration_method: '',
      dosage: '',
      number_of_birds: '',
      withdrawal_period_days: '',
      cost: '',
      veterinary_name: '',
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

  const filteredMedications = medications.filter((med) => {
    const matchesSearch = filter.search === '' || 
      med.medication_name.toLowerCase().includes(filter.search.toLowerCase()) ||
      med.disease_condition?.toLowerCase().includes(filter.search.toLowerCase());
    const matchesBatch = filter.batch === '' || med.batch_id === filter.batch;
    const matchesDateFrom = filter.dateFrom === '' || new Date(med.treatment_date) >= new Date(filter.dateFrom);
    const matchesDateTo = filter.dateTo === '' || new Date(med.treatment_date) <= new Date(filter.dateTo);
    return matchesSearch && matchesBatch && matchesDateFrom && matchesDateTo;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search medications..."
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

      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingMedication(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          Add Medication Record
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Medication Records</h3>
          <TableActions
            tableId="medications-table"
            title="Medications"
            data={filteredMedications}
            filteredData={filteredMedications}
            columns={[
              { key: 'treatment_date', label: 'Date' },
              { key: 'medication_name', label: 'Medication' },
              { key: 'disease_condition', label: 'Disease' },
              { key: 'withdrawal_period_days', label: 'Withdrawal Period' },
              { key: 'cost', label: 'Cost' },
            ]}
            getRowData={(med) => ({
              'treatment_date': med.treatment_date,
              'medication_name': med.medication_name,
              'disease_condition': med.disease_condition || 'N/A',
              'withdrawal_period_days': med.withdrawal_period_days || 'N/A',
              'cost': med.cost || 0,
            })}
          />
        </div>
        <div className="overflow-x-auto">
          <table id="medications-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch/Flock ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medication Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disease/Condition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Administration Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosage</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Number of Birds</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Withdrawal Period (Days)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veterinary</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMedications.map((med) => {
                const batch = batches.find((b) => b.id === med.batch_id);
                return (
                  <tr key={med.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(med.treatment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{batch?.batch_flock_id || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{med.medication_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{med.disease_condition || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{med.administration_method || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{med.dosage || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{med.number_of_birds || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {med.withdrawal_period_days ? (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          med.withdrawal_period_days > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {med.withdrawal_period_days} days
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {med.cost ? `KES ${med.cost.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{med.veterinary_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          setEditingMedication(med);
                          setFormData({
                            batch_id: med.batch_id,
                            treatment_date: new Date(med.treatment_date),
                            medication_name: med.medication_name,
                            disease_condition: med.disease_condition || '',
                            administration_method: med.administration_method || '',
                            dosage: med.dosage || '',
                            number_of_birds: med.number_of_birds?.toString() || '',
                            withdrawal_period_days: med.withdrawal_period_days?.toString() || '',
                            cost: med.cost?.toString() || '',
                            veterinary_name: med.veterinary_name || '',
                            notes: med.notes || '',
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
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingMedication ? 'Edit Medication Record' : 'Add Medication Record'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch / Flock ID * <span className="text-xs text-gray-500">(Select batch/flock)</span>
                </label>
                <select
                  value={formData.batch_id}
                  onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Batch/Flock</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>{batch.batch_flock_id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treatment Date * <span className="text-xs text-gray-500">(Date treatment is administered)</span>
                </label>
                <DatePicker
                  selected={formData.treatment_date}
                  onChange={(date: Date) => setFormData({ ...formData, treatment_date: date })}
                  dateFormat="yyyy-MM-dd"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medication Name * <span className="text-xs text-gray-500">(Exact medication name used)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.medication_name}
                    onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Disease Target * <span className="text-xs text-gray-500">(Disease the medication treats)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.disease_condition}
                    onChange={(e) => setFormData({ ...formData, disease_condition: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Administration Method <span className="text-xs text-gray-500">(Oral, injection, water, spray, etc.)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.administration_method}
                    onChange={(e) => setFormData({ ...formData, administration_method: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Oral, Injection"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosage <span className="text-xs text-gray-500">(Amount per bird or per kg)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., 5ml per bird"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Birds <span className="text-xs text-gray-500">(Total birds treated)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.number_of_birds}
                    onChange={(e) => setFormData({ ...formData, number_of_birds: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Withdrawal Period (Days) * <span className="text-xs text-gray-500">(Critical for food safety - Cannot use after expiry)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.withdrawal_period_days}
                    onChange={(e) => setFormData({ ...formData, withdrawal_period_days: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost <span className="text-xs text-gray-500">(Total cost of treatment)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Veterinary Name <span className="text-xs text-gray-500">(Vet overseeing treatment)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.veterinary_name}
                    onChange={(e) => setFormData({ ...formData, veterinary_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes <span className="text-xs text-gray-500">(Additional remarks)</span>
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
                  {editingMedication ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingMedication(null);
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

