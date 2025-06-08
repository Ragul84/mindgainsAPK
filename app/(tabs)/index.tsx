import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useUserStats } from '@/hooks/useUserStats';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { Brain, Trophy, Target, Clock, TrendingUp, BookOpen, Zap, Star, ArrowRight, Play, Award, Calendar, Users, Sparkles, Flame, ChevronRight, ChartBar as BarChart3, Newspaper, User } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// Static motivational messages to prevent random changes
const MOTIVATIONAL_MESSAGES = [
  "Ready to conquer today's challenges?",
  "Every question you answer makes you stronger!",
  "Your dedication is building your future!",
  "Knowledge is power - keep growing!",
  "Today's effort is tomorrow's success!"
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { stats, loading: statsLoading, refreshStats } = useUserStats();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [motivationalMessage] = useState(() => {
    // Select a message based on user ID or date to keep it consistent
    const messageIndex = user?.id ? 
      parseInt(user.id.slice(-1), 16) % MOTIVATIONAL_MESSAGES.length : 
      new Date().getDate() % MOTIVATIONAL_MESSAGES.length;
    return MOTIVATIONAL_MESSAGES[messageIndex];
  });

  // Refresh stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshStats();
    }, [refreshStats])
  );

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Animation values
  const pulseAnimation = useSharedValue(1);
  const slideAnimation = useSharedValue(0);

  useEffect(() => {
    // Pulse animation for XP card
    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );

    // Slide in animation
    slideAnimation.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const animatedSlideStyle = useAnimatedStyle(() => ({
    opacity: slideAnimation.value,
    transform: [{ translateY: (1 - slideAnimation.value) * 50 }],
  }));

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickActions = [
    {
      id: 'study',
      title: 'AI Study Room',
      description: 'Generate topic breakdowns',
      icon: Brain,
      color: ['#8B5CF6', '#7C3AED'],
      route: '/(tabs)/study'
    },
    {
      id: 'quiz',
      title: 'Quick Quiz',
      description: 'Test your knowledge',
      icon: Trophy,
      color: ['#00FF88', '#10B981'],
      route: '/(tabs)/quiz'
    },
    {
      id: 'news',
      title: 'Current Affairs',
      description: 'Stay updated',
      icon: Newspaper,
      color: ['#F59E0B', '#F97316'],
      route: '/(tabs)/news'
    },
    {
      id: 'profile',
      title: 'Your Progress',
      description: 'Track achievements',
      icon: User,
      color: ['#EF4444', '#DC2626'],
      route: '/(tabs)/profile'
    }
  ];

  const recentActivity = [
    { id: 1, type: 'quiz', title: 'Completed Mixed Quiz', score: '85%', time: '2 hours ago', xp: 80 },
    { id: 2, type: 'study', title: 'Studied Mauryan Empire', progress: '100%', time: '4 hours ago', xp: 50 },
    { id: 3, type: 'achievement', title: 'Earned Quiz Master Badge', description: 'Completed 10 quizzes', time: '1 day ago', xp: 100 },
  ];

  const StatCard = ({ 
    label, 
    value, 
    icon: Icon, 
    color,
    isAnimated = false 
  }: {
    label: string;
    value: string | number;
    icon: React.ComponentType<any>;
    color: string;
    isAnimated?: boolean;
  }) => (
    <Animated.View style={[
      styles.statCard,
      isAnimated && animatedPulseStyle
    ]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon size={20} color={color} strokeWidth={2.5} />
      </View>
      <Text style={styles.statValue}>
        {statsLoading ? '...' : value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );

  const QuickActionCard = ({ action }: { action: typeof quickActions[0] }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
      scale.value = withSpring(1);
    };

    const handlePress = () => {
      router.push(action.route as any);
    };

    return (
      <AnimatedTouchableOpacity
        style={[styles.quickActionCard, animatedStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={action.color}
          style={styles.quickActionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <action.icon size={24} color="#FFFFFF" strokeWidth={2.5} />
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionTitle}>{action.title}</Text>
            <Text style={styles.quickActionDescription}>{action.description}</Text>
          </View>
          <ArrowRight size={20} color="#FFFFFF" strokeWidth={2} />
        </LinearGradient>
      </AnimatedTouchableOpacity>
    );
  };

  const ActivityItem = ({ activity }: { activity: typeof recentActivity[0] }) => (
    <View style={styles.activityItem}>
      <View style={[
        styles.activityIcon,
        { 
          backgroundColor: activity.type === 'quiz' ? '#00FF88' : 
                          activity.type === 'study' ? '#8B5CF6' : '#F59E0B' + '20'
        }
      ]}>
        {activity.type === 'quiz' && <Target size={16} color="#FFFFFF" strokeWidth={2} />}
        {activity.type === 'study' && <BookOpen size={16} color="#FFFFFF" strokeWidth={2} />}
        {activity.type === 'achievement' && <Award size={16} color="#F59E0B" strokeWidth={2} />}
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activityTime}>{activity.time}</Text>
      </View>
      <View style={styles.activityXP}>
        <Text style={styles.activityXPText}>+{activity.xp} XP</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View style={[styles.header, animatedSlideStyle]}>
          <View style={styles.headerContent}>
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>
                {user?.user_metadata?.full_name || 'Student'}! 👋
              </Text>
              <Text style={styles.motivationalMessage}>
                {motivationalMessage}
              </Text>
            </View>
            <View style={styles.profileImageContainer}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100' }} 
                style={styles.profileImage} 
              />
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>L{stats.currentLevel}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* XP Progress Card */}
        <Animated.View style={[styles.xpCard, animatedSlideStyle]}>
          <LinearGradient
            colors={['#8B5CF6', '#3B82F6']}
            style={styles.xpGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.xpContent}>
              <View style={styles.xpHeader}>
                <View style={styles.xpInfo}>
                  <Text style={styles.xpTitle}>Your Progress</Text>
                  <Text style={styles.xpSubtitle}>Level {stats.currentLevel}</Text>
                </View>
                <View style={styles.xpBadge}>
                  <Zap size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.xpBadgeText}>{stats.totalXP} XP</Text>
                </View>
              </View>
              
              <View style={styles.xpProgressContainer}>
                <View style={styles.xpProgressBar}>
                  <LinearGradient
                    colors={['#00FF88', '#10B981']}
                    style={[styles.xpProgressFill, { width: `${(stats.totalXP % 1000) / 10}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={styles.xpProgressText}>
                  {1000 - (stats.totalXP % 1000)} XP to Level {stats.currentLevel + 1}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View style={[styles.statsSection, animatedSlideStyle]}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <StatCard
              label="Total Quizzes"
              value={stats.totalQuizzes}
              icon={Trophy}
              color="#00FF88"
              isAnimated={true}
            />
            <StatCard
              label="Average Score"
              value={`${stats.averageScore}%`}
              icon={Target}
              color="#8B5CF6"
            />
            <StatCard
              label="Study Streak"
              value={`${stats.currentStreak} days`}
              icon={Flame}
              color="#EF4444"
            />
            <StatCard
              label="Study Time"
              value={`${stats.totalStudyTime}h`}
              icon={Clock}
              color="#F59E0B"
            />
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View style={[styles.quickActionsSection, animatedSlideStyle]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <QuickActionCard key={action.id} action={action} />
            ))}
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View style={[styles.activitySection, animatedSlideStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See All</Text>
              <ChevronRight size={16} color="#8B5CF6" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          
          {recentActivity.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </Animated.View>

        {/* Daily Challenge */}
        <Animated.View style={[styles.challengeSection, animatedSlideStyle]}>
          <LinearGradient
            colors={['rgba(0, 255, 136, 0.1)', 'rgba(16, 185, 129, 0.1)']}
            style={styles.challengeCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.challengeContent}>
              <View style={styles.challengeHeader}>
                <View style={styles.challengeIcon}>
                  <Sparkles size={24} color="#00FF88" strokeWidth={2.5} />
                </View>
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeTitle}>Daily Challenge</Text>
                  <Text style={styles.challengeDescription}>
                    Complete today's quiz to earn bonus XP!
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.challengeButton}
                onPress={() => router.push('/(tabs)/quiz')}
              >
                <Play size={16} color="#00FF88" strokeWidth={2} />
                <Text style={styles.challengeButtonText}>Start Challenge</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  motivationalMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 20,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#8B5CF6',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#00FF88',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#0A0A0B',
  },
  levelText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  xpCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  xpGradient: {
    flex: 1,
  },
  xpContent: {
    padding: 20,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  xpInfo: {
    flex: 1,
  },
  xpTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  xpSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  xpBadgeText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  xpProgressContainer: {
    marginTop: 8,
  },
  xpProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpProgressText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
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
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickActionCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  quickActionContent: {
    flex: 1,
    marginLeft: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  quickActionDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activitySection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
    marginRight: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  activityXP: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityXPText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#00FF88',
  },
  challengeSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  challengeCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  challengeContent: {
    padding: 20,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
  },
  challengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  challengeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#00FF88',
    marginLeft: 8,
  },
});