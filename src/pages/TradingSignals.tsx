import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useTradingSignals } from '../hooks/useTradingSignals';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Edit2, Trash2,
  Upload, X, ThumbsUp, Share2, MessageCircle, Image as ImageIcon
} from 'lucide-react';
import { TRADING_INSTRUMENTS } from '../constants/tradingPairs';

const signalSchema = z.object({
  currency_pair: z.string().min(1, 'يجب اختيار زوج العملات'),
  entry_price: z.number().positive('يجب إدخال سعر دخول صحيح'),
  stop_loss: z.number().positive('يجب إدخال وقف خسارة صحيح'),
  take_profit: z.number().positive('يجب إدخال هدف ربح صحيح'),
  risk_rating: z.number().min(1).max(5),
  description: z.string().max(500, 'الوصف يجب أن لا يتجاوز 500 حرف').optional(),
  image_url: z.string().optional(),
  targets: z.array(z.string()).max(3, 'يمكنك إضافة 3 أهداف كحد أقصى').optional(),
});

type SignalForm = z.infer<typeof signalSchema>;

function TradingSignals() {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const { signals, loading, createSignal, updateSignal, deleteSignal, toggleLike, uploadImage } = useTradingSignals();
  const [showForm, setShowForm] = useState(false);
  const [editingSignal, setEditingSignal] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<SignalForm>({
    resolver: zodResolver(signalSchema),
    defaultValues: {
      targets: ['', '', ''],
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const imageUrl = await uploadImage(file);
      setValue('image_url', imageUrl);
      setPreviewUrl(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: SignalForm) => {
    if (!user || !isAdmin) return;

    try {
      // Filter out empty targets
      const filteredTargets = data.targets?.filter(target => target.trim() !== '') || [];

      if (editingSignal) {
        await updateSignal(editingSignal.id, {
          ...data,
          targets: filteredTargets,
          user_id: user.id,
        });
        setEditingSignal(null);
      } else {
        await createSignal({
          user_id: user.id,
          ...data,
          targets: filteredTargets,
          status: 'active',
        });
      }
      setShowForm(false);
      reset();
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error saving signal:', error);
    }
  };

  const handleEdit = (signal: any) => {
    if (!isAdmin) return;
    setEditingSignal(signal);
    setShowForm(true);
    setValue('currency_pair', signal.currency_pair);
    setValue('entry_price', signal.entry_price);
    setValue('stop_loss', signal.stop_loss);
    setValue('take_profit', signal.take_profit);
    setValue('risk_rating', signal.risk_rating);
    setValue('description', signal.description || '');
    setValue('image_url', signal.image_url || '');
    setValue('targets', signal.targets || ['', '', '']);
    setPreviewUrl(signal.image_url);
  };

  const handleDelete = async (signalId: string) => {
    if (!isAdmin) return;
    if (!window.confirm('هل أنت متأكد من حذف هذه الإشارة؟')) return;
    
    try {
      await deleteSignal(signalId);
    } catch (error) {
      console.error('Error deleting signal:', error);
    }
  };

  const handleShare = async (signal: any) => {
    try {
      await navigator.share({
        title: `توصية ${signal.currency_pair}`,
        text: `توصية جديدة على ${signal.currency_pair} - سعر الدخول: ${signal.entry_price}`,
        url: window.location.href,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('home.tradingSignals')}</h1>
        {isAdmin && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) {
                setEditingSignal(null);
                reset();
                setPreviewUrl(null);
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            {showForm ? t('common.cancel') : t('trading.newSignal')}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
            {editingSignal ? 'تعديل التوصية' : t('trading.newSignal')}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  {t('trading.currencyPair')}
                </label>
                <select
                  {...register('currency_pair')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">اختر زوج العملات أو السلعة</option>
                  {TRADING_INSTRUMENTS.map((instrument) => (
                    <option key={instrument} value={instrument}>{instrument}</option>
                  ))}
                </select>
                {errors.currency_pair && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.currency_pair.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  {t('trading.entryPrice')}
                </label>
                <input
                  type="number"
                  step="0.00001"
                  {...register('entry_price', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {errors.entry_price && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.entry_price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  {t('trading.stopLoss')}
                </label>
                <input
                  type="number"
                  step="0.00001"
                  {...register('stop_loss', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {errors.stop_loss && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.stop_loss.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  {t('trading.takeProfit')}
                </label>
                <input
                  type="number"
                  step="0.00001"
                  {...register('take_profit', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {errors.take_profit && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.take_profit.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                نص التوصية (اختياري)
              </label>
              <textarea
                {...register('description')}
                rows={4}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder="اكتب تحليلاً مختصراً للتوصية..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                الأهداف (اختياري)
              </label>
              <div className="space-y-3">
                {[0, 1, 2].map((index) => (
                  <input
                    key={index}
                    type="text"
                    {...register(`targets.${index}`)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={`الهدف ${index + 1}`}
                  />
                ))}
              </div>
              {errors.targets && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.targets.message}</p>
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
                      setValue('image_url', '');
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                {t(' trading.riskRating')}
              </label>
              <input
                type="number"
                min="1"
                max="5"
                {...register('risk_rating', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {errors.risk_rating && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.risk_rating.message}</p>
              )}
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingSignal ? 'حفظ التعديلات' : t('common.submit')}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-center py-8 text-gray-600 dark:text-gray-300">{t('common.loading')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {signals.map((signal) => (
            <div key={signal.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{signal.currency_pair}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(signal.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    signal.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                    signal.status === 'closed' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' :
                    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                  }`}>
                    {signal.status}
                  </span>
                  {signal.status === 'active' && isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(signal)}
                        className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        title="تعديل"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(signal.id)}
                        className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        title="حذف"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {signal.description && (
                <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                  {signal.description}
                </p>
              )}

              {signal.image_url && (
                <div className="mb-4">
                  <img
                    src={signal.image_url}
                    alt="تحليل فني"
                    className="w-full rounded-lg object-contain max-h-96"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('trading.entryPrice')}</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{signal.entry_price}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('trading.stopLoss')}</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{signal.stop_loss}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('trading.riskRating')}</p>
                    <div className="flex items-center">
                      {Array.from({ length: signal.risk_rating }).map((_, i) => (
                        <span key={i} className="text-yellow-500 dark:text-yellow-400">★</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {signal.targets && signal.targets.length > 0 && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">الأهداف:</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    {signal.targets.map((target: string, index: number) => (
                      target && (
                        <li key={index} className="text-gray-700 dark:text-gray-300">
                          {target}
                        </li>
                      )
                    ))}
                  </ol>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => user && toggleLike(signal.id, user.id)}
                    className={`flex items-center gap-1 ${
                      signal.likes_count ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                    } hover:text-blue-800 dark:hover:text-blue-300 transition-colors`}
                  >
                    <ThumbsUp className="w-5 h-5" />
                    <span>{signal.likes_count || 0}</span>
                  </button>
                  <button
                    onClick={() => handleShare(signal)}
                    className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                {signal.performance_pips && (
                  <div className={`font-semibold ${
                    signal.performance_pips > 0 ? 'text-green-600 dark:text-green-400' :
                    signal.performance_pips < 0 ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {signal.performance_pips} pips
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TradingSignals;