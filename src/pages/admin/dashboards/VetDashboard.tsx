import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import FirstLoginBanner from '../../../components/admin/FirstLoginBanner';

export default function VetDashboard() {
  const [stats, setStats] = useState({
    totalCattle: 0,
    healthRecords: 0,
    pendingTreatments: 0,
    vaccinationsDue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentHealthRecords, setRecentHealthRecords] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch cattle count
      const { data: cattleData } = await supabase
        .from('cattle')
        .select('id', { count: 'exact', head: true });

      // Fetch health records count
      const { data: healthData } = await supabase
        .from('cattle_health')
        .select('*')
        .order('date', { ascending: false })
        .limit(10);

      setStats({
        totalCattle: cattleData?.length || 0,
        healthRecords: healthData?.length || 0,
        pendingTreatments: 0, // Can be calculated based on treatment_type
        vaccinationsDue: 0, // Can be calculated based on last vaccination date
      });

      setRecentHealthRecords(healthData || []);
    } catch (error) {
      console.error('Error fetching vet dashboard data:', error);
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
        <h1 className="text-3xl font-bold text-gray-900">Veterinary Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor cattle health and manage treatments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Cattle"
          value={stats.totalCattle}
          icon={Activity}
          color="blue"
          link="/admin/cattle"
        />
        <StatCard
          title="Health Records"
          value={stats.healthRecords}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Pending Treatments"
          value={stats.pendingTreatments}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Vaccinations Due"
          value={stats.vaccinationsDue}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Recent Health Records */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Health Records</h2>
          <Link
            to="/admin/cattle"
            className="text-[#5a8a3d] hover:text-[#4a7a2d] text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        {recentHealthRecords.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No health records found</p>
        ) : (
          <div className="space-y-3">
            {recentHealthRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{record.treatment_type}</p>
                  <p className="text-sm text-gray-600">{record.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(record.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  {record.cost && (
                    <p className="text-sm font-semibold text-gray-900">
                      KES {record.cost.toLocaleString()}
                    </p>
                  )}
                </div>
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
            to="/admin/cattle"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#5a8a3d] hover:bg-green-50 transition-all"
          >
            <h3 className="font-semibold text-gray-900 mb-2">View Cattle</h3>
            <p className="text-sm text-gray-600">Browse and manage cattle records</p>
          </Link>
          <Link
            to="/admin/reports"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#5a8a3d] hover:bg-green-50 transition-all"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Health Reports</h3>
            <p className="text-sm text-gray-600">View health analytics and reports</p>
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
    red: 'bg-red-100 text-red-600',
  };

  const content = (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-2xl font-bold mt-2 ${colorClasses[color as keyof typeof colorClasses]}`}>
            {value}
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

