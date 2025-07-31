import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

interface SkipWarningModalProps {
  visible: boolean;
  onConfirmSkip: () => void;
  onCancel: () => void;
}

export const SkipWarningModal: React.FC<SkipWarningModalProps> = ({
  visible,
  onConfirmSkip,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black bg-opacity-50 justify-center items-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
          <Text className="text-xl font-heading text-gray-800 mb-4 text-center">
            Skip Onboarding?
          </Text>
          
          <Text className="text-sm text-gray-600 leading-6 mb-6 text-center">
            We strongly recommend completing this questionnaire as it helps us understand you better and provide more personalized support. However, you can skip for now and complete it later through multiple sessions.
          </Text>
          
          <View className="space-y-3">
            <TouchableOpacity
              onPress={onConfirmSkip}
              className="bg-orange-custom py-3 rounded-xl mb-3"
            >
              <Text className="text-white font-medium text-center">
                Skip for Now
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onCancel}
              className="bg-gray-100 py-3 rounded-xl"
            >
              <Text className="text-gray-700 font-medium text-center">
                Continue Onboarding
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}; 