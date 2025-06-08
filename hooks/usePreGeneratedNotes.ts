import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PreGeneratedNote {
  id: string;
  topic: string;
  category: string;
  difficulty: string;
  content: {
    overview: string;
    timeline: Array<{ year: string; event: string }>;
    keyPeople: Array<{ name: string; role: string; description: string }>;
    dynasties: Array<{ name: string; founder: string; period: string; capital: string }>;
    importantFacts: string[];
    causes: Array<{ cause: string; effect: string }>;
    significance: string[];
  };
  status: string;
  priority: number;
  view_count: number;
  tags: string[];
  estimated_read_time: number;
  created_at: string;
  updated_at: string;
}

interface NoteSuggestion {
  id: string;
  note_id: string;
  category: string;
  display_order: number;
  is_featured: boolean;
  note: PreGeneratedNote;
}

export const usePreGeneratedNotes = () => {
  const [suggestions, setSuggestions] = useState<NoteSuggestion[]>([]);
  const [featuredNotes, setFeaturedNotes] = useState<NoteSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async (category?: string) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('note_suggestions')
        .select(`
          *,
          note:pre_generated_notes(*)
        `)
        .order('display_order', { ascending: true });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      const typedData = data as NoteSuggestion[];
      setSuggestions(typedData);
      setFeaturedNotes(typedData.filter(item => item.is_featured));
      
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching pre-generated notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const getNote = async (topic: string): Promise<PreGeneratedNote | null> => {
    try {
      const { data, error } = await supabase
        .from('pre_generated_notes')
        .select('*')
        .eq('topic', topic)
        .eq('status', 'published')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        throw error;
      }

      // Increment view count
      await supabase.rpc('increment_note_view_count', { note_id: data.id });

      return data as PreGeneratedNote;
    } catch (err: any) {
      console.error('Error fetching note:', err);
      return null;
    }
  };

  const searchNotes = async (searchTerm: string): Promise<PreGeneratedNote[]> => {
    try {
      const { data, error } = await supabase
        .from('pre_generated_notes')
        .select('*')
        .eq('status', 'published')
        .or(`topic.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
        .order('priority', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data as PreGeneratedNote[];
    } catch (err: any) {
      console.error('Error searching notes:', err);
      return [];
    }
  };

  const getPopularNotes = async (limit = 5): Promise<PreGeneratedNote[]> => {
    try {
      const { data, error } = await supabase
        .from('pre_generated_notes')
        .select('*')
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data as PreGeneratedNote[];
    } catch (err: any) {
      console.error('Error fetching popular notes:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  return {
    suggestions,
    featuredNotes,
    loading,
    error,
    fetchSuggestions,
    getNote,
    searchNotes,
    getPopularNotes,
  };
};