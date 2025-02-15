import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { debounce } from '../utils/debounce';

type ContentPost = Database['public']['Tables']['content_posts']['Row'] & {
  users_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

const POSTS_PER_PAGE = 10;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useContentPosts() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const cache = useRef<Map<string, { data: ContentPost; timestamp: number }>>(new Map());
  const loadingRef = useRef(false);

  const loadPosts = useCallback(async (pageNumber: number = 0, refresh: boolean = false) => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setError(null);

      if (pageNumber === 0) {
        setLoading(true);
      }

      const from = pageNumber * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      // Check cache for first page
      if (pageNumber === 0 && !refresh) {
        const cachedPosts = Array.from(cache.current.values())
          .filter(({ timestamp }) => Date.now() - timestamp < CACHE_DURATION)
          .map(({ data }) => data)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, POSTS_PER_PAGE);

        if (cachedPosts.length === POSTS_PER_PAGE) {
          setPosts(cachedPosts);
          setHasMore(true);
          setLoading(false);
          loadingRef.current = false;
          return;
        }
      }

      const { data, error } = await supabase
        .from('content_posts')
        .select(`
          *,
          users_profile (
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Update cache with new data
      const now = Date.now();
      data?.forEach(post => {
        cache.current.set(post.id, { data: post, timestamp: now });
      });

      // Clean old cache entries
      Array.from(cache.current.entries()).forEach(([key, { timestamp }]) => {
        if (Date.now() - timestamp > CACHE_DURATION) {
          cache.current.delete(key);
        }
      });

      // Update state based on whether it's a refresh or pagination
      if (refresh || pageNumber === 0) {
        setPosts(data || []);
      } else {
        setPosts(prev => [...prev, ...(data || [])]);
      }

      setHasMore((data?.length || 0) === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error loading posts:', error);
      setError(error as Error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Debounced refresh function
  const debouncedRefresh = useCallback(
    debounce(() => loadPosts(0, true), 1000),
    [loadPosts]
  );

  useEffect(() => {
    let mounted = true;
    
    // Initial load
    loadPosts(0);

    // Subscribe to real-time changes
    const channel = supabase
      .channel('content_posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_posts'
        },
        () => {
          if (mounted) {
            debouncedRefresh();
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [loadPosts, debouncedRefresh]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadPosts(page + 1);
    }
  }, [loading, hasMore, page, loadPosts]);

  const getPost = useCallback((id: string) => {
    const cached = cache.current.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, []);

  const uploadMedia = async (file: File): Promise<string> => {
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
        .from('post_media')
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
        .from('post_media')
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

  const createPost = async (post: Omit<ContentPost, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const { error } = await supabase
        .from('content_posts')
        .insert(post)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh posts after successful creation
      loadPosts(0, true);
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error as Error);
    }
  };

  const updatePost = async (id: string, updates: Partial<ContentPost>) => {
    try {
      setError(null);
      const { error } = await supabase
        .from('content_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh posts after successful update
      loadPosts(0, true);
    } catch (error) {
      console.error('Error updating post:', error);
      setError(error as Error);
    }
  };

  const deletePost = async (id: string) => {
    try {
      setError(null);
      const { error } = await supabase
        .from('content_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh posts after successful deletion
      loadPosts(0, true);
    } catch (error) {
      console.error('Error deleting post:', error);
      setError(error as Error);
    }
  };

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    getPost,
    createPost,
    updatePost,
    deletePost,
    uploadMedia,
    refreshPosts: () => loadPosts(0, true),
  };
}