import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useContentPosts } from '../hooks/useContentPosts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Link as LinkIcon, Image, Video, Edit2, Trash2, ExternalLink, Upload, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import PostContent from '../components/PostContent';

const postSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب'),
  content: z.string().min(1, 'المحتوى مطلوب'),
  type: z.enum(['text', 'image', 'video', 'link']),
  media_url: z.string().optional(),
});

type PostForm = z.infer<typeof postSchema>;

export default function Home() {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const { posts, loading, createPost, updatePost, deletePost, uploadMedia, hasMore, loadMore } = useContentPosts();
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      type: 'text',
    },
  });

  const postType = watch('type');
  const mediaUrl = watch('media_url');

  // Intersection Observer for infinite scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;

    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });

    if (node) {
      observer.current.observe(node);
    }
  }, [loading, hasMore, loadMore]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const imageUrl = await uploadMedia(file);
      setValue('media_url', imageUrl);
      setPreviewUrl(imageUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = async (data: PostForm) => {
    if (!user || !isAdmin) return;

    try {
      if (editingPost) {
        await updatePost(editingPost.id, {
          ...data,
          status: 'published',
        });
        setEditingPost(null);
      } else {
        await createPost({
          user_id: user.id,
          ...data,
          status: 'published',
        });
      }
      setShowForm(false);
      reset();
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setShowForm(true);
    setValue('title', post.title);
    setValue('content', post.content);
    setValue('type', post.type);
    setValue('media_url', post.media_url);
    setPreviewUrl(post.media_url);
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنشور؟')) return;
    
    try {
      await deletePost(postId);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const truncateText = (text: string, wordLimit: number = 25) => {
    const words = text.split(/\s+/);
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...';
    }
    return text;
  };

  const renderMediaPreview = () => {
    if (!mediaUrl) return null;

    switch (postType) {
      case 'image':
        return (
          <div className="mt-4 relative">
            <img
              src={mediaUrl}
              alt="Preview"
              className="w-full rounded-lg object-cover max-h-96"
            />
            <button
              onClick={() => {
                setValue('media_url', '');
                setPreviewUrl(null);
              }}
              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      case 'video':
        return (
          <div className="mt-4 aspect-video">
            <iframe
              src={mediaUrl}
              className="w-full h-full rounded-lg"
              allowFullScreen
              title="Preview"
            />
          </div>
        );
      case 'link':
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">معاينة الرابط:</p>
            <a
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mt-2"
            >
              <ExternalLink className="w-4 h-4" />
              {mediaUrl}
            </a>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {isAdmin && (
        <div className="mb-8">
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) {
                setEditingPost(null);
                reset();
                setPreviewUrl(null);
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {showForm ? 'إلغاء' : 'منشور جديد'}
          </button>

          {showForm && (
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                {editingPost ? 'تعديل المنشور' : 'منشور جديد'}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    العنوان
                  </label>
                  <input
                    type="text"
                    {...register('title')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    نوع المنشور
                  </label>
                  <select
                    {...register('type')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    onChange={(e) => {
                      setValue('type', e.target.value as any);
                      setValue('media_url', '');
                      setPreviewUrl(null);
                    }}
                  >
                    <option value="text">نص</option>
                    <option value="image">صورة</option>
                    <option value="video">فيديو</option>
                    <option value="link">رابط</option>
                  </select>
                </div>

                {postType !== 'text' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      {postType === 'image' ? 'الصورة' :
                       postType === 'video' ? 'رابط الفيديو' : 'الرابط'}
                    </label>
                    {postType === 'image' ? (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                          disabled={uploading}
                        >
                          <Upload className="w-5 h-5" />
                          {uploading ? 'جاري الرفع...' : 'اختر صورة'}
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        {...register('media_url')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={
                          postType === 'video' ? 'https://www.youtube.com/embed/...' :
                          'https://example.com'
                        }
                      />
                    )}
                  </div>
                )}

                {renderMediaPreview()}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    المحتوى
                  </label>
                  <textarea
                    {...register('content')}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.content.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  {editingPost ? 'حفظ التعديلات' : 'نشر'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {loading && posts.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">جاري تحميل المنشورات...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post, index) => (
            <div
              key={post.id}
              ref={index === posts.length - 1 ? lastPostRef : null}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    {post.users_profile?.avatar_url ? (
                      <img
                        src={post.users_profile.avatar_url}
                        alt={post.users_profile.full_name || ''}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{post.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {post.users_profile?.full_name || 'مستخدم مجهول'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(post.created_at).toLocaleDateString('ar-SA')}
                  </span>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(post)}
                        className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        title="تعديل"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        title="حذف"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <PostContent
                  content={truncateText(post.content)}
                  type={post.type}
                  mediaUrl={post.media_url}
                  title={post.title}
                />
                {post.content.split(/\s+/).length > 25 && (
                  <Link
                    to={`/post/${post.id}`}
                    className="inline-block mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    اقرأ المزيد...
                  </Link>
                )}
              </div>
            </div>
          ))}
          {loading && posts.length > 0 && (
            <div className="col-span-full text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}