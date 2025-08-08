import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkipWarningModal } from '../../components/onboarding/SkipWarningModal';
import { trpcClient } from '../../lib/trpcClient';
import { useAuth } from '../../context/AuthContext';

export default function OnboardingSkipScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [showWarning, setShowWarning] = useState(true);

  const handleConfirmSkip = async () => {
    setShowWarning(false);
    
    try {
      console.log('Skipping onboarding - marking user as skipped');
      
      if (session?.user?.id) {
        await trpcClient.markOnboardingSkipped(session.user.id);
        console.log('✅ Onboarding marked as skipped');
      }
      
      // Navigate to main app
      router.replace('/conversation' as any);
    } catch (error) {
      console.error('Error in handleConfirmSkip:', error);
      // Still navigate to main app even if marking as skipped fails
      router.replace('/conversation' as any);
    }
  };

  const handleCancel = () => {
    setShowWarning(false);
    // Go back to previous step
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center">
        <SkipWarningModal
          visible={showWarning}
          onConfirmSkip={handleConfirmSkip}
          onCancel={handleCancel}
        />
      </View>
    </SafeAreaView>
  );
} 