import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type MarketAnalysis = Database['public']['Tables']['market_analysis']['Row'] & {
  users_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useMarketAnalysis() {
  const [analyses, setAnalyses] = useState<MarketAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cache = useRef<Map<string, { data: MarketAnalysis; timestamp: number }>>(new Map());
  const loadingRef = useRef(false);

  const loadAnalyses = useCallback(async (refresh: boolean = false) => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      // Check cache if not refreshing
      if (!refresh) {
        const cachedAnalyses = Array.from(cache.current.values())
          .filter(({ timestamp }) => Date.now() - timestamp < CACHE_DURATION)
          .map(({ data }) => data)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        if (cachedAnalyses.length > 0) {
          setAnalyses(cachedAnalyses);
          setLoading(false);
          loadingRef.current = false;
          return;
        }
      }

      const { data, error } = await supabase
        .from('market_analysis')
        .select(`
          *,
          users_profile!market_analysis_user_profile_fk (
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Update cache with new data
      const now = Date.now();
      data?.forEach(analysis => {
        cache.current.set(analysis.id, { data: analysis, timestamp: now });
      });

      // Clean old cache entries
      Array.from(cache.current.entries()).forEach(([key, { timestamp }]) => {
        if (Date.now() - timestamp > CACHE_DURATION) {
          cache.current.delete(key);
        }
      });

      setAnalyses(data || []);
    } catch (error) {
      console.error('Error loading analyses:', error);
      setError(error as Error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    loadAnalyses();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('market_analysis_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'market_analysis'
        },
        () => {
          if (mounted) {
            loadAnalyses(true);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [loadAnalyses]);

  const getAnalysis = useCallback((id: string) => {
    const cached = cache.current.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, []);

  const uploadImage = async (file: File): Promise<string> => {
    try {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('حجم الملف يجب أن لا يتجاوز 5 ميجابايت');
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
        .from('analysis_media')
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
        .from('analysis_media')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
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

  const createAnalysis = async (analysis: Omit<MarketAnalysis, 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'views_count'>) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('market_analysis')
        .insert([{
          ...analysis,
          likes_count: 0,
          views_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local cache and state
      if (data) {
        cache.current.set(data.id, {
          data,
          timestamp: Date.now()
        });
        setAnalyses(prev => [data, ...prev]);
      }

      return data;
    } catch (error) {
      console.error('Error creating analysis:', error);
      setError(error as Error);
      throw error;
    }
  };

  const updateAnalysis = async (id: string, updates: Partial<MarketAnalysis>) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('market_analysis')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update local cache and state
      if (data) {
        cache.current.set(data.id, {
          data,
          timestamp: Date.now()
        });
        setAnalyses(prev => prev.map(a => a.id === data.id ? data : a));
      }

      return data;
    } catch (error) {
      console.error('Error updating analysis:', error);
      setError(error as Error);
      throw error;
    }
  };

  const deleteAnalysis = async (analysisId: string) => {
    try {
      setError(null);
      // Update the status to 'archived' instead of deleting
      const { error } = await supabase.from('market_analysis')
        .update({ status: 'archived' })
        .eq('id', analysisId)
        .select();

      if (error) throw error;
      
      // Refresh analyses after archiving
      await loadAnalyses(true);
    } catch (error) {
      console.error('Error deleting analysis:', error);
      setError(error as Error);
    }
  };

  const toggleLike = async (analysisId: string, userId: string) => {
    try {
      setError(null);
      const { data: likes, error: checkError } = await supabase
        .from('analysis_likes')
        .select('*')
        .eq('analysis_id', analysisId)
        .eq('user_id', userId);

      if (checkError) throw checkError;

      if (likes && likes.length > 0) {
        // Unlike
        const { error: unlikeError } = await supabase
          .from('analysis_likes')
          .delete()
          .eq('analysis_id', analysisId)
          .eq('user_id', userId);

        if (unlikeError) throw unlikeError;
      } else {
        // Like
        const { error: likeError } = await supabase
          .from('analysis_likes')
          .insert({
            analysis_id: analysisId,
            user_id: userId
          });

        if (likeError) throw likeError;
      }

      // Refresh analyses to get updated like counts
      await loadAnalyses(true);
    } catch (error) {
      console.error('Error toggling like:', error);
      setError(error as Error);
    }
  };

  return {
    analyses,
    loading,
    error,
    getAnalysis,
    createAnalysis,
    updateAnalysis,
    deleteAnalysis,
    toggleLike,
    uploadImage,
    refreshAnalyses: () => loadAnalyses(true),
  };
}