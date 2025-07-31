// components/ui/StyledInput.tsx
import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';

interface StyledInputProps extends TextInputProps {
  maxWidth?: string;
  right?: React.ReactNode;
}

export function StyledInput({ maxWidth, right, ...props }: StyledInputProps) {
  return (
    <View style={{ position: 'relative', flex: 1 }}>
      <TextInput
        {...props}
        className={`border border-gray-300 rounded-lg px-4 py-3 mt-3 mb-0 text-base font-heading ${maxWidth ? `max-w-[${maxWidth}]` : ''}`}
        style={[{ flex: 1, alignSelf: 'stretch', textAlignVertical: 'center', minHeight: 50, paddingTop: 5, paddingBottom: 12 }, right ? { paddingRight: 40 } : undefined]}
        placeholderTextColor="#9CA3AF"
      />
      {right && (
        <View style={{ position: 'absolute', right: 12, top: '61%', transform: [{ translateY: -12 }] }}>
          {right}
        </View>
      )}
    </View>
  );
}