import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { AluunaLoader } from '../components/AluunaLoader';
import { useAuth } from '../context/AuthContext';
import { trpcClient } from '../lib/trpcClient';

export default function Index() {
  const { session, authLoading } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  // Check onboarding status when user is authenticated
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (session?.user?.id && !onboardingChecked) {
        try {
          console.log('🔍 Checking onboarding status for user:', session.user.id);
          const onboardingStatus = await trpcClient.checkOnboardingStatus(session.user.id);
          console.log('📋 Onboarding status:', onboardingStatus);
          
          setShouldShowOnboarding(onboardingStatus.shouldShowOnboarding);
          setOnboardingChecked(true);
        } catch (error) {
          console.error('❌ Error checking onboarding status:', error);
          // Default to conversation if check fails
          setShouldShowOnboarding(false);
          setOnboardingChecked(true);
        }
      }
    };

    checkOnboardingStatus();
  }, [session, onboardingChecked]);

  console.log('🏠 Index page - Session state:', session ? 'Authenticated' : session === null ? 'Loading' : 'Not authenticated');

  // If we have a session, user is authenticated
  if (session && onboardingChecked) {
    if (shouldShowOnboarding) {
      console.log('🚀 User should see onboarding, redirecting to step1');
      return <Redirect href="/onboarding/step1" />;
    } else {
      console.log('✅ User has completed or skipped onboarding, redirecting to conversation');
      return <Redirect href="/conversation" />;
    }
  }

  // While restoring auth or performing onboarding check, show loader
  if (authLoading || (session && !onboardingChecked)) {
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

  console.log('⚠️ User not authenticated, redirecting to login');
  return <Redirect href="/login" />;
}