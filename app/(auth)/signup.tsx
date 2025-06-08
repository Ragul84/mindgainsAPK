// (auth)/signup.tsx - Enhanced with Interactive Popups
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
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Lock, 
  CheckCircle,
  Sparkles,
  AlertCircle,
  X,
  RefreshCw
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

type PopupType = 'success' | 'verification' | 'error' | null;

interface PopupState {
  type: PopupType;
  title: string;
  message: string;
  buttonText: string;
  onPress: () => void;
}

export default function SignUpScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [popup, setPopup] = useState<PopupState | null>(null);

  const { signUp } = useAuth();

  const showPopup = (popupState: PopupState) => {
    setPopup(popupState);
  };

  const hidePopup = () => {
    setPopup(null);
  };

  const validateStep1 = () => {
    if (!fullName.trim()) {
      showPopup({
        type: 'error',
        title: 'Missing Information',
        message: 'Please enter your full name to continue.',
        buttonText: 'Got it',
        onPress: hidePopup
      });
      return false;
    }
    if (!email.trim()) {
      showPopup({
        type: 'error',
        title: 'Email Required',
        message: 'Please enter your email address.',
        buttonText: 'Got it',
        onPress: hidePopup
      });
      return false;
    }
    if (!email.includes('@')) {
      showPopup({
        type: 'error',
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
        buttonText: 'Fix it',
        onPress: hidePopup
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!password) {
      showPopup({
        type: 'error',
        title: 'Password Required',
        message: 'Please create a password to secure your account.',
        buttonText: 'Got it',
        onPress: hidePopup
      });
      return false;
    }
    if (password.length < 6) {
      showPopup({
        type: 'error',
        title: 'Password Too Short',
        message: 'Your password must be at least 6 characters long for security.',
        buttonText: 'Make it stronger',
        onPress: hidePopup
      });
      return false;
    }
    if (password !== confirmPassword) {
      showPopup({
        type: 'error',
        title: 'Passwords Don\'t Match',
        message: 'Please make sure both password fields match exactly.',
        buttonText: 'Try again',
        onPress: hidePopup
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    setError(null);
  };

  const handleSignUp = async () => {
    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await signUp(email, password, fullName);
      
      if (signUpError) {
        // Handle different error types with specific popups
        if (signUpError.message?.includes('already registered')) {
          showPopup({
            type: 'error',
            title: 'Account Already Exists',
            message: `An account with ${email} already exists. Try signing in instead!`,
            buttonText: 'Go to Sign In',
            onPress: () => {
              hidePopup();
              router.replace('/(auth)');
            }
          });
        } else if (signUpError.message?.includes('invalid email')) {
          showPopup({
            type: 'error',
            title: 'Invalid Email Format',
            message: 'Please check your email address and try again.',
            buttonText: 'Fix Email',
            onPress: () => {
              hidePopup();
              setCurrentStep(1);
            }
          });
        } else if (signUpError.message?.includes('password')) {
          showPopup({
            type: 'error',
            title: 'Password Issue',
            message: signUpError.message || 'There was an issue with your password.',
            buttonText: 'Try Again',
            onPress: hidePopup
          });
        } else {
          showPopup({
            type: 'error',
            title: 'Signup Failed',
            message: signUpError.message || 'Something went wrong. Please try again.',
            buttonText: 'Retry',
            onPress: hidePopup
          });
        }
      } else if (data?.user) {
        // Check if email confirmation is required
        if (!data.session && !data.user.email_confirmed_at) {
          showPopup({
            type: 'verification',
            title: 'Check Your Email! 📧',
            message: `We've sent a verification link to ${email}. Click the link to activate your account and start learning!`,
            buttonText: 'Go to Sign In',
            onPress: () => {
              hidePopup();
              router.replace('/(auth)');
            }
          });
        } else {
          // User is immediately confirmed
          showPopup({
            type: 'success',
            title: 'Welcome to MindGains! 🎉',
            message: 'Your account has been created successfully. Ready to start your learning journey?',
            buttonText: 'Let\'s Go!',
            onPress: () => {
              hidePopup();
              router.replace('/(tabs)');
            }
          });
        }
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
        case 'verification':
          return {
            primary: '#3B82F6',
            secondary: '#2563EB',
            icon: Mail,
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
              
              {/* Action Button */}
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

              {/* Additional Actions for specific types */}
              {popup.type === 'verification' && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    // Resend verification logic here
                    showPopup({
                      type: 'success',
                      title: 'Email Resent! ✉️',
                      message: 'We\'ve sent another verification email. Check your inbox and spam folder.',
                      buttonText: 'Got it',
                      onPress: hidePopup
                    });
                  }}
                >
                  <RefreshCw size={16} color="#3B82F6" style={{ marginRight: 8 }} />
                  <Text style={styles.secondaryButtonText}>Resend Email</Text>
                </TouchableOpacity>
              )}

              {popup.type === 'error' && popup.title.includes('Already Exists') && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    hidePopup();
                    // Could trigger forgot password flow
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  const renderStep1 = () => (
    <>
      {/* Name Input */}
      <View style={styles.inputContainer}>
        <View style={[
          styles.inputWrapper,
          focusedField === 'name' && styles.inputFocused
        ]}>
          <User 
            size={20} 
            color={focusedField === 'name' ? '#00FF88' : 'rgba(255, 255, 255, 0.5)'} 
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Full name"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={fullName}
            onChangeText={setFullName}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            textContentType="name"
          />
        </View>
      </View>

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
            onSubmitEditing={handleNext}
          />
        </View>
      </View>

      {/* Next Button */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleNext}
      >
        <LinearGradient
          colors={['#00FF88', '#00CC6F']}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Next</Text>
          <ArrowRight size={20} color="#0A0A0B" style={{ marginLeft: 8 }} />
        </LinearGradient>
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
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
            placeholder="Password (min. 6 characters)"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            textContentType="newPassword"
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

      {/* Confirm Password Input */}
      <View style={styles.inputContainer}>
        <View style={[
          styles.inputWrapper,
          focusedField === 'confirmPassword' && styles.inputFocused
        ]}>
          <Lock 
            size={20} 
            color={focusedField === 'confirmPassword' ? '#00FF88' : 'rgba(255, 255, 255, 0.5)'} 
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.textInput, { flex: 1 }]}
            placeholder="Confirm password"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onFocus={() => setFocusedField('confirmPassword')}
            onBlur={() => setFocusedField(null)}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            textContentType="newPassword"
            onSubmitEditing={handleSignUp}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeButton}
          >
            {showConfirmPassword ? (
              <EyeOff size={20} color="rgba(255, 255, 255, 0.5)" />
            ) : (
              <Eye size={20} color="rgba(255, 255, 255, 0.5)" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <ArrowLeft size={20} color="rgba(255, 255, 255, 0.7)" style={{ marginRight: 8 }} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, { flex: 1, marginLeft: 12 }, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#666', '#555'] : ['#00FF88', '#00CC6F']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  );

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
            
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              {currentStep === 1 
                ? 'Let\'s get you started on your learning journey'
                : 'Set up your secure password'
              }
            </Text>

            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
              <View style={[styles.step, styles.stepActive]} />
              <View style={[styles.step, currentStep === 2 && styles.stepActive]} />
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {currentStep === 1 ? renderStep1() : renderStep2()}

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)')}>
                <Text style={styles.signInLink}>Sign In</Text>
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
    marginTop: 40,
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
    marginBottom: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  step: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginHorizontal: 4,
  },
  stepActive: {
    backgroundColor: '#00FF88',
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
  primaryButton: {
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
    flexDirection: 'row',
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
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  backButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signInText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  signInLink: {
    color: '#00FF88',
    fontSize: 14,
    fontWeight: '600',
  },
  // Popup Styles
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
    flexDirection: 'row',
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