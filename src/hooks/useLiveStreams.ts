import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface LiveStream {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail_url: string | null;
  is_live: boolean;
  viewers_count: number;
  started_at: string;
  ended_at: string | null;
}

const CACHE_DURATION = 1 * 60 * 1000; // 1 minute for live content

export function useLiveStreams() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cache = useRef<Map<string, { data: LiveStream; timestamp: number }>>(new Map());
  const loadingRef = useRef(false);

  const loadStreams = useCallback(async (refresh: boolean = false) => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setError(null);

      // Check cache if not refreshing
      if (!refresh) {
        const cachedStreams = Array.from(cache.current.values())
          .filter(({ timestamp }) => Date.now() - timestamp < CACHE_DURATION)
          .map(({ data }) => data)
          .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

        if (cachedStreams.length > 0) {
          setStreams(cachedStreams);
          setLoading(false);
          loadingRef.current = false;
          return;
        }
      }

      const { data, error } = await supabase
        .from('live_streams')
        .select(`
          *,
          users_profile (
            full_name,
            avatar_url
          )
        `)
        .order('started_at', { ascending: false });

      if (error) throw error;

      // Update cache
      const now = Date.now();
      data?.forEach(stream => {
        cache.current.set(stream.id, { data: stream, timestamp: now });
      });

      // Clean old cache entries
      Array.from(cache.current.entries()).forEach(([key, { timestamp }]) => {
        if (Date.now() - timestamp > CACHE_DURATION) {
          cache.current.delete(key);
        }
      });

      setStreams(data || []);
    } catch (error) {
      console.error('Error loading streams:', error);
      setError(error as Error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    // Initial load
    loadStreams();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('live_streams_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_streams'
        },
        (payload) => {
          if (!mounted) return;

          // Optimistic updates
          if (payload.eventType === 'INSERT') {
            const newStream = payload.new as LiveStream;
            cache.current.set(newStream.id, { data: newStream, timestamp: Date.now() });
            setStreams(prev => [newStream, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedStream = payload.new as LiveStream;
            cache.current.set(updatedStream.id, { data: updatedStream, timestamp: Date.now() });
            setStreams(prev => prev.map(s => s.id === updatedStream.id ? updatedStream : s));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            cache.current.delete(deletedId);
            setStreams(prev => prev.filter(s => s.id !== deletedId));
          }
        }
      )
      .subscribe();

    // Set up periodic refresh for live content
    const refreshInterval = setInterval(() => {
      if (mounted) {
        loadStreams(true);
      }
    }, CACHE_DURATION);

    return () => {
      mounted = false;
      clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, [loadStreams]);

  const getStream = useCallback(async (id: string) => {
    // Check cache first
    const cached = cache.current.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select(`
          *,
          users_profile (
            full_name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Update cache
      if (data) {
        cache.current.set(data.id, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error) {
      console.error('Error loading stream:', error);
      return null;
    }
  }, []);

  return {
    streams,
    loading,
    error,
    getStream,
    refreshStreams: () => loadStreams(true),
  };
}