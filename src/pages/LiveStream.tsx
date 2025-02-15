import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLiveStreams } from '../hooks/useLiveStreams';
import { Play, Settings, Eye, Calendar, ArrowUpRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

// Validation schema
const streamSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب'),
  url: z.string().url('الرجاء إدخال رابط صحيح'),
  description: z.string().optional(),
  thumbnail_url: z.string().url('الرجاء إدخال رابط صورة صحيح').optional().or(z.literal('')),
});

export default function LiveStream() {
  const { user, isAdmin } = useAuth();
  const { streams, loading, error: streamsError, refreshStreams } = useLiveStreams();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    thumbnail_url: '',
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedStream, setSelectedStream] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    try {
      streamSchema.parse(formData);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); // Clear error when input changes
  };

  const handlePublishStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !user) return;

    try {
      setError(null);
      if (!validateForm()) return;

      setIsPublishing(true);

      // Prepare stream data
      const streamData = {
        ...formData,
        user_id: user.id,
        is_live: true,
        started_at: new Date().toISOString(),
        viewers_count: 0
      };

      const { data, error: publishError } = await supabase
        .from('live_streams')
        .insert(streamData)
        .select()
        .single();

      if (publishError) {
        if (publishError.code === '23505') { // Unique constraint violation
          throw new Error('هذا البث موجود بالفعل');
        }
        throw publishError;
      }

      // Reset form and close panel on success
      setShowAdminPanel(false);
      setFormData({
        title: '',
        url: '',
        description: '',
        thumbnail_url: '',
      });

      // Refresh streams list
      await refreshStreams();
    } catch (err) {
      console.error('Error publishing stream:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء نشر البث. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleStreamClick = (stream: any) => {
    setSelectedStream(stream);
    setShowPreview(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (streamsError) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-800">حدث خطأ أثناء تحميل البث المباشر. الرجاء المحاولة مرة أخرى.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 p-8 mb-8">
        <div className="relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">البث المباشر</h1>
              <p className="text-blue-100">شاهد أحدث التحليلات والتوصيات مباشرة</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <Settings className="w-5 h-5" />
                <span>لوحة التحكم</span>
              </button>
            )}
          </div>
        </div>
        <div className="absolute inset-0 bg-blue-600 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M30%200l15%2030-15%2030L15%2030z%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%2F%3E%3C%2Fsvg%3E')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        </div>
      </div>

      {/* Admin Panel */}
      {showAdminPanel && isAdmin && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 animate-slideDown">
          <h2 className="text-xl font-semibold mb-6">إعدادات البث المباشر</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          <form onSubmit={handlePublishStream} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عنوان البث
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="أدخل عنوان البث"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                وصف البث
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="أدخل وصف البث"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رابط البث
              </label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="أدخل رابط البث (YouTube, Twitch, Facebook Live)"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رابط الصورة المصغرة
              </label>
              <input
                type="url"
                name="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="أدخل رابط الصورة المصغرة"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={isPublishing}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isPublishing ? 'جاري النشر...' : 'نشر البث'}
            </button>
          </form>
        </div>
      )}

      {/* Streams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {streams.map((stream) => (
          <div
            key={stream.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => handleStreamClick(stream)}
          >
            <div className="relative aspect-video">
              {stream.thumbnail_url ? (
                <img
                  src={stream.thumbnail_url}
                  alt={stream.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <Play className="w-12 h-12 text-gray-400" />
                </div>
              )}
              {stream.is_live && (
                <span className="absolute top-2 right-2 px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium animate-pulse">
                  مباشر
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ArrowUpRight className="w-12 h-12 text-white" />
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  {stream.users_profile?.avatar_url ? (
                    <img
                      src={stream.users_profile.avatar_url}
                      alt={stream.users_profile.full_name || ''}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold line-clamp-1">{stream.title}</h3>
                  <p className="text-sm text-gray-500">
                    {stream.users_profile?.full_name || 'مستخدم مجهول'}
                  </p>
                </div>
              </div>
              {stream.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {stream.description}
                </p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {stream.viewers_count || 0} مشاهد
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(stream.started_at).toLocaleDateString('ar-SA')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedStream && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full animate-fadeIn">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  {selectedStream.users_profile?.avatar_url ? (
                    <img
                      src={selectedStream.users_profile.avatar_url}
                      alt={selectedStream.users_profile.full_name || ''}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedStream.title}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedStream.users_profile?.full_name || 'مستخدم مجهول'}
                  </p>
                </div>
              </div>
              {selectedStream.description && (
                <p className="text-gray-600 mb-6">{selectedStream.description}</p>
              )}
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  إغلاق
                </button>
                <Link
                  to={`/live/${selectedStream.id}`}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  مشاهدة البث
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}