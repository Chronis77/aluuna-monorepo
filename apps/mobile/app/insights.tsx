import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AluunaLoader } from '../components/AluunaLoader';
import { Toast } from '../components/ui/Toast';
import { MemoryProcessingService } from '../lib/memoryProcessingService';
import { trpcClient } from '../lib/trpcClient';
import { useAuth } from '../context/AuthContext';
import { ProfileMenu } from '../components/ProfileMenu';
import { Dimensions } from 'react-native';

interface Insight {
  id: string;
  insight_text: string;
  related_theme: string | null;
  importance: number;
  created_at: string;
}

export default function InsightsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingInsight, setEditingInsight] = useState<Insight | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editText, setEditText] = useState('');
  const [editImportance, setEditImportance] = useState('5');
  const [isSaving, setIsSaving] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
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

  // Initialize the insights screen
  useEffect(() => {
    initializeInsights();
  }, []);

  const initializeInsights = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      if (!session?.token) {
        console.log('⚠️ No session token found, redirecting to login');
        router.replace('/login' as any);
        return;
      }
      
      const user = await trpcClient.getCurrentUser(session.token);
      if (!user) {
        console.log('⚠️ No user found, redirecting to login');
        router.replace('/login' as any);
        return;
      }
      
      setCurrentUserId(user.id);

      // Load insights
      await loadInsights(user.id);

    } catch (error) {
      console.error('Error initializing insights:', error);
      setToast({
        visible: true,
        message: 'Failed to load insights. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadInsights = async (userId: string) => {
    try {
      console.log('🔄 Loading insights for user:', userId);
      const insightsData = await MemoryProcessingService.getUserInsights(userId, 100);
      // Ensure we always set an array, even if the response is undefined
      setInsights(insightsData || []);
      console.log('🔄 Loaded insights:', (insightsData || []).length);
    } catch (error) {
      console.error('❌ Error loading insights:', error);
      // Set empty array on error to prevent filter issues
      setInsights([]);
      setToast({
        visible: true,
        message: 'Failed to load insights. Please try again.',
        type: 'error',
      });
    }
  };

  const handleEditInsight = (insight: Insight) => {
    setEditingInsight(insight);
    setEditText(insight.insight_text);
    setEditImportance(insight.importance.toString());
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingInsight || !currentUserId || !editText.trim()) return;

    setIsSaving(true);
    try {
      console.log('✏️ Attempting to edit insight:', editingInsight.id);
      console.log('✏️ New text:', editText.trim());
      console.log('✏️ New importance:', editImportance);
      
      const importance = parseInt(editImportance) || 5;
      
      const result = await trpcClient.updateInsight(editingInsight.id, editText.trim(), importance);

      console.log('✏️ Insight update result:', result);
      if (!result.success) throw new Error('Failed to update insight');
      console.log('✅ Insight updated successfully');

      console.log('✅ Edit operation completed, reloading data...');

      // Reload insights first to ensure the edit was successful
      await loadInsights(currentUserId);

      console.log('✅ Data reloaded, showing success message');

      setToast({
        visible: true,
        message: 'Insight updated successfully.',
        type: 'success',
      });

    } catch (error) {
      console.error('❌ Error updating insight:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setToast({
        visible: true,
        message: `Failed to update insight: ${errorMessage}`,
        type: 'error',
      });
    } finally {
      setIsSaving(false);
      setEditModalVisible(false);
      setEditingInsight(null);
      setEditText('');
      setEditImportance('5');
    }
  };

  const handleDeleteInsight = (insight: Insight) => {
    Alert.alert(
      'Delete Insight',
      'Are you sure you want to delete this insight? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => performDelete(insight) }
      ]
    );
  };

  const performDelete = async (insight: Insight) => {
    if (!currentUserId) return;

    try {
      console.log('🗑️ Attempting to delete insight:', insight.id);
      
      const result = await trpcClient.deleteInsight(insight.id);

      console.log('🗑️ Insight delete result:', result);
      if (!result.success) throw new Error('Failed to delete insight');
      console.log('✅ Insight deleted successfully');

      console.log('✅ Delete operation completed, reloading data...');

      // Reload insights first to ensure the deletion was successful
      await loadInsights(currentUserId);

      console.log('✅ Data reloaded, showing success message');

      setToast({
        visible: true,
        message: 'Insight deleted successfully.',
        type: 'success',
      });

    } catch (error) {
      console.error('❌ Error deleting insight:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setToast({
        visible: true,
        message: `Failed to delete insight: ${errorMessage}`,
        type: 'error',
      });
    }
  };

  // Filter and search insights
  const filteredInsights = insights.filter(insight => {
    const matchesSearch = searchText === '' || 
      insight.insight_text.toLowerCase().includes(searchText.toLowerCase()) ||
      (insight.related_theme && insight.related_theme.toLowerCase().includes(searchText.toLowerCase()));
    
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'high_importance' && insight.importance >= 7) ||
      (selectedFilter === 'medium_importance' && insight.importance >= 4 && insight.importance <= 6) ||
      (selectedFilter === 'low_importance' && insight.importance <= 3) ||
      (selectedFilter === 'value_conflict' && insight.related_theme === 'value_conflict');
    
    return matchesSearch && matchesFilter;
  });

  const filterOptions = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'high_importance', label: 'High Priority', icon: 'star' },
    { key: 'medium_importance', label: 'Medium Priority', icon: 'star-half' },
    { key: 'low_importance', label: 'Low Priority', icon: 'star-outline' },
    { key: 'value_conflict', label: 'Value Conflicts', icon: 'warning' },
  ];

  const renderInsight = ({ item }: { item: Insight }) => (
    <View className="bg-white rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-sm font-medium text-gray-600">
              {item.related_theme || 'General Insight'}
            </Text>
            <View className="ml-2 flex-row items-center">
              <MaterialIcons 
                name={item.importance >= 7 ? 'star' : item.importance >= 4 ? 'star-half' : 'star-outline'} 
                size={14} 
                color="#F59E0B" 
              />
              <Text className="text-xs text-gray-500 ml-1">
                {item.importance}/10
              </Text>
            </View>
            {item.related_theme === 'value_conflict' && (
              <View className="ml-2 px-2 py-1 bg-red-100 rounded-full">
                <Text className="text-xs text-red-700 font-medium">
                  Value Conflict
                </Text>
              </View>
            )}
          </View>
          <Text className="text-base text-gray-900 leading-5">
            {item.insight_text}
          </Text>
        </View>
        <View className="flex-row ml-2">
          <TouchableOpacity
            onPress={() => handleEditInsight(item)}
            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-2"
          >
            <MaterialIcons name="edit" size={16} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteInsight(item)}
            className="w-8 h-8 rounded-full bg-orange-100 items-center justify-center"
          >
            <MaterialIcons name="delete" size={16} color="#F7941D" />
          </TouchableOpacity>
        </View>
      </View>
      <Text className="text-xs text-gray-400">
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );

  const onToastHide = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Image
          source={require('../assets/images/logo.png')}
          className="w-[200px] h-[60px] mb-8"
          resizeMode="contain"
        />
        <AluunaLoader 
          message="Loading your insights..." 
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
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-gray-900">
          Insights & Learnings
        </Text>

        <View className="flex-row">
          <TouchableOpacity onPress={() => loadInsights(currentUserId!)} className="mr-3">
            <MaterialIcons name="refresh" size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleProfileMenu}>
            <MaterialIcons name="account-circle" size={28} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-2 text-base mb-3"
          placeholder="Search insights..."
          value={searchText}
          onChangeText={setSearchText}
        />
        
        <FlatList
          data={filterOptions}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedFilter(item.key)}
              className={`px-3 py-2 rounded-full mr-2 flex-row items-center ${
                selectedFilter === item.key 
                  ? 'bg-blue-custom' 
                  : 'bg-gray-100'
              }`}
            >
              <MaterialIcons 
                name={item.icon as any} 
                size={16} 
                color={selectedFilter === item.key ? 'white' : '#6B7280'} 
              />
              <Text 
                className={`ml-1 text-sm font-medium ${
                  selectedFilter === item.key ? 'text-white' : 'text-gray-600'
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.key}
        />
      </View>

      {/* Content */}
      <FlatList
        data={filteredInsights}
        renderItem={renderInsight}
        keyExtractor={(item) => item.id}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center px-4 py-8">
            <MaterialIcons name="lightbulb" size={64} color="#9CA3AF" />
            <Text className="text-lg font-medium text-gray-500 mt-4 text-center">
              {searchText || selectedFilter !== 'all' ? 'No matching insights' : 'No insights yet'}
            </Text>
            <Text className="text-sm text-gray-400 mt-2 text-center">
              {searchText || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Your insights will appear here as you have conversations with Aluuna'
              }
            </Text>
          </View>
        }
      />

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setEditModalVisible(false)}
            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
          />
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Edit Insight
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text className="text-sm text-gray-500 mb-3">
              Edit your insight and adjust its importance level
            </Text>
            
            <TextInput
              className="border border-gray-300 rounded-lg p-4 text-base mb-4 min-h-[120px]"
              placeholder="Edit insight content..."
              value={editText}
              onChangeText={setEditText}
              multiline
              textAlignVertical="top"
            />
            
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Importance Level (1-10)
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-4 text-base"
                placeholder="5"
                value={editImportance}
                onChangeText={setEditImportance}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
            
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg mr-3"
              >
                <Text className="text-center text-gray-700 font-medium">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                disabled={isSaving || !editText.trim()}
                className={`flex-1 py-3 px-4 rounded-lg ${
                  isSaving || !editText.trim() 
                    ? 'bg-gray-300' 
                    : 'bg-blue-custom active:bg-blue-active'
                }`}
              >
                <Text className="text-center text-white font-medium">
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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