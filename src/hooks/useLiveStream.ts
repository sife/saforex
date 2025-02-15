import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface LiveStream {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
  is_live: boolean;
  viewers_count: number;
  started_at: string;
  ended_at: string | null;
}

export function useLiveStream() {
  const [currentStream, setCurrentStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    loadCurrentStream();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('live_stream_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_streams'
        },
        () => {
          if (mounted) {
            loadCurrentStream();
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const loadCurrentStream = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('live_streams')
        .select('*')
        .eq('is_live', true)
        .order('started_at', { ascending: false })
        .maybeSingle(); // Use maybeSingle instead of single to handle no rows gracefully

      if (error) throw error;
      setCurrentStream(data);
    } catch (error) {
      console.error('Error loading stream:', error);
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  const updateStream = async (stream: Partial<LiveStream>) => {
    try {
      setError(null);
      let data;

      if (currentStream) {
        // Update existing stream
        const { data: updateData, error: updateError } = await supabase
          .from('live_streams')
          .update({
            ...stream,
            ended_at: stream.is_live ? null : new Date().toISOString()
          })
          .eq('id', currentStream.id)
          .select()
          .single();

        if (updateError) throw updateError;
        data = updateData;
      } else {
        // Create new stream
        const { data: insertData, error: insertError } = await supabase
          .from('live_streams')
          .insert({
            ...stream,
            started_at: new Date().toISOString(),
            viewers_count: 0
          })
          .select()
          .single();

        if (insertError) throw insertError;
        data = insertData;
      }

      setCurrentStream(data);
      return data;
    } catch (error) {
      console.error('Error updating stream:', error);
      setError(error as Error);
      throw error;
    }
  };

  return {
    currentStream,
    loading,
    error,
    updateStream,
    refreshStream: loadCurrentStream,
  };
}