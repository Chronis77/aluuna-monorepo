import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AluunaLoader } from '../components/AluunaLoader';
import { Toast } from '../components/ui/Toast';
import { VoiceSettings } from '../components/VoiceSettings';
import { speechManager } from '../lib/speechManager';
import { supabase } from '../lib/supabase';
import { voicePreferencesService } from '../lib/voicePreferencesService';

interface SettingsItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  type: 'toggle' | 'navigate' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [usePiperTts, setUsePiperTts] = useState(false);
  const [useEarpiece, setUseEarpiece] = useState(false);
  const [dialogueMode, setDialogueMode] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  // Initialize the settings screen
  useEffect(() => {
    initializeSettings();
  }, []);

  const initializeSettings = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login' as any);
        return;
      }
      
      setCurrentUserId(user.id);

      // Load current settings
      setUsePiperTts(speechManager.isUsingPiperTts());
      setUseEarpiece(false); // Default to speaker
      setDialogueMode(voicePreferencesService.getDialogueMode());

    } catch (error) {
      console.error('Error initializing settings:', error);
      setToast({
        visible: true,
        message: 'Failed to load settings. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePiperTts = async (value: boolean) => {
    try {
      setUsePiperTts(value);
      speechManager.setUsePiperTts(value);
      
      if (value) {
        Alert.alert(
          'Enhanced TTS Setup',
          'Enhanced TTS is now enabled! The system will try your local Google TTS server first, then fall back to online services for natural speech synthesis.',
          [{ text: 'OK' }]
        );
      }
      
      setToast({
        visible: true,
        message: `Enhanced TTS ${value ? 'enabled' : 'disabled'}.`,
        type: 'success',
      });
    } catch (error) {
      console.error('Error toggling Piper TTS:', error);
      setToast({
        visible: true,
        message: 'Failed to update TTS setting.',
        type: 'error',
      });
    }
  };

  const handleToggleEarpiece = async (value: boolean) => {
    try {
      setUseEarpiece(value);
      await speechManager.setAudioRouting(value);
      
      setToast({
        visible: true,
        message: `Audio output set to ${value ? 'earpiece' : 'speaker'}.`,
        type: 'success',
      });
    } catch (error) {
      console.error('Error toggling earpiece:', error);
      setToast({
        visible: true,
        message: 'Failed to update audio routing.',
        type: 'error',
      });
    }
  };

  const handleToggleDialogueMode = async (value: boolean) => {
    try {
      setDialogueMode(value);
      await voicePreferencesService.updateDialogueMode(value);
      
      setToast({
        visible: true,
        message: `Dialogue mode ${value ? 'enabled' : 'disabled'}.`,
        type: 'success',
      });
    } catch (error) {
      console.error('Error toggling dialogue mode:', error);
      setToast({
        visible: true,
        message: 'Failed to update dialogue mode setting.',
        type: 'error',
      });
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            try {
              // Clear onboarding data from database before signing out
              const { data: { user }, error: userError } = await supabase.auth.getUser();
              if (!userError && user) {
                const { error: clearError } = await supabase
                  .from('onboarding_progress')
                  .delete()
                  .eq('user_id', user.id);
                
                if (clearError) {
                  console.error('Error clearing onboarding data:', clearError);
                } else {
                  console.log('✅ Onboarding data cleared on logout');
                }
              }
              
              const { error } = await supabase.auth.signOut();
              if (error) {
                setToast({
                  visible: true,
                  message: error.message,
                  type: 'error',
                });
              } else {
                router.replace('/login' as any);
              }
            } catch (error) {
              console.error('Error logging out:', error);
              setToast({
                visible: true,
                message: 'Failed to logout. Please try again.',
                type: 'error',
              });
            }
          }
        }
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your conversations, memories, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All Data', 
          style: 'destructive', 
          onPress: async () => {
            try {
              // Clear all user data from database
              if (currentUserId) {
                await supabase.from('session_groups').delete().eq('user_id', currentUserId);
                await supabase.from('sessions').delete().eq('user_id', currentUserId);
                await supabase.from('memory_items').delete().eq('user_id', currentUserId);
                await supabase.from('mantras').delete().eq('user_id', currentUserId);
              }
              
              setToast({
                visible: true,
                message: 'All data cleared successfully.',
                type: 'success',
              });
              
              // Navigate back to session screen
              router.replace('/session' as any);
            } catch (error) {
              console.error('Error clearing data:', error);
              setToast({
                visible: true,
                message: 'Failed to clear data. Please try again.',
                type: 'error',
              });
            }
          }
        }
      ]
    );
  };

  const settingsItems: SettingsItem[] = [
    {
      id: 'voice-settings',
      title: 'Voice Settings',
      subtitle: 'Customize voices for you and Aluuna',
      icon: 'record-voice-over',
      iconColor: '#3B82F6',
      type: 'navigate',
      onPress: () => setShowVoiceSettings(true),
    },
    {
      id: 'dialogue-mode',
      title: 'Dialogue Mode',
      subtitle: dialogueMode ? 'Auto-send & speak' : 'Manual send',
      icon: 'forum',
      iconColor: '#10B981',
      type: 'toggle',
      value: dialogueMode,
      onToggle: handleToggleDialogueMode,
    },
    {
      id: 'enhanced-tts',
      title: 'Enhanced TTS',
      subtitle: 'Use advanced speech synthesis for better voice quality',
      icon: 'psychology',
      iconColor: '#10B981',
      type: 'toggle',
      value: usePiperTts,
      onToggle: handleTogglePiperTts,
    },
    {
      id: 'audio-routing',
      title: 'Audio Output',
      subtitle: useEarpiece ? 'Use earpiece when phone is near ear' : 'Always use speaker',
      icon: 'volume-up',
      iconColor: '#F59E0B',
      type: 'toggle',
      value: useEarpiece,
      onToggle: handleToggleEarpiece,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Receive reminders and insights',
      icon: 'notifications',
      iconColor: '#8B5CF6',
      type: 'toggle',
      value: true,
      onToggle: (value) => {
        setToast({
          visible: true,
          message: `Notifications ${value ? 'enabled' : 'disabled'}.`,
          type: 'info',
        });
      },
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'Manage your data and privacy settings',
      icon: 'security',
      iconColor: '#EF4444',
      type: 'navigate',
      onPress: () => {
        setToast({
          visible: true,
          message: 'Privacy settings coming soon!',
          type: 'info',
        });
      },
    },
    {
      id: 'clear-data',
      title: 'Clear All Data',
      subtitle: 'Permanently delete all your data',
      icon: 'delete-forever',
      iconColor: '#DC2626',
      type: 'action',
      onPress: handleClearData,
    },
    {
      id: 'logout',
      title: 'Logout',
      subtitle: 'Sign out of your account',
      icon: 'logout',
      iconColor: '#6B7280',
      type: 'action',
      onPress: handleLogout,
    },
  ];

  const renderSettingsItem = ({ item }: { item: SettingsItem }) => (
    <TouchableOpacity 
      className="bg-white rounded-2xl p-4 mb-3"
      onPress={item.onPress}
      disabled={item.type === 'toggle'}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View 
            className="w-12 h-12 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: `${item.iconColor}20` }}
          >
            <MaterialIcons
              name={item.icon as any}
              size={24}
              color={item.iconColor}
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900 mb-1">
              {item.title}
            </Text>
            <Text className="text-sm text-gray-600">
              {item.subtitle}
            </Text>
          </View>
        </View>
        
        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
            thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
          />
        )}
        
        {item.type === 'navigate' && (
          <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
        )}
        
        {item.type === 'action' && item.id === 'logout' && (
          <MaterialIcons name="logout" size={20} color="#6B7280" />
        )}
        
        {item.type === 'action' && item.id === 'clear-data' && (
          <MaterialIcons name="delete-forever" size={20} color="#DC2626" />
        )}
      </View>
    </TouchableOpacity>
  );

  const onToastHide = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Image
          source={require('../assets/images/logo.png')}
          className="w-[200px] h-[60px] mb-8"
          resizeMode="contain"
        />
        <AluunaLoader 
          message="Loading settings..." 
          size="large" 
          showMessage={true}
        />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={onToastHide}
      />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-gray-900">
          Settings
        </Text>

        <View className="w-6" />
      </View>

      {/* Content */}
      <FlatList
        data={settingsItems}
        renderItem={renderSettingsItem}
        keyExtractor={(item) => item.id}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View className="mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              App Preferences
            </Text>
            <Text className="text-sm text-gray-600">
              Customize your Aluuna experience
            </Text>
          </View>
        }
      />

      {/* Voice Settings Modal */}
      <VoiceSettings
        isVisible={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
        onSave={() => {
          setToast({
            visible: true,
            message: 'Voice settings saved successfully!',
            type: 'success',
          });
        }}
      />
    </SafeAreaView>
  );
} 