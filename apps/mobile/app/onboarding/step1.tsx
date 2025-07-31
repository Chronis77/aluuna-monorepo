import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  Extrapolate, interpolate, runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AluunaLoader } from '../../components/AluunaLoader';
import { ProgressDots } from '../../components/onboarding/ProgressDots';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { useOnboarding } from '../../context/OnboardingContext';

export default function OnboardingStep1() {
  const router = useRouter();
  const { updateStepData, onboardingData, isLoading, refreshData } = useOnboarding();
  
  // Initialize state from context if available
  const step1Data = onboardingData.step1;
  const [moodScore, setMoodScore] = useState<number>(5);
  const [emotionalStates, setEmotionalStates] = useState<string[]>([]);
  const [moodTrends, setMoodTrends] = useState<string[]>([]);
  const [suicidalThoughts, setSuicidalThoughts] = useState<string>('');
  const [sleepQuality, setSleepQuality] = useState<string>('');
  const [showSuicidalWarning, setShowSuicidalWarning] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Slider animation values - must be before any conditional returns
  const sliderWidth = 280; // Width of the slider track
  const thumbSize = 24; // Size of the draggable thumb
  const translateX = useSharedValue(0);

  // Refresh data when entering the wizard
  React.useEffect(() => {
    console.log('🚀 Step1 mounted - refreshing data');
    refreshData();
  }, []);

  // Update state when data is loaded from context
  React.useEffect(() => {
    console.log(`🔄 Step1 useEffect - isLoading: ${isLoading}, step1Data:`, step1Data);
    if (!isLoading && step1Data && Object.keys(step1Data).length > 0) {
      console.log(`📝 Loading step1 data:`, step1Data);
      setMoodScore(step1Data.moodScore || 5);
      setEmotionalStates(step1Data.emotionalStates || []);
      setMoodTrends(step1Data.moodTrends || []);
      setSuicidalThoughts(step1Data.suicidalThoughts || '');
      setSleepQuality(step1Data.sleepQuality || '');
    } else if (!isLoading && (!step1Data || Object.keys(step1Data || {}).length === 0)) {
      console.log(`🆕 No existing step1 data found, starting with clean state`);
      // Ensure we start with clean state for new users
      setMoodScore(5);
      setEmotionalStates([]);
      setMoodTrends([]);
      setSuicidalThoughts('');
      setSleepQuality('');
    }
  }, [isLoading, step1Data]);

  // Initialize slider position based on current mood score
  React.useEffect(() => {
    const initialX = ((moodScore - 1) / 9) * (sliderWidth - thumbSize);
    translateX.value = initialX;
  }, [moodScore]);

  // All remaining hooks must be before any conditional returns
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
    },
    onActive: (event, context: any) => {
      const newX = context.startX + event.translationX;
      const clampedX = Math.max(0, Math.min(newX, sliderWidth - thumbSize));
      translateX.value = clampedX;
      
      // Calculate mood score based on position
      const score = Math.round(
        interpolate(
          clampedX,
          [0, sliderWidth - thumbSize],
          [1, 10],
          Extrapolate.CLAMP
        )
      );
      
      runOnJS(setMoodScore)(score);
    },
    onEnd: () => {
      // Optional: Add haptic feedback or snap to nearest value
    },
  });

  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const animatedTrackStyle = useAnimatedStyle(() => {
    const progress = translateX.value / (sliderWidth - thumbSize);
    return {
      width: `${progress * 100}%`,
    };
  });

  // Show loading state while data is being loaded
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <View className="items-center">
            <Image
              source={require('../../assets/images/logo.png')}
              className="max-w-[220px] h-[60px] max-h-[60px] mb-8"
              resizeMode="contain"
            />
            <AluunaLoader />
            <Text className="text-lg text-gray-700 font-sans mt-4">Loading your progress...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const emotionalStateOptions = [
    'Anxious', 'Sad', 'Happy', 'Numb', 'Irritable', 
    'Calm', 'Stressed', 'Excited', 'Depressed', 'Content'
  ];

  const moodTrendOptions = [
    'I\'ve felt down or depressed',
    'I\'ve felt anxious or worried',
    'I\'ve felt irritable or angry',
    'I\'ve had trouble sleeping',
    'I\'ve felt overwhelmed',
    'I\'ve felt hopeful about the future',
    'I\'ve felt connected to others',
    'I\'ve felt motivated and energetic'
  ];

  const suicidalThoughtOptions = [
    'Never',
    'Rarely',
    'Sometimes',
    'Often',
    'Currently'
  ];

  const sleepQualityOptions = [
    'Good (7-9 hours, restful)',
    'Average (6-7 hours, some rest)',
    'Poor (less than 6 hours)',
    'Insomnia (trouble falling/staying asleep)'
  ];

  const handleEmotionalStateToggle = (state: string) => {
    setEmotionalStates(prev => 
      prev.includes(state) 
        ? prev.filter(s => s !== state)
        : [...prev, state]
    );
  };

  const handleMoodTrendToggle = (trend: string) => {
    setMoodTrends(prev => 
      prev.includes(trend) 
        ? prev.filter(t => t !== trend)
        : [...prev, trend]
    );
  };

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (emotionalStates.length === 0) {
      newErrors.emotionalStates = 'Please select at least one emotional state';
    }
    
    if (!suicidalThoughts) {
      newErrors.suicidalThoughts = 'Please answer this important question';
    }
    
    if (!sleepQuality) {
      newErrors.sleepQuality = 'Please select your sleep quality';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;

    // Check for suicidal thoughts warning
    if (suicidalThoughts === 'Often' || suicidalThoughts === 'Currently') {
      setShowSuicidalWarning(true);
      return;
    }

    // Save data to context and proceed
    const stepData = {
      moodScore,
      emotionalStates,
      moodTrends,
      suicidalThoughts,
      sleepQuality
    };

    updateStepData('step1', stepData);
    router.push('/onboarding/step2' as any);
  };

  const handleSuicidalWarningConfirm = () => {
    setShowSuicidalWarning(false);
    
    // Save data to context and proceed
    const stepData = {
      moodScore,
      emotionalStates,
      moodTrends,
      suicidalThoughts,
      sleepQuality
    };

    updateStepData('step1', stepData);
    router.push('/onboarding/step2' as any);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-purple-custom">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            className="flex-1 bg-purple-custom" 
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 px-6">
              {/* Header */}
              <View className="flex-row items-center justify-between py-4">
                <View style={{ width: 60 }} />
                <Text className="text-2xl mt-2 font-heading text-white">Mood & Mental Health</Text>
                <View style={{ width: 60 }} />
              </View>

              {/* Content */}
              <View className="rounded-2xl p-6 mb-6 bg-white">
                <Text className="text-xl font-heading mb-6 text-[#7B61FF]">
                  Let's start by understanding your current mental health baseline
                </Text>

              {/* Mood Score */}
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-800 mb-3">
                  How would you rate your current mood? 
                  {"\n"}(1 = Low, 10 = Excellent)
                </Text>
                
                {/* Slider Container */}
                <View className="items-center mb-2">
                  <View className="flex-row items-center" style={{ width: sliderWidth + 40 }}>
                    {/* Slider Track Container */}
                    <View className="relative" style={{ width: sliderWidth }}>
                      {/* Slider Track */}
                      <View className="h-2 bg-gray-200 rounded-full" />
                      
                      {/* Progress Track */}
                      <Animated.View 
                        className="absolute h-2 bg-purple-custom rounded-full top-0 left-0"
                        style={animatedTrackStyle}
                      />
                      
                      {/* Slider Thumb */}
                      <PanGestureHandler onGestureEvent={gestureHandler}>
                        <Animated.View
                          className="absolute top-0 bg-purple-custom rounded-full"
                          style={[
                            {
                              width: thumbSize,
                              height: thumbSize,
                              marginTop: -thumbSize / 2 + 4, // Center vertically
                              zIndex: 10,
                              borderWidth: 0,
                            },
                            animatedThumbStyle,
                          ]}
                        />
                      </PanGestureHandler>
                    </View>
                    
                    {/* Dynamic Value */}
                    <Text className="text-sm text-gray-600 ml-2 font-medium">{moodScore}</Text>
                  </View>
                </View>
              </View>

              {/* Emotional State */}
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-800 mb-3">
                  What best describes your current emotional state?
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {emotionalStateOptions.map((state) => (
                    <TouchableOpacity
                      key={state}
                      onPress={() => handleEmotionalStateToggle(state)}
                      className={`px-4 py-2 rounded-full border border-purple-custom ${
                        emotionalStates.includes(state)
                          ? 'bg-purple-custom'
                          : 'bg-white'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          emotionalStates.includes(state) ? 'text-white' : 'text-purple-custom'
                        }`}
                      >
                        {state}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <ErrorMessage message={errors.emotionalStates} />
              </View>

              {/* Mood Trends */}
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-800 mb-3">
                  Which of these have you experienced recently? (Select all that apply)
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {moodTrendOptions.map((trend) => (
                    <TouchableOpacity
                      key={trend}
                      onPress={() => handleMoodTrendToggle(trend)}
                      className={`px-4 py-2 rounded-full border border-purple-custom ${
                        moodTrends.includes(trend)
                          ? 'bg-purple-custom'
                          : 'bg-white'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          moodTrends.includes(trend) ? 'text-white' : 'text-purple-custom'
                        }`}
                      >
                        {trend}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Suicidal Thoughts */}
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-800 mb-3">
                  How often do you experience suicidal thoughts?
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {suicidalThoughtOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setSuicidalThoughts(option)}
                      className={`px-4 py-2 rounded-full border border-purple-custom ${
                        suicidalThoughts === option
                          ? 'bg-purple-custom'
                          : 'bg-white'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          suicidalThoughts === option ? 'text-white' : 'text-purple-custom'
                        }`}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <ErrorMessage message={errors.suicidalThoughts} />
              </View>

              {/* Sleep Quality */}
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-800 mb-3">
                  How would you describe your sleep quality?
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {sleepQualityOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setSleepQuality(option)}
                      className={`px-4 py-2 rounded-full border border-purple-custom ${
                        sleepQuality === option
                          ? 'bg-purple-custom'
                          : 'bg-white'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          sleepQuality === option ? 'text-white' : 'text-purple-custom'
                        }`}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <ErrorMessage message={errors.sleepQuality} />
              </View>
            </View>
          </View>

            {/* Navigation */}
            <View className="flex-row justify-center pb-4">
              <TouchableOpacity
                onPress={handleNext}
                className="bg-white px-6 py-3 rounded-xl border border-purple-custom"
              >
                <Text className="text-purple-custom font-medium text-center">Next</Text>
              </TouchableOpacity>
            </View>

            {/* Progress Dots - Moved to bottom */}
            <ProgressDots
              currentStep={1}
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
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Suicidal Thoughts Warning Modal */}
      {showSuicidalWarning && (
        <View
          className="bg-white rounded-2xl p-6"
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100 }}
        >
          <Text className="text-lg font-heading text-purple-custom mb-4">Important Notice</Text>
          <Text className="text-base text-gray-800 mb-4">
            You've indicated that you experience suicidal thoughts. Your safety and well-being are our top priority. We encourage you to reach out for immediate support.
          </Text>
          <Text className="text-base text-gray-800 mb-4">
            While aluuna can provide support, it's not a substitute for professional crisis intervention. Please consider speaking with a mental health professional.
          </Text>
          <View className="flex-row justify-center gap-4">
            <TouchableOpacity
              onPress={() => setShowSuicidalWarning(false)}
              className="bg-gray-200 px-6 py-3 rounded-lg"
            >
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSuicidalWarningConfirm}
              className="bg-purple-custom px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-medium">Continue anyway</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </GestureHandlerRootView>
  );
} 