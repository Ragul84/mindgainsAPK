import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
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
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { User, Trophy, Target, Clock, TrendingUp, Award, Star, Settings, Zap, Calendar, BookOpen, Brain, Flame, Medal, Share2, CreditCard as Edit3, LogOut } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function ProfileScreen() {
  const [selectedTab, setSelectedTab] = useState('stats');
  const { user, signOut } = useAuth();
  const { stats, loading: statsLoading, refreshStats } = useUserStats();

  // Refresh stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshStats();
    }, [refreshStats])
  );

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigation will be handled automatically by AuthContext
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
  };

  const achievements = [
    { id: 1, name: 'First Quiz Master', description: 'Complete your first quiz', icon: Trophy, earned: stats.totalQuizzes > 0, rarity: 'common' },
    { id: 2, name: 'Speed Reader', description: 'Complete 10 quizzes', icon: Zap, earned: stats.totalQuizzes >= 10, rarity: 'rare' },
    { id: 3, name: 'Streak Warrior', description: 'Maintain 7-day streak', icon: Flame, earned: stats.currentStreak >= 7, rarity: 'epic' },
    { id: 4, name: 'Quiz Champion', description: 'Score 90%+ average', icon: Trophy, earned: stats.averageScore >= 90, rarity: 'legendary' },
    { id: 5, name: 'Knowledge Seeker', description: '1000+ XP earned', icon: Brain, earned: stats.totalXP >= 1000, rarity: 'common' },
    { id: 6, name: 'Perfect Score', description: 'Get 100% in any quiz', icon: Star, earned: stats.bestScore >= 100, rarity: 'rare' },
  ];

  const studyStats = [
    { label: 'Total Study Time', value: `${stats.totalStudyTime}h`, icon: Clock, color: '#8B5CF6' },
    { label: 'Quizzes Completed', value: stats.totalQuizzes, icon: Target, color: '#00FF88' },
    { label: 'Average Accuracy', value: `${stats.averageScore}%`, icon: Award, color: '#F59E0B' },
    { label: 'Current Streak', value: `${stats.currentStreak} days`, icon: Flame, color: '#EF4444' },
  ];

  const recentActivity = [
    { id: 1, type: 'quiz', title: 'Completed "Mixed Quiz"', score: '85%', time: '2 hours ago', xp: 80 },
    { id: 2, type: 'study', title: 'Studied "Mauryan Empire"', progress: '100%', time: '4 hours ago', xp: 50 },
    { id: 3, type: 'achievement', title: 'Earned "First Quiz Master" Badge', description: 'Completed first quiz', time: '1 day ago', xp: 100 },
    { id: 4, type: 'quiz', title: 'Completed "Mixed Quiz"', score: '92%', time: '2 days ago', xp: 100 },
  ];

  const leaderboardData = [
    { rank: 1, name: 'Priya Sharma', xp: 4580, avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100' },
    { rank: 2, name: 'Amit Patel', xp: 4320, avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100' },
    { rank: 3, name: 'Sneha Reddy', xp: 3890, avatar: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=100' },
    { rank: 142, name: 'You', xp: stats.totalXP, avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100', isUser: true },
  ];

  // Animation values
  const glowAnimation = useSharedValue(0);

  React.useEffect(() => {
    glowAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.3 + glowAnimation.value * 0.4,
    elevation: 8 + glowAnimation.value * 4,
  }));

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#6B7280';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const AchievementCard = ({ achievement }: { achievement: typeof achievements[0] }) => (
    <View style={[
      styles.achievementCard,
      !achievement.earned && styles.achievementCardLocked
    ]}>
      <View style={[
        styles.achievementIcon,
        { backgroundColor: getRarityColor(achievement.rarity) + '20' }
      ]}>
        <achievement.icon 
          size={24} 
          color={achievement.earned ? getRarityColor(achievement.rarity) : '#6B7280'} 
          strokeWidth={2} 
        />
      </View>
      <View style={styles.achievementContent}>
        <Text style={[
          styles.achievementName,
          !achievement.earned && { color: '#6B7280' }
        ]}>
          {achievement.name}
        </Text>
        <Text style={styles.achievementDescription}>
          {achievement.description}
        </Text>
        <View style={styles.achievementRarity}>
          <View style={[
            styles.rarityDot,
            { backgroundColor: getRarityColor(achievement.rarity) }
          ]} />
          <Text style={[
            styles.rarityText,
            { color: getRarityColor(achievement.rarity) }
          ]}>
            {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
          </Text>
        </View>
      </View>
      {achievement.earned && (
        <View style={styles.achievementEarned}>
          <Star size={16} color="#F59E0B" strokeWidth={2} fill="#F59E0B" />
        </View>
      )}
    </View>
  );

  const StatCard = ({ stat }: { stat: typeof studyStats[0] }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
        <stat.icon size={20} color={stat.color} strokeWidth={2.5} />
      </View>
      <Text style={styles.statLabel}>{stat.label}</Text>
      <Text style={styles.statValue}>{statsLoading ? '...' : stat.value}</Text>
    </View>
  );

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

  const LeaderboardItem = ({ item }: { item: typeof leaderboardData[0] }) => (
    <View style={[
      styles.leaderboardItem,
      item.isUser && styles.leaderboardItemUser
    ]}>
      <Text style={styles.leaderboardRank}>#{item.rank}</Text>
      <Image source={{ uri: item.avatar }} style={styles.leaderboardAvatar} />
      <Text style={[
        styles.leaderboardName,
        item.isUser && { color: '#00FF88' }
      ]}>
        {item.name}
      </Text>
      <Text style={styles.leaderboardXP}>{item.xp} XP</Text>
    </View>
  );

  const TabButton = ({ id, title, isSelected, onPress }: {
    id: string;
    title: string;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        isSelected && styles.tabButtonSelected
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.tabButtonText,
        isSelected && styles.tabButtonTextSelected
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={['#8B5CF6', '#3B82F6']}
            style={styles.profileGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.profileContent}>
              <View style={styles.profileTop}>
                <View style={styles.profileInfo}>
                  <Image 
                    source={{ uri: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400' }} 
                    style={styles.avatar} 
                  />
                  <View style={styles.profileText}>
                    <Text style={styles.profileName}>
                      {user?.user_metadata?.full_name || 'Student'}
                    </Text>
                    <Text style={styles.profileUsername}>@{user?.email?.split('@')[0]}</Text>
                    <Text style={styles.profileJoined}>
                      Joined {new Date(user?.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.editButton}>
                  <Edit3 size={20} color="#FFFFFF" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <View style={styles.levelContainer}>
                <View style={styles.levelInfo}>
                  <Text style={styles.levelText}>Level {stats.currentLevel}</Text>
                  <Text style={styles.xpText}>{stats.totalXP} / {stats.currentLevel * 1000} XP</Text>
                </View>
                <View style={styles.xpBarContainer}>
                  <LinearGradient
                    colors={['#00FF88', '#10B981']}
                    style={[styles.xpBar, { width: `${(stats.totalXP % 1000) / 10}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
              </View>

              <View style={styles.quickStats}>
                <View style={styles.quickStatItem}>
                  <Trophy size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.quickStatValue}>#142</Text>
                  <Text style={styles.quickStatLabel}>Rank</Text>
                </View>
                <View style={styles.quickStatItem}>
                  <Flame size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.quickStatValue}>{stats.currentStreak}</Text>
                  <Text style={styles.quickStatLabel}>Streak</Text>
                </View>
                <View style={styles.quickStatItem}>
                  <BookOpen size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.quickStatValue}>History</Text>
                  <Text style={styles.quickStatLabel}>Favorite</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Share2 size={20} color="#8B5CF6" strokeWidth={2} />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Settings size={20} color="#8B5CF6" strokeWidth={2} />
            <Text style={styles.actionButtonText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
            <LogOut size={20} color="#EF4444" strokeWidth={2} />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TabButton
            id="stats"
            title="Stats"
            isSelected={selectedTab === 'stats'}
            onPress={() => setSelectedTab('stats')}
          />
          <TabButton
            id="achievements"
            title="Achievements"
            isSelected={selectedTab === 'achievements'}
            onPress={() => setSelectedTab('achievements')}
          />
          <TabButton
            id="activity"
            title="Activity"
            isSelected={selectedTab === 'activity'}
            onPress={() => setSelectedTab('activity')}
          />
          <TabButton
            id="leaderboard"
            title="Leaderboard"
            isSelected={selectedTab === 'leaderboard'}
            onPress={() => setSelectedTab('leaderboard')}
          />
        </View>

        {/* Tab Content */}
        {selectedTab === 'stats' && (
          <View style={styles.tabContent}>
            <View style={styles.statsGrid}>
              {studyStats.map((stat, index) => (
                <StatCard key={index} stat={stat} />
              ))}
            </View>
          </View>
        )}

        {selectedTab === 'achievements' && (
          <View style={styles.tabContent}>
            <View style={styles.achievementsHeader}>
              <Text style={styles.achievementsTitle}>
                {achievements.filter(a => a.earned).length} of {achievements.length} unlocked
              </Text>
            </View>
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </View>
        )}

        {selectedTab === 'activity' && (
          <View style={styles.tabContent}>
            {recentActivity.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </View>
        )}

        {selectedTab === 'leaderboard' && (
          <View style={styles.tabContent}>
            {leaderboardData.map((item) => (
              <LeaderboardItem key={item.rank} item={item} />
            ))}
          </View>
        )}
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
  profileHeader: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileGradient: {
    flex: 1,
  },
  profileContent: {
    padding: 24,
    position: 'relative',
  },
  profileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  profileJoined: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelContainer: {
    marginBottom: 24,
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
  },
  xpText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  xpBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBar: {
    height: '100%',
    borderRadius: 4,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatValue: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginTop: 6,
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 80,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
    marginLeft: 6,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabButtonSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  tabButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#9CA3AF',
  },
  tabButtonTextSelected: {
    color: '#FFFFFF',
  },
  tabContent: {
    paddingHorizontal: 20,
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
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  achievementsHeader: {
    marginBottom: 16,
  },
  achievementsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#D1D5DB',
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  achievementCardLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  achievementRarity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  rarityText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'capitalize',
  },
  achievementEarned: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  leaderboardItemUser: {
    borderColor: '#00FF88',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  leaderboardRank: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#8B5CF6',
    width: 40,
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  leaderboardName: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
    flex: 1,
  },
  leaderboardXP: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#9CA3AF',
  },
});