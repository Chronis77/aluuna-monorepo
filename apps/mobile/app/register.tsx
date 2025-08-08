import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { StyledButton } from '../components/ui/StyledButton';
import { StyledInput } from '../components/ui/StyledInput';
import { Toast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { trpcClient } from '../lib/trpcClient';

export default function RegisterScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const validate = () => {
    let valid = true;
    let newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
      valid = false;
    }

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      valid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      newErrors.password = 'Password must be at least 8 characters, include uppercase, lowercase, number, and special character';
      valid = false;
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      valid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleHideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      console.log('🔐 Attempting signup with email:', email);
      const result = await signup(email, password, name.trim());

      if (result.success) {
        console.log('✅ Signup successful, checking onboarding status');
        setToast({
          visible: true,
          message: 'Account created successfully!',
          type: 'success',
        });
        
        // Check if user should see onboarding
        try {
          if (result.user?.id) {
            // Add a small delay to ensure JWT token is stored
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const onboardingStatus = await trpcClient.checkOnboardingStatus(result.user.id);
            console.log('📋 Onboarding status:', onboardingStatus);
            
            if (onboardingStatus.shouldShowOnboarding) {
              console.log('🚀 Redirecting to onboarding wizard');
              router.replace('/onboarding/step1' as any);
            } else {
              console.log('✅ User has completed or skipped onboarding, redirecting to conversation');
              router.replace('/conversation' as any);
            }
          } else {
            console.log('⚠️ No user ID in signup result, redirecting to conversation');
            router.replace('/conversation' as any);
          }
        } catch (onboardingError) {
          console.error('❌ Error checking onboarding status:', onboardingError);
          // Fallback to conversation if onboarding check fails
          router.replace('/conversation' as any);
        }
      } else {
        console.log('⚠️ Signup failed:', result.error);
        setToast({
          visible: true,
          message: result.error || 'Signup failed',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('❌ Unexpected signup error:', error);
      setToast({
        visible: true,
        message: 'An unexpected error occurred',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        className="flex-1 bg-white" 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center items-center bg-white px-6 w-[80%]">
          <Toast
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
            onHide={handleHideToast}
          />
          <Image
            source={require('../assets/images/logo.png')}
            className="max-w-[220px] h-[60px] max-h-[60px] mb-8"
            resizeMode="contain"
          />
          <Text className="text-2xl font-heading mb-8 text-gray-800 font-sans">Create Account</Text>

          <View style={{ width: '100%' }}>
            <StyledInput
              placeholder="Full Name"
              onChangeText={setName}
              value={name}
              autoCapitalize="words"
            />
            <ErrorMessage message={errors.name} />

            <StyledInput
              placeholder="Email"
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
            />
            <ErrorMessage message={errors.email} />

            <StyledInput
              placeholder="Password"
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              value={password}
              right={
                <Pressable onPress={() => setShowPassword((v) => !v)}>
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={22}
                    color="#9CA3AF"
                  />
                </Pressable>
              }
            />
            <ErrorMessage message={errors.password} />

            <StyledInput
              placeholder="Confirm Password"
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              right={
                <Pressable onPress={() => setShowConfirmPassword((v) => !v)}>
                  <MaterialIcons
                    name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                    size={22}
                    color="#9CA3AF"
                  />
                </Pressable>
              }
            />
            <ErrorMessage message={errors.confirmPassword} />

            <View className="mt-4 items-center">
              <StyledButton
                title={isLoading ? "Creating Account..." : "Sign Up"}
                onPress={handleRegister}
                disabled={isLoading}
              />
            </View>

            <View className="mt-0 items-center">
              <StyledButton
                title="Back to Login"
                onPress={() => router.push('/login' as any)}
                variant="outline"
              />
            </View>

            <View className="mt-4 items-center">
              <Text className="text-xs text-gray-600 text-center mb-1">
                By signing up, you agree to the
              </Text>
              <Text
                className="text-blue-custom underline text-xs text-center mb-1"
                onPress={() => router.push('/terms-and-conditions' as any)}
              >
                Terms and Conditions
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 