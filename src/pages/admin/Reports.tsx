import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Farm } from '../../types';
import { Download, FileText, ChevronDown } from 'lucide-react';
import DatePicker from 'react-datepicker';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type ReportType = 
  | 'comprehensive'
  | 'financial_summary'
  | 'revenue'
  | 'expenses'
  | 'profit_loss'
  | 'milk_production'
  | 'egg_collection'
  | 'broiler_production'
  | 'cattle_inventory'
  | 'cattle_breeding'
  | 'inventory_stock'
  | 'inventory_movements'
  | 'low_stock_alerts'
  | 'staff_wages'
  | 'ecommerce_orders'
  | 'ecommerce_sales'
  | 'farm_performance'
  | 'production_summary';

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  { value: 'comprehensive', label: 'Comprehensive Report', description: 'All data including revenue, expenses, production, and inventory' },
  { value: 'financial_summary', label: 'Financial Summary', description: 'Overview of revenue, expenses, and profit' },
  { value: 'revenue', label: 'Revenue Report', description: 'Detailed revenue by type and payment method' },
  { value: 'expenses', label: 'Expenses Report', description: 'Detailed expenses by category and payment method' },
  { value: 'profit_loss', label: 'Profit & Loss Statement', description: 'Complete P&L statement with breakdowns' },
  { value: 'milk_production', label: 'Milk Production Report', description: 'Daily milk yields by farm and session' },
  { value: 'egg_collection', label: 'Egg Collection Report', description: 'Daily egg collections by farm' },
  { value: 'broiler_production', label: 'Broiler Production Report', description: 'Broiler batch performance and harvest data' },
  { value: 'cattle_inventory', label: 'Cattle Inventory Report', description: 'Complete cattle inventory by farm and status' },
  { value: 'cattle_breeding', label: 'Cattle Breeding Report', description: 'Breeding records and lineage information' },
  { value: 'inventory_stock', label: 'Inventory Stock Report', description: 'Current stock levels by category' },
  { value: 'inventory_movements', label: 'Inventory Movements Report', description: 'Stock movements (in/out/transfer)' },
  { value: 'low_stock_alerts', label: 'Low Stock Alerts', description: 'Items below minimum stock levels' },
  { value: 'staff_wages', label: 'Staff Wages Report', description: 'Casual wages and staff payments' },
  { value: 'ecommerce_orders', label: 'E-commerce Orders Report', description: 'Customer orders and order status' },
  { value: 'ecommerce_sales', label: 'E-commerce Sales Report', description: 'Sales revenue from online orders' },
  { value: 'farm_performance', label: 'Farm Performance Report', description: 'Overall performance metrics by farm' },
  { value: 'production_summary', label: 'Production Summary', description: 'Summary of all production activities' },
];

