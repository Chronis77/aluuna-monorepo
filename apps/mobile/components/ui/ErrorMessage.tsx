import React from 'react';
import { Text, View } from 'react-native';

interface ErrorMessageProps {
  message?: string;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className = '' }) => {
  if (!message) return null;
  return (
    <View className={`w-full ${className}`}>
      <Text className="text-orange-custom mt-1 mb-2 ml-2">
        {message}
      </Text>
    </View>
  );
};

