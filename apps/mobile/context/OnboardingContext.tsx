import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { trpcClient } from '../lib/trpcClient';

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
  updateStepData: (step: keyof OnboardingData, data: any) => Promise<void>;
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
    // TODO: Implement with tRPC authentication
    console.log('🔄 Auth state change listener - TODO: implement with tRPC');
    
    // Temporary placeholder - will be implemented with tRPC
    // const { data: listener } = await trpcClient.onAuthStateChange((event, session) => {
    //   console.log('🔄 Auth state change in OnboardingProvider:', event, session ? 'Logged in' : 'Logged out');
    //   
    //   if (event === 'SIGNED_OUT') {
    //     console.log('🚪 User signed out, clearing onboarding data');
    //     setCurrentUserId(null);
    //     setOnboardingData({});
    //     setIsLoading(false);
    //   } else if (event === 'SIGNED_IN' && session?.user) {
    //     console.log('🚪 User signed in, will load onboarding data for:', session.user.id);
    //     setCurrentUserId(session.user.id);
    //   }
    // });
    // 
    // return () => listener?.subscription.unsubscribe();
  }, []);

  const updateStepData = async (step: keyof OnboardingData, data: any) => {
    console.log(`🔄 Updating step ${step} with data:`, data);

    // Compute the next state once and use it for both state and DB write to avoid stale reads
    const nextData: OnboardingData = {
      ...onboardingData,
      [step]: data,
    };
    console.log(`📝 Next onboarding data to persist:`, nextData);

    // Update local state immediately
    setOnboardingData(nextData);

    // Save to database immediately and wait for completion
    try {
      const user = await trpcClient.getCurrentUser();
      if (user) {
        console.log(`💾 Saving step ${step} data to DB:`, nextData);
        await trpcClient.upsertOnboardingProgress(
          user.id,
          new Date().toISOString(),
          nextData
        );
        console.log(`✅ Step ${step} data saved successfully to database`);
      } else {
        console.warn('No user found, cannot save to database');
      }
    } catch (error) {
      console.error(`❌ Error saving step ${step} data to database:`, error);
      throw error; // Re-throw so the calling function knows the save failed
    }
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
      // Get current user from tRPC
      const user = await trpcClient.getCurrentUser();
      
      if (!user) {
        console.log('User not authenticated, skipping database save');
        return;
      }

      // Use provided data or fall back to current state
      const dataToPersist = dataToSave || onboardingData;
      console.log(`🔍 Data to persist:`, dataToPersist);

      // Upsert onboarding data via tRPC
      await trpcClient.upsertOnboardingProgress(
        user.id,
        new Date().toISOString(),
        dataToPersist
      );

      console.log('✅ Onboarding data saved successfully');
    } catch (error) {
      console.error('Error in saveOnboardingToDatabase:', error);
    }
  };

  const loadOnboardingFromDatabase = async () => {
    try {
      console.log('🔄 Starting to load onboarding data from database...');
      
      // Get current user from tRPC
      const user = await trpcClient.getCurrentUser();
      
      if (!user) {
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
      const data = await trpcClient.getOnboardingProgress(user.id);
      
      if (data?.onboarding_data) {
        console.log('📥 Loaded onboarding data from database:', data.onboarding_data);
        setOnboardingData(data.onboarding_data);
      } else {
        console.log('📥 No onboarding data found in database');
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
      // Get current user from tRPC
      const user = await trpcClient.getCurrentUser();
      
      if (!user) {
        return;
      }

      await trpcClient.deleteOnboardingProgress(user.id);
      console.log('✅ Onboarding data cleared successfully');
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