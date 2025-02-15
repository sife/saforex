import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type TradingSignal = Database['public']['Tables']['trading_signals']['Row'] & {
  users_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useTradingSignals() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cache = useRef<Map<string, { data: TradingSignal; timestamp: number }>>(new Map());
  const loadingRef = useRef(false);

  const loadSignals = useCallback(async (refresh: boolean = false) => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      // Check cache if not refreshing
      if (!refresh) {
        const cachedSignals = Array.from(cache.current.values())
          .filter(({ timestamp }) => Date.now() - timestamp < CACHE_DURATION)
          .map(({ data }) => data)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        if (cachedSignals.length > 0) {
          setSignals(cachedSignals);
          setLoading(false);
          loadingRef.current = false;
          return;
        }
      }

      const { data, error } = await supabase
        .from('trading_signals')
        .select(`
          *,
          users_profile (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Update cache
      const now = Date.now();
      data?.forEach(signal => {
        cache.current.set(signal.id, { data: signal, timestamp: now });
      });

      // Clean old cache entries
      Array.from(cache.current.entries()).forEach(([key, { timestamp }]) => {
        if (Date.now() - timestamp > CACHE_DURATION) {
          cache.current.delete(key);
        }
      });

      setSignals(data || []);
    } catch (error) {
      console.error('Error loading signals:', error);
      setError(error as Error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    loadSignals();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('trading_signals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trading_signals'
        },
        () => {
          if (mounted) {
            loadSignals(true);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [loadSignals]);

  const createSignal = async (signal: Omit<TradingSignal, 'id' | 'created_at' | 'closed_at' | 'performance_pips' | 'likes_count'>) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('trading_signals')
        .insert(signal)
        .select()
        .single();

      if (error) throw error;
      await loadSignals(true);
      return data;
    } catch (error) {
      console.error('Error creating signal:', error);
      setError(error as Error);
      return null;
    }
  };

  const updateSignal = async (id: string, updates: Partial<TradingSignal>) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('trading_signals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await loadSignals(true);
      return data;
    } catch (error) {
      console.error('Error updating signal:', error);
      setError(error as Error);
      return null;
    }
  };

  const deleteSignal = async (id: string) => {
    try {
      setError(null);
      const { error } = await supabase
        .from('trading_signals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadSignals(true);
      return true;
    } catch (error) {
      console.error('Error deleting signal:', error);
      setError(error as Error);
      return false;
    }
  };

  const toggleLike = async (signalId: string, userId: string) => {
    try {
      setError(null);
      // First, check if the user has already liked this signal
      const { data: likes, error: checkError } = await supabase
        .from('signal_likes')
        .select('*')
        .eq('signal_id', signalId)
        .eq('user_id', userId);

      if (checkError) throw checkError;

      if (likes && likes.length > 0) {
        // Unlike: Delete the existing like
        const { error: unlikeError } = await supabase
          .from('signal_likes')
          .delete()
          .eq('signal_id', signalId)
          .eq('user_id', userId);

        if (unlikeError) throw unlikeError;
      } else {
        // Like: Insert a new like
        const { error: likeError } = await supabase
          .from('signal_likes')
          .insert({
            signal_id: signalId,
            user_id: userId
          });

        if (likeError) throw likeError;
      }

      // Reload signals to get updated like counts
      await loadSignals(true);
    } catch (error) {
      console.error('Error toggling like:', error);
      setError(error as Error);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('يجب اختيار ملف صورة');
      }

      // Optimize image before upload
      const optimizedImage = await optimizeImage(file);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('signal_images')
        .upload(fileName, optimizedImage, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        if (uploadError.message.includes('duplicate')) {
          throw new Error('هذا الملف موجود بالفعل، الرجاء اختيار اسم آخر');
        }
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('signal_images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Helper function to optimize images
  const optimizeImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Calculate new dimensions (max 1200px width/height)
        const maxSize = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }));
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = () => reject(new Error('فشل تحميل الصورة'));
    });
  };

  return {
    signals,
    loading,
    error,
    createSignal,
    updateSignal,
    deleteSignal,
    toggleLike,
    uploadImage,
    refreshSignals: () => loadSignals(true),
  };
}