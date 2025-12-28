import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { CustomerEnhanced, CustomerType } from '../../../types';
import { Plus, Edit, Search, Users } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import TableActions from '../../../components/admin/TableActions';

export default function CustomerManagement() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<CustomerEnhanced[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerEnhanced | null>(null);
  const [filter, setFilter] = useState({
    search: '',
    customerType: '' as CustomerType | '',
    activeOnly: true,
  });

  const [formData, setFormData] = useState({
    customer_name: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    customer_type: '' as CustomerType | '',
    payment_terms: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const generateCustomerCode = async (): Promise<string> => {
    // Generate unique customer code: CUST-YYYYMMDD-XXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CUST-${dateStr}-${random}`;
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('customer_name');
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const customerCode = editingCustomer?.customer_code || await generateCustomerCode();

      const customerData: any = {
        customer_code: customerCode,
        customer_name: formData.customer_name,
        contact_phone: formData.contact_phone || null,
        contact_email: formData.contact_email || null,
        address: formData.address || null,
        customer_type: formData.customer_type || null,
        payment_terms: formData.payment_terms || null,
        notes: formData.notes || null,
        is_active: formData.is_active,
      };

      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update({ ...customerData, updated_at: new Date().toISOString() })
          .eq('id', editingCustomer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('customers').insert([customerData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingCustomer(null);
      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error saving customer');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      contact_phone: '',
      contact_email: '',
      address: '',
      customer_type: '' as CustomerType | '',
      payment_terms: '',
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

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = filter.search === '' || 
      customer.customer_name.toLowerCase().includes(filter.search.toLowerCase()) ||
      customer.customer_code?.toLowerCase().includes(filter.search.toLowerCase()) ||
      customer.contact_phone?.toLowerCase().includes(filter.search.toLowerCase()) ||
      customer.contact_email?.toLowerCase().includes(filter.search.toLowerCase());
    const matchesType = filter.customerType === '' || customer.customer_type === filter.customerType;
    const matchesActive = !filter.activeOnly || customer.is_active;
    return matchesSearch && matchesType && matchesActive;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search customers..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={filter.customerType}
            onChange={(e) => setFilter({ ...filter, customerType: e.target.value as CustomerType | '' })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Types</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Distributor">Distributor</option>
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
            setEditingCustomer(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Customers</h3>
          <TableActions
            tableId="customers-table"
            title="Customers"
            data={filteredCustomers}
            filteredData={filteredCustomers}
            columns={[
              { key: 'customer_code', label: 'Code' },
              { key: 'customer_name', label: 'Name' },
              { key: 'customer_type', label: 'Type' },
              { key: 'contact_phone', label: 'Phone' },
              { key: 'is_active', label: 'Status' },
            ]}
            getRowData={(customer) => ({
              'customer_code': customer.customer_code || 'N/A',
              'customer_name': customer.customer_name,
              'customer_type': customer.customer_type || 'N/A',
              'contact_phone': customer.contact_phone || 'N/A',
              'is_active': customer.is_active ? 'Active' : 'Inactive',
            })}
          />
        </div>
        <div className="overflow-x-auto">
          <table id="customers-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Terms</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{customer.customer_code || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.customer_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {customer.customer_type ? (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        customer.customer_type === 'Retail' ? 'bg-blue-100 text-blue-800' :
                        customer.customer_type === 'Wholesale' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {customer.customer_type}
                      </span>
                    ) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.contact_phone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.contact_email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.payment_terms || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      customer.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => {
                        setEditingCustomer(customer);
                        setFormData({
                          customer_name: customer.customer_name,
                          contact_phone: customer.contact_phone || '',
                          contact_email: customer.contact_email || '',
                          address: customer.address || '',
                          customer_type: customer.customer_type || '' as CustomerType | '',
                          payment_terms: customer.payment_terms || '',
                          notes: customer.notes || '',
                          is_active: customer.is_active,
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {editingCustomer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Code <span className="text-xs text-gray-500">(Auto-generated unique identifier)</span>
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.customer_code || ''}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name * <span className="text-xs text-gray-500">(Full name or company name)</span>
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone <span className="text-xs text-gray-500">(Phone for communication)</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email <span className="text-xs text-gray-500">(Email for communication)</span>
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-xs text-gray-500">(Address for communication)</span>
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Type <span className="text-xs text-gray-500">(Retail, Wholesale, or Distributor)</span>
                  </label>
                  <select
                    value={formData.customer_type}
                    onChange={(e) => setFormData({ ...formData, customer_type: e.target.value as CustomerType | '' })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Type</option>
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms <span className="text-xs text-gray-500">(Net 30, cash on delivery, etc.)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Net 30, COD"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes / Preferences <span className="text-xs text-gray-500">(Any special conditions or remarks)</span>
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
                  {editingCustomer ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCustomer(null);
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

