export interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  level: number;
  xp: number;
  streak: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name?: string;
  roadmap_generations_count: number;
  plan: string;
  plan_activated_at?: string;
  plan_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StudyTopic {
  id: string;
  title: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: {
    overview: string;
    important_dates: Array<{ date: string; event: string }>;
    key_people: Array<{ name: string; role: string }>;
    cause_effect: Array<{ cause: string; effect: string }>;
    timeline: Array<{ year: string; event: string }>;
    mcqs: Array<{
      question: string;
      options: string[];
      correct_answer: number;
      explanation: string;
    }>;
  };
  tags: string[];
  study_time_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: Array<{
    id: string;
    question: string;
    type: 'mcq' | 'true_false';
    options: string[];
    correct_answer: number;
    explanation: string;
    points: number;
  }>;
  total_points: number;
  time_limit_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id?: string;
  quiz_type: string;
  score: number;
  total_questions: number;
  total_points?: number;
  accuracy?: number;
  time_taken_seconds?: number;
  answers?: Array<{
    question_id: string;
    selected_answer: number;
    is_correct: boolean;
    points_earned: number;
  }>;
  xp_earned: number;
  created_at: string;
  completed_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  topic: string;
  duration: number;
  xp_earned: number;
  created_at: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  importance: 'low' | 'medium' | 'high';
  source: string;
  image_url?: string;
  published_at: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: {
    type: string;
    target: number;
    current?: number;
  };
  xp_reward: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export interface Leaderboard {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  total_xp: number;
  level: number;
  rank: number;
}

export interface UserStats {
  user_id: string;
  total_xp: number;
  current_level: number;
  total_quizzes_completed: number;
  total_correct_answers: number;
  total_questions_attempted: number;
  average_accuracy: number;
  total_study_time_minutes: number;
  current_streak: number;
  best_streak: number;
  last_activity_date: string;
  updated_at: string;
}

export interface PaymentOrder {
  id: string;
  user_id: string;
  order_id: string;
  payment_id?: string;
  amount: number;
  currency: string;
  plan: string;
  status: string;
  created_at: string;
  updated_at: string;
}