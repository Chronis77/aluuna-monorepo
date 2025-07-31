import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

interface ThreeDotLoaderProps {
  size?: number;
  color?: string;
  speed?: number;
}

export function ThreeDotLoader({ 
  size = 6, 
  color = 'white', 
  speed = 600 
}: ThreeDotLoaderProps) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: speed / 2,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: speed / 2,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation1 = createAnimation(dot1, 0);
    const animation2 = createAnimation(dot2, speed / 3);
    const animation3 = createAnimation(dot3, (speed / 3) * 2);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, [dot1, dot2, dot3, speed]);

  const dotStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    marginHorizontal: size / 3,
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Animated.View
        style={[
          dotStyle,
          {
            transform: [
              {
                translateY: dot1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -size * 1.5],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          dotStyle,
          {
            transform: [
              {
                translateY: dot2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -size * 1.5],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          dotStyle,
          {
            transform: [
              {
                translateY: dot3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -size * 1.5],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
} 