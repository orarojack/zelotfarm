import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Vaccination, PoultryBatch, VaccinationStatus, AdministrationMethod } from '../../../types';
import { Plus, Edit, AlertTriangle, Search, Syringe } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../../contexts/AuthContext';
import TableActions from '../../../components/admin/TableActions';

export default function VaccinationSchedule() {
  const { user } = useAuth();
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [batches, setBatches] = useState<PoultryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | null>(null);
  const [filter, setFilter] = useState({
    search: '',
    batch: '',
    status: '' as VaccinationStatus | '',
    showOverdue: false,
  });

  const [formData, setFormData] = useState({
    batch_id: '',
    vaccination_date: new Date(),
    birds_age_days: '',
    vaccine_name: '',
    disease_target: '',
    administration_method: 'Oral' as AdministrationMethod,
    dosage: '',
    number_of_birds: '',
    manufacturer: '',
    batch_number: '',
    expiry_date: undefined as Date | undefined,
    cost_per_dosage: '',
    veterinary_name: '',
    status: 'Planned' as VaccinationStatus,
    notes: '',
  });

  useEffect(() => {
    fetchVaccinations();
    fetchBatches();
  }, []);

  const fetchVaccinations = async () => {
    try {
      const { data, error } = await supabase
        .from('vaccinations')
        .select('*')
        .order('vaccination_date', { ascending: false });
      if (error) throw error;
      setVaccinations(data || []);
    } catch (error) {
      console.error('Error fetching vaccinations:', error);
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
      const costPerDosage = formData.cost_per_dosage ? parseFloat(formData.cost_per_dosage) : null;
      const numBirds = parseInt(formData.number_of_birds);

      const vaccinationData: any = {
        batch_id: formData.batch_id,
        vaccination_date: formData.vaccination_date.toISOString().split('T')[0],
        birds_age_days: parseInt(formData.birds_age_days),
        vaccine_name: formData.vaccine_name,
        disease_target: formData.disease_target,
        administration_method: formData.administration_method,
        dosage: formData.dosage,
        number_of_birds: numBirds,
        manufacturer: formData.manufacturer || null,
        batch_number: formData.batch_number || null,
        expiry_date: formData.expiry_date?.toISOString().split('T')[0] || null,
        cost_per_dosage: costPerDosage,
        total_cost: costPerDosage ? costPerDosage * numBirds : null,
        veterinary_name: formData.veterinary_name || null,
        status: formData.status,
        notes: formData.notes || null,
        created_by: user.id,
      };

      if (editingVaccination) {
        const { error } = await supabase
          .from('vaccinations')
          .update({ ...vaccinationData, updated_at: new Date().toISOString() })
          .eq('id', editingVaccination.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vaccinations')
          .insert([vaccinationData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingVaccination(null);
      resetForm();
      fetchVaccinations();
    } catch (error) {
      console.error('Error saving vaccination:', error);
      alert('Error saving vaccination');
    }
  };

  const resetForm = () => {
    setFormData({
      batch_id: '',
      vaccination_date: new Date(),
      birds_age_days: '',
      vaccine_name: '',
      disease_target: '',
      administration_method: 'Oral',
      dosage: '',
      number_of_birds: '',
      manufacturer: '',
      batch_number: '',
      expiry_date: undefined,
      cost_per_dosage: '',
      veterinary_name: '',
      status: 'Planned',
      notes: '',
    });
  };

  const checkOverdue = (vaccination: Vaccination): boolean => {
    if (vaccination.status === 'Completed') return false;
    const vaccinationDate = new Date(vaccination.vaccination_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return vaccinationDate < today;
  };

  const filteredVaccinations = vaccinations.filter((vaccination) => {
    const batch = batches.find((b) => b.id === vaccination.batch_id);
    const matchesSearch = filter.search === '' ||
      vaccination.vaccine_name.toLowerCase().includes(filter.search.toLowerCase()) ||
      vaccination.disease_target.toLowerCase().includes(filter.search.toLowerCase()) ||
      batch?.batch_flock_id.toLowerCase().includes(filter.search.toLowerCase());
    const matchesBatch = filter.batch === '' || vaccination.batch_id === filter.batch;
    const matchesStatus = filter.status === '' || vaccination.status === filter.status;
    const matchesOverdue = !filter.showOverdue || checkOverdue(vaccination);
    return matchesSearch && matchesBatch && matchesStatus && matchesOverdue;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const overdueCount = vaccinations.filter(checkOverdue).length;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-600" size={24} />
          <div>
            <h4 className="font-semibold text-red-800">Overdue Vaccinations</h4>
            <p className="text-sm text-red-600">
              You have {overdueCount} overdue vaccination(s) that need attention.
            </p>
          </div>
        </div>
      )}

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
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value as VaccinationStatus | '' })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="Planned">Planned</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={filter.showOverdue}
              onChange={(e) => setFilter({ ...filter, showOverdue: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Show Overdue Only</span>
          </label>
        </div>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingVaccination(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          Schedule Vaccination
        </button>
      </div>

      {/* Vaccinations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Vaccination Schedule</h3>
          <TableActions
            tableId="vaccinations-table"
            title="Vaccinations"
            data={vaccinations}
            filteredData={filteredVaccinations}
            columns={[
              { key: 'batch_id', label: 'Batch' },
              { key: 'vaccine_name', label: 'Vaccine' },
              { key: 'vaccination_date', label: 'Date' },
              { key: 'birds_age_days', label: 'Age (Days)' },
              { key: 'status', label: 'Status' },
              { key: 'total_cost', label: 'Total Cost' },
            ]}
            getRowData={(vaccination) => {
              const batch = batches.find((b) => b.id === vaccination.batch_id);
              return {
                'batch_id': batch?.batch_flock_id || 'N/A',
                'vaccine_name': vaccination.vaccine_name,
                'vaccination_date': vaccination.vaccination_date,
                'birds_age_days': vaccination.birds_age_days,
                'status': vaccination.status,
                'total_cost': vaccination.total_cost || 0,
              };
            }}
          />
        </div>
        <div className="overflow-x-auto">
          <table id="vaccinations-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch/Flock ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vaccine Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disease Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vaccination Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Birds Age (Days)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Number of Birds</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVaccinations.map((vaccination) => {
                const batch = batches.find((b) => b.id === vaccination.batch_id);
                const isOverdue = checkOverdue(vaccination);
                return (
                  <tr key={vaccination.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{batch?.batch_flock_id || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{vaccination.vaccine_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{vaccination.disease_target}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(vaccination.vaccination_date).toLocaleDateString()}
                      {isOverdue && (
                        <AlertTriangle className="inline-block ml-2 text-red-600" size={16} />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{vaccination.birds_age_days}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{vaccination.administration_method}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{vaccination.number_of_birds.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        vaccination.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        isOverdue ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {isOverdue ? 'Overdue' : vaccination.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {vaccination.total_cost ? `KES ${vaccination.total_cost.toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          setEditingVaccination(vaccination);
                          setFormData({
                            batch_id: vaccination.batch_id,
                            vaccination_date: new Date(vaccination.vaccination_date),
                            birds_age_days: vaccination.birds_age_days.toString(),
                            vaccine_name: vaccination.vaccine_name,
                            disease_target: vaccination.disease_target,
                            administration_method: vaccination.administration_method,
                            dosage: vaccination.dosage,
                            number_of_birds: vaccination.number_of_birds.toString(),
                            manufacturer: vaccination.manufacturer || '',
                            batch_number: vaccination.batch_number || '',
                            expiry_date: vaccination.expiry_date ? new Date(vaccination.expiry_date) : undefined,
                            cost_per_dosage: vaccination.cost_per_dosage?.toString() || '',
                            veterinary_name: vaccination.veterinary_name || '',
                            status: vaccination.status,
                            notes: vaccination.notes || '',
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
              {editingVaccination ? 'Edit Vaccination' : 'Schedule Vaccination'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                      <option key={batch.id} value={batch.id}>{batch.batch_flock_id} - {batch.production_type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vaccination Date * <span className="text-xs text-gray-500">(Date vaccine is administered)</span>
                  </label>
                  <DatePicker
                    selected={formData.vaccination_date}
                    onChange={(date: Date) => setFormData({ ...formData, vaccination_date: date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birds Age (Days) * <span className="text-xs text-gray-500">(Age of birds at vaccination)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.birds_age_days}
                    onChange={(e) => setFormData({ ...formData, birds_age_days: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vaccine Name * <span className="text-xs text-gray-500">(Exact vaccine name used)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.vaccine_name}
                    onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Newcastle Disease Vaccine"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Disease Target * <span className="text-xs text-gray-500">(Disease the vaccine protects against)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.disease_target}
                    onChange={(e) => setFormData({ ...formData, disease_target: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Newcastle Disease"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Administration Method * <span className="text-xs text-gray-500">(Oral, injection, water, spray, etc.)</span>
                  </label>
                  <select
                    value={formData.administration_method}
                    onChange={(e) => setFormData({ ...formData, administration_method: e.target.value as AdministrationMethod })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Oral">Oral</option>
                    <option value="Injection">Injection</option>
                    <option value="Water">Water</option>
                    <option value="Spray">Spray</option>
                    <option value="Eye Drop">Eye Drop</option>
                    <option value="Wing Web">Wing Web</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosage * <span className="text-xs text-gray-500">(Amount per bird or per kg)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., 0.5ml per bird"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Birds * <span className="text-xs text-gray-500">(Total birds vaccinated)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.number_of_birds}
                    onChange={(e) => setFormData({ ...formData, number_of_birds: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer <span className="text-xs text-gray-500">(Company producing vaccine)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Number <span className="text-xs text-gray-500">(Vaccine batch for traceability)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date <span className="text-xs text-gray-500">(Cannot use after expiry)</span>
                  </label>
                  <DatePicker
                    selected={formData.expiry_date}
                    onChange={(date: Date | null) => setFormData({ ...formData, expiry_date: date || undefined })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost per Dosage (KES) <span className="text-xs text-gray-500">(Unit cost per bird)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_per_dosage}
                    onChange={(e) => setFormData({ ...formData, cost_per_dosage: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  {formData.cost_per_dosage && formData.number_of_birds && (
                    <p className="text-sm text-green-600 mt-1">
                      Total Cost: KES {(parseFloat(formData.cost_per_dosage) * parseFloat(formData.number_of_birds)).toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Veterinary Name <span className="text-xs text-gray-500">(Vet overseeing vaccination)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.veterinary_name}
                    onChange={(e) => setFormData({ ...formData, veterinary_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status * <span className="text-xs text-gray-500">(Planned, Completed, Overdue)</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VaccinationStatus })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Completed">Completed</option>
                    <option value="Overdue">Overdue</option>
                  </select>
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
                  {editingVaccination ? 'Update' : 'Schedule Vaccination'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingVaccination(null);
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



