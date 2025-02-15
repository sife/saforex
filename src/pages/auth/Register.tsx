import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { TrendingUp, User, Mail, Phone, Lock, CheckCircle, Users, LineChart } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const registerSchema = z.object({
  fullName: z.string().min(2, 'fullName.min'),
  email: z.string().email('email.invalid'),
  phone: z.string().min(10, 'رقم الهاتف غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل')
    .regex(/[a-z]/, 'يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل')
    .regex(/[0-9]/, 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل'),
  confirmPassword: z.string().min(8, 'confirmPassword.min'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "password.mismatch",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null);

      // Register the user
      const { error: signUpError, data: authData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        phone: data.phone,
        options: {
          data: {
            full_name: data.fullName,
          }
        }
      });
      
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError(t('register.errors.emailTaken'));
        } else {
          setError(t('register.errors.general'));
        }
        return;
      }

      // Update the user's profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users_profile')
          .update({
            full_name: data.fullName,
            phone: data.phone
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
          setError(t('register.errors.profile'));
          return;
        }
      }

      // Navigation will be handled by the useEffect above
    } catch (error) {
      console.error('Error registering:', error);
      setError(t('register.errors.general'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row-reverse">
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
              {t('common.register')}
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              انضم إلينا اليوم واكتشف عالم التداول
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t('register.fullName')}
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    {...register('fullName')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    placeholder="الاسم الكامل"
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {t(`register.errors.${errors.fullName.message}`)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
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
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {t(`register.errors.${errors.email.message}`)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  رقم الهاتف
                </label>
                <div className="mt-1">
                  <PhoneInput
                    international
                    defaultCountry="SA"
                    value={watch('phone')}
                    onChange={(value) => setValue('phone', value || '')}
                    className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t('common.password')}
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    {...register('password')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t('register.confirmPassword')}
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CheckCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    {...register('confirmPassword')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {t(`register.errors.${errors.confirmPassword.message}`)}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSubmitting ? t('register.submitting') : t('common.submit')}
            </button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-300">
              {t('register.haveAccount')}{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t('register.loginNow')}
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right Side - Content */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="relative w-full h-full flex items-center justify-center p-12">
          <div className="max-w-lg text-center text-white">
            <h2 className="text-4xl font-bold mb-6">
              ابدأ رحلتك في عالم التداول
            </h2>
            <p className="text-lg mb-8 text-blue-100">
              انضم إلى مجتمع المتداولين المحترفين واحصل على:
            </p>
            
            <div className="grid grid-cols-1 gap-6 text-right">
              <div className="flex items-center space-x-4 rtl:space-x-reverse bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-blue-500">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">تحليلات السوق المباشرة</h3>
                  <p className="text-sm text-blue-100">تحليلات فنية وأساسية يومية من خبراء السوق</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 rtl:space-x-reverse bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-purple-500">
                  <LineChart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">إشارات تداول دقيقة</h3>
                  <p className="text-sm text-blue-100">توصيات مدروسة مع نقاط الدخول والخروج</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 rtl:space-x-reverse bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-green-500">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">مجتمع متداولين نشط</h3>
                  <p className="text-sm text-blue-100">تواصل مع متداولين محترفين وشارك خبراتك</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}