import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DashboardStats, ChartData } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Users,
  Milk,
  Egg,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import VetDashboard from './dashboards/VetDashboard';
import StorekeeperDashboard from './dashboards/StorekeeperDashboard';
import AccountantDashboard from './dashboards/AccountantDashboard';
import FieldStaffDashboard from './dashboards/FieldStaffDashboard';
import FirstLoginBanner from '../../components/admin/FirstLoginBanner';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { user } = useAuth();

  // Show role-specific dashboard
  if (user?.role === 'Vet') {
    return <VetDashboard />;
  }

  if (user?.role === 'Storekeeper') {
    return <StorekeeperDashboard />;
  }

  if (user?.role === 'Accountant') {
    return <AccountantDashboard />;
  }

  if (user?.role === 'Field Staff') {
    return <FieldStaffDashboard />;
  }

  // Default dashboard for Super Admin and Branch Manager
  const [stats, setStats] = useState<DashboardStats>({
    total_revenue: 0,
    total_expenses: 0,
    total_salaries: 0,
    total_casual_wages: 0,
    net_profit: 0,
    milk_production: 0,
    egg_collection: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [farmContributions, setFarmContributions] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
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
        .select('amount, date, farm_id')
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

      // Fetch milk production
      const { data: milkData } = await supabase
        .from('milking_records')
        .select('milk_yield')
        .gte('date', startDate.toISOString().split('T')[0]);

      // Fetch egg collection
      const { data: eggData } = await supabase
        .from('egg_collections')
        .select('number_of_eggs')
        .gte('date', startDate.toISOString().split('T')[0]);

      // Calculate stats
      const totalRevenue = revenueData?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
      const totalExpenses = expenseData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const totalSalaries = salaryData?.reduce((sum, s) => sum + (s.monthly_salary || 0), 0) || 0;
      const totalWages = wageData?.reduce((sum, w) => sum + (w.total || 0), 0) || 0;
      const totalMilk = milkData?.reduce((sum, m) => sum + (m.milk_yield || 0), 0) || 0;
      const totalEggs = eggData?.reduce((sum, e) => sum + (e.number_of_eggs || 0), 0) || 0;

      setStats({
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        total_salaries: totalSalaries,
        total_casual_wages: totalWages,
        net_profit: totalRevenue - totalExpenses - totalSalaries - totalWages,
        milk_production: totalMilk,
        egg_collection: totalEggs,
      });

      // Prepare chart data (simplified - group by date)
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

      // Farm contributions (simplified)
      const farmMap = new Map<string, number>();
      revenueData?.forEach((r) => {
        const farmId = r.farm_id || 'unknown';
        farmMap.set(farmId, (farmMap.get(farmId) || 0) + (r.amount || 0));
      });

      // Fetch farm names
      const { data: farms } = await supabase.from('farms').select('id, name');
      const contributions = Array.from(farmMap.entries()).map(([farmId, value]) => {
        const farm = farms?.find((f) => f.id === farmId);
        return { name: farm?.name || 'Unknown', value };
      });

      setFarmContributions(contributions);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={stats.total_revenue}
          icon={DollarSign}
          trend="up"
          color="green"
        />
        <StatCard
          title="Total Expenses"
          value={stats.total_expenses}
          icon={TrendingDown}
          trend="down"
          color="red"
        />
        <StatCard
          title="Net Profit"
          value={stats.net_profit}
          icon={TrendingUp}
          trend={stats.net_profit >= 0 ? 'up' : 'down'}
          color={stats.net_profit >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Milk Production (L)"
          value={stats.milk_production}
          icon={Milk}
          trend="up"
          color="blue"
        />
        <StatCard
          title="Egg Collection"
          value={stats.egg_collection}
          icon={Egg}
          trend="up"
          color="orange"
        />
        <StatCard
          title="Salaries"
          value={stats.total_salaries}
          icon={Users}
          trend="neutral"
          color="purple"
        />
        <StatCard
          title="Casual Wages"
          value={stats.total_casual_wages}
          icon={Users}
          trend="neutral"
          color="purple"
        />
        <StatCard
          title="Labor Costs"
          value={stats.total_salaries + stats.total_casual_wages}
          icon={Users}
          trend="neutral"
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
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

        {/* Profit Trend */}
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

        {/* Farm Contributions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Farm Contributions</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={farmContributions}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {farmContributions.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Expense Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis />
              <YAxis />
              <Tooltip />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  trend: 'up' | 'down' | 'neutral';
  color: string;
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

  return (
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
}

