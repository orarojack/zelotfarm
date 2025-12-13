import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Milk, Egg, Calendar, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import FirstLoginBanner from '../../../components/admin/FirstLoginBanner';

export default function FieldStaffDashboard() {
  const [stats, setStats] = useState({
    todayMilk: 0,
    todayEggs: 0,
    thisWeekMilk: 0,
    thisWeekEggs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      // Fetch today's milk production
      const { data: todayMilkData } = await supabase
        .from('milking_records')
        .select('milk_yield')
        .eq('date', today);

      // Fetch this week's milk production
      const { data: weekMilkData } = await supabase
        .from('milking_records')
        .select('milk_yield')
        .gte('date', weekAgoStr);

      // Fetch today's egg collection
      const { data: todayEggData } = await supabase
        .from('egg_collections')
        .select('number_of_eggs')
        .eq('date', today);

      // Fetch this week's egg collection
      const { data: weekEggData } = await supabase
        .from('egg_collections')
        .select('number_of_eggs')
        .gte('date', weekAgoStr);

      const todayMilk = todayMilkData?.reduce((sum, m) => sum + (m.milk_yield || 0), 0) || 0;
      const weekMilk = weekMilkData?.reduce((sum, m) => sum + (m.milk_yield || 0), 0) || 0;
      const todayEggs = todayEggData?.reduce((sum, e) => sum + (e.number_of_eggs || 0), 0) || 0;
      const weekEggs = weekEggData?.reduce((sum, e) => sum + (e.number_of_eggs || 0), 0) || 0;

      setStats({
        todayMilk,
        todayEggs,
        thisWeekMilk: weekMilk,
        thisWeekEggs: weekEggs,
      });

      // Prepare today's tasks
      const tasks = [];
      if (todayMilkData && todayMilkData.length > 0) {
        tasks.push({ type: 'Milking', count: todayMilkData.length, link: '/admin/milking' });
      }
      if (todayEggData && todayEggData.length > 0) {
        tasks.push({ type: 'Egg Collection', count: todayEggData.length, link: '/admin/poultry' });
      }
      setTodayTasks(tasks);
    } catch (error) {
      console.error('Error fetching field staff dashboard data:', error);
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
        <h1 className="text-3xl font-bold text-gray-900">Field Operations Dashboard</h1>
        <p className="text-gray-600 mt-2">Record daily operations and track production</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Milk (Liters)"
          value={stats.todayMilk}
          icon={Milk}
          color="blue"
          link="/admin/milking"
        />
        <StatCard
          title="Today's Eggs"
          value={stats.todayEggs}
          icon={Egg}
          color="orange"
          link="/admin/poultry"
        />
        <StatCard
          title="This Week Milk (Liters)"
          value={stats.thisWeekMilk}
          icon={Milk}
          color="green"
        />
        <StatCard
          title="This Week Eggs"
          value={stats.thisWeekEggs}
          icon={Egg}
          color="purple"
        />
      </div>

      {/* Today's Tasks */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="text-[#5a8a3d]" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Today's Activities</h2>
        </div>
        {todayTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No activities recorded for today</p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/admin/milking"
                className="px-4 py-2 bg-[#5a8a3d] text-white rounded-lg hover:bg-[#4a7a2d] transition-colors"
              >
                Record Milking
              </Link>
              <Link
                to="/admin/poultry"
                className="px-4 py-2 bg-[#dc7f35] text-white rounded-lg hover:bg-[#c56d2a] transition-colors"
              >
                Record Egg Collection
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTasks.map((task, index) => (
              <Link
                key={index}
                to={task.link}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">{task.type}</p>
                    <p className="text-sm text-gray-600">{task.count} record(s) today</p>
                  </div>
                </div>
                <span className="text-[#5a8a3d] font-medium">View →</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/admin/milking"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#5a8a3d] hover:bg-green-50 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <Milk className="text-blue-600" size={24} />
              <h3 className="font-semibold text-gray-900">Record Milking</h3>
            </div>
            <p className="text-sm text-gray-600">Add new milking records</p>
          </Link>
          <Link
            to="/admin/poultry"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#5a8a3d] hover:bg-green-50 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <Egg className="text-orange-600" size={24} />
              <h3 className="font-semibold text-gray-900">Record Egg Collection</h3>
            </div>
            <p className="text-sm text-gray-600">Add new egg collection records</p>
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
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  const content = (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-2xl font-bold mt-2 ${colorClasses[color as keyof typeof colorClasses]}`}>
            {value.toLocaleString()}
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

