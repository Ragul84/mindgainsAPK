import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface UserStats {
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
  totalXP: number;
  currentLevel: number;
  currentStreak: number;
  bestStreak: number;
  totalStudyTime: number;
}

export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats>({
    totalQuizzes: 0,
    averageScore: 0,
    bestScore: 0,
    totalXP: 0,
    currentLevel: 1,
    currentStreak: 0,
    bestStreak: 0,
    totalStudyTime: 0,
  });
  
  // Separate loading states
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [hasData, setHasData] = useState(false);
  
  const { user } = useAuth();
  
  // Cache duration (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchStats = useCallback(async (forceRefresh = false) => {
    if (!user) {
      console.log('❌ No user found, skipping stats fetch');
      setIsInitialLoading(false);
      return;
    }

    const now = Date.now();
    const shouldFetch = forceRefresh || !hasData || (now - lastFetchTime > CACHE_DURATION);
    
    if (!shouldFetch) {
      console.log('📊 Using cached stats, skipping fetch');
      return;
    }

    try {
      console.log('📊 Fetching stats for user:', user.id);
      
      // Only show loading states when appropriate
      if (!hasData) {
        setIsInitialLoading(true);
        console.log('📊 Initial stats loading...');
      } else if (forceRefresh) {
        setIsRefreshing(true);
        console.log('📊 Refreshing stats...');
      }

      // Get user stats from the user_stats table (primary source)
      const { data: userStatsData, error: userStatsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (userStatsError && userStatsError.code !== 'PGRST116') {
        console.error('❌ Error fetching user stats:', userStatsError);
      }
      console.log('📊 User stats from DB:', userStatsData);

      // Get the user's current XP and level from the users table as fallback
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('xp, level, streak')
        .eq('id', user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('❌ Error fetching user data:', userError);
      }
      console.log('👤 User data from DB:', userData);

      // Calculate stats using user_stats table as primary source, with fallbacks
      const newStats: UserStats = {
        totalQuizzes: userStatsData?.total_quizzes_completed || 0,
        averageScore: userStatsData?.average_accuracy || 0,
        bestScore: 0, // Calculate from quiz_attempts if needed
        totalXP: userStatsData?.total_xp || userData?.xp || 0,
        currentLevel: userStatsData?.current_level || userData?.level || 1,
        currentStreak: userStatsData?.current_streak || userData?.streak || 0,
        bestStreak: userStatsData?.best_streak || userData?.streak || 0,
        totalStudyTime: userStatsData?.total_study_time_minutes || 0,
      };

      // If we need best score, get it from quiz_attempts
      if (newStats.totalQuizzes > 0) {
        const { data: quizAttempts, error: quizError } = await supabase
          .from('quiz_attempts')
          .select('score')
          .eq('user_id', user.id)
          .order('score', { ascending: false })
          .limit(1);

        if (!quizError && quizAttempts && quizAttempts.length > 0) {
          newStats.bestScore = quizAttempts[0].score || 0;
        }
      }

      setStats(newStats);
      setHasData(true);
      setLastFetchTime(now);
      console.log('📊 Stats updated successfully:', newStats);

    } catch (error) {
      console.error('❌ Error fetching user stats:', error);
      // Don't reset stats on error - keep showing cached data
      // Only set hasData to false if this was the initial load
      if (!hasData) {
        setIsInitialLoading(false);
      }
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [user, hasData, lastFetchTime]);

  // Function to update stats after quiz completion
  const updateStatsAfterQuiz = useCallback(async (score: number, xpEarned: number, correctAnswers: number, totalQuestions: number) => {
    if (!user) return;

    try {
      console.log('📊 Updating stats after quiz:', { score, xpEarned, correctAnswers, totalQuestions });

      // First, update the users table with new XP
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('xp, level')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching current user data:', fetchError);
        return;
      }

      const newXP = (currentUser?.xp || 0) + xpEarned;
      const newLevel = Math.floor(newXP / 1000) + 1; // Simple level calculation

      const { error: updateUserError } = await supabase
        .from('users')
        .update({ 
          xp: newXP,
          level: newLevel
        })
        .eq('id', user.id);

      if (updateUserError) {
        console.error('❌ Error updating user XP/level:', updateUserError);
      }

      // Now update or insert user_stats
      const { data: existingStats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
      
      if (statsError && statsError.code === 'PGRST116') {
        // No existing stats, create new record
        const { error: insertError } = await supabase
          .from('user_stats')
          .insert({
            user_id: user.id,
            total_xp: newXP,
            current_level: newLevel,
            total_quizzes_completed: 1,
            total_correct_answers: correctAnswers,
            total_questions_attempted: totalQuestions,
            average_accuracy: accuracy,
            last_activity_date: new Date().toISOString().split('T')[0],
          });

        if (insertError) {
          console.error('❌ Error inserting user stats:', insertError);
        }
      } else if (!statsError && existingStats) {
        // Update existing stats
        const totalQuizzes = (existingStats.total_quizzes_completed || 0) + 1;
        const totalCorrect = (existingStats.total_correct_answers || 0) + correctAnswers;
        const totalAttempted = (existingStats.total_questions_attempted || 0) + totalQuestions;
        const newAverageAccuracy = Math.round((totalCorrect / totalAttempted) * 100);

        const { error: updateError } = await supabase
          .from('user_stats')
          .update({
            total_xp: newXP,
            current_level: newLevel,
            total_quizzes_completed: totalQuizzes,
            total_correct_answers: totalCorrect,
            total_questions_attempted: totalAttempted,
            average_accuracy: newAverageAccuracy,
            last_activity_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('❌ Error updating user stats:', updateError);
        }
      }

      // Refresh stats to show updated values
      await fetchStats(true);

    } catch (error) {
      console.error('❌ Error updating stats after quiz:', error);
    }
  }, [user, fetchStats]);

  // Initial fetch when user changes or component mounts
  useEffect(() => {
    if (user) {
      fetchStats();
    } else {
      // Reset everything when user logs out
      setStats({
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        totalXP: 0,
        currentLevel: 1,
        currentStreak: 0,
        bestStreak: 0,
        totalStudyTime: 0,
      });
      setHasData(false);
      setIsInitialLoading(true);
      setLastFetchTime(0);
    }
  }, [user?.id]); // Only trigger when user ID changes

  const refreshStats = useCallback(() => {
    fetchStats(true);
  }, [fetchStats]);

  return {
    stats,
    loading: isInitialLoading && !hasData, // Only show loading on initial load
    refreshing: isRefreshing,
    refreshStats,
    updateStatsAfterQuiz,
    hasData, // Useful for conditional rendering
  };
};