export default function Reports() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('comprehensive');
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    const { data } = await supabase.from('farms').select('*');
    setFarms(data || []);
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      // Fetch all data
      let expenseQuery = supabase
        .from('expenses')
        .select('*')
        .gte('date', start)
        .lte('date', end);

      let revenueQuery = supabase
        .from('revenue')
        .select('*')
        .gte('date', start)
        .lte('date', end);

      let milkingQuery = supabase
        .from('milking_records')
        .select('*')
        .gte('date', start)
        .lte('date', end);

      let eggQuery = supabase
        .from('egg_collections')
        .select('*')
        .gte('date', start)
        .lte('date', end);

      if (selectedFarm !== 'all') {
        expenseQuery = expenseQuery.eq('farm_id', selectedFarm);
        revenueQuery = revenueQuery.eq('farm_id', selectedFarm);
        milkingQuery = milkingQuery.eq('farm_id', selectedFarm);
        eggQuery = eggQuery.eq('farm_id', selectedFarm);
      }

      const [expenses, revenue, milking, eggs] = await Promise.all([
        expenseQuery,
        revenueQuery,
        milkingQuery,
        eggQuery,
      ]);

      const totalExpenses = expenses.data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const totalRevenue = revenue.data?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
      const totalMilk = milking.data?.reduce((sum, m) => sum + (m.milk_yield || 0), 0) || 0;
      const totalEggs = eggs.data?.reduce((sum, e) => sum + (e.number_of_eggs || 0), 0) || 0;

      setReportData({
        expenses: expenses.data || [],
        revenue: revenue.data || [],
        milking: milking.data || [],
        eggs: eggs.data || [],
        totals: {
          expenses: totalExpenses,
          revenue: totalRevenue,
          profit: totalRevenue - totalExpenses,
          milk: totalMilk,
          eggs: totalEggs,
        },
      });
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const farmName = selectedFarm === 'all' ? 'All Farms' : farms.find((f) => f.id === selectedFarm)?.name || 'All Farms';

    // Title
    const reportTypeLabel = REPORT_TYPES.find(r => r.value === selectedReportType)?.label || 'Farm Report';
    doc.setFontSize(18);
    doc.text(`Zealot AgriWorks - ${reportTypeLabel}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Farm: ${farmName}`, 14, 30);
    doc.text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 14, 36);

    let yPos = 50;

    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 14, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.text(`Total Revenue: KES ${reportData.totals.revenue.toLocaleString()}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Expenses: KES ${reportData.totals.expenses.toLocaleString()}`, 14, yPos);
    yPos += 6;
    doc.text(`Net Profit: KES ${reportData.totals.profit.toLocaleString()}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Milk Production: ${reportData.totals.milk.toFixed(2)} L`, 14, yPos);
    yPos += 6;
    doc.text(`Total Egg Collection: ${reportData.totals.eggs.toLocaleString()}`, 14, yPos);
    yPos += 15;

    // Revenue Table
    if (reportData.revenue.length > 0) {
      doc.setFontSize(12);
      doc.text('Revenue', 14, yPos);
      yPos += 8;

      const revenueTable = reportData.revenue.map((r: any) => [
        new Date(r.date).toLocaleDateString(),
        r.revenue_type,
        `KES ${r.amount.toLocaleString()}`,
        r.payment_method,
      ]);

      (doc as any).autoTable({
        startY: yPos,
        head: [['Date', 'Type', 'Amount', 'Payment Method']],
        body: revenueTable,
        theme: 'striped',
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Expenses Table
    if (reportData.expenses.length > 0) {
      doc.setFontSize(12);
      doc.text('Expenses', 14, yPos);
      yPos += 8;

      const expenseTable = reportData.expenses.map((e: any) => [
        new Date(e.date).toLocaleDateString(),
        e.category,
        e.description,
        `KES ${e.amount.toLocaleString()}`,
        e.payment_method,
      ]);

      (doc as any).autoTable({
        startY: yPos,
        head: [['Date', 'Category', 'Description', 'Amount', 'Payment Method']],
        body: expenseTable,
        theme: 'striped',
      });
    }

    doc.save(`farm-report-${farmName}-${startDate.toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          {reportData && (
            <p className="text-sm text-gray-600 mt-1">
              {REPORT_TYPES.find(r => r.value === selectedReportType)?.label}
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <div className="relative">
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value as ReportType)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 appearance-none bg-white pr-10"
              >
                {REPORT_TYPES.map((report) => (
                  <option key={report.value} value={report.value}>
                    {report.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            {REPORT_TYPES.find(r => r.value === selectedReportType) && (
              <p className="mt-1 text-xs text-gray-500">
                {REPORT_TYPES.find(r => r.value === selectedReportType)?.description}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Farm</label>
            <select
              value={selectedFarm}
              onChange={(e) => setSelectedFarm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Farms</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>{farm.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={(date: Date) => setStartDate(date)}
              dateFormat="yyyy-MM-dd"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={(date: Date) => setEndDate(date)}
              dateFormat="yyyy-MM-dd"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Total Revenue</div>
              <div className="text-2xl font-bold text-green-600">
                KES {reportData.totals.revenue.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Total Expenses</div>
              <div className="text-2xl font-bold text-red-600">
                KES {reportData.totals.expenses.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Net Profit</div>
              <div className={`text-2xl font-bold ${reportData.totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                KES {reportData.totals.profit.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Milk Production</div>
              <div className="text-2xl font-bold text-blue-600">
                {reportData.totals.milk.toFixed(2)} L
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Egg Collection</div>
              <div className="text-2xl font-bold text-orange-600">
                {reportData.totals.eggs.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Download size={20} />
              Export to PDF
            </button>
          </div>

          {/* Revenue Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Revenue</h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.revenue.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{r.revenue_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      KES {r.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Expenses</h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.expenses.map((e: any) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{e.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{e.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      KES {e.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!reportData && (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Select filters and click "Generate Report" to view data</p>
        </div>
      )}
    </div>
  );
}

