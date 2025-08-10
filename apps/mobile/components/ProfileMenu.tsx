import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  onMenuItemPress: (title: string) => void;
  onboardingSkipped?: boolean;
}

export function ProfileMenu({ 
  visible, 
  onClose, 
  onLogout, 
  onMenuItemPress,
  onboardingSkipped = false
}: ProfileMenuProps) {
  const profileMenuItems = [
    { title: 'Emotion Trends', icon: 'trending-up', color: '#8A318F' }, // purple-custom
    { title: 'Insights', icon: 'lightbulb', color: '#066285' }, // blue-custom
    { title: 'Mantras', icon: 'self-improvement', color: '#20B5C9' }, // teal-custom
    { title: 'Memory Profile', icon: 'psychology', color: '#A6E3E3' }, // green-custom
    { title: 'Relationships', icon: 'people', color: '#F7941D' }, // orange-custom
    { title: 'Feedback History', icon: 'feedback', color: '#8B5CF6' }, // purple
    { title: 'Settings', icon: 'settings', color: '#F9CB28' }, // yellow-custom
    ...(onboardingSkipped ? [{ title: 'Complete Onboarding', icon: 'assignment', color: '#EF4444' }] : []), // red for attention
    { title: 'Logout', icon: 'logout', color: '#374151' }, // keep original gray
  ];

  const handleMenuItemPress = (item: { title: string; icon: string; color: string }) => {
    onClose();
    if (item.title === 'Logout') {
      onLogout();
    } else {
      onMenuItemPress(item.title);
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="p-4 border-b border-gray-200">
        <Text className="text-xl font-semibold text-gray-800 mb-2">
          Profile
        </Text>
        <Text className="text-sm text-gray-600">
          Your account and preferences
        </Text>
      </View>

      <View className="flex-1">
        {profileMenuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            className={`flex-row items-center px-4 py-3 ${
              index !== profileMenuItems.length - 1
                ? 'border-b border-gray-100'
                : ''
            }`}
            onPress={() => handleMenuItemPress(item)}
          >
            <View 
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: item.color }}
            >
              <MaterialIcons
                name={item.icon as any}
                size={20}
                color="white"
              />
            </View>
            <Text className="text-gray-800 font-sans">{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
} 