// components/ui/StyledButton.tsx
import { ButtonProps, Text, TouchableOpacity, View } from 'react-native';

interface StyledButtonProps extends ButtonProps {
  maxWidth?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function StyledButton(props: StyledButtonProps) {
  const { maxWidth, variant = 'primary', size = 'md', title, onPress, ...buttonProps } = props;
  
  // Define variant styles
  const variantStyles = {
    primary: 'bg-blue-custom active:bg-blue-active',
    secondary: 'bg-gray-500 active:bg-gray-600',
    outline: 'bg-transparent border border-blue-500'
  };
  
  // Define size styles
  const sizeStyles = {
    sm: 'py-2 px-4',
    md: 'py-3 px-6',
    lg: 'py-4 px-8'
  };
  
  // Use TouchableOpacity for better styling control
  return (
    <View className={`w-full min-w-[200px] mt-2 mb-2 ${maxWidth ? `max-w-[${maxWidth}]` : ''}`}>
      <TouchableOpacity
        className={`${variantStyles[variant]} ${sizeStyles[size]} rounded-lg items-center justify-center`}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text className={`font-semibold text-center ${
          variant === 'outline' ? 'text-blue-500' : 'text-white'
        }`}>
          {title}
        </Text>
      </TouchableOpacity>
    </View>
  );
}