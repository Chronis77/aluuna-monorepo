import React from 'react';
import { View } from 'react-native';
import { ThreeDotLoader } from './ThreeDotLoader';

interface ThinkingIndicatorProps {
  visible: boolean;
}

export function ThinkingIndicator({ visible }: ThinkingIndicatorProps) {
  if (!visible) return null;

  return (
    <View className="mb-4 items-start px-5">
      <View className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
        <ThreeDotLoader size={4} color="#6B7280" speed={600} />
      </View>
    </View>
  );
} 