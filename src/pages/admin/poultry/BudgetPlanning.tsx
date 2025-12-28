import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Budget, ChartOfAccount } from '../../../types';
import { Plus, Edit, Search, TrendingUp } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../../contexts/AuthContext';
import TableActions from '../../../components/admin/TableActions';

export default function BudgetPlanning() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [filter, setFilter] = useState({
    search: '',
    account: '',
    period: '',
  });

  const [formData, setFormData] = useState({
    account_id: '',
    period_start: new Date(),
    period_end: new Date(),
    planned_amount: '',
    notes: '',
  });

  useEffect(() => {
    fetchBudgets();
    fetchAccounts();
  }, []);

  const generateBudgetReference = async (): Promise<string> => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BUD-${dateStr}-${random}`;
  };

  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('period_start', { ascending: false });
      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('is_active', true)
        .order('account_code');
      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const budgetReference = editingBudget?.budget_reference || await generateBudgetReference();

      const budgetData: any = {
        budget_reference: budgetReference,
        account_id: formData.account_id,
        period_start: formData.period_start.toISOString().split('T')[0],
        period_end: formData.period_end.toISOString().split('T')[0],
        planned_amount: parseFloat(formData.planned_amount),
        notes: formData.notes || null,
        created_by: user.id,
      };

      if (editingBudget) {
        const { error } = await supabase
          .from('budgets')
          .update({ ...budgetData, updated_at: new Date().toISOString() })
          .eq('id', editingBudget.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('budgets').insert([budgetData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingBudget(null);
      resetForm();
      fetchBudgets();
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Error saving budget');
    }
  };

  const resetForm = () => {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setFormData({
      account_id: '',
      period_start: new Date(today.getFullYear(), today.getMonth(), 1),
      period_end: endOfMonth,
      planned_amount: '',
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

  const filteredBudgets = budgets.filter((budget) => {
    const account = accounts.find((a) => a.id === budget.account_id);
    const matchesSearch = filter.search === '' || 
      budget.budget_reference.toLowerCase().includes(filter.search.toLowerCase()) ||
      account?.account_name.toLowerCase().includes(filter.search.toLowerCase());
    const matchesAccount = filter.account === '' || budget.account_id === filter.account;
    return matchesSearch && matchesAccount;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search budgets..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={filter.account}
            onChange={(e) => setFilter({ ...filter, account: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_code} - {account.account_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingBudget(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          Create Budget
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Budget Plans</h3>
          <TableActions
            tableId="budgets-table"
            title="Budgets"
            data={filteredBudgets}
            filteredData={filteredBudgets}
            columns={[
              { key: 'budget_reference', label: 'Reference' },
              { key: 'account_id', label: 'Account' },
              { key: 'period_start', label: 'Period Start' },
              { key: 'planned_amount', label: 'Planned Amount' },
            ]}
            getRowData={(budget) => {
              const account = accounts.find((a) => a.id === budget.account_id);
              return {
                'budget_reference': budget.budget_reference,
                'account_id': account?.account_name || 'N/A',
                'period_start': budget.period_start,
                'planned_amount': budget.planned_amount,
              };
            }}
          />
        </div>
        <div className="overflow-x-auto">
          <table id="budgets-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period Start</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period End</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Planned Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBudgets.map((budget) => {
                const account = accounts.find((a) => a.id === budget.account_id);
                return (
                  <tr key={budget.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{budget.budget_reference}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{account?.account_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(budget.period_start).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(budget.period_end).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                      KES {budget.planned_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          setEditingBudget(budget);
                          setFormData({
                            account_id: budget.account_id,
                            period_start: new Date(budget.period_start),
                            period_end: new Date(budget.period_end),
                            planned_amount: budget.planned_amount.toString(),
                            notes: budget.notes || '',
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingBudget ? 'Edit Budget' : 'Create Budget'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {editingBudget && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget ID / Reference <span className="text-xs text-gray-500">(Unique identifier for budget plan)</span>
                  </label>
                  <input
                    type="text"
                    value={editingBudget.budget_reference}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account / Category * <span className="text-xs text-gray-500">(Select from chart of accounts)</span>
                </label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period Start * <span className="text-xs text-gray-500">(Month, Quarter, or Year)</span>
                  </label>
                  <DatePicker
                    selected={formData.period_start}
                    onChange={(date: Date) => setFormData({ ...formData, period_start: date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period End * <span className="text-xs text-gray-500">(Month, Quarter, or Year)</span>
                  </label>
                  <DatePicker
                    selected={formData.period_end}
                    onChange={(date: Date) => setFormData({ ...formData, period_end: date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Planned Amount * <span className="text-xs text-gray-500">(Budgeted figure for the period)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.planned_amount}
                  onChange={(e) => setFormData({ ...formData, planned_amount: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes / Assumptions <span className="text-xs text-gray-500">(Optional guidance or assumptions for planning)</span>
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
                  {editingBudget ? 'Update' : 'Create Budget'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBudget(null);
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

