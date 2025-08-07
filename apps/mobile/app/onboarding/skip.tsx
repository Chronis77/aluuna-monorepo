import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkipWarningModal } from '../../components/onboarding/SkipWarningModal';

export default function OnboardingSkipScreen() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(true);

  const handleConfirmSkip = async () => {
    setShowWarning(false);
    
    try {
      // TODO: Implement with tRPC when user management is ready
      console.log('Skipping onboarding - will be implemented with tRPC');
      
      // Navigate to main app
      router.replace('/conversation' as any);
    } catch (error) {
      console.error('Error in handleConfirmSkip:', error);
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