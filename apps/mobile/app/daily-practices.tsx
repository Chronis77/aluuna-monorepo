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
import { trpcClient } from '../lib/trpcClient';
import { useAuth } from '../context/AuthContext';
import { ProfileMenu } from '../components/ProfileMenu';
import { Dimensions } from 'react-native';

interface DailyPracticeItem {
  id: string;
  prompt_text: string | null;
  source?: string | null;
  is_suggested?: boolean;
  is_pinned?: boolean;
  completed_at?: string | null;
  date?: string;
  created_at?: string;
  updated_at?: string;
}

export default function DailyPracticesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [items, setItems] = useState<DailyPracticeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<DailyPracticeItem | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editText, setEditText] = useState('');
  const [editPinned, setEditPinned] = useState(false);
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
    else if (title === 'Boundaries') router.push('/boundaries' as any);
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
    initialize();
  }, []);

  const initialize = async () => {
    try {
      setIsLoading(true);
      if (!session?.token) {
        router.replace('/login' as any);
        return;
      }
      const user = await trpcClient.getCurrentUser(session.token);
      if (!user) {
        router.replace('/login' as any);
        return;
      }
      setCurrentUserId(user.id);
      await loadPractices(user.id);
    } catch (error) {
      setToast({ visible: true, message: 'Failed to load practices. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPractices = async (userId: string) => {
    try {
      const resp = await trpcClient.getDailyPractices(userId);
      const practices: DailyPracticeItem[] = (resp?.practices ?? resp ?? []).map((p: any) => ({
        id: p.id,
        prompt_text: p.prompt_text,
        source: p.source,
        is_suggested: p.is_suggested,
        is_pinned: p.is_pinned,
        completed_at: p.completed_at,
        date: p.date,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));
      setItems(practices);
    } catch (error) {
      setItems([]);
      setToast({ visible: true, message: 'Failed to load practices.', type: 'error' });
    }
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setEditText('');
    setEditPinned(false);
    setEditModalVisible(true);
  };

  const handleEditItem = (item: DailyPracticeItem) => {
    setEditingItem(item);
    setEditText(item.prompt_text || '');
    setEditPinned(!!item.is_pinned);
    setEditModalVisible(true);
  };

  const handleTogglePin = async (item: DailyPracticeItem) => {
    if (!currentUserId) return;
    try {
      setItems(prev => prev.map(p => p.id === item.id ? { ...p, is_pinned: !p.is_pinned } : p));
      await trpcClient.updateDailyPractice(item.id, { isSuggested: item.is_suggested, isPinned: !item.is_pinned });
      setToast({ visible: true, message: item.is_pinned ? 'Unpinned.' : 'Pinned!', type: 'success' });
    } catch (error) {
      setItems(prev => prev.map(p => p.id === item.id ? { ...p, is_pinned: item.is_pinned } : p));
      setToast({ visible: true, message: 'Failed to toggle pin.', type: 'error' });
    }
  };

  const handleMarkComplete = async (item: DailyPracticeItem) => {
    if (!currentUserId) return;
    try {
      const completedAt = new Date().toISOString();
      setItems(prev => prev.map(p => p.id === item.id ? { ...p, completed_at: completedAt } : p));
      await trpcClient.updateDailyPractice(item.id, { completedAt });
      await trpcClient.logDailyPractice(currentUserId, item.id);
      setToast({ visible: true, message: 'Marked complete.', type: 'success' });
    } catch (error) {
      setToast({ visible: true, message: 'Failed to mark complete.', type: 'error' });
      await loadPractices(currentUserId);
    }
  };

  const handleDeleteItem = (item: DailyPracticeItem) => {
    Alert.alert(
      'Delete Practice',
      'Are you sure you want to delete this practice? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => performDelete(item) }
      ]
    );
  };

  const performDelete = async (item: DailyPracticeItem) => {
    if (!currentUserId) return;
    try {
      await trpcClient.deleteDailyPractice(item.id);
      await loadPractices(currentUserId);
      setToast({ visible: true, message: 'Practice deleted.', type: 'success' });
    } catch (error) {
      setToast({ visible: true, message: 'Failed to delete practice.', type: 'error' });
    }
  };

  const handleSaveEdit = async () => {
    if (!currentUserId || !editText.trim()) return;
    setIsSaving(true);
    try {
      if (editingItem) {
        await trpcClient.updateDailyPractice(editingItem.id, { promptText: editText.trim(), isPinned: editPinned });
        setToast({ visible: true, message: 'Practice updated.', type: 'success' });
      } else {
        await trpcClient.createDailyPractice(currentUserId, editText.trim(), { isPinned: editPinned });
        setToast({ visible: true, message: 'Practice created.', type: 'success' });
      }
      await loadPractices(currentUserId);
    } catch (error) {
      setToast({ visible: true, message: 'Failed to save practice.', type: 'error' });
    } finally {
      setIsSaving(false);
      setEditModalVisible(false);
      setEditingItem(null);
      setEditText('');
      setEditPinned(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = searchText === '' || (item.prompt_text || '').toLowerCase().includes(searchText.toLowerCase());
    const completed = !!item.completed_at;
    const matchesFilter = selectedFilter === 'all'
      || (selectedFilter === 'pinned' && item.is_pinned)
      || (selectedFilter === 'suggested' && item.is_suggested)
      || (selectedFilter === 'completed' && completed)
      || (selectedFilter === 'active' && !completed);
    return matchesSearch && matchesFilter;
  });

  const filterOptions = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'pinned', label: 'Pinned', icon: 'push-pin' },
    { key: 'suggested', label: 'Suggested', icon: 'star' },
    { key: 'active', label: 'Active', icon: 'check-circle-outline' },
    { key: 'completed', label: 'Completed', icon: 'check-circle' },
  ];

  const renderItem = ({ item }: { item: DailyPracticeItem }) => (
    <View className="bg-white rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-sm font-medium text-gray-600">Daily Practice</Text>
            {item.is_suggested && (
              <View className="ml-2 px-2 py-1 bg-indigo-100 rounded-full">
                <Text className="text-xs text-indigo-700 font-medium">Suggested</Text>
              </View>
            )}
            {item.is_pinned && (
              <View className="ml-2 px-2 py-1 bg-yellow-100 rounded-full">
                <MaterialIcons name="push-pin" size={12} color="#F59E0B" />
              </View>
            )}
            {!!item.completed_at && (
              <View className="ml-2 px-2 py-1 bg-green-100 rounded-full">
                <MaterialIcons name="check-circle" size={12} color="#10B981" />
              </View>
            )}
          </View>
          <Text className="text-base text-gray-900 leading-5">{item.prompt_text}</Text>
        </View>
        <View className="flex-row ml-2">
          <TouchableOpacity
            onPress={() => handleTogglePin(item)}
            className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${item.is_pinned ? 'bg-teal-100' : 'bg-gray-100'}`}
          >
            <MaterialIcons name="push-pin" size={16} color={item.is_pinned ? '#14B8A6' : '#6B7280'} />
          </TouchableOpacity>
          {!item.completed_at && (
            <TouchableOpacity
              onPress={() => handleMarkComplete(item)}
              className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-2"
            >
              <MaterialIcons name="check" size={16} color="#10B981" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleEditItem(item)} className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-2">
            <MaterialIcons name="edit" size={16} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteItem(item)} className="w-8 h-8 rounded-full bg-orange-100 items-center justify-center">
            <MaterialIcons name="delete" size={16} color="#F7941D" />
          </TouchableOpacity>
        </View>
      </View>
      <Text className="text-xs text-gray-400">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
    </View>
  );

  const onToastHide = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Image source={require('../assets/images/logo.png')} className="w-[200px] h-[60px] mb-8" resizeMode="contain" />
        <AluunaLoader message="Loading your daily practices..." size="large" showMessage={true} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={onToastHide} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.replace('/conversation' as any)} className="mr-2">
          <Image
            source={require('../assets/images/logo-square-small.png')}
            style={{ width: 40, height: 40, borderRadius: 6 }}
          />
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-gray-900">Daily Practices</Text>

        <View className="flex-row">
          <TouchableOpacity onPress={handleCreateNew} className="mr-3">
            <MaterialIcons name="add" size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => loadPractices(currentUserId!)} className="mr-3">
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
          placeholder="Search practices..."
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
              className={`px-3 py-2 rounded-full mr-2 flex-row items-center ${selectedFilter === item.key ? 'bg-blue-custom' : 'bg-gray-100'}`}
            >
              <MaterialIcons name={item.icon as any} size={16} color={selectedFilter === item.key ? 'white' : '#6B7280'} />
              <Text className={`ml-1 text-sm font-medium ${selectedFilter === item.key ? 'text-white' : 'text-gray-600'}`}>{item.label}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.key}
        />
      </View>

      {/* Content */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center px-4 py-8">
            <MaterialIcons name="task-alt" size={64} color="#9CA3AF" />
            <Text className="text-lg font-medium text-gray-500 mt-4 text-center">{searchText || selectedFilter !== 'all' ? 'No matching practices' : 'No daily practices yet'}</Text>
            <Text className="text-sm text-gray-400 mt-2 text-center">{searchText || selectedFilter !== 'all' ? 'Try adjusting your search or filter criteria' : 'Your daily practices will appear here as Aluuna suggests them or you add them'}</Text>
          </View>
        }
      />

      {/* Edit/Create Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setEditModalVisible(false)} style={{ backgroundColor: 'rgba(0,0,0,0.2)' }} />
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">{editingItem ? 'Edit Practice' : 'Create Daily Practice'}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-500 mb-3">{editingItem ? 'Edit your practice text or pin it for quick access.' : 'Add a daily practice you want to keep up with.'}</Text>

            <TextInput
              className="border border-gray-300 rounded-lg p-4 text-base mb-4 min-h-[120px]"
              placeholder={editingItem ? 'Edit your practice...' : 'Enter your new practice...'}
              value={editText}
              onChangeText={setEditText}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              onPress={() => setEditPinned(prev => !prev)}
              className={`flex-row items-center px-4 py-3 rounded-lg mb-4 ${editPinned ? 'bg-teal-100' : 'bg-gray-100'}`}
            >
              <MaterialIcons name="push-pin" size={18} color={editPinned ? '#14B8A6' : '#6B7280'} />
              <Text className={`ml-2 ${editPinned ? 'text-teal-700' : 'text-gray-700'}`}>{editPinned ? 'Pinned' : 'Pin this practice'}</Text>
            </TouchableOpacity>

            <View className="flex-row">
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="flex-1 py-3 px-4 border border-gray-300 rounded-lg mr-3">
                <Text className="text-center text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                disabled={isSaving || !editText.trim()}
                className={`flex-1 py-3 px-4 rounded-lg ${isSaving || !editText.trim() ? 'bg-gray-300' : 'bg-blue-custom active:bg-blue-active'}`}
              >
                <Text className="text-center text-white font-medium">{isSaving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Profile Menu */}
      <Animated.View
        className="absolute top-0 bottom-0 right-0 bg-white shadow-lg"
        style={{ width: PROFILE_MENU_WIDTH, transform: [{ translateX: profileMenuTranslateX }], zIndex: 60 }}
      >
        <ProfileMenu visible={isProfileMenuOpen} onClose={toggleProfileMenu} onLogout={handleLogout} onMenuItemPress={handleMenuItemPress} />
      </Animated.View>

      {/* Overlay for profile menu */}
      {isProfileMenuOpen && (
        <TouchableOpacity className="absolute inset-0" activeOpacity={1} onPress={toggleProfileMenu} style={{ backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 50 }} />
      )}
    </SafeAreaView>
  );
}


