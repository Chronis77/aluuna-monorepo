import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface OnboardingData {
  step1?: {
    moodScore: number;
    emotionalStates: string[];
    moodTrends: string[];
    suicidalThoughts: string;
    sleepQuality: string;
  };
  step2?: {
    relationshipStatus: string;
    supportSystem: string[];
    currentStressors: string[];
    livingSituation: string;
  };
  step3?: {
    dailyHabits: string[];
    substanceUse: string[];
    sleepRoutine: string;
    biggestChallenge: string;
  };
  step4?: {
    previousTherapy: string;
    therapyType?: string;
    therapyDuration?: string;
    preferredTherapyStyle: string[];
    personalGoals: string;
    biggestObstacle: string;
  };
  step5?: {
    coreValues: string[];
    motivationForJoining: string;
    hopesToAchieve: string;
    motivationLevel: number;
  };
}

interface OnboardingContextType {
  onboardingData: OnboardingData;
  isLoading: boolean;
  updateStepData: (step: keyof OnboardingData, data: any) => void;
  clearOnboardingData: () => void;
  saveOnboardingToDatabase: (dataToSave?: OnboardingData) => Promise<void>;
  loadOnboardingFromDatabase: () => Promise<void>;
  isStepCompleted: (step: keyof OnboardingData) => boolean;
  refreshData: () => Promise<void>;
  forceClearData: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  console.log('🏗️ OnboardingProvider render - onboardingData:', onboardingData, 'isLoading:', isLoading, 'currentUserId:', currentUserId);

  // Load onboarding data from database on mount and when user changes
  useEffect(() => {
    console.log('🚀 OnboardingProvider mounted or user changed, calling loadOnboardingFromDatabase...');
    loadOnboardingFromDatabase();
  }, [currentUserId]);

  // Listen for auth state changes to clear data when user signs out
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change in OnboardingProvider:', event, session ? 'Logged in' : 'Logged out');
      
      if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out, clearing onboarding data');
        setCurrentUserId(null);
        setOnboardingData({});
        setIsLoading(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('🚪 User signed in, will load onboarding data for:', session.user.id);
        setCurrentUserId(session.user.id);
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  const updateStepData = (step: keyof OnboardingData, data: any) => {
    console.log(`🔄 Updating step ${step} with data:`, data);
    setOnboardingData(prev => {
      const updatedData = {
        ...prev,
        [step]: data
      };
      console.log(`📝 Updated onboarding data:`, updatedData);
      return updatedData;
    });
  };

  // Auto-save to database whenever onboardingData changes
  useEffect(() => {
    console.log(`🔄 onboardingData changed:`, onboardingData, 'isLoading:', isLoading);
    console.log(`🔄 onboardingData keys:`, Object.keys(onboardingData));
    console.log(`🔄 onboardingData step1:`, onboardingData.step1);
    console.log(`🔄 onboardingData step5:`, onboardingData.step5);
    console.log(`🔄 onboardingData type:`, typeof onboardingData);
    console.log(`🔄 onboardingData stringified:`, JSON.stringify(onboardingData));
    
    if (!isLoading && Object.keys(onboardingData).length > 0) {
      // Check if there's actual data to save (not just empty objects)
      const hasData = Object.values(onboardingData).some(stepData => 
        stepData && Object.keys(stepData).length > 0
      );
      if (hasData) {
        console.log(`💾 Auto-saving onboarding data:`, onboardingData);
        saveOnboardingToDatabase(onboardingData);
      }
    }
  }, [onboardingData, isLoading]);

  const clearOnboardingData = () => {
    setOnboardingData({});
    // Clear from database
    clearOnboardingFromDatabase();
  };

  const saveOnboardingToDatabase = async (dataToSave?: OnboardingData) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('User not authenticated, skipping database save');
        return;
      }

      // Use provided data or fall back to current state
      const dataToPersist = dataToSave || onboardingData;
      console.log(`🔍 Data to persist:`, dataToPersist);

