import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

interface AluunaLoaderProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  showMessage?: boolean;
  containerClassName?: string;
  messageClassName?: string;
}

export function AluunaLoader({ 
  message = 'Loading...', 
  size = 'medium',
  showMessage = true,
  containerClassName = '',
  messageClassName = ''
}: AluunaLoaderProps) {
  const bounce1 = useRef(new Animated.Value(0)).current;
  const bounce2 = useRef(new Animated.Value(0)).current;
  const bounce3 = useRef(new Animated.Value(0)).current;
  const bounce4 = useRef(new Animated.Value(0)).current;
  const bounce5 = useRef(new Animated.Value(0)).current;
  const bounce6 = useRef(new Animated.Value(0)).current;
  
  const rotate1 = useRef(new Animated.Value(0)).current;
  const rotate2 = useRef(new Animated.Value(0)).current;
  const rotate3 = useRef(new Animated.Value(0)).current;
  const rotate4 = useRef(new Animated.Value(0)).current;
  const rotate5 = useRef(new Animated.Value(0)).current;
  const rotate6 = useRef(new Animated.Value(0)).current;

  // Size configurations
  const sizeConfig = {
    small: { dotSize: 6, spacing: 2 },
    medium: { dotSize: 8, spacing: 3 },
    large: { dotSize: 12, spacing: 4 }
  };

  const config = sizeConfig[size];

  useEffect(() => {
    // Quirky bouncing animations for each dot with different delays
    const createQuirkyAnimation = (bounce: Animated.Value, rotate: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(bounce, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(rotate, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(bounce, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(rotate, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    };

    const anim1 = createQuirkyAnimation(bounce1, rotate1, 0);
    const anim2 = createQuirkyAnimation(bounce2, rotate2, 67);
    const anim3 = createQuirkyAnimation(bounce3, rotate3, 134);
    const anim4 = createQuirkyAnimation(bounce4, rotate4, 201);
    const anim5 = createQuirkyAnimation(bounce5, rotate5, 268);
    const anim6 = createQuirkyAnimation(bounce6, rotate6, 335);

    anim1.start();
    anim2.start();
    anim3.start();
    anim4.start();
    anim5.start();
    anim6.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
      anim4.stop();
      anim5.stop();
      anim6.stop();
    };
  }, [bounce1, bounce2, bounce3, bounce4, bounce5, bounce6, rotate1, rotate2, rotate3, rotate4, rotate5, rotate6]);

  // Use exact colors from tailwind config
  const aluunaColors = ['#8A318F', '#066285', '#20B5C9', '#A6E3E3', '#F7941D', '#F9CB28'];
  const renderDot = (index: number, bounce: Animated.Value, rotate: Animated.Value) => {
    return (
      <Animated.View
        key={index}
        style={{
          width: config.dotSize,
          height: config.dotSize,
          borderRadius: config.dotSize / 2,
          backgroundColor: aluunaColors[index],
          marginHorizontal: config.spacing / 2,
          transform: [
            {
              translateY: bounce.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -config.dotSize * 1.5],
              }),
            },
            {
              rotate: rotate.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
            {
              scale: bounce.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1.2, 1],
              }),
            },
          ],
        }}
      />
    );
  };

  const isHorizontal = containerClassName.includes('flex-row');
  
  return (
    <View className={`${isHorizontal ? 'flex-row items-center' : 'items-center justify-center'} ${containerClassName}`}>
      {/* Animated Loading Indicator */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {renderDot(0, bounce1, rotate1)}
        {renderDot(1, bounce2, rotate2)}
        {renderDot(2, bounce3, rotate3)}
        {renderDot(3, bounce4, rotate4)}
        {renderDot(4, bounce5, rotate5)}
        {renderDot(5, bounce6, rotate6)}
      </View>

      {/* Loading Message */}
      {showMessage && (
        <Text className={`text-base font-heading text-gray-700 ${isHorizontal ? '' : 'mt-4 text-center'} ${messageClassName}`}>
          {message}
        </Text>
      )}
    </View>
  );
} 