import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveStreams } from '../hooks/useLiveStreams';
import { ArrowLeft, Eye, Calendar, MessageCircle } from 'lucide-react';

export default function LiveStreamView() {
  const { id } = useParams<{ id: string }>();
  const { getStream, loading, error } = useLiveStreams();
  const [stream, setStream] = useState<any>(null);

  useEffect(() => {
    if (id) {
      const loadStream = async () => {
        const streamData = await getStream(id);
        if (streamData) {
          setStream(streamData);
        }
      };
      loadStream();
    }
  }, [id, getStream]);

  const getEmbedUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      
      // YouTube
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        const videoId = url.includes('v=') 
          ? new URLSearchParams(urlObj.search).get('v')
          : urlObj.pathname.split('/').pop();
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
      
      // Twitch
      if (urlObj.hostname.includes('twitch.tv')) {
        const channel = urlObj.pathname.split('/').pop();
        return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`;
      }
      
      // Facebook
      if (urlObj.hostname.includes('facebook.com')) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&autoplay=1`;
      }

      // Return original URL if no matching platform
      return url;
    } catch (error) {
      console.error('Error parsing URL:', error);
      return url;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">البث غير متوفر</h2>
          <Link
            to="/live"
            className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة إلى البث المباشر
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Link
        to="/live"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4 ml-2" />
        العودة إلى البث المباشر
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative bg-black aspect-video">
              <iframe
                src={getEmbedUrl(stream.url)}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">{stream.title}</h1>
                {stream.is_live && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium animate-pulse">
                    مباشر
                  </span>
                )}
              </div>

              {stream.description && (
                <p className="text-gray-600 mb-4">{stream.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500">
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
        </div>

        {/* Chat Coming Soon Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              الدردشة المباشرة
            </h2>
          </div>

          <div className="p-8 text-center">
            <MessageCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">قريباً!</h3>
            <p className="text-gray-600">
              سيتم إضافة ميزة الدردشة المباشرة قريباً لتتمكن من التفاعل مع المشاهدين الآخرين أثناء البث.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}