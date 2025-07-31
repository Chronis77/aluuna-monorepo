import { Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  const getFontClass = () => {
    switch (type) {
      case 'title':
        return 'text-3xl font-heading';
      case 'subtitle':
        return 'text-xl font-heading';
      case 'defaultSemiBold':
        return 'text-base font-semibold';
      case 'link':
        return 'text-base text-blue-600';
      default:
        return 'text-base font-sans';
    }
  };

  return (
    <Text
      className={getFontClass()}
      style={[{ color }, style]}
      {...rest}
    />
  );
}


