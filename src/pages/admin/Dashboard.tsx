import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Users, Signal, Calendar, BarChart2, Settings, Search,
  UserPlus, AlertTriangle, TrendingUp, MessageCircle,
  Shield, Bell, FileText, Activity, Ban, CheckCircle,
  UserX, Filter, ArrowUp, ArrowDown
} from 'lucide-react';
import BannerManager from '../../components/admin/BannerManager';
import UsersManager from '../../components/admin/UsersManager';
import { supabase } from '../../lib/supabase';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  bannedUsers: number;
  usersByStatus: { name: string; value: number }[];
  userGrowth: { date: string; users: number }[];
}

const COLORS = ['#10B981', '#EF4444', '#F59E0B'];

function Dashboard() {
  const { t } = useTranslation();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'overview' | 'users' | 'banners'>('overview');
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    bannedUsers: 0,
    usersByStatus: [],
    userGrowth: []
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      console.log('Redirecting: User not authorized', { user, isAdmin, loading });
      navigate('/');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    const loadUserStats = async () => {
      try {
        setLoadingStats(true);

        // Get total users count
        const { count: totalUsers } = await supabase
          .from('users_profile')
          .select('*', { count: 'exact', head: true });

        // Get active users (logged in within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { count: activeUsers } = await supabase
          .from('users_profile')
          .select('*', { count: 'exact', head: true })
          .gt('last_login', thirtyDaysAgo.toISOString())
          .eq('is_banned', false);

        // Get new users this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const { count: newUsers } = await supabase
          .from('users_profile')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', weekAgo.toISOString());

        // Get banned users count
        const { count: bannedUsers } = await supabase
          .from('users_profile')
          .select('*', { count: 'exact', head: true })
          .eq('is_banned', true);

        // Get user growth over last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const { data: growthData } = await supabase
          .from('users_profile')
          .select('created_at')
          .gte('created_at', sixMonthsAgo.toISOString())
          .order('created_at');

        // Process growth data by month
        const monthlyGrowth = growthData?.reduce((acc: { [key: string]: number }, user) => {
          const month = new Date(user.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short' });
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {});

        const userGrowth = Object.entries(monthlyGrowth || {}).map(([date, users]) => ({
          date,
          users
        }));

        // Calculate user status distribution
        const usersByStatus = [
          { name: 'نشط', value: (totalUsers || 0) - (bannedUsers || 0) },
          { name: 'محظور', value: bannedUsers || 0 }
        ];

        setUserStats({
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          newUsers: newUsers || 0,
          bannedUsers: bannedUsers || 0,
          usersByStatus,
          userGrowth
        });
      } catch (error) {
        console.error('Error loading user stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (isAdmin) {
      loadUserStats();
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const renderOverview = () => (
    <>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Activity className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">المستخدمين النشطين</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.activeUsers}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">خلال 30 يوم</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <UserPlus className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">المستخدمين الجدد</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.newUsers}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">هذا الأسبوع</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Ban className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">المستخدمين المحظورين</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.bannedUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">نمو المستخدمين</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userStats.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  name="عدد المستخدمين"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">توزيع المستخدمين</h2>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userStats.usersByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userStats.usersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">النشاط الأخير</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((_, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b dark:border-gray-700 last:border-0">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">تم إنشاء إشارة جديدة</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">EUR/USD - شراء @ 1.0950</p>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">منذ ساعتين</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('admin.dashboard')}</h1>
        <div className="flex items-center gap-4">
          <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1">
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              نظرة عامة
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'users' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
              onClick={() => setActiveTab('users')}
            >
              المستخدمين
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'banners' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
              onClick={() => setActiveTab('banners')}
            >
              الإعلانات
            </button>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Settings className="w-5 h-5" />
            <span>إعدادات النظام</span>
          </button>
        </div>
      </div>

      {loadingStats && activeTab === 'overview' ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && <UsersManager />}
          {activeTab === 'banners' && <BannerManager />}
        </>
      )}
    </div>
  );
}

export default Dashboard;