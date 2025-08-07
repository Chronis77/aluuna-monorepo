import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { AluunaLoader } from '../components/AluunaLoader';
import { useAuth } from '../context/AuthContext';
import { config } from '../lib/config';

export default function LoadingScreen() {
  const { session } = useAuth();

  useEffect(() => {
    // Check authentication after a short delay
    const timer = setTimeout(() => {
      if (session) {
        console.log('✅ User authenticated, redirecting to session');
        router.replace('/conversation');
      } else {
        console.log('⚠️ No authentication, redirecting to login');
        router.replace('/login');
      }
    }, config.ui.loadingTimeout);

    return () => clearTimeout(timer);
  }, [session]);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <AluunaLoader />
      <View className="mt-5">
        <Text className="text-lg text-gray-700 font-sans">Loading Aluuna...</Text>
      </View>
    </View>
  );
}
