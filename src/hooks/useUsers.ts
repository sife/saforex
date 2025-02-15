import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  is_banned: boolean;
  last_login: string | null;
  created_at: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('users_profile')
        .select(`
          id,
          full_name,
          email,
          is_banned,
          last_login,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleBan = async (userId: string, isBanned: boolean) => {
    try {
      setError(null);
      const { error } = await supabase
        .from('users_profile')
        .update({ is_banned: isBanned })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_banned } : user
      ));
    } catch (error) {
      console.error('Error toggling user ban:', error);
      setError(error as Error);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setError(null);
      const { error } = await supabase
        .from('users_profile')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error as Error);
    }
  };

  return {
    users,
    loading,
    error,
    loadUsers,
    toggleBan,
    deleteUser,
  };
}