import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { Star, Zap } from 'lucide-react-native';

interface XPBarProps {
  currentXP: number;
  nextLevelXP: number;
  level: number;
}

export const XPBar: React.FC<XPBarProps> = ({ currentXP, nextLevelXP, level }) => {
  const progress = (currentXP % 1000) / 10; // Assuming 1000 XP per level

  return (
    <View style={styles.xpContainer}>
      <View style={styles.xpHeader}>
        <Text style={styles.levelText}>Level {level}</Text>
        <Text style={styles.xpText}>{currentXP} XP</Text>
      </View>
      <View style={styles.xpBarContainer}>
        <LinearGradient
          colors={['#00FF88', '#8B5CF6']}
          style={[styles.xpBar, { width: `${progress}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
      <Text style={styles.xpToNext}>
        {nextLevelXP - (currentXP % 1000)} XP to next level
      </Text>
    </View>
  );
};

interface StreakBadgeProps {
  streak: number;
  animated?: boolean;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, animated = false }) => {
  const pulseAnimation = useSharedValue(1);

  React.useEffect(() => {
    if (animated) {
      pulseAnimation.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  return (
    <Animated.View style={[styles.streakBadge, animated && animatedStyle]}>
      <Zap size={16} color="#FF6B35" strokeWidth={2.5} />
      <Text style={styles.streakText}>{streak} day streak!</Text>
    </Animated.View>
  );
};

interface AchievementBadgeProps {
  title: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  title,
  description,
  rarity,
  earned = false,
}) => {
  const getRarityColor = () => {
    switch (rarity) {
      case 'common': return '#6B7280';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const glowAnimation = useSharedValue(0);

  React.useEffect(() => {
    if (earned && rarity !== 'common') {
      glowAnimation.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000 }),
          withTiming(0, { duration: 2000 })
        ),
        -1,
        true
      );
    }
  }, [earned, rarity]);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: earned ? 0.3 + glowAnimation.value * 0.4 : 0,
    elevation: earned ? 8 + glowAnimation.value * 4 : 0,
  }));

  return (
    <Animated.View style={[
      styles.achievementBadge,
      !earned && styles.achievementBadgeLocked,
      animatedGlowStyle,
      { shadowColor: getRarityColor() }
    ]}>
      <View style={[
        styles.achievementIcon,
        { backgroundColor: getRarityColor() + '20' }
      ]}>
        <Star 
          size={20} 
          color={earned ? getRarityColor() : '#6B7280'} 
          strokeWidth={2}
          fill={earned ? getRarityColor() : 'none'}
        />
      </View>
      <View style={styles.achievementContent}>
        <Text style={[
          styles.achievementTitle,
          !earned && { color: '#6B7280' }
        ]}>
          {title}
        </Text>
        <Text style={styles.achievementDescription}>
          {description}
        </Text>
        <View style={styles.rarityContainer}>
          <View style={[
            styles.rarityDot,
            { backgroundColor: getRarityColor() }
          ]} />
          <Text style={[
            styles.rarityText,
            { color: getRarityColor() }
          ]}>
            {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  xpContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelText: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color: '#FFFFFF',
  },
  xpText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#00FF88',
  },
  xpBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  xpBar: {
    height: '100%',
    borderRadius: 4,
  },
  xpToNext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  streakText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FF6B35',
    marginLeft: 6,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  achievementBadgeLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
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
  rarityContainer: {
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
});