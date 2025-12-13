import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { DollarSign, TrendingUp, TrendingDown, Users, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import FirstLoginBanner from '../../../components/admin/FirstLoginBanner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function AccountantDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalSalaries: 0,
    totalWages: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      const now = new Date();
      const startDate = new Date();
      if (dateRange === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (dateRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      // Fetch revenue
      const { data: revenueData } = await supabase
        .from('revenue')
        .select('amount, date')
        .gte('date', startDate.toISOString().split('T')[0]);

      // Fetch expenses
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('amount, date, category')
        .gte('date', startDate.toISOString().split('T')[0]);

      // Fetch salaries
      const { data: salaryData } = await supabase
        .from('staff')
        .select('monthly_salary')
        .eq('is_active', true);

      // Fetch casual wages
      const { data: wageData } = await supabase
        .from('casual_wages')
        .select('total')
        .gte('date', startDate.toISOString().split('T')[0]);

      const totalRevenue = revenueData?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
      const totalExpenses = expenseData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const totalSalaries = salaryData?.reduce((sum, s) => sum + (s.monthly_salary || 0), 0) || 0;
      const totalWages = wageData?.reduce((sum, w) => sum + (w.total || 0), 0) || 0;

      setStats({
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses - totalSalaries - totalWages,
        totalSalaries,
        totalWages,
      });

      // Prepare chart data
      const chartDataMap = new Map<string, { revenue: number; expenses: number }>();
      
      revenueData?.forEach((r) => {
        const date = r.date.split('T')[0];
        const existing = chartDataMap.get(date) || { revenue: 0, expenses: 0 };
        existing.revenue += r.amount || 0;
        chartDataMap.set(date, existing);
      });

      expenseData?.forEach((e) => {
        const date = e.date.split('T')[0];
        const existing = chartDataMap.get(date) || { revenue: 0, expenses: 0 };
        existing.expenses += e.amount || 0;
        chartDataMap.set(date, existing);
      });

      const chartDataArray = Array.from(chartDataMap.entries())
        .map(([date, values]) => ({
          date,
          revenue: values.revenue,
          expenses: values.expenses,
          profit: values.revenue - values.expenses,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setChartData(chartDataArray);
    } catch (error) {
      console.error('Error fetching accountant dashboard data:', error);
    } finally {
      setLoading(false);
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
      <FirstLoginBanner />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage finances, expenses, and revenue</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === range
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          icon={TrendingUp}
          color="green"
          link="/admin/finance"
        />
        <StatCard
          title="Total Expenses"
          value={stats.totalExpenses}
          icon={TrendingDown}
          color="red"
          link="/admin/finance"
        />
        <StatCard
          title="Net Profit"
          value={stats.netProfit}
          icon={DollarSign}
          color={stats.netProfit >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Salaries"
          value={stats.totalSalaries}
          icon={Users}
          color="purple"
          link="/admin/staff"
        />
        <StatCard
          title="Casual Wages"
          value={stats.totalWages}
          icon={Users}
          color="orange"
          link="/admin/finance"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Revenue vs Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Profit Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="profit" fill="#3b82f6" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/finance"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#5a8a3d] hover:bg-green-50 transition-all"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Manage Finance</h3>
            <p className="text-sm text-gray-600">Record expenses and revenue</p>
          </Link>
          <Link
            to="/admin/staff"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#5a8a3d] hover:bg-green-50 transition-all"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Staff & Salaries</h3>
            <p className="text-sm text-gray-600">Manage staff and salary records</p>
          </Link>
          <Link
            to="/admin/reports"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#5a8a3d] hover:bg-green-50 transition-all"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Financial Reports</h3>
            <p className="text-sm text-gray-600">View and export financial reports</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  link,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  link?: string;
}) {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  const formatValue = (val: number) => {
    if (val >= 1000000) return `KES ${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `KES ${(val / 1000).toFixed(2)}K`;
    return `KES ${val.toFixed(2)}`;
  };

  const content = (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-2xl font-bold mt-2 ${colorClasses[color as keyof typeof colorClasses]}`}>
            {formatValue(value)}
          </p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
}

