import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const [usePiperTts, setUsePiperTts] = useState(speechManager.isUsingPiperTts());
  const [ttsApiKey, setTtsApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
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

  const handlePiperTtsChange = (value: boolean) => {
    setUsePiperTts(value);
    speechManager.setUsePiperTts(value);
    
    if (value) {
      Alert.alert(
        'Enhanced TTS Setup',
        'Enhanced TTS is now enabled! The system will try your local Google TTS server first, then fall back to online services for natural speech synthesis.',
        [
          { text: 'OK' }
        ]
      );
    }
  };

  const handleDialogueModeChange = async (value: boolean) => {
    setDialogueMode(value);
    await voicePreferencesService.updateDialogueMode(value);
  };

  const handleApiKeySave = () => {
    if (ttsApiKey.trim()) {
      speechManager.setPiperApiKey(ttsApiKey.trim());
      setShowApiKeyInput(false);
      Alert.alert('Success', 'API key saved!');
    } else {
      Alert.alert('Error', 'Please enter a valid API key.');
    }
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
            <Text className="text-sm text-gray-500">
              {usePiperTts ? 'Enhanced TTS (Natural)' : 'Default Speech'}
            </Text>
          </View>
          <Switch
            value={usePiperTts}
            onValueChange={handlePiperTtsChange}
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor={usePiperTts ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>

        {usePiperTts && (
          <View className="mb-4">
            <View className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
              <Text className="text-sm text-green-800">
                <MaterialIcons name="check-circle" size={16} color="#059669" />
                <Text className="ml-1 font-sans">Enhanced TTS is enabled! Tries local Google TTS server first, then online services.</Text>
              </Text>
            </View>
            
            <View className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
              <Text className="text-sm text-blue-800">
                <MaterialIcons name="info" size={16} color="#1E40AF" />
                <Text className="ml-1 font-sans">Local Server: If you have a Google TTS server running on localhost:3000, it will be used automatically.</Text>
              </Text>
            </View>
            
                            <Text className="text-sm text-gray-700 mb-2 font-sans">Hugging Face API Key (Optional)</Text>
            <Text className="text-xs text-gray-500 mb-2">
              Add an API key for higher rate limits. Free without key!
            </Text>
            
            {showApiKeyInput ? (
              <View>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter your Hugging Face API key (optional)"
                  value={ttsApiKey}
                  onChangeText={setTtsApiKey}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <View className="flex-row mt-2 space-x-2">
                  <TouchableOpacity
                    onPress={handleApiKeySave}
                    className="flex-1 bg-green-500 p-2 rounded-lg"
                  >
                    <Text className="text-white text-center text-sm font-sans">Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowApiKeyInput(false)}
                    className="flex-1 bg-gray-500 p-2 rounded-lg"
                  >
                    <Text className="text-white text-center text-sm font-sans">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowApiKeyInput(true)}
                className="bg-blue-100 p-2 rounded-lg"
              >
                <Text className="text-blue-700 text-center text-sm">
                  {ttsApiKey ? 'Update API Key' : 'Add API Key (Optional)'}
                </Text>
              </TouchableOpacity>
            )}
            <Text className="text-xs text-gray-400 mt-1">
              Get free API key from huggingface.co (optional)
            </Text>
          </View>
        )}

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