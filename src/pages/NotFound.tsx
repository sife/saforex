import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Home, LineChart, BarChart2, Calendar, 
  Radio, ArrowLeft, AlertTriangle 
} from 'lucide-react';

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    // For now, redirect to home page
    navigate('/');
  };

  const quickLinks = [
    { path: '/', icon: Home, label: 'الرئيسية' },
    { path: '/trading-signals', icon: LineChart, label: 'توصيات التداول' },
    { path: '/market-analysis', icon: BarChart2, label: 'تحليلات السوق' },
    { path: '/economic-calendar', icon: Calendar, label: 'التقويم الاقتصادي' },
    { path: '/live', icon: Radio, label: 'البث المباشر' },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto px-4">
        {/* Main Content */}
        <div className="text-center space-y-6">
          {/* Error Icon */}
          <div className="relative mx-auto w-32 h-32 mb-8">
            <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full animate-[ping_2s_ease-in-out_infinite]"></div>
            <div className="relative flex items-center justify-center w-full h-full bg-blue-50 dark:bg-blue-900/50 rounded-full">
              <AlertTriangle className="w-16 h-16 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              عذراً، الصفحة غير موجودة
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              يبدو أن الصفحة التي تبحث عنها قد تم نقلها أو حذفها أو لم تعد موجودة
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-md mx-auto mt-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في الموقع..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Quick Links */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              روابط سريعة
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {quickLinks.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow group"
                >
                  <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-gray-700 dark:text-gray-200">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>العودة للصفحة السابقة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}