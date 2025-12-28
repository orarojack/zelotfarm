import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { JournalEntry, JournalEntryLine, ChartOfAccount } from '../../../types';
import { Plus, Edit, Search, FileText } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../../contexts/AuthContext';
import TableActions from '../../../components/admin/TableActions';

export default function JournalEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entryLines, setEntryLines] = useState<Map<string, JournalEntryLine[]>>(new Map());
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [filter, setFilter] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
  });

  const [formData, setFormData] = useState({
    entry_date: new Date(),
    description: '',
  });

  const [linesData, setLinesData] = useState<Array<{
    account_id: string;
    debit_amount: string;
    credit_amount: string;
    description: string;
  }>>([
    { account_id: '', debit_amount: '', credit_amount: '', description: '' },
    { account_id: '', debit_amount: '', credit_amount: '', description: '' },
  ]);

  useEffect(() => {
    fetchEntries();
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (editingEntry) {
      fetchEntryLines(editingEntry.id);
    }
  }, [editingEntry]);

  const generateEntryReference = async (): Promise<string> => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `JE-${dateStr}-${random}`;
  };

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('entry_date', { ascending: false });
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntryLines = async (entryId: string) => {
    try {
      const { data, error } = await supabase
        .from('journal_entry_lines')
        .select('*')
        .eq('journal_entry_id', entryId);
      if (error) throw error;
      if (data && data.length > 0) {
        setLinesData(data.map(line => ({
          account_id: line.account_id,
          debit_amount: line.debit_amount.toString(),
          credit_amount: line.credit_amount.toString(),
          description: line.description || '',
        })));
      }
    } catch (error) {
      console.error('Error fetching entry lines:', error);
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

  const calculateTotals = () => {
    const totalDebit = linesData.reduce((sum, line) => {
      return sum + (parseFloat(line.debit_amount) || 0);
    }, 0);
    const totalCredit = linesData.reduce((sum, line) => {
      return sum + (parseFloat(line.credit_amount) || 0);
    }, 0);
    return { totalDebit, totalCredit };
  };

  const validateEntry = (): boolean => {
    const { totalDebit, totalCredit } = calculateTotals();
    if (totalDebit === 0 || totalCredit === 0) {
      alert('Entry must have at least one debit and one credit');
      return false;
    }
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert(`Debit (${totalDebit.toFixed(2)}) must equal Credit (${totalCredit.toFixed(2)})`);
      return false;
    }
    if (linesData.some(line => !line.account_id)) {
      alert('All lines must have an account selected');
      return false;
    }
    if (linesData.some(line => (parseFloat(line.debit_amount) || 0) > 0 && (parseFloat(line.credit_amount) || 0) > 0)) {
      alert('Each line must have either debit OR credit, not both');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateEntry()) return;

    try {
      const entryReference = editingEntry?.entry_reference || await generateEntryReference();
      const { totalDebit, totalCredit } = calculateTotals();

      const entryData: any = {
        entry_reference: entryReference,
        entry_date: formData.entry_date.toISOString().split('T')[0],
        description: formData.description,
        total_debit: totalDebit,
        total_credit: totalCredit,
        created_by: user.id,
      };

      let entryId: string;

      if (editingEntry) {
        const { error } = await supabase
          .from('journal_entries')
          .update({ ...entryData, updated_at: new Date().toISOString() })
          .eq('id', editingEntry.id);
        if (error) throw error;
        entryId = editingEntry.id;
        await supabase.from('journal_entry_lines').delete().eq('journal_entry_id', entryId);
      } else {
        const { data, error } = await supabase
          .from('journal_entries')
          .insert([entryData])
          .select()
          .single();
        if (error) throw error;
        entryId = data.id;
      }

      const linesToInsert = linesData
        .filter(line => line.account_id && ((parseFloat(line.debit_amount) || 0) > 0 || (parseFloat(line.credit_amount) || 0) > 0))
        .map(line => ({
          journal_entry_id: entryId,
          account_id: line.account_id,
          debit_amount: parseFloat(line.debit_amount) || 0,
          credit_amount: parseFloat(line.credit_amount) || 0,
          description: line.description || null,
        }));

      if (linesToInsert.length > 0) {
        const { error: linesError } = await supabase
          .from('journal_entry_lines')
          .insert(linesToInsert);
        if (linesError) throw linesError;
      }

      setShowModal(false);
      setEditingEntry(null);
      resetForm();
      fetchEntries();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      alert('Error saving journal entry');
    }
  };

  const resetForm = () => {
    setFormData({
      entry_date: new Date(),
      description: '',
    });
    setLinesData([
      { account_id: '', debit_amount: '', credit_amount: '', description: '' },
      { account_id: '', debit_amount: '', credit_amount: '', description: '' },
    ]);
  };

  const addLine = () => {
    setLinesData([...linesData, { account_id: '', debit_amount: '', credit_amount: '', description: '' }]);
  };

  const removeLine = (index: number) => {
    if (linesData.length > 2) {
      setLinesData(linesData.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: string, value: any) => {
    const updated = [...linesData];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'debit_amount' && value) {
      updated[index].credit_amount = '';
    }
    if (field === 'credit_amount' && value) {
      updated[index].debit_amount = '';
    }
    setLinesData(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = filter.search === '' || 
      entry.entry_reference.toLowerCase().includes(filter.search.toLowerCase()) ||
      entry.description.toLowerCase().includes(filter.search.toLowerCase());
    const matchesDateFrom = filter.dateFrom === '' || new Date(entry.entry_date) >= new Date(filter.dateFrom);
    const matchesDateTo = filter.dateTo === '' || new Date(entry.entry_date) <= new Date(filter.dateTo);
    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const { totalDebit, totalCredit } = calculateTotals();
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search entries..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <input
            type="date"
            value={filter.dateFrom}
            onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
          <input
            type="date"
            value={filter.dateTo}
            onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingEntry(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          Create Journal Entry
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Journal Entries</h3>
          <TableActions
            tableId="journal-entries-table"
            title="Journal Entries"
            data={filteredEntries}
            filteredData={filteredEntries}
            columns={[
              { key: 'entry_reference', label: 'Reference' },
              { key: 'entry_date', label: 'Date' },
              { key: 'description', label: 'Description' },
              { key: 'total_debit', label: 'Debit' },
              { key: 'total_credit', label: 'Credit' },
            ]}
            getRowData={(entry) => ({
              'entry_reference': entry.entry_reference,
              'entry_date': entry.entry_date,
              'description': entry.description,
              'total_debit': entry.total_debit,
              'total_credit': entry.total_credit,
            })}
          />
        </div>
        <div className="overflow-x-auto">
          <table id="journal-entries-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Debit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Credit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{entry.entry_reference}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(entry.entry_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">{entry.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">KES {entry.total_debit.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">KES {entry.total_credit.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={async () => {
                        setEditingEntry(entry);
                        setFormData({
                          entry_date: new Date(entry.entry_date),
                          description: entry.description,
                        });
                        await fetchEntryLines(entry.id);
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
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingEntry ? 'Edit Journal Entry' : 'Create Journal Entry'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {editingEntry && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entry ID / Reference <span className="text-xs text-gray-500">(Unique reference for each transaction)</span>
                  </label>
                  <input
                    type="text"
                    value={editingEntry.entry_reference}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date * <span className="text-xs text-gray-500">(Date of the financial transaction)</span>
                  </label>
                  <DatePicker
                    selected={formData.entry_date}
                    onChange={(date: Date) => setFormData({ ...formData, entry_date: date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description / Remarks * <span className="text-xs text-gray-500">(Brief explanation of the transaction)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Entry Lines</h3>
                  <button
                    type="button"
                    onClick={addLine}
                    className="flex items-center gap-2 text-green-600 hover:text-green-700"
                  >
                    <Plus size={18} />
                    Add Line
                  </button>
                </div>
                <div className="space-y-2">
                  {linesData.map((line, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 border rounded p-2 bg-gray-50">
                      <div className="col-span-4">
                        <select
                          value={line.account_id}
                          onChange={(e) => updateLine(index, 'account_id', e.target.value)}
                          required
                          className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select Account</option>
                          {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.account_code} - {account.account_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.debit_amount}
                          onChange={(e) => updateLine(index, 'debit_amount', e.target.value)}
                          placeholder="Debit"
                          className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.credit_amount}
                          onChange={(e) => updateLine(index, 'credit_amount', e.target.value)}
                          placeholder="Credit"
                          className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          className="text-red-600 hover:text-red-700"
                          disabled={linesData.length <= 2}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-gray-100 rounded">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Debit</p>
                      <p className="text-lg font-semibold">KES {totalDebit.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Credit</p>
                      <p className="text-lg font-semibold">KES {totalCredit.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Balance</p>
                      <p className={`text-lg font-semibold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                        {isBalanced ? '✓ Balanced' : `Difference: KES ${Math.abs(totalDebit - totalCredit).toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!isBalanced}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {editingEntry ? 'Update' : 'Create Entry'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEntry(null);
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

