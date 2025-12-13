import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Package, AlertTriangle, TrendingDown, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import FirstLoginBanner from '../../../components/admin/FirstLoginBanner';

export default function StorekeeperDashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    recentMovements: 0,
    totalValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch inventory items
      const { data: inventoryData } = await supabase
        .from('inventory_items')
        .select('*');

      // Fetch low stock items
      const lowStock = inventoryData?.filter(
        (item) => item.quantity <= item.min_stock_level
      ) || [];

      // Fetch recent stock movements
      const { data: movementsData } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const totalValue = inventoryData?.reduce(
        (sum, item) => sum + (item.quantity * (item.unit_price || 0)),
        0
      ) || 0;

      setStats({
        totalItems: inventoryData?.length || 0,
        lowStockItems: lowStock.length,
        recentMovements: movementsData?.length || 0,
        totalValue,
      });

      setLowStockItems(lowStock);
      setRecentMovements(movementsData || []);
    } catch (error) {
      console.error('Error fetching storekeeper dashboard data:', error);
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage inventory and stock movements</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Items"
          value={stats.totalItems}
          icon={Package}
          color="blue"
          link="/admin/inventory"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Recent Movements"
          value={stats.recentMovements}
          icon={TrendingDown}
          color="orange"
        />
        <StatCard
          title="Total Inventory Value"
          value={stats.totalValue}
          icon={CheckCircle}
          color="green"
          isCurrency
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-600" size={24} />
            <h2 className="text-xl font-semibold text-red-900">Low Stock Alert</h2>
          </div>
          <div className="space-y-2">
            {lowStockItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    Stock: {item.quantity} {item.unit} (Min: {item.min_stock_level} {item.unit})
                  </p>
                </div>
                <span className="text-red-600 font-semibold">Low</span>
              </div>
            ))}
          </div>
          <Link
            to="/admin/inventory"
            className="mt-4 inline-block text-red-600 hover:text-red-700 font-medium text-sm"
          >
            View All Low Stock Items →
          </Link>
        </div>
      )}

      {/* Recent Stock Movements */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Stock Movements</h2>
          <Link
            to="/admin/inventory"
            className="text-[#5a8a3d] hover:text-[#4a7a2d] text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        {recentMovements.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent movements</p>
        ) : (
          <div className="space-y-3">
            {recentMovements.map((movement) => (
              <div
                key={movement.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {movement.movement_type} - {movement.quantity} units
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(movement.date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    movement.movement_type === 'In'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {movement.movement_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/admin/inventory"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#5a8a3d] hover:bg-green-50 transition-all"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Manage Inventory</h3>
            <p className="text-sm text-gray-600">Add, update, or view inventory items</p>
          </Link>
          <Link
            to="/admin/reports"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#5a8a3d] hover:bg-green-50 transition-all"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Inventory Reports</h3>
            <p className="text-sm text-gray-600">View inventory analytics and reports</p>
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
  isCurrency = false,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  link?: string;
  isCurrency?: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
  };

  const formatValue = (val: number) => {
    if (isCurrency) {
      if (val >= 1000000) return `KES ${(val / 1000000).toFixed(2)}M`;
      if (val >= 1000) return `KES ${(val / 1000).toFixed(2)}K`;
      return `KES ${val.toFixed(2)}`;
    }
    return val.toLocaleString();
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

