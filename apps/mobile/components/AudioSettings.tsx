import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { speechManager } from '../lib/speechManager';
import { voicePreferencesService } from '../lib/voicePreferencesService';
import { AudioTest } from './AudioTest';

interface AudioSettingsProps {
  isVisible: boolean;
  onClose: () => void;
}

export function AudioSettings({ isVisible, onClose }: AudioSettingsProps) {
  const [useEarpiece, setUseEarpiece] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [useServerTts, setUseServerTts] = useState(speechManager.isUsingServerTts());
  const [dialogueMode, setDialogueMode] = useState(false);

  // Load dialogue mode setting on component mount
  useEffect(() => {
    const loadDialogueMode = async () => {
      const isEnabled = voicePreferencesService.getDialogueMode();
      setDialogueMode(isEnabled);
    };
    loadDialogueMode();
  }, []);

  const handleAudioRoutingChange = async (value: boolean) => {
    setUseEarpiece(value);
    await speechManager.setAudioRouting(value);
  };

  const handleServerTtsChange = (value: boolean) => {
    setUseServerTts(value);
    speechManager.setUseServerTts(value);
    if (value) {
      Alert.alert('Enhanced TTS Enabled', 'Enhanced TTS routes through the Aluuna server using OpenAI TTS.', [{ text: 'OK' }]);
    }
  };

  const handleDialogueModeChange = async (value: boolean) => {
    setDialogueMode(value);
    await voicePreferencesService.updateDialogueMode(value);
  };

  if (!isVisible) return null;

  return (
    <View className="absolute top-20 right-4 bg-white rounded-lg shadow-lg p-4 z-50 max-w-80">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-gray-800">Audio Settings</Text>
        <TouchableOpacity onPress={onClose}>
          <MaterialIcons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-base text-gray-700">Audio Output</Text>
            <Text className="text-sm text-gray-500">
              {useEarpiece ? 'Earpiece' : 'Speaker'}
            </Text>
          </View>
          <Switch
            value={useEarpiece}
            onValueChange={handleAudioRoutingChange}
            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
            thumbColor={useEarpiece ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>
        
        <Text className="text-xs text-gray-400 mb-4">
          Switch to earpiece when phone is near your ear
        </Text>

        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-base text-gray-700">Dialogue Mode</Text>
            <Text className="text-sm text-gray-500">
              {dialogueMode ? 'Auto-send & speak' : 'Manual send'}
            </Text>
          </View>
          <Switch
            value={dialogueMode}
            onValueChange={handleDialogueModeChange}
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor={dialogueMode ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>

        <Text className="text-xs text-gray-400 mb-4">
          Automatically send transcribed speech and play AI response
        </Text>

        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-base text-gray-700">Speech Engine</Text>
            <Text className="text-sm text-gray-500">{useServerTts ? 'Enhanced TTS (Server)' : 'Disabled'}</Text>
          </View>
          <Switch
            value={useServerTts}
            onValueChange={handleServerTtsChange}
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor={useServerTts ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>

        <TouchableOpacity
          onPress={() => setShowTest(!showTest)}
          className="mb-3 p-2 bg-gray-100 rounded-lg flex-row items-center justify-center"
        >
          <MaterialIcons name="science" size={16} color="#6B7280" />
          <Text className="text-sm text-gray-700 ml-2">
            {showTest ? 'Hide Audio Test' : 'Show Audio Test'}
          </Text>
        </TouchableOpacity>

        {showTest && (
          <AudioTest />
        )}
      </ScrollView>
    </View>
  );
} 