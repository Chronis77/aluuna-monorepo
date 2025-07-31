import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { StyledButton } from '../components/ui/StyledButton';
import { StyledInput } from '../components/ui/StyledInput';
import { Toast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';

export default function RegisterScreen() {
  const router = useRouter();
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
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
          }
        }
      });

      if (authError) {
        // Check if it's a user already exists error
        if (authError.message.includes('already registered') ||
          authError.message.includes('already exists') ||
          authError.message.includes('User already registered')) {
          setToast({
            visible: true,
            message: 'An account with this email already exists. Please try logging in instead.',
            type: 'error',
          });
        } else {
          setToast({
            visible: true,
            message: authError.message,
            type: 'error',
          });
        }
        return;
      }

      if (authData.user) {
        // Debug: Log user status
        console.log('User created:', authData.user.id);
        console.log('User email confirmed:', authData.user.email_confirmed_at);
        console.log('User role:', authData.user.role);
        
        // Insert additional user data into the users table
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              name: name.trim(),
              email: email.toLowerCase(),
              created_at: new Date().toISOString(),
            }
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);

          // Check if it's a duplicate key error (user already exists)
          if (profileError.code === '23505') {
            setToast({
              visible: true,
              message: 'An account with this email already exists. Please try logging in instead.',
              type: 'error',
            });
            return;
          }

          // For other profile errors, still show success but log the error
          console.error('Non-critical profile creation error:', profileError);
        }

        setToast({
          visible: true,
          message: 'Your account has been created successfully. Please check your email to verify your account.',
          type: 'success',
        });

        // Navigate to onboarding after a short delay
        setTimeout(() => {
          router.replace('/onboarding/step1' as any);
          setName('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setToast({
        visible: true,
        message: 'An unexpected error occurred. Please try again.',
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