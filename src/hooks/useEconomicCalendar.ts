import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type EconomicEvent = {
  id: string;
  title: string;
  country: string;
  impact_level: 'low' | 'medium' | 'high';
  event_time: string;
  actual_value: string | null;
  forecast_value: string | null;
  previous_value: string | null;
  description?: string;
  currency: string;
  indicator_type: string;
};

export function useEconomicCalendar() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('economic_events')
        .select('*')
        .order('event_time', { ascending: true });

      if (fetchError) throw fetchError;
      setEvents(data || []);
    } catch (err) {
      console.error('Error loading economic events:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('economic_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'economic_events'
        },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    // Refresh data every 5 minutes
    const refreshInterval = setInterval(loadEvents, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(refreshInterval);
    };
  }, [loadEvents]);

  return {
    events,
    loading,
    error,
    refreshEvents: loadEvents,
  };
}