import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Keyboard, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  Extrapolate, interpolate, runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AluunaLoader } from '../../components/AluunaLoader';
import { ProgressDots } from '../../components/onboarding/ProgressDots';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Toast } from '../../components/ui/Toast';
import { useOnboarding } from '../../context/OnboardingContext';

export default function OnboardingStep5() {
  const router = useRouter();
  const { updateStepData, onboardingData, isLoading } = useOnboarding();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const inputRef = React.useRef<TextInput>(null);
  
  // Initialize state from context if available
  const step5Data = onboardingData.step5;
  const [coreValues, setCoreValues] = useState<string[]>([]);
  const [motivationForJoining, setMotivationForJoining] = useState<string>('');
  const [hopesToAchieve, setHopesToAchieve] = useState<string>('');
  const [motivationLevel, setMotivationLevel] = useState<number>(5);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [keyboardPadding, setKeyboardPadding] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info',
  });

  // Slider animation values
  const sliderWidth = 280; // Width of the slider track
  const thumbSize = 24; // Size of the draggable thumb
  const translateX = useSharedValue(0);

  // Update state when data is loaded from context
  React.useEffect(() => {
    console.log(`🔄 Step5 useEffect - isLoading: ${isLoading}, step5Data:`, step5Data);
    console.log(`🔍 step5Data type:`, typeof step5Data);
    console.log(`🔍 step5Data keys:`, step5Data ? Object.keys(step5Data) : 'null/undefined');
    console.log(`🔍 step5Data length:`, step5Data ? Object.keys(step5Data).length : 'N/A');
    
    if (!isLoading && step5Data) {
      console.log(`📝 Loading step5 data:`, step5Data);
      setCoreValues(step5Data.coreValues || []);
      setMotivationForJoining(step5Data.motivationForJoining || '');
      setHopesToAchieve(step5Data.hopesToAchieve || '');
      setMotivationLevel(step5Data.motivationLevel || 5);
    } else {
      console.log(`❌ Not loading step5 data - isLoading: ${isLoading}, step5Data exists: ${!!step5Data}`);
    }
  }, [isLoading, step5Data]);

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

  const coreValueOptions = [
    'Honesty',
    'Compassion',
    'Growth',
    'Connection',
    'Authenticity',
    'Courage',
    'Wisdom',
    'Balance',
    'Creativity',
    'Service',
    'Independence',
    'Family',
    'Health',
    'Learning',
    'Peace'
  ];

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
    },
    onActive: (event, context: any) => {
      const newX = context.startX + event.translationX;
      const clampedX = Math.max(0, Math.min(newX, sliderWidth - thumbSize));
      translateX.value = clampedX;
      
      // Calculate motivation level based on position
      const level = Math.round(
        interpolate(
          clampedX,
          [0, sliderWidth - thumbSize],
          [1, 10],
          Extrapolate.CLAMP
        )
      );
      
      runOnJS(setMotivationLevel)(level);
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

  // Initialize slider position based on current motivation level
  React.useEffect(() => {
    const initialX = ((motivationLevel - 1) / 9) * (sliderWidth - thumbSize);
    translateX.value = initialX;
  }, [motivationLevel]);

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (coreValues.length === 0) {
      newErrors.coreValues = 'Please select at least 3 core values';
    } else if (coreValues.length < 3) {
      newErrors.coreValues = 'Please select at least 3 core values';
    }
    
    if (!motivationForJoining.trim()) {
      newErrors.motivationForJoining = 'Please tell us why you joined';
    }
    
    if (!hopesToAchieve.trim()) {
      newErrors.hopesToAchieve = 'Please tell us what you hope to achieve';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCoreValueToggle = (value: string) => {
    setCoreValues(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const handleNext = async () => {
    if (!validate()) {
      const message = coreValues.length < 3
        ? 'Please select at least 3 core values to continue.'
        : 'Please ensure all required fields are completed.';
      setToast({ visible: true, message, type: 'error' });
      return;
    }

    // Save data and proceed
    const stepData = {
      coreValues,
      motivationForJoining,
      hopesToAchieve,
      motivationLevel
    };

    try {
      setIsSaving(true);
      await updateStepData('step5', stepData);
      router.push('/onboarding/step6' as any);
    } catch (error) {
      console.error('❌ Step5 - Failed to save data:', error);
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-orange-custom">
          <Toast
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
            onHide={handleHideToast}
          />
          <ScrollView 
            className="flex-1 bg-orange-custom" 
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
                <Text className="text-2xl mt-2 font-heading text-white">Values & Motivation</Text>
                <View style={{ width: 60 }} />
              </View>

              {/* Content */}
              <View className="rounded-2xl p-6 mb-6 bg-white">
                <Text className="text-lg font-heading text-orange-custom mb-6">
                  Tell us about your values and what motivates you
                </Text>

                {/* Core Values */}
                <View className="mb-6">
                  <Text className="text-base font-medium text-gray-800 mb-3">
                    What are your core values? {"\n"} (Select at least 3)
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {coreValueOptions.map((value) => (
                      <TouchableOpacity
                        key={value}
                        onPress={() => handleCoreValueToggle(value)}
                        className={`px-4 py-2 rounded-full border border-orange-custom ${
                          coreValues.includes(value)
                            ? 'bg-orange-custom'
                            : 'bg-white'
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            coreValues.includes(value) ? 'text-white' : 'text-orange-custom'
                          }`}
                        >
                          {value}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text className="text-xs text-gray-500 mt-2">
                    Selected: {coreValues.length}/3 minimum
                  </Text>
                  <ErrorMessage message={errors.coreValues} />
                </View>

                {/* Motivation for Joining */}
                <View className="mb-6">
                  <Text className="text-base font-medium text-gray-800 mb-3">
                    What motivated you to join aluuna?
                  </Text>
                  <TextInput
                    placeholder="e.g., seeking support, personal growth, better mental health..."
                    value={motivationForJoining}
                    onChangeText={setMotivationForJoining}
                    multiline
                    numberOfLines={3}
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    style={{ minHeight: 80, textAlignVertical: 'top' }}
                    placeholderTextColor="#9CA3AF"
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                  <ErrorMessage message={errors.motivationForJoining} />
                </View>

                {/* Hopes to Achieve */}
                <View className="mb-6">
                  <Text className="text-base font-medium text-gray-800 mb-3">
                    What do you hope to achieve through using aluuna?
                  </Text>
                  <TextInput
                    placeholder="e.g., reduce anxiety, understand myself better, build resilience..."
                    value={hopesToAchieve}
                    onChangeText={setHopesToAchieve}
                    multiline
                    numberOfLines={3}
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    style={{ minHeight: 80, textAlignVertical: 'top' }}
                    placeholderTextColor="#9CA3AF"
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                  <ErrorMessage message={errors.hopesToAchieve} />
                </View>

                {/* Motivation Level */}
                <View className="mb-6">
                  <Text className="text-base font-medium text-gray-800 mb-3">
                    How motivated are you to make positive changes? {"\n"} (1 = Not motivated, 10 = Motivated)
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
                          className="absolute h-2 bg-orange-custom rounded-full top-0 left-0"
                          style={animatedTrackStyle}
                        />
                        
                        {/* Slider Thumb */}
                        <PanGestureHandler onGestureEvent={gestureHandler}>
                          <Animated.View
                            className="absolute top-0 bg-orange-custom rounded-full"
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
                      <Text className="text-sm text-gray-600 ml-2 font-medium">{motivationLevel}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Navigation */}
              <View className="flex-row justify-center space-x-4 pb-4">
                <TouchableOpacity
                  onPress={() => router.push('/onboarding/step4' as any)}
                  className="bg-orange-custom px-6 py-3 rounded-xl border border-white"
                  style={{ marginRight: 8 }}
                >
                  <Text className="text-white font-medium text-center">Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleNext}
                  disabled={isSaving}
                  className={`px-6 py-3 rounded-xl border ${
                    isSaving ? 'bg-gray-300 border-gray-300' : 'bg-white border-orange-custom'
                  }`}
                >
                  <Text className={`font-medium text-center ${
                    isSaving ? 'text-gray-500' : 'text-orange-custom'
                  }`}>
                    {isSaving ? 'Saving...' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 16 }}>
                <ProgressDots
                  currentStep={5}
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
    </GestureHandlerRootView>
  );
} 