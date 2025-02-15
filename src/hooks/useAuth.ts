import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    const initialDelay = 1000;

    async function initializeAuth() {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await checkAdminStatus(session.user.id);
          } else {
            setUser(null);
            setIsAdmin(false);
          }
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;

            if (event === 'SIGNED_OUT') {
              setUser(null);
              setIsAdmin(false);
              navigate('/login', { replace: true });
            } else if (session?.user) {
              setUser(session.user);
              await checkAdminStatus(session.user.id);
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
        }
        
        // Retry initialization if needed
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = initialDelay * Math.pow(2, retryCount - 1);
          console.log(`Auth initialization retry ${retryCount} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return initializeAuth();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    async function checkAdminStatus(userId: string) {
      let adminRetryCount = 0;
      const adminMaxRetries = 3;

      const checkAdmin = async () => {
        try {
          const { data, error } = await supabase
            .from('users_profile')
            .select('is_admin')
            .eq('id', userId)
            .maybeSingle();

          if (error) throw error;
          
          if (mounted) {
            setIsAdmin(data?.is_admin ?? false);
          }
          adminRetryCount = 0; // Reset retry count on success
        } catch (error) {
          console.error('Error checking admin status:', error);
          if (adminRetryCount < adminMaxRetries) {
            adminRetryCount++;
            // Exponential backoff: 1s, 2s, 4s
            const delay = initialDelay * Math.pow(2, adminRetryCount - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            return checkAdmin(); // Retry
          }
          if (mounted) {
            setIsAdmin(false);
          }
        }
      };

      await checkAdmin();
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null);
      setIsAdmin(false);

      // Clear local storage
      localStorage.removeItem('sa-forex-auth');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Navigate to login
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      // Force clear session even if error occurs
      setUser(null);
      setIsAdmin(false);
      navigate('/login', { replace: true });
    }
  };

  return {
    user,
    loading,
    isAdmin,
    signOut,
  };
}