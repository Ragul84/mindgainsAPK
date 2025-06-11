import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  StatusBar,
  Animated as RNAnimated,
  Vibration,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useUserStats } from '@/hooks/useUserStats';
import { supabase } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

interface CurrentAffairsFact {
  id: string;
  topic: string;
  question: string;
  answer: string;
  options?: string[];
  type: 'reveal' | 'mcq' | 'true-false';
  category: 'politics' | 'economy' | 'international' | 'schemes' | 'general';
  difficulty: 'easy' | 'medium' | 'hard';
  examRelevance: number;
  keywords: string[];
  explanation: string;
  source?: string;
}

interface UserProgress {
  hearts: number;
  streak: number;
  totalXP: number;
  dailyXP: number;
  level: number;
  questionsToday: number;
  accuracy: number;
  achievements: string[];
  masteredTopics: string[];
}

const NewsScreen = () => {
  const { user } = useAuth();
  const { stats, updateCurrentAffairsStats, loading: statsLoading } = useUserStats();
  
  // Game State
  const [facts, setFacts] = useState<CurrentAffairsFact[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  
  // Gamification State
  const [progress, setProgress] = useState<UserProgress>({
    hearts: 3,
    streak: 0,
    totalXP: 0,
    dailyXP: 0,
    level: 1,
    questionsToday: 0,
    accuracy: 0,
    achievements: [],
    masteredTopics: []
  });

  // Animations
  const heartScale = useRef(new RNAnimated.Value(1)).current;
  const xpPulse = useRef(new RNAnimated.Value(1)).current;
  const cardSlide = useRef(new RNAnimated.Value(0)).current;
  const streakGlow = useRef(new RNAnimated.Value(0)).current;

  // Check if user is admin
  const isAdmin = user?.email === 'ragularvind84@gmail.com';

  // Fetch Today's Current Affairs from Supabase Database
  const fetchTodaysCurrentAffairs = async () => {
    try {
      setLoading(true);
      console.log('📰 Fetching today\'s current affairs from database...');
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data: todaysQuestions, error } = await supabase
        .from('current_affairs_daily')
        .select('*')
        .eq('date', today)
        .eq('is_active', true)
        .order('sequence_order', { ascending: true });

      if (error) {
        console.error('Error fetching from database:', error);
        throw error;
      }

      if (todaysQuestions && todaysQuestions.length > 0) {
        console.log(`✅ Found ${todaysQuestions.length} questions for today from database`);
        
        const formattedQuestions: CurrentAffairsFact[] = todaysQuestions.map((q: any) => ({
          id: q.id.toString(),
          topic: q.topic,
          question: q.question,
          answer: q.answer,
          options: q.options ? q.options : undefined,
          type: q.type,
          category: q.category,
          difficulty: q.difficulty,
          examRelevance: q.exam_relevance || 85,
          keywords: q.keywords || [],
          explanation: q.explanation || 'No explanation available.',
          source: q.source || 'Current Affairs Daily'
        }));
        
        setFacts(formattedQuestions);
      } else {
        console.log('⚠️ No questions found for today, using fallback questions');
        setFacts(getFallbackQuestions());
      }
      
    } catch (error) {
      console.error('❌ Database error, using fallback:', error);
      setFacts(getFallbackQuestions());
    } finally {
      setLoading(false);
    }
  };

  // Fallback questions if database is empty
  const getFallbackQuestions = (): CurrentAffairsFact[] => [
    {
      id: 'today_1',
      topic: 'Economic Survey 2025',
      question: 'What is India\'s projected GDP growth rate for 2025-26?',
      answer: '6.8%',
      options: ['6.2%', '6.5%', '6.8%', '7.1%'],
      type: 'mcq',
      category: 'economy',
      difficulty: 'medium',
      examRelevance: 95,
      keywords: ['GDP Growth', 'Economic Survey', 'Fiscal Year'],
      explanation: 'The Economic Survey 2025 projects India\'s GDP growth at 6.8% for FY 2025-26, driven by domestic consumption and investment.',
      source: 'Economic Survey 2025'
    },
    {
      id: 'today_2',
      topic: 'New Education Policy',
      question: 'NEP 2024 Amendment introduces coding from which class?',
      answer: 'Class 3',
      options: ['Class 1', 'Class 3', 'Class 5', 'Class 6'],
      type: 'mcq',
      category: 'schemes',
      difficulty: 'easy',
      examRelevance: 88,
      keywords: ['NEP 2024', 'Coding', 'Digital Education'],
      explanation: 'The NEP 2024 Amendment mandates coding and computational thinking from Class 3 onwards in all schools.',
      source: 'Ministry of Education'
    },
    {
      id: 'today_3',
      topic: 'Climate Summit 2025',
      question: 'India committed to achieve net-zero emissions by 2070',
      answer: 'true',
      type: 'true-false',
      category: 'international',
      difficulty: 'medium',
      examRelevance: 92,
      keywords: ['Net Zero', 'Climate Change', 'COP29'],
      explanation: 'India reaffirmed its commitment to achieve net-zero emissions by 2070 at the Global Climate Summit 2025.',
      source: 'Ministry of Environment'
    },
    {
      id: 'today_4',
      topic: 'Supreme Court Verdict',
      question: 'Which fundamental right was reinforced in the recent privacy judgment?',
      answer: 'Right to Privacy',
      type: 'reveal',
      category: 'politics',
      difficulty: 'hard',
      examRelevance: 96,
      keywords: ['Privacy Rights', 'Supreme Court', 'Fundamental Rights'],
      explanation: 'Supreme Court reinforced that Right to Privacy under Article 21 extends to digital spaces and AI surveillance.',
      source: 'Supreme Court of India'
    },
    {
      id: 'today_5',
      topic: 'Digital Rupee Update',
      question: 'RBI\'s Digital Rupee pilot covers 15 cities',
      answer: 'true',
      type: 'true-false',
      category: 'economy',
      difficulty: 'medium',
      examRelevance: 90,
      keywords: ['CBDC', 'Digital Rupee', 'RBI'],
      explanation: 'RBI expanded Digital Rupee (e₹) pilot to 15 major cities including Delhi, Mumbai, Bengaluru, and Chennai.',
      source: 'Reserve Bank of India'
    },
    {
      id: 'today_6',
      topic: 'Space Mission Update',
      question: 'Which is ISRO\'s next major mission after Chandrayaan-3?',
      answer: 'Gaganyaan',
      options: ['Mangalyaan-2', 'Gaganyaan', 'Shukrayaan-1', 'Aditya-L2'],
      type: 'mcq',
      category: 'general',
      difficulty: 'medium',
      examRelevance: 85,
      keywords: ['ISRO', 'Gaganyaan', 'Human Spaceflight'],
      explanation: 'ISRO\'s Gaganyaan mission aims to send Indian astronauts to space, with first uncrewed test scheduled for 2025.',
      source: 'ISRO'
    },
    {
      id: 'today_7',
      topic: 'Agricultural Reforms',
      question: 'MSP increase for wheat in 2025-26 is 8.5%',
      answer: 'false',
      type: 'true-false',
      category: 'schemes',
      difficulty: 'hard',
      examRelevance: 87,
      keywords: ['MSP', 'Wheat', 'Agricultural Policy'],
      explanation: 'MSP for wheat increased by 6.2% to ₹2,425 per quintal for 2025-26, not 8.5%.',
      source: 'Ministry of Agriculture'
    },
    {
      id: 'today_8',
      topic: 'India-Japan Partnership',
      question: 'What is the focus of the new India-Japan semiconductor alliance?',
      answer: 'Manufacturing & Research',
      type: 'reveal',
      category: 'international',
      difficulty: 'medium',
      examRelevance: 83,
      keywords: ['India-Japan', 'Semiconductors', 'Technology'],
      explanation: 'India-Japan semiconductor alliance focuses on joint manufacturing facilities and R&D centers for advanced chips.',
      source: 'Ministry of External Affairs'
    }
  ];

  // Admin function to add today's questions
  const addTodaysQuestions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const questionsToAdd = [
        {
          date: today,
          sequence_order: 1,
          topic: 'Budget 2025',
          question: 'What is the fiscal deficit target for 2025-26?',
          answer: '4.9%',
          options: JSON.stringify(['4.5%', '4.9%', '5.1%', '5.3%']),
          type: 'mcq',
          category: 'economy',
          difficulty: 'medium',
          exam_relevance: 95,
          keywords: JSON.stringify(['Budget', 'Fiscal Deficit', 'Economy']),
          explanation: 'Budget 2025 set the fiscal deficit target at 4.9% of GDP for the financial year 2025-26.',
          source: 'Union Budget 2025',
          is_active: true
        },
        {
          date: today,
          sequence_order: 2,
          topic: 'Supreme Court Verdict',
          question: 'SC upheld the constitutional validity of Aadhaar for banking',
          answer: 'true',
          options: null,
          type: 'true-false',
          category: 'politics',
          difficulty: 'medium',
          exam_relevance: 92,
          keywords: JSON.stringify(['Supreme Court', 'Aadhaar', 'Banking']),
          explanation: 'Supreme Court upheld Aadhaar linking for banking services while ensuring privacy safeguards.',
          source: 'Supreme Court of India',
          is_active: true
        },
      ];

      const { data, error } = await supabase
        .from('current_affairs_daily')
        .insert(questionsToAdd);

      if (error) throw error;

      Alert.alert('✅ Success', `Added ${questionsToAdd.length} questions for today!`);
      await fetchTodaysCurrentAffairs();
      
    } catch (error) {
      console.error('Error adding questions:', error);
      Alert.alert('❌ Error', 'Failed to add questions to database');
    }
  };

  // Save progress to database
  const saveProgressToDatabase = async (sessionData: any) => {
    try {
      if (!user?.id) return;

      const progressRecord = {
        user_id: user.id,
        session_date: new Date().toISOString().split('T')[0],
        session_type: 'current_affairs',
        questions_answered: sessionData.questions_completed || facts.length,
        correct_answers: Math.round((sessionData.final_accuracy / 100) * facts.length),
        accuracy_percentage: sessionData.final_accuracy,
        xp_earned: sessionData.final_xp || progress.dailyXP,
        time_spent_seconds: Math.round((sessionData.session_duration || 0) / 1000),
        perfect_score: sessionData.perfect_score || false,
        hearts_remaining: sessionData.hearts_remaining || progress.hearts,
        session_completed: sessionData.session_completed || false,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_progress_sessions')
        .insert([progressRecord]);

      if (error) {
        console.error('Error saving session progress:', error);
      } else {
        console.log('✅ Session progress saved successfully');
      }
    } catch (error) {
      console.error('Error in saveProgressToDatabase:', error);
    }
  };

  // Update progress when stats change from Supabase
  useEffect(() => {
    if (!statsLoading && stats) {
      setProgress(prev => ({
        ...prev,
        streak: stats.currentAffairsStreak || 0,
        totalXP: stats.totalXP || 0,
        dailyXP: stats.currentAffairsPoints || 0,
        level: stats.currentLevel || 1,
        questionsToday: stats.currentAffairsTotal || 0,
        accuracy: stats.currentAffairsAccuracy || 0,
        achievements: [],
        masteredTopics: []
      }));
    }
  }, [stats, statsLoading]);

  // Initialize with today's current affairs
  useEffect(() => {
    fetchTodaysCurrentAffairs();
    
    // Premium heartbeat animation for high streaks
    const glowAnimation = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(streakGlow, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        RNAnimated.timing(streakGlow, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    
    glowAnimation.start();
    return () => glowAnimation.stop();
  }, []);

  const handleAnswer = (answer: string | boolean) => {
    const currentFact = facts[currentIndex];
    let correct = false;
    
    if (currentFact.type === 'reveal') {
      correct = answer === 'correct';
    } else {
      correct = String(answer).toLowerCase() === String(currentFact.answer).toLowerCase();
    }
    
    setSelectedOption(String(answer));
    setIsCorrect(correct);
    setShowAnswer(true);
    
    if (correct) {
      // Use platform-specific feedback
      if (Platform.OS !== 'web') {
        Vibration.vibrate(50);
      }
      animateSuccess();
      updateProgress(true);
    } else {
      // Use platform-specific feedback
      if (Platform.OS !== 'web') {
        Vibration.vibrate([100, 50, 100]);
      }
      animateHeartLoss();
      updateProgress(false);
    }
    
    setTimeout(() => {
      setShowExplanation(true);
    }, 1000);
  };

  const animateSuccess = () => {
    RNAnimated.sequence([
      RNAnimated.timing(xpPulse, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      RNAnimated.timing(xpPulse, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateHeartLoss = () => {
    RNAnimated.sequence([
      RNAnimated.timing(heartScale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      RNAnimated.timing(heartScale, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      RNAnimated.timing(heartScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // XP and Progress Saving with Real Supabase
  const updateProgress = async (correct: boolean) => {
    const currentFact = facts[currentIndex];
    const xpGained = correct ? (currentFact.difficulty === 'hard' ? 15 : currentFact.difficulty === 'medium' ? 10 : 5) : 0;
    
    try {
      await updateCurrentAffairsStats(correct, xpGained);
      console.log('✅ Progress saved to Supabase:', { correct, xpGained });
    } catch (error) {
      console.error('❌ Error saving to Supabase:', error);
    }
    
    setProgress(prev => {
      const newHearts = correct ? prev.hearts : Math.max(0, prev.hearts - 1);
      const newProgress = {
        ...prev,
        hearts: newHearts,
        totalXP: prev.totalXP + xpGained,
        dailyXP: prev.dailyXP + xpGained,
        questionsToday: prev.questionsToday + 1,
        accuracy: Math.round(((prev.accuracy * (prev.questionsToday - 1)) + (correct ? 100 : 0)) / prev.questionsToday),
        streak: correct ? prev.streak : 0,
      };

      if (!correct && newHearts === 0) {
        setTimeout(() => {
          setShowGameOverModal(true);
        }, 2000);
      }

      return newProgress;
    });
  };

  const nextQuestion = () => {
    if (currentIndex < facts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetQuestionState();
      animateCardSlide();
    } else {
      handleCompleteSession();
    }
  };

  const resetQuestionState = () => {
    setShowAnswer(false);
    setShowExplanation(false);
    setSelectedOption(null);
    setIsCorrect(null);
  };

  const animateCardSlide = () => {
    cardSlide.setValue(100);
    RNAnimated.timing(cardSlide, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCompleteSession = async () => {
    console.log('🎉 Session completed!');
    
    await saveProgressToDatabase({
      session_completed: true,
      final_accuracy: progress.accuracy,
      total_questions: facts.length,
      final_xp: progress.totalXP,
      hearts_remaining: progress.hearts,
      session_duration: Date.now() - sessionStartTime,
      perfect_score: progress.accuracy === 100
    });
    
    setShowCompletionModal(true);
  };

  const refillHearts = () => {
    setProgress(prev => ({ ...prev, hearts: 3 }));
    setShowGameOverModal(false);
  };

  const restartSession = async () => {
    console.log('🔄 Restarting session...');
    
    await saveProgressToDatabase({
      session_completed: true,
      final_accuracy: progress.accuracy,
      final_xp: progress.totalXP,
      session_duration: Date.now() - sessionStartTime,
      questions_completed: currentIndex + 1
    });
    
    setCurrentIndex(0);
    resetQuestionState();
    await fetchTodaysCurrentAffairs();
    setProgress(prev => ({ ...prev, hearts: 3 }));
    setShowCompletionModal(false);
  };

  const currentFact = facts[currentIndex];

  if (loading || !currentFact) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingTitle}>📰 Today's Current Affairs</Text>
          <Text style={styles.loadingText}>
            Loading {new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })} questions...
          </Text>
          <Text style={styles.loadingSubtext}>💡 Visit daily for fresh content!</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      politics: ['#EF4444', '#DC2626'],
      economy: ['#10B981', '#059669'],
      international: ['#3B82F6', '#2563EB'],
      schemes: ['#8B5CF6', '#7C3AED'],
      general: ['#F59E0B', '#D97706']
    };
    return colors[category] || colors.general;
  };

  const categoryColors = getCategoryColor(currentFact.category);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0B" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Today's Current Affairs</Text>
            <Text style={styles.headerSubtitle}>
              📅 {new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} • Visit Daily!
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            {/* Hearts */}
            <RNAnimated.View style={[styles.heartsContainer, { transform: [{ scale: heartScale }] }]}>
              {Array.from({ length: 3 }, (_, i) => (
                <View key={i} style={[
                  styles.heart,
                  { backgroundColor: i < progress.hearts ? '#EF4444' : '#374151' }
                ]}>
                  <Text style={styles.heartText}>♥</Text>
                </View>
              ))}
            </RNAnimated.View>
            
            {/* Streak */}
            <RNAnimated.View style={[
              styles.streakContainer,
              {
                shadowOpacity: RNAnimated.multiply(streakGlow, 0.5),
                shadowRadius: RNAnimated.multiply(streakGlow, 10),
              }
            ]}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakText}>{progress.streak}</Text>
            </RNAnimated.View>
          </View>
        </View>

        {/* XP Progress Bar */}
        <View style={styles.xpContainer}>
          <View style={styles.xpBar}>
            <LinearGradient
              colors={['#00FF88', '#10B981']}
              style={[styles.xpFill, { width: `${(progress.dailyXP % 100)}%` }]}
            />
          </View>
          <RNAnimated.Text style={[
            styles.xpText,
            { transform: [{ scale: xpPulse }] }
          ]}>
            {progress.dailyXP} XP today • {100 - (progress.dailyXP % 100)} to next level
          </RNAnimated.Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Question {currentIndex + 1} of {facts.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / facts.length) * 100}%` }
            ]} />
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Main Question Card */}
        <RNAnimated.View style={[
          styles.cardContainer,
          { transform: [{ translateX: cardSlide }] }
        ]}>
          <LinearGradient
            colors={[categoryColors[0] + '20', categoryColors[1] + '10']}
            style={styles.questionCard}
          >
            {/* Category Badge */}
            <View style={[styles.categoryBadge, { backgroundColor: categoryColors[0] }]}>
              <Text style={styles.categoryText}>
                {currentFact.category.toUpperCase()}
              </Text>
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyText}>
                  {currentFact.difficulty === 'hard' ? '🔴' : currentFact.difficulty === 'medium' ? '🟡' : '🟢'}
                </Text>
              </View>
            </View>

            {/* Topic */}
            <Text style={styles.topicText}>{currentFact.topic}</Text>

            {/* Question */}
            <Text style={styles.questionText}>{currentFact.question}</Text>

            {/* Answer Options */}
            <View style={styles.optionsContainer}>
              {/* MCQ Questions */}
              {currentFact.type === 'mcq' && currentFact.options?.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedOption === option && (isCorrect ? styles.correctOption : styles.wrongOption),
                    showAnswer && option === currentFact.answer && styles.correctOption
                  ]}
                  onPress={() => !showAnswer && handleAnswer(option)}
                  disabled={showAnswer}
                >
                  <Text style={[
                    styles.optionText,
                    selectedOption === option && styles.selectedOptionText,
                    showAnswer && option === currentFact.answer && styles.correctOptionText
                  ]}>
                    {option}
                  </Text>
                  {showAnswer && option === currentFact.answer && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}

              {/* True/False Questions */}
              {currentFact.type === 'true-false' && (
                <View style={styles.trueFalseContainer}>
                  <TouchableOpacity
                    style={[
                      styles.trueFalseButton,
                      styles.trueButton,
                      selectedOption === 'true' && (isCorrect ? styles.correctOption : styles.wrongOption),
                      showAnswer && currentFact.answer === 'true' && styles.correctOption
                    ]}
                    onPress={() => !showAnswer && handleAnswer(true)}
                    disabled={showAnswer}
                  >
                    <Text style={styles.trueFalseText}>TRUE</Text>
                    {showAnswer && currentFact.answer === 'true' && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.trueFalseButton,
                      styles.falseButton,
                      selectedOption === 'false' && (isCorrect ? styles.correctOption : styles.wrongOption),
                      showAnswer && currentFact.answer === 'false' && styles.correctOption
                    ]}
                    onPress={() => !showAnswer && handleAnswer(false)}
                    disabled={showAnswer}
                  >
                    <Text style={styles.trueFalseText}>FALSE</Text>
                    {showAnswer && currentFact.answer === 'false' && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Reveal Questions */}
              {currentFact.type === 'reveal' && (
                <>
                  <TouchableOpacity
                    style={styles.revealButton}
                    onPress={() => !showAnswer && setShowAnswer(true)}
                    disabled={showAnswer}
                  >
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      style={styles.revealGradient}
                    >
                      <Text style={styles.revealButtonText}>
                        {showAnswer ? currentFact.answer : 'TAP TO REVEAL ANSWER'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  {showAnswer && (
                    <View style={styles.revealActionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.wrongButton]}
                        onPress={() => handleAnswer('wrong')}
                      >
                        <Text style={styles.wrongButtonText}>❌ Didn't Know</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionButton, styles.correctButton]}
                        onPress={() => handleAnswer('correct')}
                      >
                        <Text style={styles.correctButtonText}>✅ Got It!</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Explanation */}
            {showExplanation && (
              <View style={styles.explanationContainer}>
                <View style={styles.explanationHeader}>
                  <Text style={styles.explanationTitle}>
                    {isCorrect ? '🎉 Excellent!' : '📚 Learn More'}
                  </Text>
                  {isCorrect && (
                    <Text style={styles.xpGained}>
                      +{currentFact.difficulty === 'hard' ? 15 : currentFact.difficulty === 'medium' ? 10 : 5} XP
                    </Text>
                  )}
                </View>
                <Text style={styles.explanationText}>{currentFact.explanation}</Text>
                <View style={styles.keywordsContainer}>
                  {currentFact.keywords.slice(0, 3).map((keyword, index) => (
                    <View key={index} style={styles.keywordTag}>
                      <Text style={styles.keywordText}>{keyword}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.sourceText}>Source: {currentFact.source}</Text>
              </View>
            )}
          </LinearGradient>
        </RNAnimated.View>

        {/* Continue Button */}
        {showAnswer && (
          <TouchableOpacity 
            style={styles.continueButton} 
            onPress={() => {
              if (currentIndex === facts.length - 1) {
                handleCompleteSession();
              } else {
                nextQuestion();
              }
            }}
          >
            <LinearGradient
              colors={isCorrect ? ['#00FF88', '#10B981'] : ['#8B5CF6', '#7C3AED']}
              style={styles.continueGradient}
            >
              <Text style={styles.continueButtonText}>
                {currentIndex === facts.length - 1 ? 'COMPLETE SESSION 🎉' : 'CONTINUE →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Bottom Stats */}
        <View style={styles.bottomStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{progress.accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{progress.totalXP}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{progress.masteredTopics.length}</Text>
            <Text style={styles.statLabel}>Mastered</Text>
          </View>
        </View>
      </ScrollView>

      {/* Admin Panel */}
      {isAdmin && (
        <View style={styles.adminPanel}>
          <TouchableOpacity style={styles.adminButton} onPress={addTodaysQuestions}>
            <Text style={styles.adminButtonText}>➕ Add Questions</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.completionModal}>
            <LinearGradient
              colors={['#8B5CF6', '#3B82F6']}
              style={styles.modalGradient}
            >
              <Text style={styles.modalTitle}>🎉 Session Complete!</Text>
              <Text style={styles.modalSubtitle}>Outstanding performance!</Text>
              
              <View style={styles.modalStats}>
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatValue}>{facts.length}</Text>
                  <Text style={styles.modalStatLabel}>Questions</Text>
                </View>
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatValue}>{progress.accuracy}%</Text>
                  <Text style={styles.modalStatLabel}>Accuracy</Text>
                </View>
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatValue}>{progress.hearts}</Text>
                  <Text style={styles.modalStatLabel}>Hearts Left</Text>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setShowCompletionModal(false)}
                >
                  <Text style={styles.modalButtonTextSecondary}>Done</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => {
                    setShowCompletionModal(false);
                    restartSession();
                  }}
                >
                  <Text style={styles.modalButtonTextPrimary}>New Session</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      )}

      {/* Game Over Modal */}
      {showGameOverModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.gameOverModal}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.modalGradient}
            >
              <Text style={styles.gameOverTitle}>💔 Out of Hearts!</Text>
              <Text style={styles.gameOverSubtitle}>Don't worry, you did great!</Text>
              
              <View style={styles.gameOverStats}>
                <Text style={styles.gameOverStatsText}>
                  📊 Session Stats:
                </Text>
                <Text style={styles.gameOverStatsDetail}>
                  • Questions Answered: {currentIndex + 1}
                </Text>
                <Text style={styles.gameOverStatsDetail}>
                  • Accuracy: {progress.accuracy}%
                </Text>
                <Text style={styles.gameOverStatsDetail}>
                  • XP Earned: {progress.dailyXP}
                </Text>
              </View>

              <View style={styles.heartRefillInfo}>
                <Text style={styles.heartRefillTitle}>💖 Hearts Refill Options:</Text>
                <Text style={styles.heartRefillText}>
                  • Wait 2 hours for free refill
                </Text>
                <Text style={styles.heartRefillText}>
                  • Watch an ad to continue now
                </Text>
                <Text style={styles.heartRefillText}>
                  • Start fresh tomorrow
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setShowGameOverModal(false)}
                >
                  <Text style={styles.modalButtonTextSecondary}>Wait</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={refillHearts}
                >
                  <Text style={styles.modalButtonTextPrimary}>Watch Ad ▶️</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0A0A0B',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B5CF6',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heartsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  heart: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#FF6B35',
  },
  streakIcon: {
    fontSize: 16,
  },
  streakText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginLeft: 4,
  },
  xpContainer: {
    marginTop: 8,
  },
  xpBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpText: {
    fontSize: 12,
    color: '#00FF88',
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  cardContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    flex: 1,
    minHeight: height * 0.6,
  },
  questionCard: {
    flex: 1,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 400,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  difficultyBadge: {
    marginLeft: 8,
  },
  difficultyText: {
    fontSize: 12,
  },
  topicText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 16,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  correctOption: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  wrongOption: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  optionText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: 'bold',
  },
  correctOptionText: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  checkmark: {
    fontSize: 20,
    color: '#10B981',
    fontWeight: 'bold',
  },
  trueFalseContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  trueFalseButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  trueButton: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  falseButton: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  trueFalseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  revealButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  revealGradient: {
    padding: 20,
    alignItems: 'center',
  },
  revealButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  revealActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  wrongButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  correctButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  wrongButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  correctButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
  explanationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  explanationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  xpGained: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00FF88',
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 16,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  keywordTag: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  keywordText: {
    fontSize: 10,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  sourceText: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  continueButton: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueGradient: {
    padding: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 100,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  completionModal: {
    width: width - 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 32,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 32,
    textAlign: 'center',
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalButtonSecondary: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  gameOverModal: {
    width: width - 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  gameOverSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
    textAlign: 'center',
  },
  gameOverStats: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  gameOverStatsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  gameOverStatsDetail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  heartRefillInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  heartRefillTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heartRefillText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  adminPanel: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1001,
  },
  adminButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default NewsScreen;