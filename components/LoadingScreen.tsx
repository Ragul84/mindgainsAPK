// components/LoadingScreen.tsx - Beautiful Loading Component
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading...", 
  subMessage 
}) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    // Spinning animation
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000 }),
      -1,
      false
    );

    // Pulsing animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    // Opacity animation
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.7, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedSpinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={[styles.floatingElement, styles.element1]} />
        <View style={[styles.floatingElement, styles.element2]} />
        <View style={[styles.floatingElement, styles.element3]} />
      </View>

      {/* Main Loading Content */}
      <View style={styles.content}>
        {/* Animated Logo */}
        <Animated.View style={[styles.logoContainer, animatedPulseStyle]}>
          <LinearGradient
            colors={['#00FF88', '#00CC6F']}
            style={styles.logoGradient}
          >
            <Animated.View style={animatedSpinStyle}>
              <Sparkles size={40} color="#0A0A0B" strokeWidth={2.5} />
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Loading Text */}
        <Text style={styles.loadingText}>{message}</Text>
        {subMessage && (
          <Text style={styles.subText}>{subMessage}</Text>
        )}

        {/* Loading Dots */}
        <View style={styles.dotsContainer}>
          <LoadingDot delay={0} />
          <LoadingDot delay={200} />
          <LoadingDot delay={400} />
        </View>
      </View>
    </View>
  );
};

// Individual Loading Dot Component
const LoadingDot: React.FC<{ delay: number }> = ({ delay }) => {
  const animatedValue = useSharedValue(0.5);

  useEffect(() => {
    animatedValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.5, { duration: 600 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animatedValue.value,
    transform: [{ scale: animatedValue.value }],
  }));

  return (
    <Animated.View style={[styles.dot, animatedStyle]} />
  );
};

// Page Transition Loading Component
export const PageTransitionLoader: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.transitionContainer}>
      <View style={styles.transitionContent}>
        <LinearGradient
          colors={['#00FF88', '#00CC6F']}
          style={styles.transitionLogo}
        >
          <Sparkles size={24} color="#0A0A0B" strokeWidth={2.5} />
        </LinearGradient>
        <Text style={styles.transitionText}>Loading...</Text>
      </View>
    </View>
  );
};

// Minimal Loading Spinner
export const LoadingSpinner: React.FC<{ size?: number; color?: string }> = ({ 
  size = 20, 
  color = '#00FF88' 
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.spinner, { width: size, height: size }]} >
      <Animated.View style={[
        styles.spinnerInner, 
        { 
          width: size, 
          height: size, 
          borderColor: color,
          borderTopColor: 'transparent' 
        },
        animatedStyle
      ]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingElement: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.05,
  },
  element1: {
    width: 200,
    height: 200,
    backgroundColor: '#00FF88',
    top: -100,
    right: -100,
  },
  element2: {
    width: 150,
    height: 150,
    backgroundColor: '#FF6B6B',
    bottom: 100,
    left: -75,
  },
  element3: {
    width: 120,
    height: 120,
    backgroundColor: '#4ECDC4',
    top: '40%',
    right: -60,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 15,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF88',
    marginHorizontal: 4,
  },
  // Transition Loader Styles
  transitionContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 11, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  transitionContent: {
    alignItems: 'center',
  },
  transitionLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  transitionText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  // Spinner Styles
  spinner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerInner: {
    borderWidth: 2,
    borderRadius: 50,
  },
});

// Auth Loading Context for managing loading states
export const useAuthLoading = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState('Loading...');

  const showLoading = (message = 'Loading...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  return {
    isLoading,
    loadingMessage,
    showLoading,
    hideLoading,
  };
};