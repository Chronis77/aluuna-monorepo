import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { speechManager } from '../lib/speechManager';
import { VOICE_OPTIONS, VoiceOption, voicePreferencesService } from '../lib/voicePreferencesService';
import { trpcClient } from '../lib/trpcClient';

interface VoiceSettingsProps {
  isVisible: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export function VoiceSettings({ isVisible, onClose, onSave }: VoiceSettingsProps) {
  const [selectedUserVoice, setSelectedUserVoice] = useState<string>('alloy');
  const [selectedAIVoice, setSelectedAIVoice] = useState<string>('shimmer');
  const [isTesting, setIsTesting] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    loadVoicePreferences();
  }, []);

  const loadVoicePreferences = async () => {
    try {
      await voicePreferencesService.loadPreferences();
      // Hydrate from server if available
      const currentUser: any = await trpcClient.getCurrentUser();
      if (currentUser?.id) {
        const userData: any = await trpcClient.getUserData(currentUser.id);
        const serverPrefs = userData?.data?.user_preferences;
        if (serverPrefs) {
          const userVoiceId = serverPrefs.user_voice_id || 'alloy';
          const aiVoiceId = serverPrefs.ai_voice_id || 'shimmer';
          await voicePreferencesService.savePreferences({
            ...voicePreferencesService.getCurrentPreferences(),
            userVoiceId,
            aiVoiceId,
          });
        }
      }
      const preferences = voicePreferencesService.getCurrentPreferences();
      setSelectedUserVoice(preferences.userVoiceId);
      setSelectedAIVoice(preferences.aiVoiceId);
    } catch (error) {
      console.error('Error loading voice preferences:', error);
    }
  };

  const saveVoicePreferences = async () => {
    try {
      const existing = voicePreferencesService.getCurrentPreferences();
      await voicePreferencesService.savePreferences({
        userVoiceId: selectedUserVoice,
        aiVoiceId: selectedAIVoice,
        dialogueMode: existing.dialogueMode ?? false
      });
      // Persist to server as well
      const currentUser: any = await trpcClient.getCurrentUser();
      if (currentUser?.id) {
        await trpcClient.upsertUserPreferences(currentUser.id, {
          user_voice_id: selectedUserVoice,
          ai_voice_id: selectedAIVoice,
        });
      }
      
      // Close the modal and return to settings page
      onClose();
      
      // Call the onSave callback to show success toast
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving voice preferences:', error);
      Alert.alert('Error', 'Failed to save voice settings');
    }
  };

  const testVoice = async (voiceId: string, isUser: boolean) => {
    if (isTesting) return;

    const voice = VOICE_OPTIONS.find(v => v.id === voiceId);
    if (!voice) return;

    setIsTesting(true);
    
    const testText = isUser 
      ? "Hello, this is how your voice will sound in conversations." 
      : "Hello, I'm Aluuna. This is how I'll sound when speaking with you.";

    console.log(`🎤 Testing voice: ${voice.name} (${voice.gender})`);
    console.log(`👤 Testing as user: ${isUser}`);

    // Temporarily set the voice preferences for testing
    const originalPreferences = voicePreferencesService.getCurrentPreferences();
    
    try {
      if (isUser) {
        await voicePreferencesService.updateUserVoice(voiceId);
      } else {
        await voicePreferencesService.updateAIVoice(voiceId);
      }

      // Now test with the actual voice preferences that will be used in sessions
      await speechManager.speak(testText, `test-${Date.now()}`, {
        isUser: isUser,
        onStart: () => {
          console.log(`✅ Started playing ${voice.name}`);
        },
        onDone: () => {
          console.log(`✅ Finished playing ${voice.name}`);
          setIsTesting(false);
        },
        onError: (error) => {
          console.error(`❌ Error playing ${voice.name}:`, error);
          setIsTesting(false);
        },
      });
    } catch (error) {
      console.error('Error testing voice:', error);
      setIsTesting(false);
    } finally {
      // Restore original preferences
      try {
        await voicePreferencesService.savePreferences(originalPreferences);
      } catch (restoreError) {
        console.error('Error restoring voice preferences:', restoreError);
      }
    }
  };

  const getVoiceOption = (voiceId: string): VoiceOption | undefined => {
    return VOICE_OPTIONS.find(v => v.id === voiceId);
  };

  const renderVoiceOption = (voice: VoiceOption, isSelected: boolean, onSelect: () => void, isUser: boolean) => (
    <TouchableOpacity
      key={voice.id}
      className={`rounded-2xl p-4 mb-3 border-2 ${
        isSelected ? 'border-blue-custom bg-blue-custom' : 'border-gray-200 bg-white'
      }`}
      onPress={onSelect}
      disabled={isTesting}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View 
            className="w-12 h-12 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: isSelected ? '#FFFFFF20' : (voice.gender === 'male' ? '#3B82F620' : '#EC489920') }}
          >
            <MaterialIcons 
              name={voice.gender === 'male' ? 'person' : 'person-outline'} 
              size={24} 
              color={isSelected ? 'white' : (voice.gender === 'male' ? '#3B82F6' : '#EC4899')} 
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className={`text-base font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>{voice.name}</Text>
              {isSelected && (
                <MaterialIcons name="check-circle" size={20} color="white" style={{ marginLeft: 8 }} />
              )}
            </View>
            <Text className={`text-sm mb-2 ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>{voice.description}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          onPress={() => testVoice(voice.id, isUser)}
          disabled={isTesting}
          className={`p-3 rounded-full ${
            isTesting ? 'bg-gray-300' : isSelected ? 'bg-white' : 'bg-blue-100'
          }`}
        >
          <MaterialIcons 
            name={isTesting ? 'hourglass-empty' : 'play-arrow'} 
            size={20} 
            color={isTesting ? '#9CA3AF' : (isSelected ? '#3B82F6' : '#3B82F6')} 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderVoiceSection = (title: string, selectedVoice: string, onVoiceSelect: (voiceId: string) => void, isUser: boolean) => {
    const selectedVoiceData = getVoiceOption(selectedVoice);
    const availableVoices = voicePreferencesService.getAvailableVoices(isUser);

    return (
      <View className="mb-6">
        <View className="flex-row items-center mb-4">
          <View 
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: isUser ? '#3B82F620' : '#EC489920' }}
          >
            <MaterialIcons 
              name={isUser ? 'person' : 'record-voice-over'} 
              size={20} 
              color={isUser ? '#3B82F6' : '#EC4899'} 
            />
          </View>
          <View>
            <Text className="text-lg font-semibold text-gray-900">{title}</Text>
            <Text className="text-sm text-gray-600">
              {isUser ? 'Choose how your voice will sound' : 'Choose how Aluuna will sound'}
            </Text>
          </View>
        </View>
        
        {selectedVoiceData && (
          <View className="mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <Text className="text-sm text-gray-600">
              Current: <Text className="font-semibold">{selectedVoiceData.name}</Text> ({selectedVoiceData.description})
            </Text>
          </View>
        )}
        
        {availableVoices.map(voice => 
          renderVoiceOption(
            voice, 
            selectedVoice === voice.id, 
            () => onVoiceSelect(voice.id), 
            isUser
          )
        )}
      </View>
    );
  };

  if (!isVisible) return null;

  return (
    <View className="absolute inset-0 bg-white z-50">
      {/* Header */}
      <SafeAreaView className="bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">Voice Settings</Text>
          <View className="w-6" />
        </View>
      </SafeAreaView>
      
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {renderVoiceSection('Your Voice', selectedUserVoice, setSelectedUserVoice, true)}
        {renderVoiceSection('Aluuna\'s Voice', selectedAIVoice, setSelectedAIVoice, false)}
        
        <View className="bg-white rounded-2xl p-4 mb-4 border border-blue-200">
          <View className="flex-row items-start">
            <View 
              className="w-8 h-8 rounded-full items-center justify-center mr-3 mt-0.5"
              style={{ backgroundColor: '#1E40AF20' }}
            >
              <MaterialIcons name="info" size={16} color="#1E40AF" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-blue-900 mb-1">Voice Testing</Text>
              <Text className="text-sm text-blue-800">
                Tap the play button to test each voice. Different voices will be used even if both are the same gender.
              </Text>
            </View>
          </View>
        </View>
        
        {/* Removed technical pitch/rate notes for a cleaner UI */}
      </ScrollView>

      <View className="flex-row p-4 pb-8 border-t border-gray-200 bg-white">
        <TouchableOpacity
          onPress={onClose}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg mr-3"
        >
          <Text className="text-center text-gray-700 font-medium">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={saveVoicePreferences}
          className="flex-1 py-3 px-4 bg-blue-custom rounded-lg"
        >
          <Text className="text-center text-white font-medium">Save Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 