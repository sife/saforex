import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, LineChart, BarChart2, Radio, User as UserIcon, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

export default function MobileNav() {
  const location = useLocation();
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: Home, label: t('home.home') },
    { path: '/trading-signals', icon: LineChart, label: t('home.tradingSignals') },
    { path: '/market-analysis', icon: BarChart2, label: t('home.marketAnalysis') },
    { path: '/live', icon: Radio, label: 'البث المباشر' },
    ...(user ? [{ path: '/profile', icon: UserIcon, label: 'الملف الشخصي' }] : []),
    ...(isAdmin ? [{ path: '/admin', icon: Settings, label: 'لوحة التحكم' }] : [])
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/10 md:hidden z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center flex-1 py-2 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                isActive(path)
                  ? 'text-blue-600 dark:text-blue-400 scale-105 font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-colors duration-200 ${
                isActive(path) ? 'bg-blue-50 dark:bg-blue-900/30' : ''
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-xs mt-1">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}