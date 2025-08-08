import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AluunaLoader } from '../../components/AluunaLoader';
import { ProgressDots } from '../../components/onboarding/ProgressDots';
import { Toast } from '../../components/ui/Toast';
import { useOnboarding } from '../../context/OnboardingContext';
import { trpcClient } from '../../lib/trpcClient';

export default function OnboardingStep6() {
  const router = useRouter();
  const { onboardingData, clearOnboardingData } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'info' | 'success' | 'error',
  });

  const handleHideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Local AI insights generation
  const generateLocalInsights = async (data: any) => {
    const emotional_patterns = analyzeEmotionalPatterns(data);
    const relationship_dynamics = analyzeRelationshipDynamics(data);
    const growth_opportunities = analyzeGrowthOpportunities(data);
    const therapeutic_approach = determineTherapeuticApproach(data);
    const risk_factors = identifyRiskFactors(data);
    const strengths = identifyStrengths(data);
    const personalized_insights = generatePersonalizedInsights(data);

    return {
      emotional_patterns,
      relationship_dynamics,
      growth_opportunities,
      therapeutic_approach,
      risk_factors,
      strengths,
      personalized_insights
    };
  };

  const analyzeEmotionalPatterns = (data: any) => {
    const patterns: string[] = [];
    
    if (data?.step1) {
      const { moodScore, emotionalStates, moodTrends, suicidalThoughts } = data.step1;
      
      if (moodScore && moodScore <= 3) patterns.push('low_mood_baseline');
      if (moodScore && moodScore >= 8) patterns.push('positive_mood_baseline');
      if (emotionalStates && Array.isArray(emotionalStates) && emotionalStates.length > 2) {
        patterns.push('emotional_complexity');
      }
      if (emotionalStates && Array.isArray(emotionalStates) && 
          emotionalStates.includes('Anxious') && emotionalStates.includes('Sad')) {
        patterns.push('anxiety_depression_comorbidity');
      }
      if (suicidalThoughts === 'Currently' || suicidalThoughts === 'Often') {
        patterns.push('suicidal_ideation_pattern');
      }
      if (moodTrends && Array.isArray(moodTrends) && 
          moodTrends.some((trend: string) => trend.includes('hopeful'))) {
        patterns.push('optimistic_tendencies');
      }
    }
    
    return patterns;
  };

  const analyzeRelationshipDynamics = (data: any) => {
    const dynamics: string[] = [];
    
    if (data?.step2) {
      const { relationshipStatus, supportSystem, currentStressors } = data.step2;
      
      if (relationshipStatus === 'Single' && supportSystem && Array.isArray(supportSystem) && supportSystem.length < 2) {
        dynamics.push('limited_social_support');
      }
      if (supportSystem && Array.isArray(supportSystem) && 
          supportSystem.includes('Family') && supportSystem.includes('Friends')) {
        dynamics.push('strong_support_network');
      }
      if (currentStressors && Array.isArray(currentStressors) && currentStressors.includes('Relationships')) {
        dynamics.push('relationship_stress');
      }
    }
    
    return dynamics;
  };

  const analyzeGrowthOpportunities = (data: any) => {
    const opportunities: string[] = [];
    
    if (data?.step3?.biggestChallenge && data.step3.biggestChallenge.includes('self-care')) {
      opportunities.push('self_care_development');
    }
    if (data?.step4?.personalGoals && data.step4.personalGoals.includes('confidence')) {
      opportunities.push('confidence_building');
    }
    if (data?.step5?.motivationLevel && data.step5.motivationLevel >= 8) {
      opportunities.push('high_motivation_advantage');
    }
    
    return opportunities;
  };

  const determineTherapeuticApproach = (data: any) => {
    const approaches: string[] = [];
    
    if (data?.step4?.preferredTherapyStyle && data.step4.preferredTherapyStyle.includes('CBT')) {
      approaches.push('cbt_focused');
    }
    if (data?.step4?.preferredTherapyStyle && data.step4.preferredTherapyStyle.includes('Mindfulness')) {
      approaches.push('mindfulness_based');
    }
    
    return approaches;
  };

  const identifyRiskFactors = (data: any) => {
    const risks: string[] = [];
    
    if (data?.step1?.suicidalThoughts === 'Currently' || data?.step1?.suicidalThoughts === 'Often') {
      risks.push('suicidal_ideation');
    }
    if (data?.step1?.moodScore && data.step1.moodScore <= 2) {
      risks.push('severe_depression');
    }
    if (data?.step3?.substanceUse && Array.isArray(data.step3.substanceUse) && data.step3.substanceUse.length > 2) {
      risks.push('substance_use_concerns');
    }
    
    return risks;
  };

  const identifyStrengths = (data: any) => {
    const strengths: string[] = [];
    
    if (data?.step5?.motivationLevel && data.step5.motivationLevel >= 7) {
      strengths.push('high_motivation');
    }
    if (data?.step2?.supportSystem && Array.isArray(data.step2.supportSystem) && data.step2.supportSystem.length >= 3) {
      strengths.push('strong_support_network');
    }
    if (data?.step3?.dailyHabits && Array.isArray(data.step3.dailyHabits) && data.step3.dailyHabits.includes('Exercise')) {
      strengths.push('active_lifestyle');
    }
    if (data?.step5?.coreValues && Array.isArray(data.step5.coreValues) && data.step5.coreValues.length >= 3) {
      strengths.push('clear_values');
    }
    
    return strengths;
  };

  const generatePersonalizedInsights = (data: any) => {
    const insights: string[] = [];
    
    // Generate insights based on the data patterns
    if (data?.step1?.moodScore && data.step1.moodScore <= 3 && 
        data?.step5?.motivationLevel && data.step5.motivationLevel >= 7) {
      insights.push('motivated_but_struggling');
    }
    if (data?.step2?.supportSystem && Array.isArray(data.step2.supportSystem) && 
        data.step2.supportSystem.length < 2 && 
        data?.step1?.emotionalStates && Array.isArray(data.step1.emotionalStates) && 
        data.step1.emotionalStates.includes('Lonely')) {
      insights.push('social_connection_focus');
    }
    
    return insights;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      console.log('Starting profile creation process...');
      console.log('Onboarding data:', onboardingData);

      // Get current user
      const user = await trpcClient.getCurrentUser();
      
      if (!user) {
        console.error('User not authenticated');
        setToast({
          visible: true,
          message: 'Authentication error. Please try again.',
          type: 'error',
        });
        return;
      }

      console.log('User authenticated:', user.id);

      // Generate insights from onboarding data
      const insights = await generateLocalInsights(onboardingData);
      console.log('Generated insights:', insights);

      // Finalize in a single server-side transaction
      try {
        console.log('Finalizing onboarding via single transactional endpoint...');
        await trpcClient.finalizeOnboarding(user.id, onboardingData);
        console.log('✅ Onboarding finalized successfully');
      } catch (error) {
        console.error('Error finalizing onboarding:', error);
        throw error;
      }

      // (Value compass, preferences, trend now handled server-side in finalize)

      // Store additional onboarding data in memory_profiles for comprehensive record
      const additionalProfileData = {
        // Step 1 - Mood & Emotional State
        themes: onboardingData.step1?.emotionalStates || [],
        trauma_patterns: onboardingData.step1?.suicidalThoughts === 'Currently' || onboardingData.step1?.suicidalThoughts === 'Often' 
          ? `Suicidal thoughts: ${onboardingData.step1.suicidalThoughts}` 
          : null,
        suicidal_risk_level: onboardingData.step1?.suicidalThoughts === 'Currently' ? 3 : 
                           onboardingData.step1?.suicidalThoughts === 'Often' ? 2 : 
                           onboardingData.step1?.suicidalThoughts === 'Sometimes' ? 1 : 0,
        mood_score_initial: onboardingData.step1?.moodScore,
        emotional_states_initial: onboardingData.step1?.emotionalStates || [],
        suicidal_thoughts_initial: onboardingData.step1?.suicidalThoughts,
        mood_trends: onboardingData.step1?.moodTrends || [],
        sleep_quality: onboardingData.step1?.sleepQuality,
        
        // Step 2 - Life Context
        people: {
          relationship_status: onboardingData.step2?.relationshipStatus,
          living_situation: onboardingData.step2?.livingSituation,
          support_system: onboardingData.step2?.supportSystem || [],
          current_stressors: onboardingData.step2?.currentStressors || []
        },
        relationship_status: onboardingData.step2?.relationshipStatus,
        living_situation: onboardingData.step2?.livingSituation,
        support_system: onboardingData.step2?.supportSystem || [],
        current_stressors: onboardingData.step2?.currentStressors || [],
        
        // Step 3 - Daily Life
        regulation_strategies: onboardingData.step3?.dailyHabits || [],
        dysregulating_factors: onboardingData.step3?.substanceUse || [],
        stuck_points: onboardingData.step3?.biggestChallenge ? [onboardingData.step3.biggestChallenge] : [],
        current_practices: onboardingData.step3?.dailyHabits || [],
        daily_habits: onboardingData.step3?.dailyHabits || [],
        substance_use: onboardingData.step3?.substanceUse || [],
        sleep_routine: onboardingData.step3?.sleepRoutine,
        biggest_challenge: onboardingData.step3?.biggestChallenge,
        
        // Step 4 - Therapy & Goals
        preferred_therapy_styles: onboardingData.step4?.preferredTherapyStyle || [],
        goals: onboardingData.step4?.personalGoals ? [onboardingData.step4.personalGoals] : [],
        insight_notes: onboardingData.step4?.biggestObstacle || '',
        previous_therapy: onboardingData.step4?.previousTherapy,
        therapy_type: onboardingData.step4?.therapyType,
        therapy_duration: onboardingData.step4?.therapyDuration,
        biggest_obstacle: onboardingData.step4?.biggestObstacle,
        
        // Step 5 - Motivation & Values
        role_model_traits: onboardingData.step5?.coreValues || [],
        personal_agency_level: onboardingData.step5?.motivationLevel || 5,
        awareness_level: onboardingData.step5?.motivationLevel || 5,
        motivation_for_joining: onboardingData.step5?.motivationForJoining,
        hopes_to_achieve: onboardingData.step5?.hopesToAchieve,
        
        // Additional context - comprehensive onboarding data
        summary: `User joined with motivation level ${onboardingData.step5?.motivationLevel || 0}/10. Primary goal: ${onboardingData.step4?.personalGoals || 'Not specified'}. Current mood: ${onboardingData.step1?.moodScore || 0}/10.`
      };

      // Update memory profile with additional data (simplified)
      try {
        console.log('Additional profile data:', additionalProfileData);
        // For now, we'll skip the complex memory profile updates
        console.log('Additional profile updates skipped');
      } catch (error) {
        console.error('Error updating additional profile data:', error);
      }

      // Success
      setToast({
        visible: true,
        message: 'Profile created successfully! Welcome to Aluuna.',
        type: 'success',
      });

      // Clear onboarding data from context
      clearOnboardingData();

      // Navigate to main app after a short delay
      setTimeout(() => {
        router.replace('/conversation' as any);
      }, 2000);

    } catch (error) {
      console.error('Onboarding submission error:', error);
      setToast({
        visible: true,
        message: 'An error occurred while saving your profile. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSummarySection = (title: string, data: any) => (
    <View className="mb-4">
      <Text className="text-base font-medium text-gray-800 mb-2">{title}</Text>
      <View className="bg-gray-50 rounded-lg p-3">
        {Object.entries(data).map(([key, value]) => (
          <View key={key} className="mb-2">
            <Text className="text-sm font-medium text-gray-600 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}:
            </Text>
            <Text className="text-sm text-gray-800">
              {Array.isArray(value) ? value.join(', ') : String(value)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-yellow-custom">
      <ScrollView 
        className="flex-1 bg-yellow-custom" 
        contentContainerStyle={{ minHeight: 800 }}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => {}}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6">
          {/* Header */}
          <View className="flex-row items-center justify-between py-4">
            <View style={{ width: 60 }} />
            <Text className="text-2xl mt-2 font-heading text-white">Review & Submit</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Content */}
          <View className="rounded-2xl p-6 mb-6 bg-white">
            <Text className="text-lg font-heading text-yellow-custom mb-6">
              Review your information and submit your profile
            </Text>

            {/* Comprehensive Profile Summary */}
            <View className="mb-6">
              <Text className="text-base font-medium text-gray-800 mb-4">
                Profile Summary
              </Text>
              <View className="bg-gray-50 rounded-lg p-4 space-y-3">
                {/* Step 1 - Mood & Emotional State */}
                <View className="border-b border-gray-200 pb-3">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Current State</Text>
                  <Text className="text-sm text-gray-600">
                    <Text className="font-medium">Mood Score:</Text> {onboardingData.step1?.moodScore || 0}/10
                  </Text>
                  <Text className="text-sm text-gray-600">
                    <Text className="font-medium">Emotional States:</Text> {onboardingData.step1?.emotionalStates?.join(', ') || 'N/A'}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    <Text className="font-medium">Mood Trends:</Text> {onboardingData.step1?.moodTrends?.join(', ') || 'N/A'}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    <Text className="font-medium">Sleep Quality:</Text> {onboardingData.step1?.sleepQuality || 'N/A'}
                  </Text>
                </View>

                {/* Step 2 - Life Context */}
                <View className="border-b border-gray-200 pb-3">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Life Context</Text>
                  <Text className="text-sm text-gray-600">
                    <Text className="font-medium">Relationship Status:</Text> {onboardingData.step2?.relationshipStatus || 'N/A'}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    <Text className="font-medium">Living Situation:</Text> {onboardingData.step2?.livingSituation || 'N/A'}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    <Text className="font-medium">Support System:</Text> {onboardingData.step2?.supportSystem?.join(', ') || 'N/A'}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    <Text className="font-medium">Current Stressors:</Text> {onboardingData.step2?.currentStressors?.join(', ') || 'N/A'}
                  </Text>
                </View>

                {/* Step 3 - Daily Life */}
                <View className="border-b border-gray-200 pb-3">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Daily Life</Text>
                  <Text className="text-sm text-gray-600">
                    <Text className="font-medium">Daily Habits:</Text> {onboardingData.step3?.dailyHabits?.join(', ') || 'N/A'}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    <Text className="font-medium">Sleep Routine:</Text> {onboardingData.step3?.sleepRoutine || 'N/A'}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    <Text className="font-medium">Biggest Challenge:</Text> {onboardingData.step3?.biggestChallenge || 'N/A'}
                  </Text>
                </View>

                {/* Step 4 - Therapy & Goals */}
                <View className="border-b border-gray-200 pb-3">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Therapy & Goals</Text>
                  <Text className="text-sm text-gray-600">
                    <Text className="font-medium">Previous Therapy:</Text> {onboardingData.step4?.previousTherapy || 'N/A'}
                  </Text>
                  {onboardingData.step4?.therapyType && (
                    <Text className="text-sm text-gray-600">
                      <Text className="font-medium">Therapy Type:</Text> {onboardingData.step4.therapyType}
                    </Text>
                  )}
                  <Text className="text-sm text-gray-600">
                    <Text className="font-medium">Personal Goals:</Text> {onboardingData.step4?.personalGoals || 'N/A'}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    <Text className="font-medium">Biggest Obstacle:</Text> {onboardingData.step4?.biggestObstacle || 'N/A'}
                  </Text>
                </View>

                {/* Step 5 - Motivation & Values */}
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Motivation & Values</Text>
                  <Text className="text-sm text-gray-600">
                    <Text className="font-medium">Motivation Level:</Text> {onboardingData.step5?.motivationLevel || 0}/10
                  </Text>
                  <Text className="text-sm text-gray-600">
                    <Text className="font-medium">Core Values:</Text> {onboardingData.step5?.coreValues?.join(', ') || 'N/A'}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    <Text className="font-medium">Motivation for Joining:</Text> {onboardingData.step5?.motivationForJoining || 'N/A'}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    <Text className="font-medium">Hopes to Achieve:</Text> {onboardingData.step5?.hopesToAchieve || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Privacy Notice */}
            <View className="mb-6 p-4 bg-yellow-50 rounded-lg">
              <Text className="text-sm text-gray-700 leading-5">
                <Text className="font-medium">Privacy Notice:</Text> Your information will be used to personalize your experience. All data is encrypted and stored securely. You can update or delete your information at any time.
              </Text>
            </View>
          </View>

          {/* Navigation */}
          <View className="flex-row justify-center space-x-4 pb-4">
            <TouchableOpacity
              onPress={() => router.push('/onboarding/step5' as any)}
              className="bg-yellow-custom px-6 py-3 rounded-xl border border-white"
              style={{ marginRight: 8 }}
            >
              <Text className="text-white font-medium text-center">Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className="bg-white px-6 py-3 rounded-xl border border-yellow-custom"
            >
              <Text className="text-black font-medium text-center">
                {isSubmitting ? 'Submitting...' : 'Submit Profile'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: 16 }}>
            <ProgressDots
              currentStep={6}
              totalSteps={6}
              onStepPress={(step) => {
                // TODO: Navigate to specific step
                console.log('Navigate to step:', step);
              }}
            />
          </View>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {isSubmitting && (
        <View className="absolute inset-0 bg-black bg-opacity-50 justify-center items-center">
          <View className="bg-white rounded-2xl p-8 w-80 items-center">
            <Image
              source={require('../../assets/images/logo.png')}
              className="w-[180px] h-[50px] mb-6"
              resizeMode="contain"
            />
            <AluunaLoader 
              message="Creating Your Profile" 
              size="large" 
              showMessage={true}
            />
            <Text className="text-sm text-gray-600 text-center mt-4">
              Please wait while we process your information...
            </Text>
          </View>
        </View>
      )}

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={handleHideToast}
      />
    </SafeAreaView>
  );
} 