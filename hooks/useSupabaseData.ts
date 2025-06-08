import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useUserProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        // Create profile if it doesn't exist
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user?.id,
            full_name: user?.user_metadata?.full_name || 'Student',
            roadmap_generations_count: 0,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setProfile(newProfile);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user?.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  return { profile, loading, error, updateProfile, refetch: fetchProfile };
};

export const useSmartNotes = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('smart_notes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (noteData: any) => {
    try {
      const { data, error } = await supabase
        .from('smart_notes')
        .insert({
          ...noteData,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      setNotes(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  return { notes, loading, error, createNote, refetch: fetchNotes };
};

export const useGenerationCounts = () => {
  const [counts, setCounts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCounts();
    }
  }, [user]);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('generation_counts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setCounts(data || { count: 0 });
    } catch (err: any) {
      console.error('Error fetching generation counts:', err);
    } finally {
      setLoading(false);
    }
  };

  const incrementCount = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase.rpc('increment_generation_count', {
        p_user_id: user?.id,
        p_date: today,
      });

      if (error) throw error;
      await fetchCounts();
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return { counts, loading, incrementCount, refetch: fetchCounts };
};

export const useUserAchievements = () => {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user?.id)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (err: any) {
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const unlockAchievement = async (achievementId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user?.id,
          achievement_id: achievementId,
        })
        .select()
        .single();

      if (error) throw error;
      setAchievements(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  return { achievements, loading, unlockAchievement, refetch: fetchAchievements };
};