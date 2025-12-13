import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Expense, Revenue, Farm, ExpenseCategory, RevenueType, PaymentMethod } from '../../types';
import { Plus, Edit, Trash2, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../contexts/AuthContext';

export default function Finance() {
  const [activeTab, setActiveTab] = useState<'expenses' | 'revenue'>('expenses');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const [expenseFormData, setExpenseFormData] = useState({
    farm_id: '',
    date: new Date(),
    amount: '',
    description: '',
    category: 'Feeds' as ExpenseCategory,
    payment_method: 'Cash' as PaymentMethod,
  });
  const [revenueFormData, setRevenueFormData] = useState({
    farm_id: '',
    date: new Date(),
    amount: '',
    customer: '',
    revenue_type: 'Milk' as RevenueType,
    payment_method: 'Cash' as PaymentMethod,
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchFarms();
    if (activeTab === 'expenses') {
      fetchExpenses();
    } else {
      fetchRevenue();
    }
  }, [activeTab]);

  const fetchFarms = async () => {
    const { data } = await supabase.from('farms').select('*');
    setFarms(data || []);
  };

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenue = async () => {
    try {
      const { data, error } = await supabase
        .from('revenue')
        .select('*')
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;
      setRevenue(data || []);
    } catch (error) {
      console.error('Error fetching revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const canEditDelete = (createdAt: string) => {
    const recordDate = new Date(createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - recordDate.getTime()) / (1000 * 60);
    return diffMinutes <= 30;
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const expenseData = {
        farm_id: expenseFormData.farm_id,
        date: expenseFormData.date.toISOString().split('T')[0],
        amount: parseFloat(expenseFormData.amount),
        description: expenseFormData.description,
        category: expenseFormData.category,
        payment_method: expenseFormData.payment_method,
        created_by: user.id,
      };

      if (editingExpense) {
        if (!canEditDelete(editingExpense.created_at)) {
          alert('Cannot edit record after 30 minutes. Please request approval.');
          return;
        }
        const { error } = await supabase
          .from('expenses')
          .update({ ...expenseData, updated_at: new Date().toISOString() })
          .eq('id', editingExpense.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('expenses').insert([expenseData]);
        if (error) throw error;
      }

      setShowExpenseModal(false);
      setEditingExpense(null);
      setExpenseFormData({
        farm_id: '',
        date: new Date(),
        amount: '',
        description: '',
        category: 'Feeds',
        payment_method: 'Cash',
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error saving expense');
    }
  };

  const handleRevenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const revenueData = {
        farm_id: revenueFormData.farm_id,
        date: revenueFormData.date.toISOString().split('T')[0],
        amount: parseFloat(revenueFormData.amount),
        customer: revenueFormData.customer || null,
        revenue_type: revenueFormData.revenue_type,
        payment_method: revenueFormData.payment_method,
        created_by: user.id,
      };

      if (editingRevenue) {
        if (!canEditDelete(editingRevenue.created_at)) {
          alert('Cannot edit record after 30 minutes. Please request approval.');
          return;
        }
        const { error } = await supabase
          .from('revenue')
          .update({ ...revenueData, updated_at: new Date().toISOString() })
          .eq('id', editingRevenue.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('revenue').insert([revenueData]);
        if (error) throw error;
      }

      setShowRevenueModal(false);
      setEditingRevenue(null);
      setRevenueFormData({
        farm_id: '',
        date: new Date(),
        amount: '',
        customer: '',
        revenue_type: 'Milk',
        payment_method: 'Cash',
      });
      fetchRevenue();
    } catch (error) {
      console.error('Error saving revenue:', error);
      alert('Error saving revenue');
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
        <h1 className="text-3xl font-bold text-gray-900">Finance Management</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'expenses'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingDown size={20} />
              Expenses
            </div>
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'revenue'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={20} />
              Revenue
            </div>
          </button>
        </nav>
      </div>

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingExpense(null);
                setExpenseFormData({
                  farm_id: '',
                  date: new Date(),
                  amount: '',
                  description: '',
                  category: 'Feeds',
                  payment_method: 'Cash',
                });
                setShowExpenseModal(true);
              }}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              <Plus size={20} />
              Add Expense
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => {
                  const farm = farms.find((f) => f.id === expense.farm_id);
                  const canEdit = canEditDelete(expense.created_at);
                  return (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{farm?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{expense.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        KES {expense.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {canEdit ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingExpense(expense);
                                setExpenseFormData({
                                  farm_id: expense.farm_id,
                                  date: new Date(expense.date),
                                  amount: expense.amount.toString(),
                                  description: expense.description,
                                  category: expense.category,
                                  payment_method: expense.payment_method,
                                });
                                setShowExpenseModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit size={18} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Locked</span>
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

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingRevenue(null);
                setRevenueFormData({
                  farm_id: '',
                  date: new Date(),
                  amount: '',
                  customer: '',
                  revenue_type: 'Milk',
                  payment_method: 'Cash',
                });
                setShowRevenueModal(true);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus size={20} />
              Add Revenue
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revenue.map((rev) => {
                  const farm = farms.find((f) => f.id === rev.farm_id);
                  const canEdit = canEditDelete(rev.created_at);
                  return (
                    <tr key={rev.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(rev.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{farm?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {rev.revenue_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rev.customer || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        KES {rev.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rev.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {canEdit ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingRevenue(rev);
                                setRevenueFormData({
                                  farm_id: rev.farm_id,
                                  date: new Date(rev.date),
                                  amount: rev.amount.toString(),
                                  customer: rev.customer || '',
                                  revenue_type: rev.revenue_type,
                                  payment_method: rev.payment_method,
                                });
                                setShowRevenueModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit size={18} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Locked</span>
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

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingExpense ? 'Edit Expense' : 'Add Expense'}
            </h2>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
                <select
                  value={expenseFormData.farm_id}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, farm_id: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <DatePicker
                  selected={expenseFormData.date}
                  onChange={(date: Date) => setExpenseFormData({ ...expenseFormData, date })}
                  dateFormat="yyyy-MM-dd"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseFormData.amount}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input
                  type="text"
                  value={expenseFormData.description}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={expenseFormData.category}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value as ExpenseCategory })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Feeds">Feeds</option>
                    <option value="Drugs & Vaccines">Drugs & Vaccines</option>
                    <option value="Staff Salaries">Staff Salaries</option>
                    <option value="Casual Wages">Casual Wages</option>
                    <option value="Fuel & Transport">Fuel & Transport</option>
                    <option value="Repairs">Repairs</option>
                    <option value="Services">Services</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                  <select
                    value={expenseFormData.payment_method}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, payment_method: e.target.value as PaymentMethod })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="MPesa">MPesa</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                >
                  {editingExpense ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revenue Modal */}
      {showRevenueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingRevenue ? 'Edit Revenue' : 'Add Revenue'}
            </h2>
            <form onSubmit={handleRevenueSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
                <select
                  value={revenueFormData.farm_id}
                  onChange={(e) => setRevenueFormData({ ...revenueFormData, farm_id: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <DatePicker
                  selected={revenueFormData.date}
                  onChange={(date: Date) => setRevenueFormData({ ...revenueFormData, date })}
                  dateFormat="yyyy-MM-dd"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={revenueFormData.amount}
                  onChange={(e) => setRevenueFormData({ ...revenueFormData, amount: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Revenue Type *</label>
                <select
                  value={revenueFormData.revenue_type}
                  onChange={(e) => setRevenueFormData({ ...revenueFormData, revenue_type: e.target.value as RevenueType })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="Milk">Milk</option>
                  <option value="Eggs">Eggs</option>
                  <option value="Broilers">Broilers</option>
                  <option value="Male Calves">Male Calves</option>
                  <option value="Heifers">Heifers</option>
                  <option value="Other Products">Other Products</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <input
                  type="text"
                  value={revenueFormData.customer}
                  onChange={(e) => setRevenueFormData({ ...revenueFormData, customer: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select
                  value={revenueFormData.payment_method}
                  onChange={(e) => setRevenueFormData({ ...revenueFormData, payment_method: e.target.value as PaymentMethod })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="MPesa">MPesa</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingRevenue ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRevenueModal(false)}
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

