import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { AluunaLoader } from '../components/AluunaLoader';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Shorter timeout - if no session after 3 seconds, go to login
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 second timeout

    return () => clearTimeout(timer);
  }, []);

  console.log('🏠 Index page - Session state:', session ? 'Authenticated' : session === null ? 'Loading' : 'Not authenticated');

  // If we have a session, user is authenticated
  if (session) {
    console.log('✅ User authenticated, redirecting to session');
    return <Redirect href="/session" />;
  }

  // If no session and still loading, show AluunaLoader
  if (session === null && isLoading) {
    console.log('⏳ Briefly showing AluunaLoader...');
    return (
      <View className="flex-1 justify-center items-center bg-white px-6">
        <Image
          source={require('../assets/images/logo.png')}
          className="max-w-[220px] h-[60px] max-h-[60px] mb-8"
          resizeMode="contain"
        />
        <AluunaLoader 
          message="Starting Aluuna..." 
          size="large"
          showMessage={true}
        />
      </View>
    );
  }

  // No session and not loading = not authenticated, go to login
  console.log('⚠️ User not authenticated, redirecting to login');
  return <Redirect href="/login" />;
}