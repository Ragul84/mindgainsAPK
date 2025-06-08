import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useUserStats } from '@/hooks/useUserStats';
import { supabase } from '@/lib/supabase';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Trophy, Target, Clock, Star, Brain, Play, ArrowRight, ArrowLeft, CircleCheck as CheckCircle, Circle as XCircle, Plus, Settings } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Question {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  category: string;
  difficulty: string;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function QuizScreen() {
  const [quizMode, setQuizMode] = useState<'menu' | 'custom' | 'quiz' | 'results'>('menu');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Custom Quiz Settings
  const [customTopic, setCustomTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('intermediate');
  const [questionCount, setQuestionCount] = useState(5);
  
  const { user } = useAuth();
  const { stats, loading: statsLoading, refreshStats, updateStatsAfterQuiz } = useUserStats();

  const difficulties = [
    { id: 'beginner', name: 'Beginner', color: '#10B981', description: 'Basic concepts' },
    { id: 'intermediate', name: 'Intermediate', color: '#F59E0B', description: 'Moderate difficulty' },
    { id: 'advanced', name: 'Advanced', color: '#EF4444', description: 'Expert level' },
  ];

  // Refresh stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 Quiz screen focused, refreshing stats...');
      refreshStats();
    }, [refreshStats])
  );

  // Sample UPSC/TNPSC questions database
  const questionBank: Question[] = [
    // Current Affairs
    {
      id: 1,
      question: "Which country hosted the G20 Summit in 2023?",
      options: ["India", "Indonesia", "Italy", "Japan"],
      correct_answer: 0,
      explanation: "India hosted the G20 Summit in New Delhi in September 2023 under its presidency.",
      category: "Current Affairs",
      difficulty: "Easy"
    },
    {
      id: 2,
      question: "The Chandrayaan-3 mission successfully landed on which part of the Moon?",
      options: ["North Pole", "South Pole", "Equator", "Far Side"],
      correct_answer: 1,
      explanation: "Chandrayaan-3 successfully landed near the Moon's South Pole in August 2023, making India the first country to achieve this feat.",
      category: "Current Affairs",
      difficulty: "Medium"
    },
    {
      id: 3,
      question: "Which Indian state recently became the first to implement the Uniform Civil Code?",
      options: ["Gujarat", "Uttarakhand", "Himachal Pradesh", "Goa"],
      correct_answer: 1,
      explanation: "Uttarakhand became the first state to implement the Uniform Civil Code in 2024.",
      category: "Current Affairs",
      difficulty: "Medium"
    },

    // History
    {
      id: 4,
      question: "Who was the founder of the Mauryan Empire?",
      options: ["Ashoka", "Chandragupta Maurya", "Bindusara", "Bimbisara"],
      correct_answer: 1,
      explanation: "Chandragupta Maurya founded the Mauryan Empire around 321 BCE with the help of Chanakya.",
      category: "History",
      difficulty: "Easy"
    },
    {
      id: 5,
      question: "The Battle of Plassey was fought in which year?",
      options: ["1757", "1764", "1761", "1767"],
      correct_answer: 0,
      explanation: "The Battle of Plassey was fought on June 23, 1757, between the British East India Company and the Nawab of Bengal.",
      category: "History",
      difficulty: "Medium"
    },
    {
      id: 6,
      question: "Who founded the Indian National Congress?",
      options: ["Dadabhai Naoroji", "A.O. Hume", "Surendranath Banerjee", "W.C. Bonnerjee"],
      correct_answer: 1,
      explanation: "Allan Octavian Hume, a British civil servant, founded the Indian National Congress in 1885.",
      category: "History",
      difficulty: "Medium"
    },

    // Polity
    {
      id: 7,
      question: "How many fundamental rights are guaranteed by the Indian Constitution?",
      options: ["6", "7", "8", "9"],
      correct_answer: 0,
      explanation: "The Indian Constitution guarantees 6 fundamental rights: Right to Equality, Right to Freedom, Right against Exploitation, Right to Freedom of Religion, Cultural and Educational Rights, and Right to Constitutional Remedies.",
      category: "Polity",
      difficulty: "Easy"
    },
    {
      id: 8,
      question: "Which article of the Constitution deals with the Right to Constitutional Remedies?",
      options: ["Article 32", "Article 21", "Article 19", "Article 14"],
      correct_answer: 0,
      explanation: "Article 32 is known as the 'Heart and Soul' of the Constitution as it guarantees the Right to Constitutional Remedies.",
      category: "Polity",
      difficulty: "Medium"
    },
    {
      id: 9,
      question: "The concept of 'Basic Structure' of the Constitution was established in which case?",
      options: ["Golaknath Case", "Kesavananda Bharati Case", "Minerva Mills Case", "Maneka Gandhi Case"],
      correct_answer: 1,
      explanation: "The Kesavananda Bharati case (1973) established the doctrine of Basic Structure, limiting Parliament's power to amend the Constitution.",
      category: "Polity",
      difficulty: "Hard"
    },

    // Science & Technology
    {
      id: 10,
      question: "What is the chemical formula of ozone?",
      options: ["O2", "O3", "O4", "H2O"],
      correct_answer: 1,
      explanation: "Ozone has the chemical formula O3, consisting of three oxygen atoms.",
      category: "Science",
      difficulty: "Easy"
    },
    {
      id: 11,
      question: "Which vitamin is produced when skin is exposed to sunlight?",
      options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"],
      correct_answer: 3,
      explanation: "Vitamin D is synthesized in the skin when exposed to UVB radiation from sunlight.",
      category: "Science",
      difficulty: "Easy"
    },
    {
      id: 12,
      question: "ISRO's Mars Orbiter Mission is also known as:",
      options: ["Mangalyaan", "Chandrayaan", "Aditya", "Astrosat"],
      correct_answer: 0,
      explanation: "Mangalyaan (Mars Orbiter Mission) was India's first interplanetary mission launched in 2013.",
      category: "Science",
      difficulty: "Medium"
    },

    // Geography
    {
      id: 13,
      question: "Which is the longest river in India?",
      options: ["Yamuna", "Ganga", "Godavari", "Narmada"],
      correct_answer: 1,
      explanation: "The Ganga is the longest river in India, flowing for about 2,525 kilometers.",
      category: "Geography",
      difficulty: "Easy"
    },
    {
      id: 14,
      question: "The Tropic of Cancer passes through how many Indian states?",
      options: ["6", "7", "8", "9"],
      correct_answer: 2,
      explanation: "The Tropic of Cancer passes through 8 Indian states: Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram.",
      category: "Geography",
      difficulty: "Medium"
    },
    {
      id: 15,
      question: "Which mountain range separates India from China?",
      options: ["Himalayas", "Karakoram", "Aravalli", "Western Ghats"],
      correct_answer: 0,
      explanation: "The Himalayas form the natural boundary between India and China.",
      category: "Geography",
      difficulty: "Easy"
    },

    // Economics
    {
      id: 16,
      question: "What does GDP stand for?",
      options: ["Gross Domestic Product", "General Development Program", "Global Development Plan", "Gross Development Product"],
      correct_answer: 0,
      explanation: "GDP stands for Gross Domestic Product, which measures the total value of goods and services produced in a country.",
      category: "Economics",
      difficulty: "Easy"
    },
    {
      id: 17,
      question: "The Reserve Bank of India was established in which year?",
      options: ["1935", "1947", "1950", "1969"],
      correct_answer: 0,
      explanation: "The Reserve Bank of India was established on April 1, 1935, under the Reserve Bank of India Act, 1934.",
      category: "Economics",
      difficulty: "Medium"
    },
    {
      id: 18,
      question: "Which committee recommended the establishment of Regional Rural Banks?",
      options: ["Narasimham Committee", "Kelkar Committee", "Narasimham Committee", "M. Narasimham Committee"],
      correct_answer: 0,
      explanation: "The Narasimham Committee recommended the establishment of Regional Rural Banks in 1975.",
      category: "Economics",
      difficulty: "Hard"
    },

    // Art & Culture
    {
      id: 19,
      question: "Bharatanatyam dance form originated in which state?",
      options: ["Kerala", "Karnataka", "Tamil Nadu", "Andhra Pradesh"],
      correct_answer: 2,
      explanation: "Bharatanatyam is a classical dance form that originated in Tamil Nadu.",
      category: "Art & Culture",
      difficulty: "Easy"
    },
    {
      id: 20,
      question: "The Ajanta Caves are famous for:",
      options: ["Sculptures", "Paintings", "Architecture", "All of the above"],
      correct_answer: 3,
      explanation: "The Ajanta Caves are renowned for their ancient Buddhist rock-cut cave monuments, featuring sculptures, paintings, and architecture.",
      category: "Art & Culture",
      difficulty: "Medium"
    }
  ];

  // Animation values
  const nextButtonScale = useSharedValue(0);
  const explanationOpacity = useSharedValue(0);

  useEffect(() => {
    if (showExplanation) {
      explanationOpacity.value = withTiming(1, { duration: 300 });
      nextButtonScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    } else {
      explanationOpacity.value = withTiming(0, { duration: 200 });
      nextButtonScale.value = withTiming(0, { duration: 200 });
    }
  }, [showExplanation]);

  const animatedExplanationStyle = useAnimatedStyle(() => ({
    opacity: explanationOpacity.value,
    transform: [{ scale: explanationOpacity.value }],
  }));

  const animatedNextButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nextButtonScale.value }],
  }));

  const startQuiz = () => {
    // Get 5 random questions from different categories
    const shuffled = [...questionBank].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 5);
    
    setQuestions(selectedQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowExplanation(false);
    setQuizMode('quiz');
  };

  const generateCustomQuiz = async () => {
    if (!customTopic.trim()) {
      Alert.alert('Error', 'Please enter a topic for your custom quiz');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: customTopic.trim(),
          examType: 'UPSC Civil Services',
          difficulty: selectedDifficulty,
          questionCount,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate custom quiz');
      }

      // Convert API response to our question format
      const formattedQuestions = data.questions.map((q: any, index: number) => ({
        id: index + 1,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        category: customTopic,
        difficulty: selectedDifficulty,
      }));

      setQuestions(formattedQuestions);
      setCurrentQuestionIndex(0);
      setSelectedAnswers([]);
      setShowExplanation(false);
      setQuizMode('quiz');
    } catch (error: any) {
      console.error('Custom quiz generation error:', error);
      Alert.alert('Error', error.message || 'Failed to generate custom quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (answerIndex: number) => {
    if (showExplanation) return;
    
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowExplanation(selectedAnswers[currentQuestionIndex - 1] !== undefined);
    }
  };

  const finishQuiz = async () => {
    const correctAnswers = questions.reduce((count, question, index) => {
      return count + (selectedAnswers[index] === question.correct_answer ? 1 : 0);
    }, 0);

    const score = Math.round((correctAnswers / questions.length) * 100);
    const xpEarned = correctAnswers * 20; // 20 XP per correct answer

    const results = {
      score,
      correctAnswers,
      totalQuestions: questions.length,
      xpEarned,
      questions: questions.map((q, index) => ({
        ...q,
        selectedAnswer: selectedAnswers[index],
        isCorrect: selectedAnswers[index] === q.correct_answer,
      })),
    };

    setQuizResults(results);
    setQuizMode('results');

    // Save quiz attempt to database and update stats
    if (user) {
      try {
        console.log('💾 Saving quiz attempt:', { score, xpEarned });
        
        const { error } = await supabase
          .from('quiz_attempts')
          .insert({
            user_id: user.id,
            quiz_type: questions[0]?.category || 'Mixed Quiz',
            score,
            total_questions: questions.length,
            xp_earned: xpEarned,
            completed_at: new Date().toISOString(),
          });

        if (error) {
          console.error('❌ Error saving quiz attempt:', error);
          Alert.alert('Error', 'Failed to save quiz results. Please try again.');
        } else {
          console.log('✅ Quiz attempt saved successfully');
          // Update stats after successful save - pass all required parameters
          await updateStatsAfterQuiz(score, xpEarned, correctAnswers, questions.length);
        }
      } catch (error) {
        console.error('❌ Error saving quiz attempt:', error);
        Alert.alert('Error', 'Failed to save quiz results. Please try again.');
      }
    }
  };

  const resetQuiz = () => {
    setQuizMode('menu');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowExplanation(false);
    setQuizResults(null);
    setCustomTopic('');
  };

  const StatCard = ({ 
    label, 
    value, 
    icon: Icon, 
    color 
  }: {
    label: string;
    value: string | number;
    icon: React.ComponentType<any>;
    color: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon size={20} color={color} strokeWidth={2.5} />
      </View>
      <Text style={styles.statValue}>
        {statsLoading ? (
          <View style={styles.loadingDots}>
            <View style={[styles.loadingDot, { backgroundColor: color }]} />
            <View style={[styles.loadingDot, { backgroundColor: color }]} />
            <View style={[styles.loadingDot, { backgroundColor: color }]} />
          </View>
        ) : (
          value
        )}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const DifficultyButton = ({ 
    difficulty, 
    isSelected, 
    onPress 
  }: {
    difficulty: typeof difficulties[0];
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.difficultyButton,
        isSelected && { backgroundColor: difficulty.color + '20', borderColor: difficulty.color },
      ]}
      onPress={onPress}
    >
      <View style={[
        styles.difficultyDot,
        { backgroundColor: difficulty.color }
      ]} />
      <View style={styles.difficultyContent}>
        <Text style={[
          styles.difficultyName,
          isSelected && { color: difficulty.color }
        ]}>
          {difficulty.name}
        </Text>
        <Text style={styles.difficultyDescription}>
          {difficulty.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Custom Quiz Screen
  if (quizMode === 'custom') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.customHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setQuizMode('menu')}
            >
              <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.customTitle}>Custom Quiz</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Topic Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Quiz Topic</Text>
            <TextInput
              style={styles.topicInput}
              placeholder="Enter any topic (e.g., Delhi Sultanate, Quantum Physics)"
              placeholderTextColor="#6B7280"
              value={customTopic}
              onChangeText={setCustomTopic}
            />
          </View>

          {/* Difficulty Selection */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Difficulty Level</Text>
            <View style={styles.difficultyButtons}>
              {difficulties.map((difficulty) => (
                <DifficultyButton
                  key={difficulty.id}
                  difficulty={difficulty}
                  isSelected={selectedDifficulty === difficulty.id}
                  onPress={() => setSelectedDifficulty(difficulty.id)}
                />
              ))}
            </View>
          </View>

          {/* Question Count */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Number of Questions</Text>
            <View style={styles.questionCountContainer}>
              {[5, 10, 15, 20].map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.countButton,
                    questionCount === count && styles.countButtonSelected,
                  ]}
                  onPress={() => setQuestionCount(count)}
                >
                  <Text style={[
                    styles.countButtonText,
                    questionCount === count && styles.countButtonTextSelected,
                  ]}>
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Generate Button */}
          <TouchableOpacity 
            style={styles.generateQuizButton}
            onPress={generateCustomQuiz}
            disabled={loading}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.generateQuizGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.generateQuizText}>
                {loading ? 'Generating...' : 'Generate Custom Quiz'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (quizMode === 'quiz') {
    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswer = selectedAnswers[currentQuestionIndex];

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.quizContainer}>
          {/* Quiz Header */}
          <View style={styles.quizHeader}>
            <TouchableOpacity onPress={resetQuiz} style={styles.backButton}>
              <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.questionCounter}>
              {currentQuestionIndex + 1} / {questions.length}
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#00FF88', '#10B981']}
                style={[styles.progressFill, { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollableContent} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{currentQuestion.category}</Text>
            </View>
            
            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => {
                let optionStyle = styles.optionButton;
                let optionTextStyle = styles.optionText;

                if (showExplanation) {
                  if (index === currentQuestion.correct_answer) {
                    optionStyle = styles.correctOption;
                    optionTextStyle = styles.correctOptionText;
                  } else if (index === selectedAnswer && index !== currentQuestion.correct_answer) {
                    optionStyle = styles.wrongOption;
                    optionTextStyle = styles.wrongOptionText;
                  }
                } else if (index === selectedAnswer) {
                  optionStyle = styles.selectedOption;
                  optionTextStyle = styles.selectedOptionText;
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={optionStyle}
                    onPress={() => selectAnswer(index)}
                    disabled={showExplanation}
                  >
                    <View style={styles.optionContent}>
                      <Text style={styles.optionLabel}>{String.fromCharCode(65 + index)}</Text>
                      <Text style={optionTextStyle}>{option}</Text>
                      {showExplanation && index === currentQuestion.correct_answer && (
                        <CheckCircle size={20} color="#10B981" strokeWidth={2} />
                      )}
                      {showExplanation && index === selectedAnswer && index !== currentQuestion.correct_answer && (
                        <XCircle size={20} color="#EF4444" strokeWidth={2} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Explanation */}
            {showExplanation && (
              <Animated.View style={[styles.explanationContainer, animatedExplanationStyle]}>
                <Text style={styles.explanationTitle}>Explanation</Text>
                <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
              </Animated.View>
            )}

            {/* Instructions when no answer selected */}
            {!showExplanation && selectedAnswer === undefined && (
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsText}>
                  💡 Select an answer to see the explanation
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Fixed Navigation at Bottom */}
          <View style={styles.fixedNavigationContainer}>
            {/* Previous Button */}
            <TouchableOpacity
              style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]}
              onPress={previousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft size={18} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>

            {/* Next Button - Only show when explanation is visible */}
            {showExplanation && (
              <AnimatedTouchableOpacity 
                style={[styles.nextButton, animatedNextButtonStyle]} 
                onPress={nextQuestion}
              >
                <Text style={styles.nextButtonText}>
                  {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                </Text>
                <ArrowRight size={18} color="#FFFFFF" strokeWidth={2} />
              </AnimatedTouchableOpacity>
            )}

            {/* Spacer when next button is not visible */}
            {!showExplanation && <View style={styles.buttonSpacer} />}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (quizMode === 'results') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
          {/* Results Header */}
          <LinearGradient
            colors={quizResults.score >= 80 ? ['#00FF88', '#10B981'] : 
                   quizResults.score >= 60 ? ['#F59E0B', '#F97316'] : ['#EF4444', '#DC2626']}
            style={styles.resultsHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Trophy size={48} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.resultsTitle}>Quiz Complete!</Text>
            <Text style={styles.scoreText}>{quizResults.score}%</Text>
            <Text style={styles.scoreSubtext}>
              {quizResults.correctAnswers} out of {quizResults.totalQuestions} correct
            </Text>
            <Text style={styles.xpText}>+{quizResults.xpEarned} XP earned</Text>
          </LinearGradient>

          {/* Performance Message */}
          <View style={styles.performanceContainer}>
            <Text style={styles.performanceText}>
              {quizResults.score >= 80 ? "Excellent work! 🎉" :
               quizResults.score >= 60 ? "Good job! Keep practicing! 👍" :
               "Keep studying and try again! 💪"}
            </Text>
          </View>

          {/* Question Review */}
          <View style={styles.reviewContainer}>
            <Text style={styles.reviewTitle}>Question Review</Text>
            {quizResults.questions.map((question: any, index: number) => (
              <View key={index} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewQuestionNumber}>Q{index + 1}</Text>
                  {question.isCorrect ? (
                    <CheckCircle size={20} color="#10B981" strokeWidth={2} />
                  ) : (
                    <XCircle size={20} color="#EF4444" strokeWidth={2} />
                  )}
                </View>
                <Text style={styles.reviewQuestion}>{question.question}</Text>
                <Text style={styles.reviewAnswer}>
                  Your answer: {question.options[question.selectedAnswer] || 'Not answered'}
                </Text>
                {!question.isCorrect && (
                  <Text style={styles.reviewCorrect}>
                    Correct answer: {question.options[question.correct_answer]}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.retryButton} onPress={startQuiz}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.homeButton} onPress={resetQuiz}>
              <Text style={styles.homeButtonText}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Quiz Arena</Text>
          <Text style={styles.subtitle}>Test your UPSC & TNPSC knowledge</Text>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <StatCard
              label="Total Quizzes"
              value={stats.totalQuizzes || 0}
              icon={Trophy}
              color="#00FF88"
            />
            <StatCard
              label="Average Score"
              value={`${stats.averageScore || 0}%`}
              icon={Target}
              color="#8B5CF6"
            />
            <StatCard
              label="Best Score"
              value={`${stats.bestScore || 0}%`}
              icon={Star}
              color="#F59E0B"
            />
            <StatCard
              label="Total XP"
              value={stats.totalXP || 0}
              icon={Brain}
              color="#EF4444"
            />
          </View>
        </View>

        {/* Quiz Options */}
        <View style={styles.quizOptionsSection}>
          {/* Quick Quiz */}
          <TouchableOpacity style={styles.quizOptionCard} onPress={startQuiz} activeOpacity={0.9}>
            <LinearGradient
              colors={['#00FF88', '#10B981']}
              style={styles.quizOptionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.quizOptionContent}>
                <Play size={32} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.quizOptionTitle}>Quick Quiz</Text>
                <Text style={styles.quizOptionDescription}>
                  5 random questions from all categories
                </Text>
                <View style={styles.quizOptionFeatures}>
                  <Text style={styles.quizOptionFeature}>• Mixed topics</Text>
                  <Text style={styles.quizOptionFeature}>• Instant explanations</Text>
                  <Text style={styles.quizOptionFeature}>• 20 XP per correct answer</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Custom Quiz */}
          <TouchableOpacity 
            style={styles.quizOptionCard} 
            onPress={() => setQuizMode('custom')} 
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.quizOptionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.quizOptionContent}>
                <Plus size={32} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.quizOptionTitle}>Custom Quiz</Text>
                <Text style={styles.quizOptionDescription}>
                  AI-generated questions on any topic
                </Text>
                <View style={styles.quizOptionFeatures}>
                  <Text style={styles.quizOptionFeature}>• Choose your topic</Text>
                  <Text style={styles.quizOptionFeature}>• Select difficulty</Text>
                  <Text style={styles.quizOptionFeature}>• 5-20 questions</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Categories Info */}
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesTitle}>Question Categories</Text>
          <View style={styles.categoriesGrid}>
            {['Current Affairs', 'History', 'Polity', 'Science', 'Geography', 'Economics', 'Art & Culture'].map((category) => (
              <View key={category} style={styles.categoryItem}>
                <Text style={styles.categoryItemText}>{category}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
    minHeight: 28,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  quizOptionsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  quizOptionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  quizOptionGradient: {
    flex: 1,
  },
  quizOptionContent: {
    padding: 24,
    alignItems: 'center',
  },
  quizOptionTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  quizOptionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  quizOptionFeatures: {
    alignItems: 'center',
  },
  quizOptionFeature: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  categoriesSection: {
    paddingHorizontal: 20,
  },
  categoriesTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryItemText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#D1D5DB',
  },

  // Custom Quiz Styles
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  topicInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  difficultyButtons: {
    gap: 12,
  },
  difficultyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  difficultyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
  },
  difficultyContent: {
    flex: 1,
  },
  difficultyName: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  difficultyDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  questionCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  countButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  countButtonSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: '#8B5CF6',
  },
  countButtonText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#9CA3AF',
  },
  countButtonTextSelected: {
    color: '#8B5CF6',
  },
  generateQuizButton: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  generateQuizGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  generateQuizText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },

  // Quiz Styles - UPDATED LAYOUT
  quizContainer: {
    flex: 1,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  questionCounter: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  scrollableContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
  },
  questionText: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedOption: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: '#8B5CF6',
  },
  correctOption: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  wrongOption: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#8B5CF6',
    marginRight: 12,
    minWidth: 20,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    flex: 1,
    lineHeight: 22,
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  correctOptionText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  wrongOptionText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  explanationContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: 16,
  },
  explanationTitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#3B82F6',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 20,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
    textAlign: 'center',
  },

  // FIXED NAVIGATION AT BOTTOM
  fixedNavigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0A0A0B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    // Add padding to account for tab bar
    paddingBottom: 100,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00FF88',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 140,
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginRight: 6,
  },
  buttonSpacer: {
    width: 140, // Same width as next button to maintain layout
  },

  // Results Styles
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  resultsHeader: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 48,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  scoreSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  xpText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  performanceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  performanceText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  reviewContainer: {
    marginBottom: 24,
  },
  reviewTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  reviewItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewQuestionNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#8B5CF6',
  },
  reviewQuestion: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewAnswer: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  reviewCorrect: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  actionButtons: {
    gap: 12,
    paddingBottom: 40,
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  homeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  homeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});