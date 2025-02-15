import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Banner } from '../lib/database.types';

export default function Banner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveBanner();
  }, []);

  const loadActiveBanner = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      setBanner(data?.[0] || null);
    } catch (error) {
      console.error('Error loading banner:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerClick = async () => {
    if (!banner) return;

    try {
      // Update click count
      const { error } = await supabase
        .from('banners')
        .update({ click_count: (banner.click_count || 0) + 1 })
        .eq('id', banner.id);

      if (error) throw error;

      // Open link in new tab
      window.open(banner.link_url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error updating click count:', error);
    }
  };

  if (loading || !banner) return null;

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black/50 to-transparent">
      <div className="container mx-auto max-w-7xl">
        <button
          onClick={handleBannerClick}
          className="block w-full overflow-hidden rounded-lg shadow-lg hover:opacity-95 transition-opacity"
        >
          <img
            src={banner.image_url}
            alt="Advertisement"
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </button>
      </div>
    </div>
  );
}