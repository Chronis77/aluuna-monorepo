import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { FeedbackService } from '../lib/feedbackService';
import { ThreeDotLoader } from './ThreeDotLoader';
import { Toast } from './ui/Toast';
import { VoiceInput } from './VoiceInput';

const { width: screenWidth } = Dimensions.get('window');
const MODAL_WIDTH = screenWidth * 0.9;

interface FeedbackFormProps {
  visible: boolean;
  onClose: () => void;
}

export function FeedbackForm({ visible, onClose }: FeedbackFormProps) {
  const { session } = useAuth();
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    textInputRef.current?.blur();
  };

  const handleVoiceTranscription = (text: string) => {
    setFeedbackText(prev => prev + (prev ? ' ' : '') + text);
    setIsRecording(false);
  };

  const handleVoiceError = (message: string) => {
    setToast({
      visible: true,
      message,
      type: 'error',
    });
    setIsRecording(false);
  };

  const handleVoiceInfo = (message: string) => {
    setToast({
      visible: true,
      message,
      type: 'info',
    });
  };

  const handleVoiceCancel = () => {
    setIsRecording(false);
  };

  const handleVoiceStart = () => {
    setIsRecording(true);
  };

  const handleSubmit = async () => {
    if (!feedbackText.trim() || !session?.user?.id) {
      setToast({
        visible: true,
        message: 'Please enter your feedback before submitting.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await FeedbackService.submitFeedback(session.user.id, {
        rawFeedback: feedbackText.trim(),
        feedbackType: 'general'
      });

      setToast({
        visible: true,
        message: 'Thank you for your feedback! We\'ll review it shortly.',
        type: 'success',
      });

      // Clear form and close after success
      setTimeout(() => {
        setFeedbackText('');
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      setToast({
        visible: true,
        message: 'Failed to submit feedback. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (feedbackText.trim()) {
      Alert.alert(
        'Discard Feedback?',
        'You have unsaved feedback. Are you sure you want to close?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              setFeedbackText('');
              onClose();
            }
          }
        ]
      );
    } else {
      onClose();
    }
  };

  const onToastHide = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Animation effects
  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(-100);
      
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <Animated.View 
        className="flex-1 justify-center items-center"
        style={{
          backgroundColor: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.5)'],
          }),
        }}
      >
        <Animated.View 
          className="bg-white rounded-lg mx-4 max-w-[90%] max-h-[80%]"
          style={{
            transform: [{
              translateY: slideAnim,
            }],
          }}
        >
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={onToastHide}
        />

        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={handleClose}>
            <MaterialIcons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          
          <Text className="text-lg font-heading text-gray-800">
            Send Feedback
          </Text>
          
          <View className="w-6" />
        </View>

        {/* Content */}
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View className="p-4">
              {/* Logo */}
              <View className="items-center mb-6">
                <Image
                  source={require('../assets/images/logo.png')}
                  className="max-w-[180px] h-[50px] max-h-[50px]"
                  resizeMode="contain"
                  fadeDuration={0}
                />
              </View>

              {/* Instructions */}
              <View className="mb-6">
                <Text className="text-lg font-heading text-gray-800 mb-2 text-center">
                  Help us improve Aluuna
                </Text>
                <Text className="text-gray-600 leading-6 text-center font-sans">
                  Share your thoughts, report bugs, or suggest new features. 
                  Your feedback helps us create a better experience for everyone.
                </Text>
              </View>

              {/* Feedback Input */}
              <View className="h-40 mb-4">
                <Text className="text-sm font-input text-gray-700 mb-2">
                  Your Feedback
                </Text>
                
                <View className="flex-1 border border-gray-300 rounded-lg bg-gray-50">
                  <TextInput
                    ref={textInputRef}
                    className="flex-1 px-4 py-3 text-base text-gray-800 font-sans"
                    placeholder="Describe your feedback, bug report, or feature request..."
                    value={feedbackText}
                    onChangeText={setFeedbackText}
                    multiline
                    textAlignVertical="top"
                    maxLength={2000}
                    editable={!isRecording}
                  />
                  
                  {/* Character count */}
                  <View className="px-4 py-2 border-t border-gray-200 bg-gray-100">
                    <Text className="text-xs text-gray-500 text-right font-sans">
                      {feedbackText.length}/2000 characters
                    </Text>
                  </View>
                </View>
              </View>

              {/* Input Controls - Right aligned with explicit spacing */}
              <View className="flex-row items-center justify-end mb-4">
                <VoiceInput
                  onTranscription={handleVoiceTranscription}
                  onError={handleVoiceError}
                  onInfo={handleVoiceInfo}
                  onCancel={handleVoiceCancel}
                  onStart={handleVoiceStart}
                  disabled={isSubmitting}
                />

                <View className="w-2" />

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isSubmitting || !feedbackText.trim()}
                  className={`w-12 h-12 rounded-full items-center justify-center ${
                    isSubmitting || !feedbackText.trim() 
                      ? 'bg-gray-400' 
                      : 'bg-blue-custom active:bg-blue-active'
                  }`}
                >
                  {isSubmitting ? (
                    <ThreeDotLoader size={4} color="white" speed={500} />
                  ) : (
                    <MaterialIcons name="send" size={20} color="white" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Tips */}
              <View className="p-4 bg-blue-50 rounded-lg">
                <Text className="text-sm font-input text-blue-800 mb-2">
                  💡 Tips for better feedback:
                </Text>
                <Text className="text-sm text-blue-700 leading-5 font-sans">
                  • Be specific about what happened{'\n'}
                  • Include steps to reproduce bugs{'\n'}
                  • Mention your device and app version{'\n'}
                  • Share your thoughts on new features
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
} 