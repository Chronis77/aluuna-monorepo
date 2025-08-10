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
import { useAuth } from '../context/AuthContext';
import { MemoryProcessingService } from '../lib/memoryProcessingService';
import { trpcClient } from '../lib/trpcClient';
import { ProfileMenu } from '../components/ProfileMenu';
import { Dimensions } from 'react-native';

interface MantraItem {
  id: string;
  content: string;
  source?: string;
  isFavorite?: boolean;
  tags?: string[];
  isPinned?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export default function MantrasScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [mantras, setMantras] = useState<MantraItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MantraItem | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editText, setEditText] = useState('');
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

  // Initialize the mantras screen
  useEffect(() => {
    if (session) {
      initializeMantras();
    } else {
      // If no session, redirect to login
      router.replace('/login' as any);
    }
  }, [session]);

  const initializeMantras = async () => {
    try {
      setIsLoading(true);
      
      // Check if we have a valid session with token
      if (!session?.token) {
        console.error('No authentication token available');
        router.replace('/login' as any);
        return;
      }
      
      // Get current user with token from session
      const user = await trpcClient.getCurrentUser(session.token);
      if (!user) {
        router.replace('/login' as any);
        return;
      }
      
      setCurrentUserId(user.id);

      // Load mantras data
      await loadMantrasData(user.id);

    } catch (error) {
      console.error('Error initializing mantras:', error);
      setToast({
        visible: true,
        message: 'Failed to load mantras. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMantrasData = async (userId: string) => {
    try {
      console.log('🔄 Loading mantras data for user:', userId);
      
      const mantrasArray = await MemoryProcessingService.getUserMantras(userId);

      console.log('🔄 Loaded mantras:', mantrasArray);

      // Ensure we always set an array, even if the response is undefined
      const safeMantrasArray = mantrasArray || [];

      const mantraItems: MantraItem[] = safeMantrasArray.map((mantra: any) => ({
        id: mantra.id,
        content: mantra.text,
        source: mantra.source,
        isFavorite: mantra.is_favorite,
        tags: mantra.tags,
        isPinned: mantra.is_pinned,
        createdAt: mantra.created_at,
        updatedAt: mantra.created_at,
      }));

      setMantras(mantraItems);
      console.log('🔄 Mantras updated:', mantraItems.length, 'items');

    } catch (error) {
      console.error('❌ Error loading mantras data:', error);
      // Set empty array on error to prevent filter issues
      setMantras([]);
      setToast({
        visible: true,
        message: 'Failed to load mantras data. Please try again.',
        type: 'error',
      });
    }
  };

  const handleEditItem = (item: MantraItem) => {
    setEditingItem(item);
    setEditText(item.content);
    setEditModalVisible(true);
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setEditText('');
    setEditModalVisible(true);
  };

  const handleTogglePin = async (item: MantraItem) => {
    if (!currentUserId) return;

    try {
      console.log('📌 Toggling pin for mantra:', item.id);
      console.log('📌 Current pinned status:', item.isPinned);
      
      // Optimistically update the UI immediately
      setMantras(prevMantras => 
        prevMantras.map(mantra => 
          mantra.id === item.id 
            ? { ...mantra, isPinned: !mantra.isPinned }
            : mantra
        )
      );

      // Update database in background
      await toggleMantraPin(item.id, !item.isPinned);

      // Show success message
      setToast({
        visible: true,
        message: item.isPinned ? 'Mantra unpinned.' : 'Mantra pinned!',
        type: 'success',
      });

    } catch (error) {
      console.error('❌ Error toggling pin:', error);
      
      // Revert the optimistic update on error
      setMantras(prevMantras => 
        prevMantras.map(mantra => 
          mantra.id === item.id 
            ? { ...mantra, isPinned: item.isPinned }
            : mantra
        )
      );

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setToast({
        visible: true,
        message: `Failed to toggle pin: ${errorMessage}`,
        type: 'error',
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!currentUserId || !editText.trim()) return;

    setIsSaving(true);
    try {
      if (editingItem) {
        console.log('✏️ Updating mantra:', editingItem.id);
        await updateMantra(editingItem.id, editText.trim());
        setToast({
          visible: true,
          message: 'Mantra updated successfully.',
          type: 'success',
        });
      } else {
        console.log('➕ Creating new mantra');
        await createMantra(editText.trim());
        setToast({
          visible: true,
          message: 'Mantra created successfully.',
          type: 'success',
        });
      }

      // Reload data
      await loadMantrasData(currentUserId);

    } catch (error) {
      console.error('❌ Error saving mantra:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setToast({
        visible: true,
        message: `Failed to save mantra: ${errorMessage}`,
        type: 'error',
      });
    } finally {
      setIsSaving(false);
      setEditModalVisible(false);
      setEditingItem(null);
      setEditText('');
    }
  };

  const updateMantra = async (id: string, newText: string) => {
    console.log('✏️ Updating mantra with ID:', id);
    console.log('✏️ New text:', newText);
    
    const result = await trpcClient.updateMantra(id, { text: newText });

    console.log('✏️ Mantra update result:', result);
    if (!result.success) throw new Error('Failed to update mantra');
    console.log('✅ Mantra updated successfully');
  };

  const handleDeleteItem = (item: MantraItem) => {
    Alert.alert(
      'Delete Mantra',
      'Are you sure you want to delete this mantra? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => performDelete(item) }
      ]
    );
  };

  const performDelete = async (item: MantraItem) => {
    if (!currentUserId) return;

    try {
      console.log('🗑️ Attempting to delete mantra:', item.id);
      
      await deleteMantra(item.id);

      console.log('✅ Delete operation completed, reloading data...');

      // Reload mantras data first to ensure the deletion was successful
      await loadMantrasData(currentUserId);

      console.log('✅ Data reloaded, showing success message');

      setToast({
        visible: true,
        message: 'Mantra deleted successfully.',
        type: 'success',
      });

    } catch (error) {
      console.error('❌ Error deleting mantra:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setToast({
        visible: true,
        message: `Failed to delete mantra: ${errorMessage}`,
        type: 'error',
      });
    }
  };

  const createMantra = async (text: string) => {
    console.log('➕ Creating new mantra:', text);
    
    const result = await trpcClient.createMantra({
      user_id: currentUserId!,
      text: text,
      source: 'user_created',
      is_favorite: false,
      tags: null,
      is_pinned: false
    });

    console.log('➕ Mantra create result:', result);
    if (!result.success) throw new Error('Failed to create mantra');
    console.log('✅ Mantra created successfully');
  };

  const toggleMantraPin = async (id: string, isPinned: boolean) => {
    console.log('📌 Toggling mantra pin with ID:', id);
    console.log('📌 New pinned status:', isPinned);
    
    const result = await trpcClient.updateMantra(id, { is_pinned: isPinned });

    console.log('📌 Mantra pin toggle result:', result);
    if (!result.success) throw new Error('Failed to toggle mantra pin');
    console.log('✅ Mantra pin toggled successfully');
  };

  const deleteMantra = async (id: string) => {
    console.log('🗑️ Deleting mantra with ID:', id);
    
    const result = await trpcClient.deleteMantra(id);

    console.log('🗑️ Mantra delete result:', result);
    if (!result.success) throw new Error('Failed to delete mantra');
    console.log('✅ Mantra deleted successfully');
  };

  const renderMantraItem = ({ item }: { item: MantraItem }) => (
    <View className="bg-white rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-sm font-medium text-gray-600">
              Mantra
            </Text>
            <View className="ml-2 px-2 py-1 bg-indigo-100 rounded-full">
              <Text className="text-xs text-indigo-700 font-medium">
                Affirmation
              </Text>
            </View>
            {item.isPinned && (
              <View className="ml-2 px-2 py-1 bg-yellow-100 rounded-full">
                <MaterialIcons name="push-pin" size={12} color="#F59E0B" />
              </View>
            )}
            {item.isFavorite && (
              <View className="ml-2 px-2 py-1 bg-red-100 rounded-full">
                <MaterialIcons name="favorite" size={12} color="#EF4444" />
              </View>
            )}
          </View>
          <Text className="text-base text-gray-900 leading-5 italic">
            "{item.content}"
          </Text>
          {item.tags && item.tags.length > 0 && (
            <View className="mt-2 flex-row flex-wrap">
              {item.tags.map((tag: string, index: number) => (
                <View key={index} className="mr-2 mb-1 px-2 py-1 bg-gray-100 rounded-full">
                  <Text className="text-xs text-gray-700 font-medium">
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {item.source && (
            <Text className="text-xs text-gray-500 mt-1">
              Source: {item.source === 'ai_generated' ? 'AI Generated' : 'User Created'}
            </Text>
          )}
        </View>
        <View className="flex-row ml-2">
          <TouchableOpacity
            onPress={() => handleTogglePin(item)}
            className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${
              item.isPinned ? 'bg-teal-100' : 'bg-gray-100'
            }`}
          >
            <MaterialIcons 
              name="push-pin" 
              size={16} 
              color={item.isPinned ? "#14B8A6" : "#6B7280"} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleEditItem(item)}
            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-2"
          >
            <MaterialIcons name="edit" size={16} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteItem(item)}
            className="w-8 h-8 rounded-full bg-orange-100 items-center justify-center"
          >
            <MaterialIcons name="delete" size={16} color="#F7941D" />
          </TouchableOpacity>
        </View>
      </View>
      <Text className="text-xs text-gray-400">
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  const onToastHide = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  // Filter and search mantras
  const filteredMantras = mantras.filter(item => {
    const matchesSearch = searchText === '' || 
      item.content.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'favorites' && item.isFavorite) ||
      (selectedFilter === 'pinned' && item.isPinned) ||
      (selectedFilter === 'ai_generated' && item.source === 'ai_generated') ||
      (selectedFilter === 'user_created' && item.source === 'user_created');
    
    return matchesSearch && matchesFilter;
  });

  const filterOptions = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'favorites', label: 'Favorites', icon: 'favorite' },
    { key: 'pinned', label: 'Pinned', icon: 'push-pin' },
    { key: 'ai_generated', label: 'AI Generated', icon: 'psychology' },
    { key: 'user_created', label: 'User Created', icon: 'edit' },
  ];

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Image
          source={require('../assets/images/logo.png')}
          className="w-[200px] h-[60px] mb-8"
          resizeMode="contain"
        />
        <AluunaLoader 
          message="Loading your mantras..." 
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

        <Text className="text-lg font-semibold text-gray-900">
          Personal Mantras
        </Text>

        <View className="flex-row">
          <TouchableOpacity 
            onPress={handleCreateNew}
            className="mr-3"
          >
            <MaterialIcons name="add" size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => loadMantrasData(currentUserId!)} className="mr-3">
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
          placeholder="Search mantras..."
          placeholderTextColor="#6B7280"
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
        data={filteredMantras}
        renderItem={renderMantraItem}
        keyExtractor={(item) => item.id}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center px-4 py-8">
            <MaterialIcons name="self-improvement" size={64} color="#9CA3AF" />
            <Text className="text-lg font-medium text-gray-500 mt-4 text-center">
              {searchText || selectedFilter !== 'all' ? 'No matching mantras' : 'No mantras yet'}
            </Text>
            <Text className="text-sm text-gray-400 mt-2 text-center">
              {searchText || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Your personal mantras will appear here as Aluuna identifies them during your conversations'
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
              {editingItem ? 'Edit Mantra' : 'Create New Mantra'}
            </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text className="text-sm text-gray-500 mb-3">
              {editingItem 
                ? 'Edit your personal mantra or affirmation. This should be a positive statement that resonates with you.'
                : 'Create a new personal mantra or affirmation that resonates with you. This should be a positive statement that helps you stay grounded and focused.'
              }
            </Text>
            
            <TextInput
              className="border border-gray-300 rounded-lg p-4 text-base mb-4 min-h-[120px]"
              placeholder={editingItem ? "Edit your mantra..." : "Enter your new mantra..."}
              placeholderTextColor="#6B7280"
              value={editText}
              onChangeText={setEditText}
              multiline
              textAlignVertical="top"
            />
            
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