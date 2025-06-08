// (auth)/index.tsx - Enhanced Sign-In with Interactive Popups
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Sparkles,
  AlertCircle,
  CheckCircle,
  X,
  UserX,
  Wifi,
  Shield
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

type PopupType = 'success' | 'error' | 'info' | null;

interface PopupState {
  type: PopupType;
  title: string;
  message: string;
  buttonText: string;
  onPress: () => void;
  secondaryButton?: {
    text: string;
    onPress: () => void;
  };
}

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [popup, setPopup] = useState<PopupState | null>(null);

  const { signIn } = useAuth();

  const showPopup = (popupState: PopupState) => {
    setPopup(popupState);
  };

  const hidePopup = () => {
    setPopup(null);
  };

  const handleSignIn = async () => {
    // Input validation with friendly popups
    if (!email || !password) {
      showPopup({
        type: 'error',
        title: 'Missing Information',
        message: 'Please enter both your email and password to sign in.',
        buttonText: 'Got it',
        onPress: hidePopup
      });
      return;
    }

    if (!email.includes('@')) {
      showPopup({
        type: 'error',
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
        buttonText: 'Fix Email',
        onPress: hidePopup
      });
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        // Handle different sign-in errors with specific popups
        if (signInError.message?.includes('Invalid login credentials')) {
          showPopup({
            type: 'error',
            title: 'Incorrect Credentials',
            message: 'The email or password you entered is incorrect. Please double-check and try again.',
            buttonText: 'Try Again',
            onPress: hidePopup,
            secondaryButton: {
              text: 'Forgot Password?',
              onPress: () => {
                hidePopup();
                // Handle forgot password flow
                showPopup({
                  type: 'info',
                  title: 'Reset Password',
                  message: 'Password reset feature coming soon! For now, try to remember your password or create a new account.',
                  buttonText: 'Create New Account',
                  onPress: () => {
                    hidePopup();
                    router.push('/(auth)/signup');
                  }
                });
              }
            }
          });
        } else if (signInError.message?.includes('Email not confirmed')) {
          showPopup({
            type: 'info',
            title: 'Email Not Verified',
            message: 'Please check your email and click the verification link before signing in.',
            buttonText: 'Resend Verification',
            onPress: () => {
              hidePopup();
              // Handle resend verification
              showPopup({
                type: 'success',
                title: 'Verification Resent! ✉️',
                message: 'We\'ve sent another verification email. Check your inbox and spam folder.',
                buttonText: 'Got it',
                onPress: hidePopup
              });
            },
            secondaryButton: {
              text: 'I\'ll check my email',
              onPress: hidePopup
            }
          });
        } else if (signInError.message?.includes('Too many requests')) {
          showPopup({
            type: 'error',
            title: 'Too Many Attempts',
            message: 'You\'ve made too many sign-in attempts. Please wait a few minutes before trying again.',
            buttonText: 'I\'ll wait',
            onPress: hidePopup
          });
        } else if (signInError.message?.includes('User not found')) {
          showPopup({
            type: 'error',
            title: 'Account Not Found',
            message: `No account found with ${email}. Would you like to create a new account?`,
            buttonText: 'Create Account',
            onPress: () => {
              hidePopup();
              router.push('/(auth)/signup');
            },
            secondaryButton: {
              text: 'Try Different Email',
              onPress: hidePopup
            }
          });
        } else if (signInError.message?.includes('network') || signInError.message?.includes('fetch')) {
          showPopup({
            type: 'error',
            title: 'Connection Issue',
            message: 'Unable to connect to our servers. Please check your internet connection and try again.',
            buttonText: 'Retry',
            onPress: () => {
              hidePopup();
              handleSignIn();
            }
          });
        } else {
          showPopup({
            type: 'error',
            title: 'Sign In Failed',
            message: signInError.message || 'Something went wrong. Please try again.',
            buttonText: 'Try Again',
            onPress: hidePopup
          });
        }
      } else {
        // Success! Show welcome back message
        showPopup({
          type: 'success',
          title: 'Welcome Back! 🎉',
          message: 'Successfully signed in. Ready to continue your learning journey?',
          buttonText: 'Let\'s Go!',
          onPress: () => {
            hidePopup();
            router.replace('/(tabs)');
          }
        });
      }
    } catch (err) {
      showPopup({
        type: 'error',
        title: 'Unexpected Error',
        message: 'Something unexpected happened. Please try again.',
        buttonText: 'Retry',
        onPress: hidePopup
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    showPopup({
      type: 'info',
      title: 'Demo Account',
      message: 'You\'re about to sign in with our demo account. This will give you full access to explore all features!',
      buttonText: 'Continue with Demo',
      onPress: async () => {
        hidePopup();
        setEmail('demo@mindgains.ai');
        setPassword('demo123');
        
        // Small delay for visual feedback
        setTimeout(() => {
          handleSignIn();
        }, 500);
      },
      secondaryButton: {
        text: 'Use My Account',
        onPress: hidePopup
      }
    });
  };

  const InteractivePopup = () => {
    if (!popup) return null;

    const getPopupColors = () => {
      switch (popup.type) {
        case 'success':
          return {
            primary: '#00FF88',
            secondary: '#00CC6F',
            icon: CheckCircle,
            iconColor: '#0A0A0B'
          };
        case 'info':
          return {
            primary: '#3B82F6',
            secondary: '#2563EB',
            icon: Shield,
            iconColor: '#FFFFFF'
          };
        case 'error':
        default:
          return {
            primary: '#FF6B6B',
            secondary: '#FF5252',
            icon: AlertCircle,
            iconColor: '#FFFFFF'
          };
      }
    };

    const colors = getPopupColors();
    const IconComponent = colors.icon;

    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        onRequestClose={hidePopup}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.popupContainer}>
            <View style={styles.popupContent}>
              {/* Close Button */}
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={hidePopup}
              >
                <X size={20} color="rgba(255, 255, 255, 0.7)" />
              </TouchableOpacity>

              {/* Icon */}
              <View style={[styles.popupIcon, { backgroundColor: colors.primary }]}>
                <IconComponent 
                  size={40} 
                  color={colors.iconColor} 
                  strokeWidth={2.5} 
                />
              </View>
              
              {/* Title */}
              <Text style={styles.popupTitle}>{popup.title}</Text>
              
              {/* Message */}
              <Text style={styles.popupMessage}>{popup.message}</Text>
              
              {/* Primary Action Button */}
              <TouchableOpacity
                style={styles.popupButton}
                onPress={popup.onPress}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.popupButtonGradient}
                >
                  <Text style={[styles.popupButtonText, { color: colors.iconColor }]}>
                    {popup.buttonText}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Secondary Button */}
              {popup.secondaryButton && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={popup.secondaryButton.onPress}
                >
                  <Text style={styles.secondaryButtonText}>
                    {popup.secondaryButton.text}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Background Elements */}
          <View style={styles.backgroundElements}>
            <View style={[styles.floatingElement, styles.element1]} />
            <View style={[styles.floatingElement, styles.element2]} />
            <View style={[styles.floatingElement, styles.element3]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#00FF88', '#00CC6F']}
                style={styles.logoGradient}
              >
                <Sparkles size={32} color="#0A0A0B" strokeWidth={2.5} />
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your learning journey
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={[
                styles.inputWrapper,
                focusedField === 'email' && styles.inputFocused
              ]}>
                <Mail 
                  size={20} 
                  color={focusedField === 'email' ? '#00FF88' : 'rgba(255, 255, 255, 0.5)'} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Email address"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  returnKeyType="next"
                  textContentType="emailAddress"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={[
                styles.inputWrapper,
                focusedField === 'password' && styles.inputFocused
              ]}>
                <Lock 
                  size={20} 
                  color={focusedField === 'password' ? '#00FF88' : 'rgba(255, 255, 255, 0.5)'} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  returnKeyType="done"
                  textContentType="password"
                  onSubmitEditing={handleSignIn}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="rgba(255, 255, 255, 0.5)" />
                  ) : (
                    <Eye size={20} color="rgba(255, 255, 255, 0.5)" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#666', '#555'] : ['#00FF88', '#00CC6F']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Demo Login */}
            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleDemoLogin}
              disabled={loading}
            >
              <Text style={styles.demoButtonText}>Try Demo Account</Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <InteractivePopup />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height,
    paddingHorizontal: 24,
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
    opacity: 0.1,
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
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    zIndex: 1,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  inputFocused: {
    borderColor: '#00FF88',
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  signInButton: {
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#0A0A0B',
    fontSize: 16,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  demoButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  signUpLink: {
    color: '#00FF88',
    fontSize: 14,
    fontWeight: '600',
  },
  // Popup Styles (same as signup)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  popupContainer: {
    width: '100%',
    maxWidth: 360,
  },
  popupContent: {
    backgroundColor: 'rgba(26, 26, 27, 0.98)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  popupIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  popupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  popupMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  popupButton: {
    width: '100%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  popupButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
});