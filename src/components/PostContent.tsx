import React from 'react';
import LinkPreview from './LinkPreview';

interface PostContentProps {
  content: string;
  type: 'text' | 'image' | 'video' | 'link';
  mediaUrl?: string;
  title?: string;
}

export default function PostContent({ content, type, mediaUrl, title }: PostContentProps) {
  const renderMedia = () => {
    if (!mediaUrl) return null;

    switch (type) {
      case 'image':
        return (
          <img
            src={mediaUrl}
            alt={title || 'Post image'}
            className="w-full rounded-lg object-cover max-h-96"
            loading="lazy"
          />
        );
      case 'video':
        return <LinkPreview url={mediaUrl} type="video" title={title} />;
      case 'link':
        return <LinkPreview url={mediaUrl} type="link" title={title} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
        {content}
      </p>
      {renderMedia()}
    </div>
  );
}