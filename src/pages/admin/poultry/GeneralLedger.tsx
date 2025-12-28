import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { ChartOfAccount, JournalEntryLine } from '../../../types';
import { Search, BookOpen } from 'lucide-react';
import DatePicker from 'react-datepicker';
import TableActions from '../../../components/admin/TableActions';

export default function GeneralLedger() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [ledgerEntries, setLedgerEntries] = useState<Array<{
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }>>([]);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchLedgerData();
    }
  }, [selectedAccount, dateFrom, dateTo]);

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
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgerData = async () => {
    try {
      // Get journal entry lines for this account
      let query = supabase
        .from('journal_entry_lines')
        .select(`
          *,
          journal_entries!inner(entry_date, description)
        `)
        .eq('account_id', selectedAccount);

      if (dateFrom) {
        query = query.gte('journal_entries.entry_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('journal_entries.entry_date', dateTo);
      }

      const { data, error } = await query.order('journal_entries.entry_date', { ascending: true });
      if (error) throw error;

      // Calculate opening balance (sum of all entries before dateFrom)
      if (dateFrom) {
        const { data: openingData } = await supabase
          .from('journal_entry_lines')
          .select(`
            *,
            journal_entries!inner(entry_date)
          `)
          .eq('account_id', selectedAccount)
          .lt('journal_entries.entry_date', dateFrom);
        
        if (openingData) {
          const opening = openingData.reduce((sum, line) => {
            return sum + (line.debit_amount || 0) - (line.credit_amount || 0);
          }, 0);
          setOpeningBalance(opening);
        }
      } else {
        setOpeningBalance(0);
      }

      // Build ledger entries
      let runningBalance = openingBalance;
      const entries = (data || []).map((line: any) => {
        const debit = line.debit_amount || 0;
        const credit = line.credit_amount || 0;
        runningBalance += debit - credit;
        return {
          date: line.journal_entries.entry_date,
          description: line.journal_entries.description || line.description || '',
          debit,
          credit,
          balance: runningBalance,
        };
      });

      setLedgerEntries(entries);
    } catch (error) {
      console.error('Error fetching ledger data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const selectedAccountData = accounts.find(a => a.id === selectedAccount);
  const closingBalance = ledgerEntries.length > 0 
    ? ledgerEntries[ledgerEntries.length - 1].balance 
    : openingBalance;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account * <span className="text-xs text-gray-500">(Linked to chart of accounts)</span>
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setSelectedAccount('');
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {selectedAccount && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">General Ledger</h3>
                <p className="text-sm text-gray-600">
                  {selectedAccountData?.account_code} - {selectedAccountData?.account_name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Opening Balance</p>
                <p className="text-lg font-semibold">KES {openingBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="bg-blue-50">
                  <td colSpan={2} className="px-6 py-3 text-sm font-semibold">Opening Balance</td>
                  <td className="px-6 py-3 text-sm text-right"></td>
                  <td className="px-6 py-3 text-sm text-right"></td>
                  <td className="px-6 py-3 text-sm text-right font-semibold">KES {openingBalance.toFixed(2)}</td>
                </tr>
                {ledgerEntries.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">{entry.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {entry.debit > 0 ? `KES ${entry.debit.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {entry.credit > 0 ? `KES ${entry.credit.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                      KES {entry.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-green-50 font-semibold">
                  <td colSpan={2} className="px-6 py-3 text-sm">Closing Balance</td>
                  <td className="px-6 py-3 text-sm text-right"></td>
                  <td className="px-6 py-3 text-sm text-right"></td>
                  <td className="px-6 py-3 text-sm text-right">KES {closingBalance.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!selectedAccount && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600">Please select an account to view the general ledger</p>
        </div>
      )}
    </div>
  );
}

