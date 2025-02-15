import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Upload, Trash2, Edit2, Eye, ExternalLink, Ban } from 'lucide-react';
import type { Banner } from '../../lib/database.types';

const bannerSchema = z.object({
  image_url: z.string().url('يجب إدخال رابط صورة صحيح'),
  link_url: z.string().url('يجب إدخال رابط صحيح'),
  is_active: z.boolean(),
  start_date: z.string().min(1, 'تاريخ البداية مطلوب'),
  end_date: z.string().min(1, 'تاريخ النهاية مطلوب'),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return start <= end;
}, {
  message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
  path: ["end_date"],
});

type BannerForm = z.infer<typeof bannerSchema>;

export default function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BannerForm>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      is_active: false,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error loading banners:', error);
      setError('حدث خطأ أثناء تحميل الإعلانات');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('يجب اختيار ملف صورة');
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('حجم الصورة يجب أن لا يتجاوز 2 ميجابايت');
      }

      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      // First, try to upload the file
      const { error: uploadError, data } = await supabase.storage
        .from('banners')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        if (uploadError.message.includes('duplicate')) {
          throw new Error('هذا الملف موجود بالفعل، الرجاء اختيار اسم آخر');
        }
        throw new Error('حدث خطأ أثناء رفع الصورة');
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(fileName);

      setValue('image_url', publicUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = async (data: BannerForm) => {
    try {
      setError(null);

      // Convert dates to ISO format with time
      const formattedData = {
        ...data,
        start_date: new Date(`${data.start_date}T00:00:00`).toISOString(),
        end_date: new Date(`${data.end_date}T23:59:59`).toISOString(),
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('banners')
          .update(formattedData)
          .eq('id', editingBanner.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('banners')
          .insert([formattedData]);

        if (error) throw error;
      }

      await loadBanners();
      reset();
      setEditingBanner(null);
    } catch (error) {
      console.error('Error saving banner:', error);
      setError('حدث خطأ أثناء حفظ الإعلان');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setValue('image_url', banner.image_url);
    setValue('link_url', banner.link_url);
    setValue('is_active', banner.is_active);
    setValue('start_date', new Date(banner.start_date).toISOString().split('T')[0]);
    setValue('end_date', new Date(banner.end_date).toISOString().split('T')[0]);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      setError('حدث خطأ أثناء حذف الإعلان');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">
          {editingBanner ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الصورة
            </label>
            <div className="flex items-center gap-4">
              <input
                type="text"
                {...register('image_url')}
                className="flex-1 px-3 py-2 border rounded-md"
                placeholder="رابط الصورة"
                dir="ltr"
              />
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
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploading}
              >
                <Upload className="w-5 h-5" />
                {uploading ? 'جاري الرفع...' : 'رفع صورة'}
              </button>
            </div>
            {errors.image_url && (
              <p className="mt-1 text-sm text-red-600">{errors.image_url.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رابط الإعلان
            </label>
            <input
              type="text"
              {...register('link_url')}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="https://example.com"
              dir="ltr"
            />
            {errors.link_url && (
              <p className="mt-1 text-sm text-red-600">{errors.link_url.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ البداية
              </label>
              <input
                type="date"
                {...register('start_date')}
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ النهاية
              </label>
              <input
                type="date"
                {...register('end_date')}
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.end_date && (
                <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('is_active')}
              className="rounded border-gray-300"
            />
            <label className="text-sm font-medium text-gray-700">
              تفعيل الإعلان
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingBanner ? 'حفظ التعديلات' : 'إضافة الإعلان'}
            </button>
            {editingBanner && (
              <button
                type="button"
                onClick={() => {
                  setEditingBanner(null);
                  reset();
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                إلغاء
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">الإعلانات</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">الصورة</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">الحالة</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">تاريخ البداية</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">تاريخ النهاية</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">عدد النقرات</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <img
                      src={banner.image_url}
                      alt="Banner preview"
                      className="w-20 h-12 object-cover rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      banner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {banner.is_active ? 'مفعل' : 'غير مفعل'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(banner.start_date).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(banner.end_date).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {banner.click_count || 0}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(banner)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="تعديل"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="حذف"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <a
                        href={banner.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-600 hover:text-gray-800"
                        title="فتح الرابط"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}