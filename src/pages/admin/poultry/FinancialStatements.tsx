import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { ChartOfAccount, JournalEntryLine } from '../../../types';
import { FileText, Download } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FinancialStatements() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [journalLines, setJournalLines] = useState<JournalEntryLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatement, setActiveStatement] = useState<'income' | 'balance' | 'cashflow'>('income');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchJournalLines();
    }
  }, [dateFrom, dateTo]);

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

  const fetchJournalLines = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entry_lines')
        .select(`
          *,
          journal_entries!inner(entry_date)
        `)
        .gte('journal_entries.entry_date', dateFrom)
        .lte('journal_entries.entry_date', dateTo);
      if (error) throw error;
      setJournalLines(data || []);
    } catch (error) {
      console.error('Error fetching journal lines:', error);
    }
  };

  const getAccountBalance = (accountId: string, accountType: string): number => {
    const lines = journalLines.filter(l => l.account_id === accountId);
    const balance = lines.reduce((sum, line) => {
      if (accountType === 'Asset' || accountType === 'Expense') {
        return sum + (line.debit_amount || 0) - (line.credit_amount || 0);
      } else {
        return sum + (line.credit_amount || 0) - (line.debit_amount || 0);
      }
    }, 0);
    return balance;
  };

  const generateIncomeStatement = () => {
    const revenueAccounts = accounts.filter(a => a.account_type === 'Revenue');
    const expenseAccounts = accounts.filter(a => a.account_type === 'Expense');
    
    const revenues = revenueAccounts.map(acc => ({
      account: acc.account_name,
      amount: getAccountBalance(acc.id, 'Revenue'),
    })).filter(r => r.amount !== 0);

    const expenses = expenseAccounts.map(acc => ({
      account: acc.account_name,
      amount: getAccountBalance(acc.id, 'Expense'),
    })).filter(e => e.amount !== 0);

    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    return { revenues, expenses, totalRevenue, totalExpenses, netIncome };
  };

  const generateBalanceSheet = () => {
    const assetAccounts = accounts.filter(a => a.account_type === 'Asset');
    const liabilityAccounts = accounts.filter(a => a.account_type === 'Liability');
    const equityAccounts = accounts.filter(a => a.account_type === 'Equity');

    const assets = assetAccounts.map(acc => ({
      account: acc.account_name,
      amount: getAccountBalance(acc.id, 'Asset'),
    })).filter(a => a.amount !== 0);

    const liabilities = liabilityAccounts.map(acc => ({
      account: acc.account_name,
      amount: getAccountBalance(acc.id, 'Liability'),
    })).filter(l => l.amount !== 0);

    const equity = equityAccounts.map(acc => ({
      account: acc.account_name,
      amount: getAccountBalance(acc.id, 'Equity'),
    })).filter(e => e.amount !== 0);

    const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
    const totalEquity = equity.reduce((sum, e) => sum + e.amount, 0);
    const { netIncome } = generateIncomeStatement();
    const totalEquityWithIncome = totalEquity + netIncome;
    const balance = totalAssets - (totalLiabilities + totalEquityWithIncome);

    return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity: totalEquityWithIncome, balance };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const incomeStatement = generateIncomeStatement();
  const balanceSheet = generateBalanceSheet();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveStatement('income')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeStatement === 'income'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Income Statement
          </button>
          <button
            onClick={() => setActiveStatement('balance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeStatement === 'balance'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Balance Sheet
          </button>
          <button
            onClick={() => setActiveStatement('cashflow')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeStatement === 'cashflow'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cash Flow
          </button>
        </nav>
      </div>

      {activeStatement === 'income' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Income Statement (P&L)</h3>
            <p className="text-sm text-gray-600">
              {dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'Select date range'}
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Revenue</h4>
                <div className="space-y-1">
                  {incomeStatement.revenues.map((rev, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-sm">{rev.account}</span>
                      <span className="text-sm font-medium">KES {rev.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total Revenue</span>
                    <span>KES {incomeStatement.totalRevenue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Expenses</h4>
                <div className="space-y-1">
                  {incomeStatement.expenses.map((exp, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-sm">{exp.account}</span>
                      <span className="text-sm font-medium">KES {exp.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total Expenses</span>
                    <span>KES {incomeStatement.totalExpenses.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="border-t-2 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Net Income / (Loss)</span>
                  <span className={incomeStatement.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                    KES {incomeStatement.netIncome.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeStatement === 'balance' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Balance Sheet</h3>
            <p className="text-sm text-gray-600">
              {dateFrom && dateTo ? `As of ${dateTo}` : 'Select date range'}
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold mb-2">Assets</h4>
                <div className="space-y-1">
                  {balanceSheet.assets.map((asset, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-sm">{asset.account}</span>
                      <span className="text-sm font-medium">KES {asset.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total Assets</span>
                    <span>KES {balanceSheet.totalAssets.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Liabilities & Equity</h4>
                <div className="space-y-1">
                  <div className="font-medium text-sm mb-2">Liabilities</div>
                  {balanceSheet.liabilities.map((liab, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-sm">{liab.account}</span>
                      <span className="text-sm font-medium">KES {liab.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total Liabilities</span>
                    <span>KES {balanceSheet.totalLiabilities.toFixed(2)}</span>
                  </div>
                  <div className="font-medium text-sm mt-4 mb-2">Equity</div>
                  {balanceSheet.equity.map((eq, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-sm">{eq.account}</span>
                      <span className="text-sm font-medium">KES {eq.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total Equity</span>
                    <span>KES {balanceSheet.totalEquity.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t-2 pt-4 mt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Liabilities + Equity</span>
                <span>KES {(balanceSheet.totalLiabilities + balanceSheet.totalEquity).toFixed(2)}</span>
              </div>
              <div className={`text-sm mt-2 ${Math.abs(balanceSheet.balance) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(balanceSheet.balance) < 0.01 
                  ? '✓ Balanced (Assets = Liabilities + Equity)' 
                  : `⚠ Unbalanced: Difference of KES ${Math.abs(balanceSheet.balance).toFixed(2)}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeStatement === 'cashflow' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Cash Flow Statement</h3>
            <p className="text-sm text-gray-600 mt-1">
              {dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'Select date range'}
            </p>
          </div>
          <div className="p-6">
            <p className="text-gray-600">Cash flow statement calculation based on journal entries (Operating, Investing, Financing activities)</p>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Operating Activities</h4>
                <p className="text-sm text-gray-600">Cash flows from operations</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Investing Activities</h4>
                <p className="text-sm text-gray-600">Cash flows from asset transactions</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Financing Activities</h4>
                <p className="text-sm text-gray-600">Cash flows from financing</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

