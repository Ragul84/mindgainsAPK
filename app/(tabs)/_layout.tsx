import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { 
  Home, 
  Brain, 
  Trophy, 
  Newspaper, 
  User 
} from 'lucide-react-native';
import { useEffect } from 'react';

export default function TabLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(auth)" />;
  }

  // Optimized tab bar icon for instant navigation
  const AnimatedTabBarIcon = ({ 
    icon: Icon, 
    color, 
    focused
  }: { 
    icon: React.ComponentType<any>; 
    color: string; 
    focused: boolean;
  }) => {
    const scale = useSharedValue(focused ? 1.05 : 1);
    const glowOpacity = useSharedValue(focused ? 1 : 0);

    // Simplified, faster animations
    useEffect(() => {
      if (focused) {
        scale.value = withTiming(1.05, { duration: 150 }); // Faster animation
        glowOpacity.value = withTiming(1, { duration: 150 });
      } else {
        scale.value = withTiming(1, { duration: 150 });
        glowOpacity.value = withTiming(0, { duration: 100 });
      }
    }, [focused]);

    const animatedIconStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const animatedGlowStyle = useAnimatedStyle(() => ({
      opacity: glowOpacity.value,
    }));

    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          position: 'relative',
        }}
      >
        {/* Static background for active state */}
        {focused && (
          <View 
            style={{
              position: 'absolute',
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'rgba(0, 255, 136, 0.12)',
              borderWidth: 1,
              borderColor: 'rgba(0, 255, 136, 0.25)',
            }}
          />
        )}
        
        {/* Outer glow effect for active state */}
        {focused && (
          <Animated.View 
            style={[
              {
                position: 'absolute',
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: 'rgba(0, 255, 136, 0.05)',
                borderWidth: 1,
                borderColor: 'rgba(0, 255, 136, 0.1)',
              },
              animatedGlowStyle
            ]} 
          />
        )}
        
        {/* Icon with minimal animation */}
        <Animated.View style={animatedIconStyle}>
          <Icon 
            size={26} 
            color={focused ? '#00FF88' : color}
            strokeWidth={focused ? 2.5 : 2}
          />
        </Animated.View>
        
        {/* Active indicator dot */}
        {focused && (
          <View 
            style={{
              position: 'absolute',
              bottom: 6,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#00FF88',
              shadowColor: '#00FF88',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 4,
            }}
          />
        )}
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20, // Floating effect
          left: 20,
          right: 20,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 12,
          paddingTop: 12,
          paddingHorizontal: 16,
          elevation: 0,
          shadowOpacity: 0,
          borderRadius: 28, // Fully rounded
        },
        tabBarBackground: () => (
          <>
            {/* Main glassmorphism background */}
            {Platform.OS !== 'web' ? (
              <BlurView
                intensity={90}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'rgba(10, 10, 11, 0.9)',
                  borderRadius: 28,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
              />
            ) : (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'rgba(10, 10, 11, 0.95)',
                  borderRadius: 28,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
              />
            )}
            
            {/* Gradient border effect */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 28,
                padding: 1,
                background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(139, 92, 246, 0.2) 50%, rgba(59, 130, 246, 0.2) 100%)',
              }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: 27,
                  backgroundColor: 'transparent',
                }}
              />
            </View>
            
            {/* Inner highlight */}
            <View
              style={{
                position: 'absolute',
                top: 2,
                left: 2,
                right: 2,
                height: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderTopLeftRadius: 26,
                borderTopRightRadius: 26,
              }}
            />
            
            {/* Subtle shadow inside */}
            <View
              style={{
                position: 'absolute',
                bottom: 2,
                left: 2,
                right: 2,
                height: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderBottomLeftRadius: 26,
                borderBottomRightRadius: 26,
              }}
            />
          </>
        ),
        tabBarActiveTintColor: '#00FF88',
        tabBarInactiveTintColor: 'rgba(156, 163, 175, 0.7)',
        tabBarItemStyle: {
          paddingVertical: 0,
          borderRadius: 24,
          marginHorizontal: 2,
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon icon={Home} color={color} focused={focused} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="study"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon icon={Brain} color={color} focused={focused} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="quiz"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon icon={Trophy} color={color} focused={focused} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="news"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon icon={Newspaper} color={color} focused={focused} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon icon={User} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}