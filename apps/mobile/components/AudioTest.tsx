import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import { Alert, Platform, Text, TouchableOpacity, View } from 'react-native';
import { speechManager } from '../lib/speechManager';

export function AudioTest() {
  const [isTesting, setIsTesting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const testBasicSpeech = async () => {
    try {
      setIsTesting(true);
      
      // Simple test to verify speech is working at all
      await speechManager.speak(
        "Hello, this is a basic speech test.",
        'test-basic',
        {
          onStart: () => {
            Alert.alert('Basic Test', 'Testing basic speech functionality...');
          },
          onDone: () => {
            Alert.alert('Basic Test', 'Basic speech test completed! Did you hear anything?');
            setIsTesting(false);
          },
          onError: (error) => {
            Alert.alert('Basic Test Error', `Error: ${error.message}`);
            setIsTesting(false);
          },
        }
      );
    } catch (error) {
      Alert.alert('Basic Test Error', `Error: ${error}`);
      setIsTesting(false);
    }
  };

  const testGoogleTts = async () => {
    try {
      setIsTesting(true);
      
      // Test Google TTS specifically
      const isUsingGoogleTts = speechManager.isUsingPiperTts();
      const testText = isUsingGoogleTts 
        ? "This is a test of the enhanced TTS service. The system will try your local Google TTS server first, then fall back to online services if needed. Notice how much more natural and human-like this voice sounds compared to the default speech engine."
        : "This is a test of the default speech engine. Switch to Google TTS in settings for more natural speech.";
      
      await speechManager.speak(
        testText,
        'test-google-tts',
        {
          onStart: () => {
            Alert.alert('Enhanced TTS Test', `Testing ${isUsingGoogleTts ? 'Enhanced TTS (Local + Online)' : 'Default Speech'}...`);
          },
          onDone: () => {
            const message = isUsingGoogleTts
              ? 'Enhanced TTS test completed! Check the console to see which service was used (Local Google TTS, VoiceRSS, or other online services).'
              : 'Default speech test completed! Enable Google TTS in settings for natural speech.';
            Alert.alert('Enhanced TTS Test', message);
            setIsTesting(false);
          },
          onError: (error) => {
            Alert.alert('Enhanced TTS Test Error', `Error: ${error.message}`);
            setIsTesting(false);
          },
        }
      );
    } catch (error) {
      Alert.alert('Enhanced TTS Test Error', `Error: ${error}`);
      setIsTesting(false);
    }
  };

  const testSpeakerOutput = async () => {
    try {
      setIsTesting(true);
      
      // Test with a simple message
      await speechManager.speak(
        "This is a test message. If you can hear this clearly through the main speaker, the audio routing is working correctly.",
        'test-speaker',
        {
          onStart: () => {
            Alert.alert('Audio Test', 'Testing speaker output...');
          },
          onDone: () => {
            const message = Platform.OS === 'ios' 
              ? 'Test completed! On iOS, audio routing may be limited by system settings. Did you hear the audio at full volume?'
              : 'Test completed! Did you hear the audio through the main speaker?';
            Alert.alert('Audio Test', message);
            setIsTesting(false);
          },
          onError: (error) => {
            Alert.alert('Audio Test Error', `Error: ${error.message}`);
            setIsTesting(false);
          },
        }
      );
    } catch (error) {
      Alert.alert('Audio Test Error', `Error: ${error}`);
      setIsTesting(false);
    }
  };

  const testEarpieceOutput = async () => {
    try {
      setIsTesting(true);
      
      // Set audio routing to earpiece
      await speechManager.setAudioRouting(true);
      
      // Test with a simple message
      await speechManager.speak(
        "This is an earpiece test. Hold the phone to your ear to hear this message.",
        'test-earpiece',
        {
          onStart: () => {
            Alert.alert('Audio Test', 'Testing earpiece output...');
          },
          onDone: () => {
            const message = Platform.OS === 'ios'
              ? 'Earpiece test completed! On iOS, the system may automatically route audio based on proximity sensors.'
              : 'Earpiece test completed!';
            Alert.alert('Audio Test', message);
            setIsTesting(false);
          },
          onError: (error) => {
            Alert.alert('Audio Test Error', `Error: ${error.message}`);
            setIsTesting(false);
          },
        }
      );
    } catch (error) {
      Alert.alert('Audio Test Error', `Error: ${error}`);
      setIsTesting(false);
    }
  };

  const testRecordingCompatibility = async () => {
    try {
      setIsTesting(true);
      
      // First, test speech
      await speechManager.speak(
        "Testing speech and recording compatibility. After this message, recording should work.",
        'test-recording-compat',
        {
          onStart: () => {
            Alert.alert('Recording Test', 'Testing speech, then checking recording compatibility...');
          },
          onDone: () => {
            Alert.alert('Recording Test', 'Speech completed! Now try using the voice recording button. It should work without errors.');
            setIsTesting(false);
          },
          onError: (error) => {
            Alert.alert('Recording Test Error', `Error: ${error.message}`);
            setIsTesting(false);
          },
        }
      );
    } catch (error) {
      Alert.alert('Recording Test Error', `Error: ${error}`);
      setIsTesting(false);
    }
  };

  const resetAudioSession = async () => {
    try {
      setIsResetting(true);
      await speechManager.resetAudioSession();
      Alert.alert('Audio Reset', 'Audio session has been reset to default state. Try testing audio again.');
    } catch (error) {
      Alert.alert('Reset Error', `Error resetting audio: ${error}`);
    } finally {
      setIsResetting(false);
    }
  };

  const isUsingGoogleTts = speechManager.isUsingPiperTts();

  return (
    <View className="p-4 bg-white rounded-lg shadow-lg">
      <Text className="text-lg font-semibold text-gray-800 mb-4">Audio Routing Test</Text>
      
      {Platform.OS === 'ios' && (
        <View className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Text className="text-sm text-yellow-800">
            <MaterialIcons name="info" size={16} color="#92400E" />
                            <Text className="ml-1 font-sans">iOS Note: Audio routing may be limited by system settings. The volume should be much louder now.</Text>
          </Text>
        </View>
      )}

      {isUsingGoogleTts && (
        <View className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Text className="text-sm text-green-800">
            <MaterialIcons name="check-circle" size={16} color="#059669" />
                            <Text className="ml-1 font-sans">Enhanced TTS is enabled! The system will try your local Google TTS server first, then fall back to online services.</Text>
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        onPress={testBasicSpeech}
        disabled={isTesting || isResetting}
        className={`mb-3 p-3 rounded-lg flex-row items-center justify-center ${
          isTesting || isResetting ? 'bg-gray-400' : 'bg-purple-500'
        }`}
      >
        <MaterialIcons name="play-arrow" size={20} color="white" />
        <Text className="text-white font-semibold ml-2">
          {isTesting ? 'Testing...' : 'Basic Speech Test'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={testGoogleTts}
        disabled={isTesting || isResetting}
        className={`mb-3 p-3 rounded-lg flex-row items-center justify-center ${
          isTesting || isResetting ? 'bg-gray-400' : 'bg-emerald-500'
        }`}
      >
        <MaterialIcons name="record-voice-over" size={20} color="white" />
        <Text className="text-white font-semibold ml-2">
          {isTesting ? 'Testing...' : `${isUsingGoogleTts ? 'Enhanced TTS' : 'Default Speech'} Test`}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={testSpeakerOutput}
        disabled={isTesting || isResetting}
        className={`mb-3 p-3 rounded-lg flex-row items-center justify-center ${
          isTesting || isResetting ? 'bg-gray-400' : 'bg-blue-500'
        }`}
      >
        <MaterialIcons name="volume-up" size={20} color="white" />
        <Text className="text-white font-semibold ml-2">
          {isTesting ? 'Testing...' : 'Test Speaker Output'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={testEarpieceOutput}
        disabled={isTesting || isResetting}
        className={`mb-3 p-3 rounded-lg flex-row items-center justify-center ${
          isTesting || isResetting ? 'bg-gray-400' : 'bg-green-500'
        }`}
      >
        <MaterialIcons name="phone" size={20} color="white" />
        <Text className="text-white font-semibold ml-2">
          {isTesting ? 'Testing...' : 'Test Earpiece Output'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={testRecordingCompatibility}
        disabled={isTesting || isResetting}
        className={`mb-3 p-3 rounded-lg flex-row items-center justify-center ${
          isTesting || isResetting ? 'bg-gray-400' : 'bg-orange-500'
        }`}
      >
        <MaterialIcons name="mic" size={20} color="white" />
        <Text className="text-white font-semibold ml-2">
          {isTesting ? 'Testing...' : 'Test Recording Compatibility'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={resetAudioSession}
        disabled={isTesting || isResetting}
        className={`p-3 rounded-lg flex-row items-center justify-center ${
          isTesting || isResetting ? 'bg-gray-400' : 'bg-red-500'
        }`}
      >
        <MaterialIcons name="refresh" size={20} color="white" />
        <Text className="text-white font-semibold ml-2">
          {isResetting ? 'Resetting...' : 'Reset Audio Session'}
        </Text>
      </TouchableOpacity>
      
      <Text className="text-xs text-gray-500 mt-3 text-center">
        Test order: Basic → {isUsingGoogleTts ? 'Enhanced TTS' : 'Default Speech'} → Speaker → Earpiece → Recording → Reset if needed
      </Text>
    </View>
  );
} 