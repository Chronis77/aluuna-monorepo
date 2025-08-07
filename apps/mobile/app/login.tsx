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

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const validate = () => {
    let valid = true;
    let newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      console.log('🔐 Attempting login with email:', email);
      const result = await login(email, password);
      
      if (result.success) {
        console.log('✅ Login successful, redirecting to session');
        setToast({
          visible: true,
          message: 'Login successful!',
          type: 'success',
        });
        // Redirect to session page on successful login
        router.replace('/conversation' as any);
      } else {
        console.log('⚠️ Login failed:', result.error);
        setToast({
          visible: true,
          message: result.error || 'Login failed',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('❌ Unexpected login error:', error);
      setToast({
        visible: true,
        message: 'An unexpected error occurred',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
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
            onHide={hideToast}
          />
          <Image
            source={require('../assets/images/logo.png')}
            className="max-w-[220px] h-[60px] max-h-[60px] mb-8"
            resizeMode="contain"
          />
          <Text className="text-2xl font-heading mb-8 text-gray-800 font-sans">Welcome Back</Text>
          
          <View className="w-full">
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
            
            <View className="mt-4 items-center">
                <StyledButton 
                  title={isLoading ? "Logging In..." : "Log In"} 
                  onPress={handleLogin} 
                  disabled={isLoading}
                />
            </View>
            
            <View className="mt-0 items-center">
              <StyledButton 
                title="Sign Up" 
                onPress={() => {
                  router.push('/register' as any);
                }}
                variant="outline"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}