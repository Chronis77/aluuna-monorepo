import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Keyboard, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AluunaLoader } from '../../components/AluunaLoader';
import { ProgressDots } from '../../components/onboarding/ProgressDots';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Toast } from '../../components/ui/Toast';
import { useOnboarding } from '../../context/OnboardingContext';

export default function OnboardingStep3() {
  const router = useRouter();
  const { updateStepData, onboardingData, isLoading } = useOnboarding();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const inputRef = React.useRef<TextInput>(null);
  
  // Initialize state from context if available
  const step3Data = onboardingData.step3;
  const [dailyHabits, setDailyHabits] = useState<string[]>([]);
  const [substanceUse, setSubstanceUse] = useState<string[]>([]);
  const [sleepRoutine, setSleepRoutine] = useState<string>('');
  const [biggestChallenge, setBiggestChallenge] = useState<string>('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [keyboardPadding, setKeyboardPadding] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info',
  });

  // Update state when data is loaded from context
  React.useEffect(() => {
    console.log(`🔄 Step3 useEffect - isLoading: ${isLoading}, step3Data:`, step3Data);
    if (!isLoading && step3Data && Object.keys(step3Data).length > 0) {
      console.log(`📝 Loading step3 data:`, step3Data);
      setDailyHabits(step3Data.dailyHabits || []);
      setSubstanceUse(step3Data.substanceUse || []);
      setSleepRoutine(step3Data.sleepRoutine || '');
      setBiggestChallenge(step3Data.biggestChallenge || '');
    }
  }, [isLoading, step3Data]);

  // Show loading state while data is being loaded
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-green-custom">
        <View className="flex-1 justify-center items-center">
          <AluunaLoader />
          <Text className="text-lg text-gray-700 font-sans mt-4">Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dailyHabitOptions = [
    'Exercise/Physical activity',
    'Meditation/Mindfulness',
    'Journaling',
    'Reading',
    'Social activities',
    'Creative hobbies',
    'Spiritual practices',
    'No regular habits'
  ];

  const substanceUseOptions = [
    'Alcohol',
    'Tobacco/Nicotine',
    'Cannabis',
    'Prescription medications',
    'Caffeine',
    'No substance use'
  ];

  const sleepRoutineOptions = [
    'Regular bedtime (same time most nights)',
    'Irregular bedtime',
    'I have trouble falling asleep',
    'I wake up frequently during the night',
    'I sleep too much',
    'I don\'t have a routine'
  ];

  const handleDailyHabitToggle = (habit: string) => {
    setDailyHabits(prev => 
      prev.includes(habit) 
        ? prev.filter(h => h !== habit)
        : [...prev, habit]
    );
  };

  const handleSubstanceUseToggle = (substance: string) => {
    setSubstanceUse(prev => 
      prev.includes(substance) 
        ? prev.filter(s => s !== substance)
        : [...prev, substance]
    );
  };

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (dailyHabits.length === 0) {
      newErrors.dailyHabits = 'Please select at least one habit or "No regular habits"';
    }
    
    if (substanceUse.length === 0) {
      newErrors.substanceUse = 'Please select at least one option or "No substance use"';
    }
    
    if (!sleepRoutine) {
      newErrors.sleepRoutine = 'Please select your sleep routine';
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
      dailyHabits,
      substanceUse,
      sleepRoutine,
      biggestChallenge
    };

    try {
      setIsSaving(true);
      await updateStepData('step3', stepData);
      router.push('/onboarding/step4' as any);
    } catch (error) {
      console.error('❌ Step3 - Failed to save data:', error);
      alert('Failed to save your progress. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleHideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const handleInputFocus = () => {
    setKeyboardPadding(200);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleInputBlur = () => {
    setKeyboardPadding(0);
  };

  return (
    <SafeAreaView className="flex-1 bg-teal-custom">
        <ScrollView 
          className="flex-1 bg-teal-custom" 
          contentContainerStyle={{ minHeight: 800, paddingBottom: keyboardPadding }}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          showsVerticalScrollIndicator={false}
          ref={scrollViewRef}
        >
          <View className="px-6">
            <Toast
              visible={toast.visible}
              message={toast.message}
              type={toast.type}
              onHide={handleHideToast}
            />
            {/* Header */}
            <View className="flex-row items-center justify-between py-4">
              <View style={{ width: 60 }} />
              <Text className="text-2xl mt-2 font-heading text-white">Habits & Lifestyle</Text>
              <View style={{ width: 60 }} />
            </View>

            {/* Content */}
            <View className="rounded-2xl p-6 mb-6 bg-white">
              <Text className="text-lg font-heading text-teal-custom mb-6">
                Tell us about your daily habits and routines
              </Text>

              {/* Daily Habits */}
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-800 mb-3">
                  What daily habits do you practice? (Select all that apply)
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {dailyHabitOptions.map((habit) => (
                    <TouchableOpacity
                      key={habit}
                      onPress={() => handleDailyHabitToggle(habit)}
                      className={`px-4 py-2 rounded-full border border-teal-custom ${
                        dailyHabits.includes(habit)
                          ? 'bg-teal-custom'
                          : 'bg-white'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          dailyHabits.includes(habit) ? 'text-white' : 'text-teal-custom'
                        }`}
                      >
                        {habit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <ErrorMessage message={errors.dailyHabits} />
              </View>

              {/* Substance Use */}
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-800 mb-3">
                  Do you use any substances? (Select all that apply)
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {substanceUseOptions.map((substance) => (
                    <TouchableOpacity
                      key={substance}
                      onPress={() => handleSubstanceUseToggle(substance)}
                      className={`px-4 py-2 rounded-full border border-teal-custom ${
                        substanceUse.includes(substance)
                          ? 'bg-teal-custom'
                          : 'bg-white'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          substanceUse.includes(substance) ? 'text-white' : 'text-teal-custom'
                        }`}
                      >
                        {substance}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <ErrorMessage message={errors.substanceUse} />
              </View>

              {/* Sleep Routine */}
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-800 mb-3">
                  How would you describe your sleep routine?
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {sleepRoutineOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setSleepRoutine(option)}
                      className={`px-4 py-2 rounded-full border border-teal-custom ${
                        sleepRoutine === option
                          ? 'bg-teal-custom'
                          : 'bg-white'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          sleepRoutine === option ? 'text-white' : 'text-teal-custom'
                        }`}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <ErrorMessage message={errors.sleepRoutine} />
              </View>

              {/* Biggest Challenge */}
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-800 mb-3">
                  What's your biggest challenge with maintaining healthy habits?
                </Text>
                <TextInput
                  placeholder="e.g., lack of motivation, time constraints, stress..."
                  value={biggestChallenge}
                  onChangeText={setBiggestChallenge}
                  multiline
                  numberOfLines={3}
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                  placeholderTextColor="#9CA3AF"
                  ref={inputRef}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </View>
            </View>

            {/* Navigation */}
            <View className="flex-row justify-center space-x-4 pb-4">
              <TouchableOpacity
                onPress={() => router.push('/onboarding/step2' as any)}
                className="bg-teal-custom px-6 py-3 rounded-xl border border-white"
                style={{ marginRight: 8 }}
              >
                <Text className="text-white font-medium text-center">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNext}
                disabled={isSaving}
                className={`px-6 py-3 rounded-xl border ${
                  isSaving ? 'bg-gray-300 border-gray-300' : 'bg-white border-teal-custom'
                }`}
              >
                <Text className={`font-medium text-center ${
                  isSaving ? 'text-gray-500' : 'text-teal-custom'
                }`}>
                  {isSaving ? 'Saving...' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 16 }}>
              <ProgressDots
                currentStep={3}
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
    </SafeAreaView>
  );
} 