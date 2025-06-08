import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { usePreGeneratedNotes } from '@/hooks/usePreGeneratedNotes';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { Search, Clock, Users, Calendar, MapPin, ArrowRight, BookOpen, History, Landmark, TrendingUp, Globe, Briefcase, Lightbulb, Star, Brain, Zap, Target, Award, ChevronDown, ChevronUp, User, Trophy, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Play, Rocket, Eye, Bookmark } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface TopicBreakdown {
  overview: string;
  timeline: Array<{ year: string; event: string }>;
  keyPeople: Array<{ name: string; role: string; description: string }>;
  dynasties: Array<{ name: string; founder: string; period: string; capital: string }>;
  importantFacts: string[];
  causes: Array<{ cause: string; effect: string }>;
  significance: string[];
  examCriticalPoints: string[]; // Keep for internal use but don't display
}

export default function StudyScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [topicBreakdown, setTopicBreakdown] = useState<TopicBreakdown | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isPreGenerated, setIsPreGenerated] = useState(false);
  
  const { user } = useAuth();
  const { suggestions, featuredNotes, loading: notesLoading, getNote, searchNotes } = usePreGeneratedNotes();

  const categories = [
    { id: 'all', name: 'All', icon: BookOpen, color: '#6B7280' },
    { id: 'history', name: 'History', icon: History, color: '#F59E0B' },
    { id: 'polity', name: 'Polity', icon: Landmark, color: '#8B5CF6' },
    { id: 'economics', name: 'Economics', icon: TrendingUp, color: '#10B981' },
    { id: 'geography', name: 'Geography', icon: Globe, color: '#3B82F6' },
    { id: 'current', name: 'Current Affairs', icon: Briefcase, color: '#EF4444' },
  ];

  const recentTopics = [
    {
      id: 1,
      title: 'Delhi Sultanate',
      category: 'History',
      difficulty: 'Intermediate',
      studyTime: '45 min',
      progress: 75,
      color: ['#F59E0B', '#F97316'],
      isPreGenerated: true,
    },
    {
      id: 2,
      title: 'Fundamental Rights',
      category: 'Polity',
      difficulty: 'Advanced',
      studyTime: '60 min',
      progress: 40,
      color: ['#8B5CF6', '#7C3AED'],
      isPreGenerated: true,
    },
    {
      id: 3,
      title: 'Monetary Policy',
      category: 'Economics',
      difficulty: 'Intermediate',
      studyTime: '35 min',
      progress: 90,
      color: ['#10B981', '#059669'],
      isPreGenerated: false,
    },
  ];

  // Get filtered suggestions based on selected category
  const filteredSuggestions = selectedCategory === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.category.toLowerCase() === selectedCategory);

  // Loading animation
  const loadingAnimation = useSharedValue(0);
  const progressAnimation = useSharedValue(0);

  React.useEffect(() => {
    if (loading) {
      loadingAnimation.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        true
      );

      // Simulate progress
      progressAnimation.value = withTiming(1, { duration: 8000 });
    } else {
      loadingAnimation.value = 0;
      progressAnimation.value = 0;
    }
  }, [loading]);

  const animatedLoadingStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + loadingAnimation.value * 0.5,
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressAnimation.value * 100}%`,
  }));

  const generateTopicBreakdown = async (topic: string, usePreGenerated = true) => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a topic to study');
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    setIsPreGenerated(false);
    
    try {
      console.log('🧠 Generating topic breakdown for:', topic);

      // First, try to get pre-generated note
      if (usePreGenerated) {
        console.log('📚 Checking for pre-generated note...');
        const preGeneratedNote = await getNote(topic.trim());
        
        if (preGeneratedNote) {
          console.log('✅ Found pre-generated note!');
          setTopicBreakdown(preGeneratedNote.content);
          setExpandedSections(new Set(['overview', 'shortcut', 'importantFacts']));
          setIsPreGenerated(true);
          setLoading(false);
          return;
        }
      }

      // If no pre-generated note found, use AI generation
      console.log('🤖 No pre-generated note found, using AI generation...');

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + 10, 90));
      }, 800);

      const response = await fetch('/api/generate-topic-breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          userId: user?.id,
        }),
      });

      clearInterval(progressInterval);
      setLoadingProgress(100);

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate topic breakdown');
      }

      // Add exam-critical points to the breakdown
      const enhancedBreakdown = {
        ...data.breakdown,
        examCriticalPoints: generateExamCriticalPoints(topic, data.breakdown)
      };

      setTopicBreakdown(enhancedBreakdown);
      setExpandedSections(new Set(['overview', 'shortcut', 'importantFacts'])); // Start with overview, shortcut, and important facts expanded
      setIsPreGenerated(false);
    } catch (error: any) {
      console.error('Topic breakdown error:', error);
      Alert.alert('Error', error.message || 'Failed to generate topic breakdown. Please try again.');
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  const generateExamCriticalPoints = (topic: string, breakdown: any): string[] => {
    // Generate exam-focused critical points based on the topic and breakdown
    const points = [
      `Key dates and chronology related to ${topic}`,
      `Important personalities and their contributions`,
      `Cause and effect relationships`,
      `Constitutional/Legal significance`,
      `Current relevance and contemporary connections`
    ];

    // Add specific points based on breakdown content
    if (breakdown.timeline && breakdown.timeline.length > 0) {
      points.push(`Timeline: ${breakdown.timeline[0]?.year} - ${breakdown.timeline[breakdown.timeline.length - 1]?.year}`);
    }

    if (breakdown.keyPeople && breakdown.keyPeople.length > 0) {
      points.push(`Key Figure: ${breakdown.keyPeople[0]?.name} - ${breakdown.keyPeople[0]?.role}`);
    }

    return points.slice(0, 5); // Return top 5 points
  };

  const handlePopularTopicPress = (topic: string) => {
    console.log('🎯 Popular topic selected:', topic);
    setSearchQuery(topic);
    generateTopicBreakdown(topic);
  };

  const handlePreGeneratedNotePress = (note: any) => {
    console.log('📚 Pre-generated note selected:', note.topic);
    setSearchQuery(note.topic);
    setTopicBreakdown(note.content);
    setExpandedSections(new Set(['overview', 'shortcut', 'importantFacts']));
    setIsPreGenerated(true);
  };

  const handleQuickQuiz = (topic: string) => {
    // Navigate to quiz screen with the topic pre-filled
    router.push({
      pathname: '/(tabs)/quiz',
      params: { 
        mode: 'custom',
        topic: topic,
        difficulty: 'intermediate',
        questionCount: '5'
      }
    });
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const CategoryButton = ({ 
    category, 
    isSelected, 
    onPress 
  }: {
    category: typeof categories[0];
    isSelected: boolean;
    onPress: () => void;
  }) => {
    const scaleValue = useSharedValue(1);
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
    }));

    const handlePressIn = () => {
      scaleValue.value = withSpring(0.95);
    };

    const handlePressOut = () => {
      scaleValue.value = withSpring(1);
      onPress();
    };

    return (
      <AnimatedTouchableOpacity
        style={[
          styles.categoryButton,
          isSelected && { backgroundColor: category.color + '20', borderColor: category.color },
          animatedStyle,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <category.icon 
          size={20} 
          color={isSelected ? category.color : '#9CA3AF'} 
          strokeWidth={2} 
        />
        <Text style={[
          styles.categoryText,
          isSelected && { color: category.color }
        ]}>
          {category.name}
        </Text>
      </AnimatedTouchableOpacity>
    );
  };

  const TopicCard = ({ topic }: { topic: typeof recentTopics[0] }) => (
    <TouchableOpacity 
      style={styles.topicCard} 
      activeOpacity={0.9}
      onPress={() => handlePopularTopicPress(topic.title)}
    >
      <LinearGradient
        colors={[...topic.color, 'rgba(0,0,0,0.1)']}
        style={styles.topicGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.topicContent}>
          <View style={styles.topicHeader}>
            <View style={styles.topicInfo}>
              <Text style={styles.topicTitle}>{topic.title}</Text>
              <Text style={styles.topicCategory}>{topic.category}</Text>
            </View>
            <View style={styles.topicBadges}>
              {topic.isPreGenerated && (
                <View style={styles.preGeneratedBadge}>
                  <Bookmark size={12} color="#00FF88" strokeWidth={2} />
                  <Text style={styles.preGeneratedText}>Ready</Text>
                </View>
              )}
              <ArrowRight size={20} color="#FFFFFF" strokeWidth={2} />
            </View>
          </View>
          
          <View style={styles.topicMeta}>
            <View style={styles.metaItem}>
              <Clock size={14} color="rgba(255,255,255,0.8)" strokeWidth={2} />
              <Text style={styles.metaText}>{topic.studyTime}</Text>
            </View>
            <View style={styles.metaItem}>
              <Star size={14} color="rgba(255,255,255,0.8)" strokeWidth={2} />
              <Text style={styles.metaText}>{topic.difficulty}</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${topic.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{topic.progress}% complete</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const PreGeneratedNoteCard = ({ note }: { note: any }) => (
    <TouchableOpacity 
      style={styles.preGeneratedCard} 
      activeOpacity={0.9}
      onPress={() => handlePreGeneratedNotePress(note)}
    >
      <View style={styles.preGeneratedContent}>
        <View style={styles.preGeneratedHeader}>
          <View style={styles.preGeneratedInfo}>
            <Text style={styles.preGeneratedTitle}>{note.topic}</Text>
            <Text style={styles.preGeneratedCategory}>{note.category}</Text>
          </View>
          <View style={styles.preGeneratedBadges}>
            <View style={styles.readyBadge}>
              <CheckCircle size={12} color="#00FF88" strokeWidth={2} />
              <Text style={styles.readyText}>Ready</Text>
            </View>
            <View style={styles.viewCountBadge}>
              <Eye size={12} color="#9CA3AF" strokeWidth={2} />
              <Text style={styles.viewCountText}>{note.view_count}</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.preGeneratedDescription} numberOfLines={2}>
          {note.content.overview}
        </Text>
        
        <View style={styles.preGeneratedMeta}>
          <View style={styles.metaItem}>
            <Clock size={12} color="#9CA3AF" strokeWidth={2} />
            <Text style={styles.preGeneratedMetaText}>{note.estimated_read_time} min read</Text>
          </View>
          <View style={styles.metaItem}>
            <Target size={12} color="#9CA3AF" strokeWidth={2} />
            <Text style={styles.preGeneratedMetaText}>{note.difficulty}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const PopularTopicChip = ({ topic }: { topic: string }) => (
    <TouchableOpacity 
      style={styles.topicChip} 
      activeOpacity={0.8}
      onPress={() => handlePopularTopicPress(topic)}
    >
      <Text style={styles.topicChipText}>{topic}</Text>
      <ArrowRight size={12} color="#8B5CF6" strokeWidth={2} />
    </TouchableOpacity>
  );

  const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.1)']}
        style={styles.loadingCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={[styles.loadingIcon, animatedLoadingStyle]}>
          <Brain size={48} color="#8B5CF6" strokeWidth={2} />
        </Animated.View>
        
        <Text style={styles.loadingTitle}>
          {isPreGenerated ? 'Loading Pre-generated Notes' : 'Generating AI Study Notes'}
        </Text>
        <Text style={styles.loadingSubtitle}>
          {isPreGenerated 
            ? `Loading comprehensive notes for "${searchQuery}"`
            : `Creating comprehensive breakdown for "${searchQuery}"`
          }
        </Text>

        {!isPreGenerated && (
          <>
            <View style={styles.loadingProgressContainer}>
              <View style={styles.loadingProgressBar}>
                <Animated.View style={[styles.loadingProgressFill, animatedProgressStyle]} />
              </View>
              <Text style={styles.loadingProgressText}>{loadingProgress}%</Text>
            </View>

            <View style={styles.loadingSteps}>
              <View style={styles.loadingStep}>
                <CheckCircle size={16} color="#00FF88" strokeWidth={2} />
                <Text style={styles.loadingStepText}>Analyzing topic structure</Text>
              </View>
              <View style={styles.loadingStep}>
                <CheckCircle size={16} color="#00FF88" strokeWidth={2} />
                <Text style={styles.loadingStepText}>Gathering historical data</Text>
              </View>
              <View style={styles.loadingStep}>
                <Animated.View style={animatedLoadingStyle}>
                  <AlertCircle size={16} color="#F59E0B" strokeWidth={2} />
                </Animated.View>
                <Text style={styles.loadingStepText}>Creating exam-focused content</Text>
              </View>
            </View>
          </>
        )}
      </LinearGradient>
    </View>
  );

  const BreakdownSection = ({ 
    title, 
    icon: Icon, 
    children, 
    sectionId,
    badge
  }: {
    title: string;
    icon: React.ComponentType<any>;
    children: React.ReactNode;
    sectionId: string;
    badge?: string;
  }) => {
    const isExpanded = expandedSections.has(sectionId);
    
    return (
      <View style={styles.breakdownSection}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection(sectionId)}
        >
          <View style={styles.sectionHeaderLeft}>
            <Icon size={20} color="#8B5CF6" strokeWidth={2} />
            <Text style={styles.sectionTitle}>{title}</Text>
            {badge && (
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{badge}</Text>
              </View>
            )}
          </View>
          {isExpanded ? (
            <ChevronUp size={20} color="#9CA3AF" strokeWidth={2} />
          ) : (
            <ChevronDown size={20} color="#9CA3AF" strokeWidth={2} />
          )}
        </TouchableOpacity>
        
        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {children}
          </Animated.View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingScreen />
      </SafeAreaView>
    );
  }

  if (topicBreakdown) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.breakdownContainer}>
          {/* Header */}
          <View style={styles.breakdownHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setTopicBreakdown(null)}
            >
              <ArrowRight size={24} color="#FFFFFF" strokeWidth={2} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
            <View style={styles.breakdownTitleContainer}>
              <Text style={styles.breakdownTitle}>Study Notes</Text>
              {isPreGenerated && (
                <View style={styles.preGeneratedIndicator}>
                  <Bookmark size={14} color="#00FF88" strokeWidth={2} />
                  <Text style={styles.preGeneratedIndicatorText}>Pre-generated</Text>
                </View>
              )}
            </View>
            <View style={styles.placeholder} />
          </View>

          <ScrollView 
            style={styles.breakdownScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Quiz Shortcut */}
            <BreakdownSection title="Quick Quiz Shortcut" icon={Rocket} sectionId="shortcut" badge="INSTANT">
              <TouchableOpacity 
                style={styles.shortcutButton}
                onPress={() => handleQuickQuiz(searchQuery)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#00FF88', '#10B981']}
                  style={styles.shortcutGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.shortcutContent}>
                    <Play size={24} color="#FFFFFF" strokeWidth={2} />
                    <View style={styles.shortcutText}>
                      <Text style={styles.shortcutTitle}>Start Quiz on {searchQuery}</Text>
                      <Text style={styles.shortcutDescription}>
                        Test your knowledge with 5 AI-generated questions
                      </Text>
                    </View>
                    <ArrowRight size={20} color="#FFFFFF" strokeWidth={2} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </BreakdownSection>

            {/* Overview */}
            <BreakdownSection title="Overview" icon={BookOpen} sectionId="overview">
              <Text style={styles.overviewText}>{topicBreakdown.overview}</Text>
            </BreakdownSection>

            {/* Enhanced Important Facts - ALL exam-critical points */}
            <BreakdownSection title="Important Points for Exams" icon={Lightbulb} sectionId="importantFacts" badge="EXAM FOCUS">
              <View style={styles.importantFactsContainer}>
                {/* Original Important Facts */}
                {topicBreakdown.importantFacts.map((fact, index) => (
                  <View key={`fact-${index}`} style={styles.importantFactItem}>
                    <View style={styles.factNumber}>
                      <Text style={styles.factNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.importantFactText}>{fact}</Text>
                  </View>
                ))}

                {/* Additional exam-critical points from other sections */}
                {topicBreakdown.timeline.length > 0 && (
                  <>
                    <View style={styles.factSeparator}>
                      <Text style={styles.factSeparatorText}>Key Dates & Timeline</Text>
                    </View>
                    {topicBreakdown.timeline.slice(0, 5).map((event, index) => (
                      <View key={`timeline-${index}`} style={styles.importantFactItem}>
                        <View style={[styles.factNumber, { backgroundColor: '#F59E0B' }]}>
                          <Calendar size={12} color="#FFFFFF" strokeWidth={2} />
                        </View>
                        <Text style={styles.importantFactText}>
                          <Text style={styles.factYear}>{event.year}:</Text> {event.event}
                        </Text>
                      </View>
                    ))}
                  </>
                )}

                {/* Key People as exam points */}
                {topicBreakdown.keyPeople.length > 0 && (
                  <>
                    <View style={styles.factSeparator}>
                      <Text style={styles.factSeparatorText}>Key Personalities</Text>
                    </View>
                    {topicBreakdown.keyPeople.slice(0, 3).map((person, index) => (
                      <View key={`person-${index}`} style={styles.importantFactItem}>
                        <View style={[styles.factNumber, { backgroundColor: '#8B5CF6' }]}>
                          <User size={12} color="#FFFFFF" strokeWidth={2} />
                        </View>
                        <Text style={styles.importantFactText}>
                          <Text style={styles.factHighlight}>{person.name}</Text> - {person.role}: {person.description}
                        </Text>
                      </View>
                    ))}
                  </>
                )}

                {/* Cause & Effect as exam points */}
                {topicBreakdown.causes.length > 0 && (
                  <>
                    <View style={styles.factSeparator}>
                      <Text style={styles.factSeparatorText}>Cause & Effect Analysis</Text>
                    </View>
                    {topicBreakdown.causes.slice(0, 3).map((item, index) => (
                      <View key={`cause-${index}`} style={styles.importantFactItem}>
                        <View style={[styles.factNumber, { backgroundColor: '#10B981' }]}>
                          <TrendingUp size={12} color="#FFFFFF" strokeWidth={2} />
                        </View>
                        <Text style={styles.importantFactText}>
                          <Text style={styles.factCause}>Cause:</Text> {item.cause} → 
                          <Text style={styles.factEffect}> Effect:</Text> {item.effect}
                        </Text>
                      </View>
                    ))}
                  </>
                )}

                {/* Historical Significance */}
                {topicBreakdown.significance.length > 0 && (
                  <>
                    <View style={styles.factSeparator}>
                      <Text style={styles.factSeparatorText}>Historical Significance</Text>
                    </View>
                    {topicBreakdown.significance.slice(0, 3).map((point, index) => (
                      <View key={`significance-${index}`} style={styles.importantFactItem}>
                        <View style={[styles.factNumber, { backgroundColor: '#EF4444' }]}>
                          <Award size={12} color="#FFFFFF" strokeWidth={2} />
                        </View>
                        <Text style={styles.importantFactText}>{point}</Text>
                      </View>
                    ))}
                  </>
                )}
              </View>
            </BreakdownSection>

            {/* Timeline */}
            <BreakdownSection title="Timeline" icon={Calendar} sectionId="timeline">
              {topicBreakdown.timeline.map((event, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineYear}>
                    <Text style={styles.yearText}>{event.year}</Text>
                  </View>
                  <View style={styles.timelineEvent}>
                    <Text style={styles.eventText}>{event.event}</Text>
                  </View>
                </View>
              ))}
            </BreakdownSection>

            {/* Key People */}
            <BreakdownSection title="Key People" icon={User} sectionId="people">
              {topicBreakdown.keyPeople.map((person, index) => (
                <View key={index} style={styles.personItem}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={styles.personRole}>{person.role}</Text>
                  <Text style={styles.personDescription}>{person.description}</Text>
                </View>
              ))}
            </BreakdownSection>

            {/* Dynasties */}
            {topicBreakdown.dynasties.length > 0 && (
              <BreakdownSection title="Dynasties" icon={Trophy} sectionId="dynasties">
                {topicBreakdown.dynasties.map((dynasty, index) => (
                  <View key={index} style={styles.dynastyItem}>
                    <Text style={styles.dynastyName}>{dynasty.name}</Text>
                    <View style={styles.dynastyDetails}>
                      <Text style={styles.dynastyDetail}>Founder: {dynasty.founder}</Text>
                      <Text style={styles.dynastyDetail}>Period: {dynasty.period}</Text>
                      <Text style={styles.dynastyDetail}>Capital: {dynasty.capital}</Text>
                    </View>
                  </View>
                ))}
              </BreakdownSection>
            )}

            {/* Cause & Effect */}
            <BreakdownSection title="Cause & Effect" icon={TrendingUp} sectionId="causes">
              {topicBreakdown.causes.map((item, index) => (
                <View key={index} style={styles.causeItem}>
                  <View style={styles.causeSection}>
                    <Text style={styles.causeLabel}>Cause:</Text>
                    <Text style={styles.causeText}>{item.cause}</Text>
                  </View>
                  <View style={styles.effectSection}>
                    <Text style={styles.effectLabel}>Effect:</Text>
                    <Text style={styles.effectText}>{item.effect}</Text>
                  </View>
                </View>
              ))}
            </BreakdownSection>

            {/* Significance */}
            <BreakdownSection title="Historical Significance" icon={Award} sectionId="significance">
              {topicBreakdown.significance.map((point, index) => (
                <View key={index} style={styles.significanceItem}>
                  <View style={styles.significanceBullet} />
                  <Text style={styles.significanceText}>{point}</Text>
                </View>
              ))}
            </BreakdownSection>
          </ScrollView>
        </View>
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
          <Text style={styles.title}>AI Study Room</Text>
          <Text style={styles.subtitle}>Get AI-powered topic breakdowns</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#9CA3AF" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter any topic (e.g., Delhi Sultanate, Mauryan Empire)"
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => generateTopicBreakdown(searchQuery)}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={() => generateTopicBreakdown(searchQuery)}
            disabled={loading}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.generateGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <Brain size={20} color="#FFFFFF" strokeWidth={2} />
              ) : (
                <Brain size={20} color="#FFFFFF" strokeWidth={2} />
              )}
              <Text style={styles.generateText}>
                {loading ? 'Generating...' : 'Generate'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <CategoryButton
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.id}
                onPress={() => setSelectedCategory(category.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Pre-generated Notes Section */}
        {!notesLoading && filteredSuggestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}></Text>
            <Text style={styles.sectionSubtitle}>
              Comprehensive notes prepared by experts - instant access!
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.preGeneratedScroll}
            >
              {filteredSuggestions.map((suggestion) => (
                <PreGeneratedNoteCard key={suggestion.id} note={suggestion.note} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Continue Learning */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {recentTopics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </View>

        {/* Popular Topics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Topics</Text>
          <Text style={styles.sectionSubtitle}>Tap any topic to generate instant study notes</Text>
          <View style={styles.topicChipsContainer}>
            {['Mauryan Empire', 'Mughal Administration', 'Indian National Congress', 'Quit India Movement', 'Partition of India', 'Green Revolution', 'Five Year Plans', 'Panchayati Raj System'].map((topic) => (
              <PopularTopicChip key={topic} topic={topic} />
            ))}
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You'll Get</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <Rocket size={24} color="#00FF88" strokeWidth={2} />
              <Text style={styles.featureTitle}>Quick Quiz Shortcut</Text>
              <Text style={styles.featureDescription}>Instant quiz generation from any topic</Text>
            </View>

            <View style={styles.featureCard}>
              <Lightbulb size={24} color="#EF4444" strokeWidth={2} />
              <Text style={styles.featureTitle}>Exam-Critical Points</Text>
              <Text style={styles.featureDescription}>All important facts for competitive exams</Text>
            </View>

            <View style={styles.featureCard}>
              <Calendar size={24} color="#8B5CF6" strokeWidth={2} />
              <Text style={styles.featureTitle}>Timeline</Text>
              <Text style={styles.featureDescription}>Chronological events and dates</Text>
            </View>
            
            <View style={styles.featureCard}>
              <User size={24} color="#10B981" strokeWidth={2} />
              <Text style={styles.featureTitle}>Key People</Text>
              <Text style={styles.featureDescription}>Important figures and their roles</Text>
            </View>
            
            <View style={styles.featureCard}>
              <Trophy size={24} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.featureTitle}>Dynasties</Text>
              <Text style={styles.featureDescription}>Rulers, periods, and capitals</Text>
            </View>

            <View style={styles.featureCard}>
              <Award size={24} color="#8B5CF6" strokeWidth={2} />
              <Text style={styles.featureTitle}>Significance</Text>
              <Text style={styles.featureDescription}>Historical importance</Text>
            </View>
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
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  generateButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  generateText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  categoriesContainer: {
    marginBottom: 32,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginLeft: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 16,
    marginTop: -8,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
  },
  
  // Pre-generated Notes Styles
  preGeneratedScroll: {
    paddingRight: 20,
  },
  preGeneratedCard: {
    width: 280,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  preGeneratedContent: {
    flex: 1,
  },
  preGeneratedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  preGeneratedInfo: {
    flex: 1,
  },
  preGeneratedTitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  preGeneratedCategory: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
  },
  preGeneratedBadges: {
    alignItems: 'flex-end',
    gap: 6,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readyText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#00FF88',
    marginLeft: 4,
  },
  viewCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  viewCountText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginLeft: 4,
  },
  preGeneratedDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 18,
    marginBottom: 12,
  },
  preGeneratedMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preGeneratedMetaText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginLeft: 4,
  },

  topicCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  topicGradient: {
    flex: 1,
  },
  topicContent: {
    padding: 20,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 24,
  },
  topicCategory: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  topicBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preGeneratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  preGeneratedText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#00FF88',
    marginLeft: 4,
  },
  topicMeta: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  topicChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  topicChipText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
    marginRight: 6,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 52) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  loadingIcon: {
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
  },
  loadingProgressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  loadingProgressBar: {
    height: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  loadingProgressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  loadingProgressText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
    textAlign: 'center',
  },
  loadingSteps: {
    width: '100%',
    gap: 12,
  },
  loadingStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingStepText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    marginLeft: 12,
  },

  // Breakdown Styles
  breakdownContainer: {
    flex: 1,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownTitleContainer: {
    alignItems: 'center',
  },
  breakdownTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
  },
  preGeneratedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  preGeneratedIndicatorText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#00FF88',
    marginLeft: 4,
  },
  placeholder: {
    width: 40,
  },
  breakdownScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  breakdownSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 12,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // Shortcut Styles
  shortcutButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  shortcutGradient: {
    flex: 1,
  },
  shortcutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  shortcutText: {
    flex: 1,
    marginLeft: 16,
  },
  shortcutTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  shortcutDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Enhanced Important Facts Styles
  importantFactsContainer: {
    gap: 12,
  },
  importantFactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  factNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  factNumberText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  importantFactText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  factSeparator: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  factSeparatorText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#8B5CF6',
    textAlign: 'center',
  },
  factYear: {
    fontFamily: 'Inter-Bold',
    color: '#F59E0B',
  },
  factHighlight: {
    fontFamily: 'Inter-Bold',
    color: '#8B5CF6',
  },
  factCause: {
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
  },
  factEffect: {
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },

  overviewText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 22,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineYear: {
    width: 80,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginRight: 12,
    alignItems: 'center',
  },
  yearText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#8B5CF6',
  },
  timelineEvent: {
    flex: 1,
    justifyContent: 'center',
  },
  eventText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 20,
  },
  personItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  personName: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  personRole: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
    marginBottom: 6,
  },
  personDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 20,
  },
  dynastyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  dynastyName: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  dynastyDetails: {
    gap: 4,
  },
  dynastyDetail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
  },
  causeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  causeSection: {
    marginBottom: 8,
  },
  causeLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  causeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 20,
  },
  effectSection: {},
  effectLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    marginBottom: 4,
  },
  effectText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 20,
  },
  significanceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  significanceBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
    marginTop: 8,
    marginRight: 12,
  },
  significanceText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 20,
  },
});