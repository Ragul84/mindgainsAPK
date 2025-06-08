import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// These environment variables should be set in your .env file
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Enhanced error checking with more specific messages
if (!supabaseUrl || supabaseUrl.includes('your-project-ref') || supabaseUrl === 'your_supabase_project_url') {
  console.warn('⚠️ EXPO_PUBLIC_SUPABASE_URL is not configured. Please set your actual Supabase project URL in the .env file.');
}

if (!supabaseAnonKey || supabaseAnonKey.includes('your-actual-anon-key') || supabaseAnonKey === 'your_supabase_anon_key') {
  console.warn('⚠️ EXPO_PUBLIC_SUPABASE_ANON_KEY is not configured. Please set your actual Supabase anonymous key in the .env file.');
}

// Validate URL format only if URL is provided and properly configured
if (supabaseUrl && !supabaseUrl.includes('your-project-ref') && supabaseUrl !== 'your_supabase_project_url') {
  try {
    new URL(supabaseUrl);
  } catch {
    console.warn('⚠️ EXPO_PUBLIC_SUPABASE_URL is not a valid URL. Please check your Supabase project URL.');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic session refresh
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    // Disable email confirmation for development
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'mindgains-ai'
    }
  }
});

// Test connection function - only run if properly configured
export const testSupabaseConnection = async () => {
  // Skip connection test if Supabase is not properly configured
  if (!supabaseUrl || 
      !supabaseAnonKey || 
      supabaseUrl.includes('your-project-ref') || 
      supabaseUrl === 'your_supabase_project_url' ||
      supabaseAnonKey.includes('your-actual-anon-key') || 
      supabaseAnonKey === 'your_supabase_anon_key') {
    console.log('⚠️ Skipping Supabase connection test - credentials not configured');
    return false;
  }

  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error.message);
      return false;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (networkError) {
    console.error('❌ Network error connecting to Supabase:', networkError);
    return false;
  }
};

// Auth helpers with better error handling
export const signUp = async (email: string, password: string, userData?: any) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: undefined // Disable email confirmation
      },
    });
    
    if (error) {
      console.error('Sign up error:', error.message);
    } else {
      console.log('✅ Sign up successful:', data.user?.email);
    }
    
    return { data, error };
  } catch (networkError) {
    console.error('❌ Network error during sign up:', networkError);
    return { 
      data: null, 
      error: { 
        message: 'Network error: Unable to connect to Supabase. Please check your internet connection and Supabase configuration.',
        details: networkError
      } 
    };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign in error:', error.message);
    } else {
      console.log('✅ Sign in successful:', data.user?.email);
    }
    
    return { data, error };
  } catch (networkError) {
    console.error('❌ Network error during sign in:', networkError);
    return { 
      data: null, 
      error: { 
        message: 'Network error: Unable to connect to Supabase. Please check your internet connection and Supabase configuration.',
        details: networkError
      } 
    };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error.message);
    } else {
      console.log('✅ Sign out successful');
    }
    return { error };
  } catch (networkError) {
    console.error('❌ Network error during sign out:', networkError);
    return { 
      error: { 
        message: 'Network error: Unable to connect to Supabase. Please check your internet connection and Supabase configuration.',
        details: networkError
      } 
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  } catch (networkError) {
    console.error('❌ Network error getting current user:', networkError);
    return { 
      user: null, 
      error: { 
        message: 'Network error: Unable to connect to Supabase. Please check your internet connection and Supabase configuration.',
        details: networkError
      } 
    };
  }
};

// Only initialize connection test if properly configured
if (supabaseUrl && 
    supabaseAnonKey && 
    !supabaseUrl.includes('your-project-ref') && 
    supabaseUrl !== 'your_supabase_project_url' &&
    !supabaseAnonKey.includes('your-actual-anon-key') && 
    supabaseAnonKey !== 'your_supabase_anon_key') {
  testSupabaseConnection();
}

