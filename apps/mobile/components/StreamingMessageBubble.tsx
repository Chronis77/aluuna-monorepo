import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface StreamingMessageBubbleProps {
  text: string;
  isUser: boolean;
  isStreaming?: boolean;
  onStreamingComplete?: () => void;
}

export const StreamingMessageBubble: React.FC<StreamingMessageBubbleProps> = ({
  text,
  isUser,
  isStreaming = false,
  onStreamingComplete
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const cursorAnimation = useRef(new Animated.Value(0)).current;

  // Typing animation effect
  useEffect(() => {
    if (isStreaming && currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.substring(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 30); // Adjust speed here (lower = faster)

      return () => clearTimeout(timer);
    } else if (isStreaming && currentIndex >= text.length) {
      // Streaming complete
      onStreamingComplete?.();
    }
  }, [currentIndex, text, isStreaming, onStreamingComplete]);

  // Cursor blinking animation
  useEffect(() => {
    if (isStreaming) {
      const blinkAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(cursorAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
        ])
      );
      blinkAnimation.start();

      return () => blinkAnimation.stop();
    }
  }, [isStreaming, cursorAnimation]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  const containerStyle = [
    styles.container,
    isUser ? styles.userContainer : styles.aiContainer,
  ];

  const textStyle = [
    styles.text,
    isUser ? styles.userText : styles.aiText,
  ];

  const cursorOpacity = cursorAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={containerStyle}>
      <View style={styles.messageContainer}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <MaterialIcons name="psychology" size={20} color="#6366f1" />
          </View>
        )}
        
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <View style={styles.textContainer}>
            <Text style={textStyle}>
              {displayedText}
              {isStreaming && currentIndex < text.length && (
                <Animated.Text style={[styles.cursor, { opacity: cursorOpacity }]}>
                  |
                </Animated.Text>
              )}
            </Text>
            {isStreaming && currentIndex < text.length && (
              <View style={styles.inlineTypingIndicator}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '100%',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  userBubble: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  aiText: {
    color: '#1f2937',
  },
  cursor: {
    color: '#6366f1',
    fontWeight: 'bold',
  },
  inlineTypingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    marginTop: 0,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9ca3af',
    marginHorizontal: 2,
    opacity: 0.6,
  },
}); 