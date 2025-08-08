import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AluunaLoader } from '../../components/AluunaLoader';
import { ProgressDots } from '../../components/onboarding/ProgressDots';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Toast } from '../../components/ui/Toast';
import { useOnboarding } from '../../context/OnboardingContext';

export default function OnboardingStep2() {
  const router = useRouter();
  const { updateStepData, onboardingData, isLoading } = useOnboarding();
  
  // Initialize state from context if available
  const step2Data = onboardingData.step2;
  const [relationshipStatus, setRelationshipStatus] = useState<string>('');
  const [supportSystem, setSupportSystem] = useState<string[]>([]);
  const [currentStressors, setCurrentStressors] = useState<string[]>([]);
  const [livingSituation, setLivingSituation] = useState<string>('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info',
  });

  // Update state when data is loaded from context
  React.useEffect(() => {
    console.log(`🔄 Step2 useEffect - isLoading: ${isLoading}`);
    console.log(`🔄 Step2 useEffect - full onboardingData:`, onboardingData);
    console.log(`🔄 Step2 useEffect - step1Data:`, onboardingData.step1);
    console.log(`🔄 Step2 useEffect - step2Data:`, step2Data);
    
    if (!isLoading && step2Data && Object.keys(step2Data).length > 0) {
      console.log(`📝 Loading step2 data:`, step2Data);
      setRelationshipStatus(step2Data.relationshipStatus || '');
      setSupportSystem(step2Data.supportSystem || []);
      setCurrentStressors(step2Data.currentStressors || []);
      setLivingSituation(step2Data.livingSituation || '');
    }
  }, [isLoading, step2Data, onboardingData]);

  // Show loading state while data is being loaded
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-orange-custom">
        <View className="flex-1 justify-center items-center">
          <AluunaLoader />
          <Text className="text-lg text-gray-700 font-sans mt-4">Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const relationshipOptions = [
    'Single',
    'In a relationship',
    'Married',
    'Divorced/Separated',
    'Widowed',
    'Prefer not to say'
  ];

  const supportSystemOptions = [
    'Family',
    'Friends',
    'Partner/Spouse',
    'Therapist/Counselor',
    'Support groups',
    'Online communities',
    'Religious/spiritual community',
    'No support system'
  ];

  const stressorOptions = [
    'Work/Career',
    'Family relationships',
    'Financial concerns',
    'Health issues',
    'Housing',
    'Social isolation',
    'Academic pressure',
    'Caregiving responsibilities',
    'Legal issues',
    'None currently'
  ];

  const livingSituationOptions = [
    'Living alone',
    'Living with partner/spouse',
    'Living with family',
    'Living with roommates',
    'Living in shared housing',
    'Temporary housing',
    'Other'
  ];

  const handleSupportSystemToggle = (support: string) => {
    setSupportSystem(prev => 
      prev.includes(support) 
        ? prev.filter(s => s !== support)
        : [...prev, support]
    );
  };

  const handleStressorToggle = (stressor: string) => {
    setCurrentStressors(prev => 
      prev.includes(stressor) 
        ? prev.filter(s => s !== stressor)
        : [...prev, stressor]
    );
  };

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!relationshipStatus) {
      newErrors.relationshipStatus = 'Please select your relationship status';
    }
    
    if (supportSystem.length === 0) {
      newErrors.supportSystem = 'Please select at least one support option';
    }
    
    if (currentStressors.length === 0) {
      newErrors.currentStressors = 'Please select at least one stressor or "None currently"';
    }
    
    if (!livingSituation) {
      newErrors.livingSituation = 'Please select your living situation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) {
      setToast({
        visible: true,
        message: 'Please ensure all required fields are completed.',
        type: 'error',
      });
      return;
    }

    // Save data and proceed
    const stepData = {
      relationshipStatus,
      supportSystem,
      currentStressors,
      livingSituation
    };

    try {
      setIsSaving(true);
      await updateStepData('step2', stepData);
      router.push('/onboarding/step3' as any);
    } catch (error) {
      console.error('❌ Step2 - Failed to save data:', error);
      alert('Failed to save your progress. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleHideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-custom">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          className="flex-1 bg-blue-custom" 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6">
            <Toast
              visible={toast.visible}
              message={toast.message}
              type={toast.type}
              onHide={handleHideToast}
            />
            {/* Header */}
            <View className="flex-row items-center justify-center py-4">
              <Text className="text-2xl mt-2 font-heading text-white text-center">Life Context & Relationships</Text>
            </View>

            {/* Content */}
            <View className="rounded-2xl p-6 mb-6 bg-white">
              <Text className="text-lg font-heading text-blue-custom mb-6">
                Tell us about your life context and relationships
              </Text>

              {/* Relationship Status */}
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-800 mb-3">
                  What is your current relationship status?
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {relationshipOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setRelationshipStatus(option)}
                      className={`px-4 py-2 rounded-full border border-blue-custom ${
                        relationshipStatus === option
                          ? 'bg-blue-custom'
                          : 'bg-white'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          relationshipStatus === option ? 'text-white' : 'text-blue-custom'
                        }`}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <ErrorMessage message={errors.relationshipStatus} />
              </View>

              {/* Support System */}
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-800 mb-3">
                  Who do you have for support? (Select all that apply)
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {supportSystemOptions.map((support) => (
                    <TouchableOpacity
                      key={support}
                      onPress={() => handleSupportSystemToggle(support)}
                      className={`px-4 py-2 rounded-full border border-blue-custom ${
                        supportSystem.includes(support)
                          ? 'bg-blue-custom'
                          : 'bg-white'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          supportSystem.includes(support) ? 'text-white' : 'text-blue-custom'
                        }`}
                      >
                        {support}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <ErrorMessage message={errors.supportSystem} />
              </View>

              {/* Current Stressors */}
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-800 mb-3">
                  What are your current sources of stress? (Select all that apply)
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {stressorOptions.map((stressor) => (
                    <TouchableOpacity
                      key={stressor}
                      onPress={() => handleStressorToggle(stressor)}
                      className={`px-4 py-2 rounded-full border border-blue-custom ${
                        currentStressors.includes(stressor)
                          ? 'bg-blue-custom'
                          : 'bg-white'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          currentStressors.includes(stressor) ? 'text-white' : 'text-blue-custom'
                        }`}
                      >
                        {stressor}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <ErrorMessage message={errors.currentStressors} />
              </View>

              {/* Living Situation */}
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-800 mb-3">
                  What is your current living situation?
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {livingSituationOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setLivingSituation(option)}
                      className={`px-4 py-2 rounded-full border border-blue-custom ${
                        livingSituation === option
                          ? 'bg-blue-custom'
                          : 'bg-white'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          livingSituation === option ? 'text-white' : 'text-blue-custom'
                        }`}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <ErrorMessage message={errors.livingSituation} />
              </View>
            </View>

            {/* Navigation */}
            <View className="flex-row justify-center space-x-4 pb-4">
              <TouchableOpacity
                onPress={() => router.push('/onboarding/step1' as any)}
                className="bg-blue-custom px-6 py-3 rounded-xl border border-white"
                style={{ marginRight: 8 }}
              >
                <Text className="text-white font-medium text-center">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNext}
                disabled={isSaving}
                className={`px-6 py-3 rounded-xl border ${
                  isSaving ? 'bg-gray-300 border-gray-300' : 'bg-white border-blue-custom'
                }`}
              >
                <Text className={`font-medium text-center ${
                  isSaving ? 'text-gray-500' : 'text-blue-custom'
                }`}>
                  {isSaving ? 'Saving...' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 16 }}>
              <ProgressDots
                currentStep={2}
                totalSteps={6}
                onStepPress={(step) => {
                  // TODO: Navigate to specific step
                  console.log('Navigate to step:', step);
                }}
              />
              <View className="items-center pb-6">
                <TouchableOpacity onPress={() => router.push('/onboarding/skip' as any)}>
                  <Text className="text-white font-medium">Skip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 