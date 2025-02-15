import React from 'react';
import { ExternalLink, Play } from 'lucide-react';

interface LinkPreviewProps {
  url: string;
  type: 'link' | 'video';
  title?: string;
}

export default function LinkPreview({ url, type, title }: LinkPreviewProps) {
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const isVimeo = url.includes('vimeo.com');

  const getVideoId = () => {
    if (isYouTube) {
      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      return match?.[1] || '';
    }
    if (isVimeo) {
      const match = url.match(/vimeo\.com\/(?:.*\/)?([0-9]+)/);
      return match?.[1] || '';
    }
    return '';
  };

  const getEmbedUrl = () => {
    if (isYouTube) {
      return `https://www.youtube.com/embed/${getVideoId()}`;
    }
    if (isVimeo) {
      return `https://player.vimeo.com/video/${getVideoId()}`;
    }
    return url;
  };

  const getThumbnailUrl = () => {
    if (isYouTube) {
      return `https://img.youtube.com/vi/${getVideoId()}/maxresdefault.jpg`;
    }
    return null;
  };

  if (type === 'video') {
    return (
      <div className="relative aspect-video bg-gray-900 dark:bg-gray-800 rounded-lg overflow-hidden">
        <iframe
          src={getEmbedUrl()}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          title={title || 'Video preview'}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {title || url}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {new URL(url).hostname}
          </p>
        </div>
      </div>
    </a>
  );
}