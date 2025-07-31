import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Keyboard, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AluunaLoader } from '../../components/AluunaLoader';
import { ProgressDots } from '../../components/onboarding/ProgressDots';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { useOnboarding } from '../../context/OnboardingContext';

export default function OnboardingStep4() {
  const router = useRouter();
  const { updateStepData, onboardingData, isLoading } = useOnboarding();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const inputRef = React.useRef<TextInput>(null);
  
  // Initialize state from context if available
  const step4Data = onboardingData.step4;
  const [previousTherapy, setPreviousTherapy] = useState<string>('');
  const [therapyType, setTherapyType] = useState<string>('');
  const [therapyDuration, setTherapyDuration] = useState<string>('');
  const [preferredTherapyStyle, setPreferredTherapyStyle] = useState<string[]>([]);
  const [personalGoals, setPersonalGoals] = useState<string>('');
  const [biggestObstacle, setBiggestObstacle] = useState<string>('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [keyboardPadding, setKeyboardPadding] = useState(0);

  // Update state when data is loaded from context
  React.useEffect(() => {
    console.log(`🔄 Step4 useEffect - isLoading: ${isLoading}, step4Data:`, step4Data);
    if (!isLoading && step4Data && Object.keys(step4Data).length > 0) {
      console.log(`📝 Loading step4 data:`, step4Data);
      setPreviousTherapy(step4Data.previousTherapy || '');
      setTherapyType(step4Data.therapyType || '');
      setTherapyDuration(step4Data.therapyDuration || '');
      setPreferredTherapyStyle(step4Data.preferredTherapyStyle || []);
      setPersonalGoals(step4Data.personalGoals || '');
      setBiggestObstacle(step4Data.biggestObstacle || '');
    }
  }, [isLoading, step4Data]);

  // Show loading state while data is being loaded
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-blue-custom">
        <View className="flex-1 justify-center items-center">
          <AluunaLoader />
          <Text className="text-lg text-gray-700 font-sans mt-4">Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const previousTherapyOptions = [
    'Yes, currently in therapy',
    'Yes, in the past',
    'No, never been to therapy',
    'Prefer not to say'
  ];

  const therapyTypeOptions = [
    'Cognitive Behavioral Therapy (CBT)',
    'Psychodynamic therapy',
    'Mindfulness-based therapy',
    'Group therapy',
    'Family therapy',
    'Other'
  ];

  const therapyDurationOptions = [
    'Less than 6 months',
    '6 months to 1 year',
    '1-2 years',
    'More than 2 years'
  ];

  const preferredStyleOptions = [
    'CBT (Cognitive Behavioral Therapy)',
    'Mindfulness and meditation',
    'Talk therapy',
    'Solution-focused therapy',
    'Trauma-informed therapy',
    'Acceptance and Commitment Therapy (ACT)',
    'Dialectical Behavior Therapy (DBT)',
    'No preference'
  ];

  const handlePreferredStyleToggle = (style: string) => {
    setPreferredTherapyStyle(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!previousTherapy) {
      newErrors.previousTherapy = 'Please select an option';
    }
    
    if (previousTherapy.includes('Yes') && !therapyType) {
      newErrors.therapyType = 'Please select the type of therapy';
    }
    
    if (previousTherapy.includes('Yes') && !therapyDuration) {
      newErrors.therapyDuration = 'Please select the duration';
    }
    
    if (preferredTherapyStyle.length === 0) {
      newErrors.preferredTherapyStyle = 'Please select at least one preferred style';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;

    // Save data and proceed
    const stepData = {
      previousTherapy,
      therapyType,
      therapyDuration,
      preferredTherapyStyle,
      personalGoals,
      biggestObstacle
    };

    updateStepData('step4', stepData);
    router.push('/onboarding/step5' as any);
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
    <SafeAreaView className="flex-1 bg-green-custom">
        <ScrollView 
          className="flex-1 bg-green-custom" 
          contentContainerStyle={{ minHeight: 800, paddingBottom: keyboardPadding }}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          showsVerticalScrollIndicator={false}
          ref={scrollViewRef}
        >
          <View className="flex-1 px-6">
            {/* Header */}
            <View className="flex-row items-center justify-between py-4">
              <View style={{ width: 60 }} />
              <Text className="text-2xl mt-2 font-heading text-white">Therapy & Growth</Text>
              <View style={{ width: 60 }} />
            </View>

            {/* Content */}
            <View className="rounded-2xl p-6 mb-6 bg-white">
              <Text className="text-lg font-heading text-green-custom mb-6">
                Tell us about your therapy experience and growth goals
              </Text>

              {/* Previous Therapy */}
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-800 mb-3">
                  Have you been to therapy before?
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {previousTherapyOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setPreviousTherapy(option)}
                      className={`px-4 py-2 rounded-full border border-green-custom ${
                        previousTherapy === option
                          ? 'bg-green-custom'
                          : 'bg-white'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          previousTherapy === option ? 'text-white' : 'text-green-custom'
                        }`}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <ErrorMessage message={errors.previousTherapy} />
              </View>

              {/* Therapy Type (conditional) */}
              {previousTherapy.includes('Yes') && (
                <View className="mb-6">
                  <Text className="text-base font-medium text-gray-800 mb-3">
                    What type of therapy did you receive?
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {therapyTypeOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        onPress={() => setTherapyType(option)}
                        className={`px-4 py-2 rounded-full border border-green-custom ${
                          therapyType === option
                            ? 'bg-green-custom'
                            : 'bg-white'
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            therapyType === option ? 'text-white' : 'text-green-custom'
                          }`}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <ErrorMessage message={errors.therapyType} />
                </View>
              )}

              {/* Therapy Duration (conditional) */}
              {previousTherapy.includes('Yes') && (
                <View className="mb-6">
                  <Text className="text-base font-medium text-gray-800 mb-3">
                    How long were you in therapy?
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {therapyDurationOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        onPress={() => setTherapyDuration(option)}
                        className={`px-4 py-2 rounded-full border border-green-custom ${
                          therapyDuration === option
                            ? 'bg-green-custom'
                            : 'bg-white'
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            therapyDuration === option ? 'text-white' : 'text-green-custom'
                          }`}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <ErrorMessage message={errors.therapyDuration} />
                </View>
              )}

              {/* Preferred Therapy Style */}
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-800 mb-3">
                  What therapy style appeals to you most? (Select all that apply)
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {preferredStyleOptions.map((style) => (
                    <TouchableOpacity
                      key={style}
                      onPress={() => handlePreferredStyleToggle(style)}
                      className={`px-4 py-2 rounded-full border border-green-custom ${
                        preferredTherapyStyle.includes(style)
                          ? 'bg-green-custom'
                          : 'bg-white'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          preferredTherapyStyle.includes(style) ? 'text-white' : 'text-green-custom'
                        }`}
                      >
                        {style}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <ErrorMessage message={errors.preferredTherapyStyle} />
              </View>

              {/* Personal Goals */}
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-800 mb-3">
                  What are your main personal growth goals?
                </Text>
                <TextInput
                  placeholder="e.g., reduce anxiety, improve relationships, build confidence..."
                  value={personalGoals}
                  onChangeText={setPersonalGoals}
                  multiline
                  numberOfLines={3}
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                  placeholderTextColor="#9CA3AF"
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </View>

              {/* Biggest Obstacle */}
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-800 mb-3">
                  What's your biggest obstacle to personal growth?
                </Text>
                <TextInput
                  placeholder="e.g., self-doubt, lack of time, fear of change..."
                  value={biggestObstacle}
                  onChangeText={setBiggestObstacle}
                  multiline
                  numberOfLines={3}
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                  placeholderTextColor="#9CA3AF"
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </View>
            </View>

            {/* Navigation */}
            <View className="flex-row justify-center space-x-4 pb-4">
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-green-custom px-6 py-3 rounded-xl border border-white"
                style={{ marginRight: 8 }}
              >
                <Text className="text-white font-medium text-center">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNext}
                className="bg-white px-6 py-3 rounded-xl border border-green-custom"
              >
                <Text className="text-green-custom font-medium text-center">Next</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 16 }}>
              <ProgressDots
                currentStep={4}
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