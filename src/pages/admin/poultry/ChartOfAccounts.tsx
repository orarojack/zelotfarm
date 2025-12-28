import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { ChartOfAccount, AccountType } from '../../../types';
import { Plus, Edit, Search, BookOpen } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import TableActions from '../../../components/admin/TableActions';

export default function ChartOfAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
  const [filter, setFilter] = useState({
    search: '',
    accountType: '' as AccountType | '',
    activeOnly: true,
  });

  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    account_type: '' as AccountType | '',
    parent_account_id: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .order('account_code');
      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const accountData: any = {
        account_code: formData.account_code,
        account_name: formData.account_name,
        account_type: formData.account_type,
        parent_account_id: formData.parent_account_id || null,
        notes: formData.notes || null,
        is_active: formData.is_active,
      };

      if (editingAccount) {
        const { error } = await supabase
          .from('chart_of_accounts')
          .update({ ...accountData, updated_at: new Date().toISOString() })
          .eq('id', editingAccount.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('chart_of_accounts').insert([accountData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingAccount(null);
      resetForm();
      fetchAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
      alert('Error saving account');
    }
  };

  const resetForm = () => {
    setFormData({
      account_code: '',
      account_name: '',
      account_type: '' as AccountType | '',
      parent_account_id: '',
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

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = filter.search === '' || 
      account.account_code.toLowerCase().includes(filter.search.toLowerCase()) ||
      account.account_name.toLowerCase().includes(filter.search.toLowerCase());
    const matchesType = filter.accountType === '' || account.account_type === filter.accountType;
    const matchesActive = !filter.activeOnly || account.is_active;
    return matchesSearch && matchesType && matchesActive;
  });

  const getParentAccountName = (parentId?: string): string => {
    if (!parentId) return 'N/A';
    const parent = accounts.find(a => a.id === parentId);
    return parent ? `${parent.account_code} - ${parent.account_name}` : 'N/A';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search accounts..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={filter.accountType}
            onChange={(e) => setFilter({ ...filter, accountType: e.target.value as AccountType | '' })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Types</option>
            <option value="Asset">Asset</option>
            <option value="Liability">Liability</option>
            <option value="Equity">Equity</option>
            <option value="Revenue">Revenue</option>
            <option value="Expense">Expense</option>
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
            setEditingAccount(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          Add Account
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Chart of Accounts</h3>
          <TableActions
            tableId="accounts-table"
            title="Chart of Accounts"
            data={filteredAccounts}
            filteredData={filteredAccounts}
            columns={[
              { key: 'account_code', label: 'Code' },
              { key: 'account_name', label: 'Name' },
              { key: 'account_type', label: 'Type' },
              { key: 'is_active', label: 'Status' },
            ]}
            getRowData={(account) => ({
              'account_code': account.account_code,
              'account_name': account.account_name,
              'account_type': account.account_type,
              'is_active': account.is_active ? 'Active' : 'Inactive',
            })}
          />
        </div>
        <div className="overflow-x-auto">
          <table id="accounts-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent Account</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{account.account_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{account.account_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      account.account_type === 'Asset' ? 'bg-green-100 text-green-800' :
                      account.account_type === 'Liability' ? 'bg-red-100 text-red-800' :
                      account.account_type === 'Equity' ? 'bg-blue-100 text-blue-800' :
                      account.account_type === 'Revenue' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {account.account_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{getParentAccountName(account.parent_account_id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      account.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {account.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => {
                        setEditingAccount(account);
                        setFormData({
                          account_code: account.account_code,
                          account_name: account.account_name,
                          account_type: account.account_type,
                          parent_account_id: account.parent_account_id || '',
                          notes: account.notes || '',
                          is_active: account.is_active,
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
              {editingAccount ? 'Edit Account' : 'Add Account'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Code * <span className="text-xs text-gray-500">(Unique code for each account)</span>
                </label>
                <input
                  type="text"
                  value={formData.account_code}
                  onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 1000, 2000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name * <span className="text-xs text-gray-500">(Descriptive name, e.g., Feed Expenses, Sales Revenue)</span>
                </label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type * <span className="text-xs text-gray-500">(Asset, Liability, Equity, Revenue, Expense)</span>
                </label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value as AccountType | '' })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Type</option>
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                  <option value="Revenue">Revenue</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Account / Category <span className="text-xs text-gray-500">(For hierarchical grouping, e.g., Current Assets &gt; Cash)</span>
                </label>
                <select
                  value={formData.parent_account_id}
                  onChange={(e) => setFormData({ ...formData, parent_account_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">None (Top Level)</option>
                  {accounts
                    .filter(a => a.id !== editingAccount?.id)
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes <span className="text-xs text-gray-500">(Optional explanation or usage guidance)</span>
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
                  {editingAccount ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAccount(null);
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

