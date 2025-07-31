import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkipWarningModal } from '../../components/onboarding/SkipWarningModal';
import { supabase } from '../../lib/supabase';

export default function OnboardingSkipScreen() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(true);

  const handleConfirmSkip = async () => {
    setShowWarning(false);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated');
        router.replace('/session' as any);
        return;
      }

      // Update the user's onboarding_skipped flag in the users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ onboarding_skipped: true })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error setting onboarding skipped flag:', updateError);
      }

      // Navigate to main app
      router.replace('/session' as any);
    } catch (error) {
      console.error('Error in handleConfirmSkip:', error);
      router.replace('/session' as any);
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