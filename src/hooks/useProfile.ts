import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['users_profile']['Row'];

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    loadProfile();
  }, [user?.id]);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setError(error as Error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.id) return null;

    try {
      setError(null);
      const { data, error } = await supabase
        .from('users_profile')
        .upsert({ id: user.id, ...updates })
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error as Error);
      return null;
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user?.id) return null;

    try {
      setError(null);
      // Create a folder for the user if it doesn't exist
      const userFolder = `${user.id}`;
      
      // Upload the file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userFolder}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      // Update the profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('users_profile')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Reload the profile
      await loadProfile();
      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(error as Error);
      return null;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    refreshProfile: loadProfile,
  };
}