import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEconomicCalendar } from '../hooks/useEconomicCalendar';
import { 
  Calendar, Filter, Bell, BellOff, ChevronDown, Globe, 
  TrendingUp, TrendingDown, AlertTriangle, RefreshCw 
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';

type EventFilter = {
  impact: string[];
  countries: string[];
  dateRange: 'today' | 'tomorrow' | 'week' | 'all';
  indicatorTypes: string[];
};

export default function EconomicCalendar() {
  const { t } = useTranslation();
  const { events, loading, refreshEvents } = useEconomicCalendar();
  const [filters, setFilters] = useState<EventFilter>({
    impact: ['high', 'medium', 'low'],
    countries: [],
    dateRange: 'all',
    indicatorTypes: []
  });
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [showFilters, setShowFilters] = useState(false);
  const [notifications, setNotifications] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get unique values for filters
  const countries = [...new Set(events.map(event => event.country))].sort();
  const indicatorTypes = [...new Set(events.map(event => event.indicator_type))].sort();

  const formatEventTime = (time: string) => {
    try {
      return format(parseISO(time), 'PPp', { locale: ar });
    } catch {
      return time;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'medium':
        return <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'low':
        return <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshEvents();
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  const toggleNotification = (eventId: string) => {
    const newNotifications = new Set(notifications);
    if (notifications.has(eventId)) {
      newNotifications.delete(eventId);
    } else {
      newNotifications.add(eventId);
      // Request notification permission if needed
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
    setNotifications(newNotifications);
    localStorage.setItem('eventNotifications', JSON.stringify([...newNotifications]));
  };

  const filterEvents = () => {
    return events.filter(event => {
      // Filter by impact
      if (!filters.impact.includes(event.impact_level)) {
        return false;
      }

      // Filter by country
      if (filters.countries.length > 0 && !filters.countries.includes(event.country)) {
        return false;
      }

      // Filter by indicator type
      if (filters.indicatorTypes.length > 0 && !filters.indicatorTypes.includes(event.indicator_type)) {
        return false;
      }

      // Filter by date range
      const eventDate = parseISO(event.event_time);
      const today = startOfDay(new Date());
      const tomorrow = startOfDay(new Date(today.getTime() + 24 * 60 * 60 * 1000));
      const weekEnd = startOfDay(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000));

      switch (filters.dateRange) {
        case 'today':
          return isAfter(eventDate, startOfDay(today)) && isBefore(eventDate, endOfDay(today));
        case 'tomorrow':
          return isAfter(eventDate, startOfDay(tomorrow)) && isBefore(eventDate, endOfDay(tomorrow));
        case 'week':
          return isAfter(eventDate, startOfDay(today)) && isBefore(eventDate, weekEnd);
        default:
          return true;
      }
    });
  };

  const filteredEvents = filterEvents();

  // Load saved notifications on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('eventNotifications');
    if (savedNotifications) {
      setNotifications(new Set(JSON.parse(savedNotifications)));
    }
  }, []);

  // Set up notification timers
  useEffect(() => {
    const timers = Array.from(notifications).map(eventId => {
      const event = events.find(e => e.id === eventId);
      if (!event) return null;

      const eventTime = parseISO(event.event_time);
      const now = new Date();
      const timeUntilEvent = eventTime.getTime() - now.getTime() - 5 * 60 * 1000; // 5 minutes before

      if (timeUntilEvent > 0) {
        return setTimeout(() => {
          if (Notification.permission === 'granted') {
            new Notification('تذكير بحدث اقتصادي', {
              body: `${event.title} سيبدأ خلال 5 دقائق`,
              icon: '/favicon.ico'
            });
          }
        }, timeUntilEvent);
      }
      return null;
    });

    return () => {
      timers.forEach(timer => timer && clearTimeout(timer));
    };
  }, [notifications, events]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('home.economicCalendar')}
          </h1>
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            disabled={isRefreshing}
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-sm">
              {isRefreshing ? 'جاري التحديث...' : 'تحديث'}
            </span>
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          تابع أهم الأحداث والمؤشرات الاقتصادية العالمية وتأثيرها على الأسواق المالية
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          آخر تحديث: {format(lastRefresh, 'PPp', { locale: ar })}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/10 mb-8">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Filter className="w-5 h-5" />
            <span className="font-semibold">تصفية الأحداث</span>
            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Impact Level Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  مستوى التأثير
                </label>
                <div className="space-y-2">
                  {['high', 'medium', 'low'].map((impact) => (
                    <div key={`impact-${impact}`} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`impact-${impact}`}
                        checked={filters.impact.includes(impact)}
                        onChange={(e) => {
                          setFilters(prev => ({
                            ...prev,
                            impact: e.target.checked
                              ? [...prev.impact, impact]
                              : prev.impact.filter(i => i !== impact)
                          }));
                        }}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400"
                      />
                      <label
                        htmlFor={`impact-${impact}`}
                        className={`text-sm ${getImpactColor(impact)} px-2 py-1 rounded-full`}
                      >
                        {t(`calendar.impact.${impact}`)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Country Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  الدول
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {countries.map((country) => (
                    <div key={`country-${country}`} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`country-${country}`}
                        checked={filters.countries.includes(country)}
                        onChange={(e) => {
                          setFilters(prev => ({
                            ...prev,
                            countries: e.target.checked
                              ? [...prev.countries, country]
                              : prev.countries.filter(c => c !== country)
                          }));
                        }}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400"
                      />
                      <label
                        htmlFor={`country-${country}`}
                        className="text-sm text-gray-700 dark:text-gray-200"
                      >
                        {country}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Indicator Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  نوع المؤشر
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {indicatorTypes.map((type) => (
                    <div key={`type-${type}`} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`type-${type}`}
                        checked={filters.indicatorTypes.includes(type)}
                        onChange={(e) => {
                          setFilters(prev => ({
                            ...prev,
                            indicatorTypes: e.target.checked
                              ? [...prev.indicatorTypes, type]
                              : prev.indicatorTypes.filter(t => t !== type)
                          }));
                        }}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400"
                      />
                      <label
                        htmlFor={`type-${type}`}
                        className="text-sm text-gray-700 dark:text-gray-200"
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Range & Timezone */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    الفترة الزمنية
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as EventFilter['dateRange'] }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">جميع الأحداث</option>
                    <option value="today">اليوم</option>
                    <option value="tomorrow">غداً</option>
                    <option value="week">هذا الأسبوع</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    المنطقة الزمنية
                  </label>
                  <select
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {Intl.supportedValuesOf('timeZone').map((zone) => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">جاري تحميل الأحداث...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-8">
          <Globe className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">لا توجد أحداث تطابق المعايير المحددة</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/10 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 rtl:space-x-reverse">
                  <div className={`p-2 rounded-lg ${getImpactColor(event.impact_level)}`}>
                    {getImpactIcon(event.impact_level)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{event.country}</span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{event.currency}</span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ltr">
                        {formatEventTime(event.event_time)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleNotification(event.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    notifications.has(event.id)
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                  title={notifications.has(event.id) ? 'إلغاء التنبيه' : 'تفعيل التنبيه'}
                >
                  {notifications.has(event.id) ? (
                    <Bell className="w-5 h-5" />
                  ) : (
                    <BellOff className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">القراءة السابقة</p>
                  <p className="font-medium text-gray-900 dark:text-white">{event.previous_value || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">التوقعات</p>
                  <p className="font-medium text-gray-900 dark:text-white">{event.forecast_value || '-'}</p>
                </div>
                {event.actual_value && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">القراءة الفعلية</p>
                    <p className="font-semibold text-blue-600 dark:text-blue-400">{event.actual_value}</p>
                  </div>
                )}
              </div>

              {event.description && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300">{event.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}