import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AluunaLoader } from '../components/AluunaLoader';
import { Toast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { FeedbackService } from '../lib/feedbackService';
import { Feedback } from '../types/database';
import { ProfileMenu } from '../components/ProfileMenu';
import { trpcClient } from '../lib/trpcClient';

export default function FeedbackHistoryScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  // Profile menu state/animation
  const { width: screenWidth } = Dimensions.get('window');
  const PROFILE_MENU_WIDTH = screenWidth * 0.6;
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuTranslateX = useRef(new Animated.Value(screenWidth)).current;

  const toggleProfileMenu = () => {
    const toValue = isProfileMenuOpen ? screenWidth : 0;
    Animated.spring(profileMenuTranslateX, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleMenuItemPress = (title: string) => {
    if (title === 'Memory Profile') router.push('/memory-profile' as any);
    else if (title === 'Insights') router.push('/insights' as any);
    else if (title === 'Mantras') router.push('/mantras' as any);
    else if (title === 'Daily Practices') router.push('/daily-practices' as any);
    else if (title === 'Goals') router.push('/goals' as any);
    else if (title === 'Relationships') router.push('/relationships' as any);
    else if (title === 'Feedback History') router.push('/feedback-history' as any);
    else if (title === 'Settings') router.push('/settings' as any);
    else {
      setToast({ visible: true, message: `${title} feature coming soon!`, type: 'info' });
    }
  };

  const handleLogout = async () => {
    try {
      await trpcClient.signOut();
      router.replace('/login' as any);
    } catch (error) {
      setToast({ visible: true, message: 'Error during logout', type: 'error' });
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      loadFeedback();
    }
  }, [session?.user?.id]);

  const loadFeedback = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const userFeedback = await FeedbackService.getUserFeedback(session.user.id);
      setFeedback(userFeedback);
    } catch (error) {
      console.error('Error loading feedback:', error);
      setToast({
        visible: true,
        message: 'Failed to load feedback history.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFeedback();
    setIsRefreshing(false);
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'critical': return '#EF4444';
      case 'high': return '#F97316';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#10B981';
      case 'processed': return '#3B82F6';
      case 'pending': return '#F59E0B';
      case 'ignored': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderFeedbackItem = ({ item }: { item: Feedback }) => (
    <View className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
      {/* Header */}
      <View className="flex-row items-center mb-3">
        <View 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: getPriorityColor(item.priority) }}
        />
        <View className="ml-2">
          <Text className="text-sm font-medium text-gray-800 capitalize">
            {item.priority || 'unknown'} priority
          </Text>
        </View>
        <View 
          className="px-2 py-1 rounded-full ml-auto"
          style={{ backgroundColor: getStatusColor(item.status) + '20' }}
        >
          <Text 
            className="text-xs font-medium capitalize"
            style={{ color: getStatusColor(item.status) }}
          >
            {item.status}
          </Text>
        </View>
      </View>

      {/* Feedback Type */}
      <View className="mb-3">
        <Text className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Type
        </Text>
        <Text className="text-sm text-gray-800 capitalize">
          {item.feedback_type.replace('_', ' ')}
        </Text>
      </View>

      {/* AI Summary */}
      {item.ai_summary && (
        <View className="mb-3">
          <Text className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Summary
          </Text>
          <Text className="text-sm text-gray-700 leading-5">
            {item.ai_summary}
          </Text>
        </View>
      )}

      {/* Raw Feedback */}
      <View className="mb-3">
        <Text className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Your Feedback
        </Text>
        <Text className="text-sm text-gray-800 leading-5">
          {item.raw_feedback.length > 200 
            ? item.raw_feedback.substring(0, 200) + '...'
            : item.raw_feedback
          }
        </Text>
      </View>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <View className="flex-row flex-wrap mb-3">
          {item.tags.map((tag, index) => (
            <View 
              key={index}
              className="bg-gray-100 px-2 py-1 rounded-full mr-2 mb-1"
            >
              <Text className="text-xs text-gray-600">
                {tag}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Date at bottom */}
      <View className="border-t border-gray-100 pt-2">
        <Text className="text-xs text-gray-500 text-left">
          {formatDate(item.created_at)}
        </Text>
      </View>
    </View>
  );

  const onToastHide = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Image
          source={require('../assets/images/logo.png')}
          className="w-[200px] h-[60px] mb-8"
          resizeMode="contain"
        />
        <AluunaLoader 
          message="Loading your feedback..." 
          size="large" 
          showMessage={true}
        />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={onToastHide}
      />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.replace('/conversation' as any)} className="mr-2">
          <Image
            source={require('../assets/images/logo-square-small.png')}
            style={{ width: 40, height: 40, borderRadius: 6 }}
          />
        </TouchableOpacity>
        
        <Text className="text-lg font-semibold text-gray-800">
          Feedback History
        </Text>

        <View className="flex-row">
          <TouchableOpacity onPress={toggleProfileMenu}>
            <MaterialIcons name="account-circle" size={28} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1">
        {feedback.length === 0 ? (
          <View className="flex-1 justify-center items-center px-6">
            <MaterialIcons name="feedback" size={64} color="#D1D5DB" />
            <Text className="text-lg font-medium text-gray-600 mt-4 mb-2">
              No feedback yet
            </Text>
            <Text className="text-gray-500 text-center leading-6">
              Your feedback helps us improve Aluuna. 
              Tap the bug icon in the main screen to share your thoughts.
            </Text>
          </View>
        ) : (
          <FlatList
            data={feedback}
            renderItem={renderFeedbackItem}
            keyExtractor={(item) => item.id}
            className="flex-1 p-4"
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={['#3B82F6']}
                tintColor="#3B82F6"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      {/* Profile Menu */}
      <Animated.View
        className="absolute top-0 bottom-0 right-0 bg-white shadow-lg"
        style={{
          width: PROFILE_MENU_WIDTH,
          transform: [{ translateX: profileMenuTranslateX }],
          zIndex: 60,
        }}
      >
        <ProfileMenu
          visible={isProfileMenuOpen}
          onClose={toggleProfileMenu}
          onLogout={handleLogout}
          onMenuItemPress={handleMenuItemPress}
        />
      </Animated.View>

      {/* Overlay for profile menu */}
      {isProfileMenuOpen && (
        <TouchableOpacity
          className="absolute inset-0"
          activeOpacity={1}
          onPress={toggleProfileMenu}
          style={{ backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 50 }}
        />
      )}
    </SafeAreaView>
  );
} 