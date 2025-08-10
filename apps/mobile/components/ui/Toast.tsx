import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { config } from '../../lib/config';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
}

export function Toast({ 
  visible, 
  message, 
  type = 'info', 
  duration = config.ui.toastDuration, 
  onHide 
}: ToastProps) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(false);
  const [bottomInset, setBottomInset] = useState(0);
  
  // Get safe area insets in a useEffect to avoid render-time issues
  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    setBottomInset(insets.bottom);
  }, [insets.bottom]);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      // Show snackbar
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onHide();
    });
  };

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10B981',
          icon: 'check-circle',
          iconColor: '#FFFFFF',
        };
      case 'error':
        return {
          backgroundColor: '#F7941D',
          icon: 'error',
          iconColor: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: '#EFF6FF',
          icon: 'info',
          iconColor: '#066285',
        };
    }
  };

  const styles = getToastStyles();

  if (!isVisible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: bottomInset,
        left: 0,
        right: 0,
        zIndex: 9999,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <View
        className="flex-row items-center px-4 py-3"
        style={{
          backgroundColor: styles.backgroundColor,
        }}
      >
        <MaterialIcons
          name={styles.icon as any}
          size={20}
          color={styles.iconColor}
          style={{ marginRight: 12 }}
        />
        <Text
          className="flex-1 font-input text-sm"
          style={{
            color: type === 'error' ? '#FFFFFF' : type === 'success' ? '#065F46' : '#1E40AF',
          }}
        >
          {message}
        </Text>
        <Pressable 
          onPress={hideToast} 
          className="ml-3 p-1 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <MaterialIcons 
            name="close" 
            size={18} 
            color={type === 'error' ? '#FFFFFF' : type === 'success' ? '#065F46' : '#1E40AF'} 
          />
        </Pressable>
      </View>
    </Animated.View>
  );
} 