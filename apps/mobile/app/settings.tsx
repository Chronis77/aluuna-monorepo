import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
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
import { trpcClient } from '../lib/trpcClient';
import { voicePreferencesService } from '../lib/voicePreferencesService';
import { ProfileMenu } from '../components/ProfileMenu';
import { Dimensions } from 'react-native';

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
  const [useServerTts, setUseServerTts] = useState(false);
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

  // Profile menu state/animation
  const { width: screenWidth } = Dimensions.get('window');
  const PROFILE_MENU_WIDTH = screenWidth * 0.6;
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuTranslateX = useRef(new Animated.Value(screenWidth)).current;

  const toggleProfileMenu = () => {
    const toValue = isProfileMenuOpen ? screenWidth : 0;
    Animated.spring(profileMenuTranslateX, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleMenuItemPress = (title: string) => {
    if (title === 'Memory Profile') router.push('/memory-profile' as any);
    else if (title === 'Insights') router.push('/insights' as any);
    else if (title === 'Mantras') router.push('/mantras' as any);
    else if (title === 'Relationships') router.push('/relationships' as any);
    else if (title === 'Feedback History') router.push('/feedback-history' as any);
    else if (title === 'Settings') router.push('/settings' as any);
    else {
      setToast({ visible: true, message: `${title} feature coming soon!`, type: 'info' });
    }
  };

  // Note: logout handler is defined below with confirmation prompt

  // Initialize the settings screen
  useEffect(() => {
    initializeSettings();
  }, []);

  const initializeSettings = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const user = await trpcClient.getCurrentUser();
      if (!user) {
        router.replace('/login' as any);
        return;
      }
      
      setCurrentUserId(user.id);

      // Load current settings
      setUseServerTts(speechManager.isUsingServerTts());
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

  const handleToggleServerTts = async (value: boolean) => {
    try {
      setUseServerTts(value);
      speechManager.setUseServerTts(value);
      
      if (value) {
        Alert.alert(
          'Enhanced TTS Enabled',
          'Enhanced TTS now routes through the Aluuna server using OpenAI TTS for higher-quality, consistent speech.',
          [{ text: 'OK' }]
        );
      }
      
      setToast({
        visible: true,
        message: `Enhanced TTS ${value ? 'enabled' : 'disabled'}.`,
        type: 'success',
      });
    } catch (error) {
      console.error('Error toggling server TTS:', error);
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
              const user = await trpcClient.getCurrentUser();
              if (user) {
                await trpcClient.deleteOnboardingProgress(user.id);
                console.log('✅ Onboarding data cleared on logout');
              }
              
              await trpcClient.signOut();
              router.replace('/login' as any);
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
                await trpcClient.deleteUserData(currentUserId);
              }
              
              setToast({
                visible: true,
                message: 'All data cleared successfully.',
                type: 'success',
              });
              
                    // Navigate back to conversation screen
      router.replace('/conversation' as any);
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
    // {
    //   id: 'dialogue-mode',
    //   title: 'Dialogue Mode',
    //   subtitle: dialogueMode ? 'Auto-send & speak' : 'Manual send',
    //   icon: 'forum',
    //   iconColor: '#10B981',
    //   type: 'toggle',
    //   value: dialogueMode,
    //   onToggle: handleToggleDialogueMode,
    // },
    // {
    //   id: 'enhanced-tts',
    //   title: 'Enhanced TTS',
    //   subtitle: 'Use advanced speech synthesis for better voice quality',
    //   icon: 'psychology',
    //   iconColor: '#10B981',
    //   type: 'toggle',
    //   value: useServerTts,
    //   onToggle: handleToggleServerTts,
    // },
    // {
    //   id: 'audio-routing',
    //   title: 'Audio Output',
    //   subtitle: useEarpiece ? 'Use earpiece when phone is near ear' : 'Always use speaker',
    //   icon: 'volume-up',
    //   iconColor: '#F59E0B',
    //   type: 'toggle',
    //   value: useEarpiece,
    //   onToggle: handleToggleEarpiece,
    // },
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
      onPress: () => {
        setToast({
          visible: true,
          message: 'Clear All Data coming soon!',
          type: 'info',
        });
      },
    },
    // {
    //   id: 'clear-data',
    //   title: 'Clear All Data',
    //   subtitle: 'Permanently delete all your data',
    //   icon: 'delete-forever',
    //   iconColor: '#DC2626',
    //   type: 'action',
    //   onPress: handleClearData,
    // },
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

        <View className="flex-row">
          <TouchableOpacity onPress={toggleProfileMenu}>
            <MaterialIcons name="account-circle" size={28} color="#374151" />
          </TouchableOpacity>
        </View>
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

      {/* Profile Menu */}
      <Animated.View
        className="absolute top-0 bottom-0 right-0 bg-white shadow-lg"
        style={{
          width: PROFILE_MENU_WIDTH,
          transform: [{ translateX: profileMenuTranslateX }],
          zIndex: 60,
        }}
      >
        <ProfileMenu
          visible={isProfileMenuOpen}
          onClose={toggleProfileMenu}
          onLogout={handleLogout}
          onMenuItemPress={handleMenuItemPress}
        />
      </Animated.View>

      {/* Overlay for profile menu */}
      {isProfileMenuOpen && (
        <TouchableOpacity
          className="absolute inset-0"
          activeOpacity={1}
          onPress={toggleProfileMenu}
          style={{ backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 50 }}
        />
      )}
    </SafeAreaView>
  );
} 