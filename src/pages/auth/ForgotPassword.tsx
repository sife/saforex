import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { TrendingUp, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setError(null);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('حدث خطأ أثناء إرسال رابط إعادة تعيين كلمة المرور');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-800">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link 
              to="/"
              className="inline-flex items-center text-2xl font-bold text-blue-600 dark:text-blue-400"
            >
              <TrendingUp className="w-8 h-8 mr-2" />
              SA FOREX
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
              استعادة كلمة المرور
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  تم إرسال رابط إعادة تعيين كلمة المرور
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  يرجى التحقق من بريدك الإلكتروني واتباع التعليمات لإعادة تعيين كلمة المرور
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                العودة إلى تسجيل الدخول
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  {t('common.email')}
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    {...register('email')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    placeholder="your@email.com"
                    dir="ltr"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Link
                  to="/login"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  العودة إلى تسجيل الدخول
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Right Side - Content */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="relative w-full h-full flex items-center justify-center p-12">
          <div className="max-w-lg text-center text-white">
            <h2 className="text-4xl font-bold mb-6">
              هل نسيت كلمة المرور؟
            </h2>
            <p className="text-lg mb-8 text-blue-100">
              لا تقلق! سنساعدك في استعادة حسابك بخطوات بسيطة وآمنة
            </p>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4">خطوات استعادة الحساب</h3>
                <ol className="text-right space-y-4 text-blue-100">
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">1</span>
                    <span>أدخل بريدك الإلكتروني المسجل</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">2</span>
                    <span>تحقق من بريدك الإلكتروني للحصول على رابط إعادة التعيين</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">3</span>
                    <span>اختر كلمة مرور جديدة وآمنة</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}