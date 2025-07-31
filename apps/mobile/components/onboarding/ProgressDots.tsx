import React from 'react';
import { TouchableOpacity, View } from 'react-native';

interface ProgressDotsProps {
  currentStep: number;
  totalSteps: number;
  onStepPress: (step: number) => void;
}

export const ProgressDots: React.FC<ProgressDotsProps> = ({
  currentStep,
  totalSteps,
  onStepPress,
}) => {
  // Color progression from purple to yellow (ascending brightness)
  const colors = [
    'bg-purple-custom', // purple
    'bg-blue-custom', // blue
    'bg-teal-custom', // teal
    'bg-green-custom', // green
    'bg-orange-custom', // orange
    'bg-yellow-custom', // yellow
  ];

  // Border colors matching the dot colors
  const borderColors = [
    'border-purple-custom',
    'border-blue-custom',
    'border-teal-custom',
    'border-green-custom',
    'border-orange-custom',
    'border-yellow-custom',
  ];

  return (
    <View className="flex-row justify-center items-center space-x-4 pt-2 pb-6">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const colorIndex = index % colors.length;
        
        return (
          <TouchableOpacity
            key={stepNumber}
            onPress={() => onStepPress(stepNumber)}
            className={`w-4 h-4 mr-2 rounded-full border-2 ${
              isCurrent
                ? `${colors[colorIndex]} border-2 border-white`
                : isCompleted
                ? `${colors[colorIndex]} border-2 border-white`
                : 'bg-white border-2 border-white'
            }`}
            style={{
              borderWidth: 2,
              borderRadius: 8,
            }}
          />
        );
      })}
    </View>
  );
}; 