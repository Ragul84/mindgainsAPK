import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  points: number;
  category: string;
  difficulty: string;
}

interface QuizAttempt {
  quiz_type: string;
  score: number;
  total_questions: number;
  xp_earned: number;
  answers: number[];
  time_taken: number;
}

export const useQuiz = () => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const { user } = useAuth();

  const generateQuiz = async (
    topic: string,
    examType: string,
    difficulty: string,
    questionCount: number
  ) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          examType,
          difficulty,
          questionCount,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate quiz');
      }

      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setQuizStartTime(Date.now());

      return { success: true, questions: data.questions };
    } catch (error: any) {
      console.error('Quiz generation error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitQuiz = async () => {
    if (!user || questions.length === 0) return { success: false };

    setLoading(true);
    try {
      // Calculate score
      let correctAnswers = 0;
      let totalPoints = 0;

      questions.forEach((question, index) => {
        if (answers[index] === question.correct_answer) {
          correctAnswers++;
          totalPoints += question.points;
        }
      });

      const score = Math.round((correctAnswers / questions.length) * 100);
      const timeTaken = Math.round((Date.now() - quizStartTime) / 1000);
      const xpEarned = Math.round(totalPoints * (score / 100));

      // Save quiz attempt to database
      const quizAttempt: QuizAttempt = {
        quiz_type: questions[0]?.category || 'General',
        score,
        total_questions: questions.length,
        xp_earned: xpEarned,
        answers,
        time_taken: timeTaken,
      };

      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_type: quizAttempt.quiz_type,
          score: quizAttempt.score,
          total_questions: quizAttempt.total_questions,
          xp_earned: quizAttempt.xp_earned,
        });

      if (error) {
        console.error('Error saving quiz attempt:', error);
      }

      // Analyze performance
      const analysisResponse = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/analyze-quiz-performance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          quizAttemptId: 'temp_id', // Would be the actual ID from the insert
          questions,
          answers,
          timeSpent: timeTaken,
        }),
      });

      let analysis = null;
      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        analysis = analysisData.analysis;
      }

      return {
        success: true,
        results: {
          score,
          correctAnswers,
          totalQuestions: questions.length,
          xpEarned,
          timeTaken,
          analysis,
        },
      };
    } catch (error: any) {
      console.error('Quiz submission error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setQuizStartTime(0);
  };

  return {
    loading,
    questions,
    currentQuestionIndex,
    answers,
    generateQuiz,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    resetQuiz,
    currentQuestion: questions[currentQuestionIndex],
    isLastQuestion: currentQuestionIndex === questions.length - 1,
    progress: questions.length > 0 ? (currentQuestionIndex + 1) / questions.length : 0,
  };
};