import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, User, Upload } from 'lucide-react';
import { TRADING_INSTRUMENTS } from '../constants/tradingPairs';

const profileSchema = z.object({
  full_name: z.string().min(2).max(100),
  country: z.string().min(2).max(100),
  bio: z.string().max(500).optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'professional']),
  preferred_markets: z.array(z.string()).min(1),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile, loading, updateProfile, uploadAvatar } = useProfile();
  const [isEditing, setIsEditing] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      country: profile?.country || '',
      bio: profile?.bio || '',
      experience_level: profile?.experience_level || 'beginner',
      preferred_markets: profile?.preferred_markets || [],
    },
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <p className="text-center text-gray-600">الرجاء تسجيل الدخول لعرض الملف الشخصي.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <p className="text-center">{t('common.loading')}</p>
      </div>
    );
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await uploadAvatar(file);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10">
      {/* Profile Header */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 h-48 rounded-t-lg">
        <div className="absolute -bottom-16 left-8">
          <div className="relative">
            <div 
              className="w-32 h-32 bg-white rounded-full flex items-center justify-center border-4 border-white cursor-pointer overflow-hidden"
              onClick={handleAvatarClick}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-gray-400" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <button 
              className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white hover:bg-blue-700"
              onClick={handleAvatarClick}
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="bg-white rounded-b-lg shadow-md p-8 pt-20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{profile?.full_name || 'المستخدم'}</h1>
            <p className="text-gray-600 mt-1 ltr">@{profile?.username || ''}</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {t('common.edit')}
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.fullName')}
              </label>
              <input
                type="text"
                {...register('full_name')}
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.country')}
              </label>
              <input
                type="text"
                {...register('country')}
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.country && (
                <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.bio')}
              </label>
              <textarea
                {...register('bio')}
                rows={4}
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.experienceLevel')}
              </label>
              <select
                {...register('experience_level')}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="beginner">{t('profile.levels.beginner')}</option>
                <option value="intermediate">{t('profile.levels.intermediate')}</option>
                <option value="advanced">{t('profile.levels.advanced')}</option>
                <option value="professional">{t('profile.levels.professional')}</option>
              </select>
              {errors.experience_level && (
                <p className="mt-1 text-sm text-red-600">{errors.experience_level.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.preferredMarkets')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {TRADING_INSTRUMENTS.map((instrument) => (
                  <label key={instrument} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={instrument}
                      {...register('preferred_markets')}
                      className="rounded border-gray-300"
                    />
                    <span>{instrument}</span>
                  </label>
                ))}
              </div>
              {errors.preferred_markets && (
                <p className="mt-1 text-sm text-red-600">{errors.preferred_markets.message}</p>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {t('common.save')}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">{t('profile.fullName')}</h2>
              <p>{profile?.full_name || '-'}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">{t('profile.country')}</h2>
              <p>{profile?.country || '-'}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">{t('profile.bio')}</h2>
              <p>{profile?.bio || '-'}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">{t('profile.experienceLevel')}</h2>
              <p>{profile?.experience_level ? t(`profile.levels.${profile.experience_level}`) : '-'}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">{t('profile.preferredMarkets')}</h2>
              <div className="flex flex-wrap gap-2">
                {profile?.preferred_markets?.map((market) => (
                  <span
                    key={market}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {market}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}