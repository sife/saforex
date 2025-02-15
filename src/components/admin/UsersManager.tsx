import React, { useEffect, useState } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { 
  Search, Filter, Ban, CheckCircle, Trash2, User,
  AlertTriangle
} from 'lucide-react';

export default function UsersManager() {
  const { users, loading, error, loadUsers, toggleBan, deleteUser } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all');

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleBan = async (userId: string, currentStatus: boolean) => {
    if (window.confirm(currentStatus 
      ? 'هل أنت متأكد من إلغاء حظر هذا المستخدم؟' 
      : 'هل أنت متأكد من حظر هذا المستخدم؟'
    )) {
      await toggleBan(userId, !currentStatus);
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      await deleteUser(userId);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'banned' && user.is_banned) ||
                         (statusFilter === 'active' && !user.is_banned);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
          <AlertTriangle className="w-5 h-5" />
          <p>حدث خطأ أثناء تحميل المستخدمين. الرجاء المحاولة مرة أخرى.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="بحث عن مستخدم..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <select
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'banned')}
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="banned">محظور</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-300">المستخدم</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-300">البريد الإلكتروني</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-300">تاريخ التسجيل</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-300">آخر دخول</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-300">الحالة</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-300">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.full_name || 'مستخدم مجهول'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{user.email}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleDateString('ar-SA')
                      : 'لم يسجل دخول'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_banned
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                    }`}>
                      {user.is_banned ? 'محظور' : 'نشط'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleBan(user.id, user.is_banned)}
                        className={`p-1 rounded-lg transition-colors ${
                          user.is_banned
                            ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
                            : 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300'
                        }`}
                        title={user.is_banned ? 'إلغاء الحظر' : 'حظر'}
                      >
                        {user.is_banned ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Ban className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}