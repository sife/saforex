import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useMarketAnalysis } from '../hooks/useMarketAnalysis';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TRADING_INSTRUMENTS } from '../constants/tradingPairs';
import { 
  TrendingUp, TrendingDown, ThumbsUp, Eye, Clock, User as UserIcon, 
  Trash2, Edit2, Upload, X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const analysisSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب'),
  content: z.string().min(10, 'المحتوى يجب أن يكون 10 أحرف على الأقل'),
  instrument: z.string().min(1, 'يجب اختيار أداة التداول'),
  direction: z.enum(['buy', 'sell']).optional().nullable(),
  entry_price: z.number().optional().nullable(),
  stop_loss: z.number().optional().nullable(),
  take_profit: z.number().optional().nullable(),
  media_url: z.string().optional(),
  media_type: z.enum(['image', 'video']).optional(),
});

type AnalysisForm = z.infer<typeof analysisSchema>;

function MarketAnalysis() {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const { analyses, loading, createAnalysis, updateAnalysis, deleteAnalysis, toggleLike, uploadImage } = useMarketAnalysis();
  const [showForm, setShowForm] = useState(false);
  const [editingAnalysis, setEditingAnalysis] = useState<MarketAnalysis | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AnalysisForm>({
    resolver: zodResolver(analysisSchema),
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const imageUrl = await uploadImage(file);
      setValue('media_url', imageUrl);
      setValue('media_type', 'image');
      setPreviewUrl(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = async (data: AnalysisForm) => {
    if (!user || !isAdmin) return;

    try {
      if (editingAnalysis) {
        await updateAnalysis(editingAnalysis.id, {
          ...data,
          updated_at: new Date().toISOString()
        });
        setEditingAnalysis(null);
      } else {
        await createAnalysis({
          user_id: user.id,
          ...data,
          status: 'published',
        });
      }
      setShowForm(false);
      reset();
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error creating analysis:', error);
    }
  };

  const handleEdit = (analysis: MarketAnalysis) => {
    setEditingAnalysis(analysis);
    setShowForm(true);
    setValue('title', analysis.title);
    setValue('content', analysis.content);
    setValue('instrument', analysis.instrument);
    setValue('direction', analysis.direction);
    setValue('entry_price', analysis.entry_price || undefined);
    setValue('stop_loss', analysis.stop_loss || undefined);
    setValue('take_profit', analysis.take_profit || undefined);
    if (analysis.media_url) {
      setValue('media_url', analysis.media_url);
      setPreviewUrl(analysis.media_url);
    }
  };

  const handleDelete = async (analysisId: string) => {
    if (deleteConfirmation !== analysisId) {
      setDeleteConfirmation(analysisId);
      // Clear confirmation after 3 seconds
      setTimeout(() => setDeleteConfirmation(null), 3000);
      return;
    }

    try {
      await deleteAnalysis(analysisId);
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Error deleting analysis:', error);
      alert('حدث خطأ أثناء حذف التحليل');
    }
  };

  const handleLike = async (analysisId: string) => {
    if (!user) return;
    await toggleLike(analysisId, user.id);
  };

  const truncateText = (text: string, wordLimit: number = 25) => {
    const words = text.split(/\s+/);
    if (words.length > wordLimit) {
      return {
        truncated: true,
        text: words.slice(0, wordLimit).join(' ') + '...'
      };
    }
    return {
      truncated: false,
      text
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">تحليلات السوق</h1>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'إلغاء' : editingAnalysis ? 'تعديل التحليل' : 'تحليل جديد'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">تحليل جديد</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                العنوان
              </label>
              <input
                type="text"
                {...register('title')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="عنوان التحليل"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                أداة التداول
              </label>
              <select
                {...register('instrument')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">اختر أداة التداول</option>
                {TRADING_INSTRUMENTS.map((instrument) => (
                  <option key={instrument} value={instrument}>{instrument}</option>
                ))}
              </select>
              {errors.instrument && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.instrument.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                الاتجاه
              </label>
              <select
                {...register('direction')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">اختر الاتجاه</option>
                <option value="buy">شراء</option>
                <option value="sell">بيع</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  سعر الدخول
                </label>
                <input
                  type="number"
                  step="0.00001"
                  {...register('entry_price', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  وقف الخسارة
                </label>
                <input
                  type="number"
                  step="0.00001"
                  {...register('stop_loss', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  الهدف
                </label>
                <input
                  type="number"
                  step="0.00001"
                  {...register('take_profit', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                التحليل
              </label>
              <textarea
                {...register('content')}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="اكتب تحليلك هنا..."
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.content.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                صورة التحليل (اختياري)
              </label>
              <div className="mt-1 flex items-center gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                  disabled={uploading}
                >
                  <Upload className="w-5 h-5" />
                  {uploading ? 'جاري الرفع...' : 'اختر صورة'}
                </button>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setValue('media_url', '');
                      setValue('media_type', undefined);
                      setPreviewUrl(null);
                    }}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              {previewUrl && (
                <div className="mt-4 relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-h-96 object-contain rounded-lg"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingAnalysis ? 'حفظ التعديلات' : 'نشر التحليل'}
            </button>
            {editingAnalysis && (
              <button
                type="button"
                onClick={() => {
                  setEditingAnalysis(null);
                  setShowForm(false);
                  reset();
                  setPreviewUrl(null);
                }}
                className="mr-4 px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
            )}
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">جاري تحميل التحليلات...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analyses.map((analysis) => {
            const truncatedContent = truncateText(analysis.content);
            
            return (
              <div key={analysis.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                {analysis.media_url && (
                  <div className="relative aspect-video">
                    {analysis.media_type === 'image' ? (
                      <img
                        src={analysis.media_url}
                        alt={analysis.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : analysis.media_type === 'video' ? (
                      <div className="relative w-full h-full bg-gray-900">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="w-12 h-12 text-white opacity-80" />
                        </div>
                        <iframe
                          src={analysis.media_url}
                          className="absolute inset-0 w-full h-full"
                          allowFullScreen
                          title={analysis.title}
                        />
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      {analysis.users_profile?.avatar_url ? (
                        <img
                          src={analysis.users_profile.avatar_url}
                          alt={analysis.users_profile.full_name || ''}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {analysis.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="truncate">{analysis.users_profile?.full_name || 'مستخدم مجهول'}</span>
                        <span>•</span>
                        <Clock className="w-4 h-4" />
                        <span>{new Date(analysis.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="font-medium text-gray-900 dark:text-white">{analysis.instrument}</span>
                    {analysis.direction && (
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        analysis.direction === 'buy' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                      }`}>
                        {analysis.direction === 'buy' ? 'شراء' : 'بيع'}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                    {truncatedContent.text}
                  </p>

                  {(analysis.entry_price || analysis.stop_loss || analysis.take_profit) && (
                    <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4 text-sm">
                      {analysis.entry_price && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">سعر الدخول</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{analysis.entry_price}</p>
                        </div>
                      )}
                      {analysis.stop_loss && (
                        <div className="text-red-600 dark:text-red-400">
                          <p className="flex items-center gap-1">
                            <TrendingDown className="w-4 h-4" />
                            وقف الخسارة
                          </p>
                          <p className="font-semibold">{analysis.stop_loss}</p>
                        </div>
                      )}
                      {analysis.take_profit && (
                        <div className="text-green-600 dark:text-green-400">
                          <p className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            الهدف
                          </p>
                          <p className="font-semibold">{analysis.take_profit}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(analysis.id)}
                        className="flex items-center gap-1 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                      >
                        <ThumbsUp className="w-5 h-5" />
                        <span>{analysis.likes_count || 0}</span>
                      </button>
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Eye className="w-5 h-5" />
                        <span>{analysis.views_count || 0}</span>
                      </div>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleDelete(analysis.id)}
                            className={`flex items-center gap-1 ${
                              deleteConfirmation === analysis.id
                                ? 'text-red-600 dark:text-red-400 animate-pulse'
                                : 'text-gray-600 dark:text-gray-400'
                            } hover:text-red-600 dark:hover:text-red-400 transition-colors`}
                            title={deleteConfirmation === analysis.id ? 'اضغط مرة أخرى للتأكيد' : 'حذف التحليل'}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(analysis)}
                            className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="تعديل التحليل"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                    <Link
                      to={`/market-analysis/${analysis.id}`}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      قراءة المزيد
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MarketAnalysis;