export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Banner {
  id: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      content_posts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          type: 'text' | 'image' | 'video' | 'link'
          media_url: string | null
          status: 'draft' | 'published' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          type: 'text' | 'image' | 'video' | 'link'
          media_url?: string | null
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          type?: 'text' | 'image' | 'video' | 'link'
          media_url?: string | null
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      users_profile: {
        Row: {
          id: string
          full_name: string | null
          country: string | null
          bio: string | null
          experience_level: 'beginner' | 'intermediate' | 'advanced' | 'professional' | null
          avatar_url: string | null
          cover_photo_url: string | null
          preferred_markets: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          country?: string | null
          bio?: string | null
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'professional' | null
          avatar_url?: string | null
          cover_photo_url?: string | null
          preferred_markets?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          country?: string | null
          bio?: string | null
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'professional' | null
          avatar_url?: string | null
          cover_photo_url?: string | null
          preferred_markets?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      market_analysis: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          instrument: string
          direction: 'buy' | 'sell' | null
          entry_price: number | null
          stop_loss: number | null
          take_profit: number | null
          status: 'draft' | 'published' | 'archived'
          created_at: string
          updated_at: string
          likes_count: number
          views_count: number
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          instrument: string
          direction?: 'buy' | 'sell' | null
          entry_price?: number | null
          stop_loss?: number | null
          take_profit?: number | null
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
          likes_count?: number
          views_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          instrument?: string
          direction?: 'buy' | 'sell' | null
          entry_price?: number | null
          stop_loss?: number | null
          take_profit?: number | null
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
          likes_count?: number
          views_count?: number
        }
      }
      analysis_likes: {
        Row: {
          analysis_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          analysis_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          analysis_id?: string
          user_id?: string
          created_at?: string
        }
      }
      banners: {
        Row: Banner;
        Insert: Omit<Banner, 'id' | 'click_count' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Banner, 'id'>>;
      };
    }
  }
}