// Quiz helpers
export const getQuizQuestions = async (category?: string, difficulty?: string, limit = 10) => {
  try {
    let query = supabase.from('quiz_questions').select('*');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  } catch (networkError) {
    return { 
      data: null, 
      error: { 
        message: 'Failed to fetch quiz questions',
        details: networkError
      } 
    };
  }
};

export const saveQuizAttempt = async (attempt: any) => {
  try {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert(attempt)
      .select()
      .single();
    return { data, error };
  } catch (networkError) {
    return { 
      data: null, 
      error: { 
        message: 'Failed to save quiz attempt',
        details: networkError
      } 
    };
  }
};

export const getUserQuizHistory = async (userId: string, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit);
    return { data, error };
  } catch (networkError) {
    return { 
      data: null, 
      error: { 
        message: 'Failed to fetch quiz history',
        details: networkError
      } 
    };
  }
};

export const getUserStats = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // Handle case where no user stats exist yet
    if (error && error.code === 'PGRST116') {
      // No rows found - return null data with no error
      return { data: null, error: null };
    }
    
    return { data, error };
  } catch (networkError) {
    return { 
      data: null, 
      error: { 
        message: 'Failed to fetch user stats',
        details: networkError
      } 
    };
  }
};

export const getLeaderboard = async (limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('user_id, total_xp, current_level')
      .order('total_xp', { ascending: false })
      .limit(limit);
    return { data, error };
  } catch (networkError) {
    return { 
      data: null, 
      error: { 
        message: 'Failed to fetch leaderboard',
        details: networkError
      } 
    };
  }
};

export const getNewsArticles = async (category?: string, limit = 20) => {
  try {
    let query = supabase.from('news_articles').select('*');
    
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query
      .order('published_at', { ascending: false })
      .limit(limit);
    return { data, error };
  } catch (networkError) {
    return { 
      data: null, 
      error: { 
        message: 'Failed to fetch news articles',
        details: networkError
      } 
    };
  }
};

export const getStudyTopics = async (category?: string, difficulty?: string) => {
  try {
    let query = supabase.from('study_topics').select('*');
    
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  } catch (networkError) {
    return { 
      data: null, 
      error: { 
        message: 'Failed to fetch study topics',
        details: networkError
      } 
    };
  }
};

export const createStudySession = async (session: any) => {
  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .insert(session)
      .select()
      .single();
    return { data, error };
  } catch (networkError) {
    return { 
      data: null, 
      error: { 
        message: 'Failed to create study session',
        details: networkError
      } 
    };
  }
};

export const updateStudySession = async (sessionId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();
    return { data, error };
  } catch (networkError) {
    return { 
      data: null, 
      error: { 
        message: 'Failed to update study session',
        details: networkError
      } 
    };
  }
};

export const getUserAchievements = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);
    return { data, error };
  } catch (networkError) {
    return { 
      data: null, 
      error: { 
        message: 'Failed to fetch user achievements',
        details: networkError
      } 
    };
  }
};

export const unlockAchievement = async (userId: string, achievementId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
      })
      .select()
      .single();
    return { data, error };
  } catch (networkError) {
    return { 
      data: null, 
      error: { 
        message: 'Failed to unlock achievement',
        details: networkError
      } 
    };
  }
};

export const getDailyChallenge = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('date', today)
      .single();
    return { data, error };
  } catch (networkError) {
    return { 
      data: null, 
      error: { 
        message: 'Failed to fetch daily challenge',
        details: networkError
      } 
    };
  }
};

export const submitDailyChallengeAttempt = async (userId: string, challengeId: string, score: number) => {
  try {
    const { data, error } = await supabase
      .from('daily_challenge_attempts')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        score: score,
      })
      .select()
      .single();
    return { data, error };
  } catch (networkError) {
    return { 
      data: null, 
      error: { 
        message: 'Failed to submit daily challenge attempt',
        details: networkError
      } 
    };
  }
};