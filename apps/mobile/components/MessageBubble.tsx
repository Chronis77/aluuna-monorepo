import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { MarkdownMessage } from './MarkdownMessage';
import { speechManager } from '../lib/speechManager';

interface MessageBubbleProps {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export function MessageBubble({ text, isUser, timestamp }: MessageBubbleProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const spinnerAnimation = useRef(new Animated.Value(0)).current;
  
  // Generate unique ID for this message bubble
  const messageId = useRef(`message-${Date.now()}-${Math.random()}`).current;
  
  // Wave animations for speaking state
  const wave1 = useRef(new Animated.Value(0.2)).current;
  const wave2 = useRef(new Animated.Value(0.3)).current;
  const wave3 = useRef(new Animated.Value(0.25)).current;
  const wave4 = useRef(new Animated.Value(0.4)).current;
  const wave5 = useRef(new Animated.Value(0.2)).current;

  // Cleanup effect to stop speech when component unmounts
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        speechManager.stop();
      }
    };
  }, [isSpeaking]);

  // Check if this message is currently being spoken
  useEffect(() => {
    const checkSpeakingStatus = () => {
      const currentlySpeaking = speechManager.isSpeaking(messageId);
      if (!currentlySpeaking && isSpeaking) {
        setIsSpeaking(false);
        stopWaveAnimation();
      }
    };

    const interval = setInterval(checkSpeakingStatus, 100);
    return () => clearInterval(interval);
  }, [isSpeaking, messageId]);

  const startSpinnerAnimation = () => {
    Animated.loop(
      Animated.timing(spinnerAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopSpinnerAnimation = () => {
    spinnerAnimation.stopAnimation();
    spinnerAnimation.setValue(0);
  };

  const startWaveAnimation = () => {
    const animateWaves = () => {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(wave1, { toValue: 0.8, duration: 300, useNativeDriver: true }),
          Animated.timing(wave1, { toValue: 0.2, duration: 300, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(wave2, { toValue: 0.6, duration: 400, useNativeDriver: true }),
          Animated.timing(wave2, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(wave3, { toValue: 0.9, duration: 350, useNativeDriver: true }),
          Animated.timing(wave3, { toValue: 0.25, duration: 350, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(wave4, { toValue: 0.7, duration: 320, useNativeDriver: true }),
          Animated.timing(wave4, { toValue: 0.4, duration: 320, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(wave5, { toValue: 0.5, duration: 380, useNativeDriver: true }),
          Animated.timing(wave5, { toValue: 0.2, duration: 380, useNativeDriver: true }),
        ]),
      ]).start(() => {
        if (isSpeaking) {
          animateWaves();
        }
      });
    };
    animateWaves();
  };

  const stopWaveAnimation = () => {
    Animated.parallel([
      Animated.timing(wave1, { toValue: 0.2, duration: 200, useNativeDriver: true }),
      Animated.timing(wave2, { toValue: 0.3, duration: 200, useNativeDriver: true }),
      Animated.timing(wave3, { toValue: 0.25, duration: 200, useNativeDriver: true }),
      Animated.timing(wave4, { toValue: 0.4, duration: 200, useNativeDriver: true }),
      Animated.timing(wave5, { toValue: 0.2, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const handleSpeak = async () => {
    if (isSpeaking || isLoading) {
      // Stop speaking if already speaking
      if (isSpeaking) {
        speechManager.stop();
        setIsSpeaking(false);
        stopWaveAnimation();
      }
      return;
    }

    try {
      setIsLoading(true);
      startSpinnerAnimation();

      // Start speaking with different voices for user vs AI
      await speechManager.speak(text, messageId, {
        isUser: isUser, // Pass the isUser parameter for different voices
        onStart: () => {
          setIsLoading(false);
          setIsSpeaking(true);
          stopSpinnerAnimation();
          startWaveAnimation();
        },
        onDone: () => {
          setIsSpeaking(false);
          stopWaveAnimation();
        },
        onError: (error) => {
          console.error('Speech error:', error);
          setIsLoading(false);
          setIsSpeaking(false);
          stopSpinnerAnimation();
          stopWaveAnimation();
        },
      });
    } catch (error) {
      console.error('Error starting speech:', error);
      setIsLoading(false);
      setIsSpeaking(false);
      stopSpinnerAnimation();
      stopWaveAnimation();
    }
  };

  return (
    <View className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-blue-custom rounded-br-md'
            : 'bg-gray-100 rounded-bl-md'
        }`}
      >
        {isUser ? (
          <MarkdownMessage text={text} color="#FFFFFF" />
        ) : (
          <MarkdownMessage text={text} color="#1F2937" />
        )}
        
        {/* Bottom row with timestamp and speaker icon */}
        <View className={`flex-row items-center justify-between mt-2 ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}>
          <Text
            className={`text-xs ${
              isUser ? 'text-blue-100' : 'text-gray-500'
            }`}
          >
            {timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          
                     {/* Speaker Icon */}
           <TouchableOpacity
             onPress={handleSpeak}
             className="-ml-1 p-1"
             disabled={isLoading}
             accessibilityLabel={isSpeaking ? "Stop speaking" : "Speak message"}
             accessibilityHint={isSpeaking ? "Double tap to stop speaking this message" : "Double tap to hear this message spoken aloud"}
           >
            {isLoading ? (
              <Animated.View
                style={{
                  transform: [{
                    rotate: spinnerAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['360deg', '0deg'],
                    }),
                  }],
                }}
              >
                <MaterialIcons 
                  name="sync" 
                  size={16} 
                  color={isUser ? '#BFDBFE' : '#6B7280'} 
                />
              </Animated.View>
                         ) : isSpeaking ? (
               <View className="flex-row items-center">
                 <Animated.View
                   className="w-0.5 rounded-full h-3"
                   style={{
                     transform: [{ scaleY: wave1 }],
                     backgroundColor: isUser ? '#BFDBFE' : '#6B7280',
                   }}
                 />
                 <Animated.View
                   className="w-0.5 rounded-full h-4"
                   style={{
                     transform: [{ scaleY: wave2 }],
                     backgroundColor: isUser ? '#BFDBFE' : '#6B7280',
                     marginLeft: 2,
                   }}
                 />
                 <Animated.View
                   className="w-0.5 rounded-full h-3"
                   style={{
                     transform: [{ scaleY: wave3 }],
                     backgroundColor: isUser ? '#BFDBFE' : '#6B7280',
                     marginLeft: 2,
                   }}
                 />
                  <Animated.View
                    className="w-0.5 rounded-full h-4"
                    style={{
                      transform: [{ scaleY: wave4 }],
                      backgroundColor: isUser ? '#BFDBFE' : '#6B7280',
                      marginLeft: 2,
                    }}
                  />
                  <Animated.View
                    className="w-0.5 rounded-full h-3"
                    style={{
                      transform: [{ scaleY: wave5 }],
                      backgroundColor: isUser ? '#BFDBFE' : '#6B7280',
                      marginLeft: 2,
                    }}
                  />
               </View>
            ) : (
              <MaterialIcons 
                name="volume-up" 
                size={16} 
                color={isUser ? '#BFDBFE' : '#6B7280'} 
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