      // Upsert onboarding data
      const { error } = await supabase
        .from('onboarding_progress')
        .upsert([
          {
            user_id: user.id,
            onboarding_data: dataToPersist,
            updated_at: new Date().toISOString()
          }
        ], {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving onboarding data:', error);
      } else {
        console.log('✅ Onboarding data saved successfully');
      }
    } catch (error) {
      console.error('Error in saveOnboardingToDatabase:', error);
    }
  };

  const loadOnboardingFromDatabase = async () => {
    try {
      console.log('🔄 Starting to load onboarding data from database...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('User not authenticated, skipping database load');
        setCurrentUserId(null);
        setOnboardingData({});
        setIsLoading(false);
        return;
      }

      console.log('👤 User authenticated, user ID:', user.id);
      
      // Check if user has changed
      if (currentUserId !== user.id) {
        console.log('🔄 User changed from', currentUserId, 'to', user.id);
        setCurrentUserId(user.id);
        setOnboardingData({}); // Clear existing data for new user
      }

      console.log('🔍 Querying onboarding_progress for user_id:', user.id);
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('onboarding_data')
        .eq('user_id', user.id)
        .single();

      console.log('🔍 Database query result - data:', data);
      console.log('🔍 Database query result - error:', error);
      console.log('🔍 Database query result - error code:', error?.code);
      console.log('🔍 Database query result - error message:', error?.message);

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error loading onboarding data:', error);
      } else if (data?.onboarding_data) {
        console.log('📥 Loaded onboarding data from database:', data.onboarding_data);
        console.log('📥 Data type:', typeof data.onboarding_data);
        console.log('📥 Data keys:', Object.keys(data.onboarding_data));
        console.log('📥 Step1 data:', data.onboarding_data.step1);
        console.log('📥 Step5 data:', data.onboarding_data.step5);
        
        // Verify this data is for the current user
        console.log('🔍 Verifying data is for current user:', user.id);
        
        console.log('🔄 About to call setOnboardingData with:', data.onboarding_data);
        setOnboardingData(data.onboarding_data);
        console.log('✅ setOnboardingData called successfully');
        
        // Add a small delay to check if the state was actually updated
        setTimeout(() => {
          console.log('⏰ After setOnboardingData delay - checking if state was updated');
        }, 100);
      } else {
        console.log('📥 No onboarding data found in database');
        console.log('📥 Data object:', data);
        console.log('📥 Data.onboarding_data:', data?.onboarding_data);
      }
    } catch (error) {
      console.error('Error in loadOnboardingFromDatabase:', error);
    } finally {
      console.log('✅ Finished loading onboarding data, setting isLoading to false');
      setIsLoading(false);
    }
  };

  const clearOnboardingFromDatabase = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return;
      }

      const { error } = await supabase
        .from('onboarding_progress')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing onboarding data:', error);
      }
    } catch (error) {
      console.error('Error in clearOnboardingFromDatabase:', error);
    }
  };

  const isStepCompleted = (step: keyof OnboardingData) => {
    return !!onboardingData[step];
  };

  const refreshData = async () => {
    console.log('🔄 Manual refresh requested');
    setIsLoading(true);
    await loadOnboardingFromDatabase();
  };

  const forceClearData = async () => {
    console.log('🧹 Force clearing onboarding data');
    setOnboardingData({});
    setIsLoading(false);
    await clearOnboardingFromDatabase();
  };

  return (
    <OnboardingContext.Provider value={{
      onboardingData,
      isLoading,
      updateStepData,
      clearOnboardingData,
      saveOnboardingToDatabase,
      loadOnboardingFromDatabase,
      isStepCompleted,
      refreshData,
      forceClearData
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  
  console.log('🎯 useOnboarding called - context data:', {
    onboardingData: context.onboardingData,
    isLoading: context.isLoading,
    hasStep1: !!context.onboardingData.step1,
    hasStep5: !!context.onboardingData.step5
  });
  
  return context;
} 