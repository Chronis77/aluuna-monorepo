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

type GoalStatus = 'active'|'completed'|'paused'|'abandoned';

interface GoalItem {
  id: string;
  goal_title: string;
  goal_description?: string | null;
  goal_category?: string | null;
  priority_level?: number | null;
  target_date?: string | null;
  status: GoalStatus;
  progress_percentage?: number | null;
  created_at?: string;
}

export default function GoalsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<GoalItem | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('3');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editStatus, setEditStatus] = useState<GoalStatus>('active');
  const [isSaving, setIsSaving] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success'|'error'|'info'; }>({ visible: false, message: '', type: 'info' });

  // Profile menu state/animation
  const { width: screenWidth } = Dimensions.get('window');
  const PROFILE_MENU_WIDTH = screenWidth * 0.6;
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuTranslateX = useRef(new Animated.Value(screenWidth)).current;

  const toggleProfileMenu = () => {
    const toValue = isProfileMenuOpen ? screenWidth : 0;
    Animated.spring(profileMenuTranslateX, { toValue, useNativeDriver: true, tension: 100, friction: 8 }).start();
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
    else setToast({ visible: true, message: `${title} feature coming soon!`, type: 'info' });
  };

  const handleLogout = async () => {
    try { await trpcClient.signOut(); router.replace('/login' as any); }
    catch { setToast({ visible: true, message: 'Error during logout', type: 'error' }); }
  };

  useEffect(() => { initialize(); }, []);

  const initialize = async () => {
    try {
      setIsLoading(true);
      if (!session?.token) { router.replace('/login' as any); return; }
      const user = await trpcClient.getCurrentUser(session.token);
      if (!user) { router.replace('/login' as any); return; }
      setCurrentUserId(user.id);
      await loadGoals(user.id);
    } catch {
      setToast({ visible: true, message: 'Failed to load goals. Please try again.', type: 'error' });
    } finally { setIsLoading(false); }
  };

  const loadGoals = async (userId: string) => {
    try {
      const resp = await trpcClient.getUserGoals(userId);
      const arr: GoalItem[] = (resp ?? []).map((g: any) => ({
        id: g.id,
        goal_title: g.goal_title,
        goal_description: g.goal_description,
        goal_category: g.goal_category,
        priority_level: g.priority_level,
        target_date: g.target_date,
        status: g.status,
        progress_percentage: g.progress_percentage,
        created_at: g.created_at,
      }));
      setGoals(arr);
    } catch {
      setGoals([]);
      setToast({ visible: true, message: 'Failed to load goals.', type: 'error' });
    }
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setEditTitle('');
    setEditDescription('');
    setEditPriority('3');
    setEditTargetDate('');
    setEditStatus('active');
    setEditModalVisible(true);
  };

  const handleEditItem = (item: GoalItem) => {
    setEditingItem(item);
    setEditTitle(item.goal_title);
    setEditDescription(item.goal_description || '');
    setEditPriority(String(item.priority_level ?? 3));
    setEditTargetDate(item.target_date ? String(item.target_date).slice(0, 10) : '');
    setEditStatus(item.status);
    setEditModalVisible(true);
  };

  const handleDeleteItem = (item: GoalItem) => {
    Alert.alert('Delete Goal','Are you sure you want to delete this goal? This action cannot be undone.',[
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: () => performDelete(item) }
    ]);
  };

  const performDelete = async (item: GoalItem) => {
    if (!currentUserId) return;
    try {
      await trpcClient.deleteGoal(item.id);
      await loadGoals(currentUserId);
      setToast({ visible: true, message: 'Goal deleted.', type: 'success' });
    } catch {
      setToast({ visible: true, message: 'Failed to delete goal.', type: 'error' });
    }
  };

  const handleSaveEdit = async () => {
    if (!currentUserId || !editTitle.trim()) return;
    setIsSaving(true);
    try {
      if (editingItem) {
        await trpcClient.updateGoal(editingItem.id, {
          goalTitle: editTitle.trim(),
          goalDescription: editDescription.trim() || undefined,
          priorityLevel: parseInt(editPriority) || 3,
          targetDate: editTargetDate || undefined,
          status: editStatus,
        });
        setToast({ visible: true, message: 'Goal updated.', type: 'success' });
      } else {
        await trpcClient.createGoal({
          userId: currentUserId,
          goalTitle: editTitle.trim(),
          goalDescription: editDescription.trim() || undefined,
          priorityLevel: parseInt(editPriority) || 3,
          targetDate: editTargetDate || undefined,
        });
        setToast({ visible: true, message: 'Goal created.', type: 'success' });
      }
      await loadGoals(currentUserId);
    } catch {
      setToast({ visible: true, message: 'Failed to save goal.', type: 'error' });
    } finally {
      setIsSaving(false);
      setEditModalVisible(false);
      setEditingItem(null);
      setEditTitle('');
      setEditDescription('');
      setEditPriority('3');
      setEditTargetDate('');
      setEditStatus('active');
    }
  };

  const filteredGoals = goals.filter(g => {
    const matchesSearch = searchText === '' || g.goal_title.toLowerCase().includes(searchText.toLowerCase()) || (g.goal_description || '').toLowerCase().includes(searchText.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || g.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const filterOptions = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'active', label: 'Active', icon: 'play-arrow' },
    { key: 'completed', label: 'Completed', icon: 'check-circle' },
    { key: 'paused', label: 'Paused', icon: 'pause-circle' },
    { key: 'abandoned', label: 'Abandoned', icon: 'block' },
  ];

  const renderGoal = ({ item }: { item: GoalItem }) => (
    <View className="bg-white rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-sm font-medium text-gray-600">{item.goal_category || 'Goal'}</Text>
            {typeof item.priority_level === 'number' && (
              <View className="ml-2 flex-row items-center">
                <MaterialIcons name={item.priority_level >= 4 ? 'flag' : item.priority_level >= 2 ? 'outlined-flag' : 'assistant-photo'} size={14} color="#EF4444" />
                <Text className="text-xs text-gray-500 ml-1">P{item.priority_level}</Text>
              </View>
            )}
            <View className="ml-2 px-2 py-1 bg-gray-100 rounded-full">
              <Text className="text-xs text-gray-700 font-medium">{item.status}</Text>
            </View>
          </View>
          <Text className="text-base text-gray-900 leading-5">{item.goal_title}</Text>
          {!!item.goal_description && (
            <Text className="text-sm text-gray-600 mt-1">{item.goal_description}</Text>
          )}
        </View>
        <View className="flex-row ml-2">
          {item.status !== 'completed' && (
            <TouchableOpacity
              onPress={async () => {
                await trpcClient.updateGoal(item.id, { status: 'completed', progressPercentage: 100 });
                if (currentUserId) {
                  await loadGoals(currentUserId);
                }
              }}
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

  const onToastHide = useCallback(() => setToast(prev => ({ ...prev, visible: false })), []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Image source={require('../assets/images/logo.png')} className="w-[200px] h-[60px] mb-8" resizeMode="contain" />
        <AluunaLoader message="Loading your goals..." size="large" showMessage={true} />
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
        <Text className="text-lg font-semibold text-gray-900">Goals</Text>
        <View className="flex-row">
          <TouchableOpacity onPress={handleCreateNew} className="mr-3">
            <MaterialIcons name="add" size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => loadGoals(currentUserId!)} className="mr-3">
            <MaterialIcons name="refresh" size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleProfileMenu}>
            <MaterialIcons name="account-circle" size={28} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <TextInput className="border border-gray-300 rounded-lg px-4 py-2 text-base mb-3" placeholder="Search goals..." value={searchText} onChangeText={setSearchText} />
        <FlatList
          data={filterOptions}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelectedFilter(item.key)} className={`px-3 py-2 rounded-full mr-2 flex-row items-center ${selectedFilter === item.key ? 'bg-blue-custom' : 'bg-gray-100'}`}>
              <MaterialIcons name={item.icon as any} size={16} color={selectedFilter === item.key ? 'white' : '#6B7280'} />
              <Text className={`ml-1 text-sm font-medium ${selectedFilter === item.key ? 'text-white' : 'text-gray-600'}`}>{item.label}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.key}
        />
      </View>

      {/* Content */}
      <FlatList
        data={filteredGoals}
        renderItem={renderGoal}
        keyExtractor={(item) => item.id}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center px-4 py-8">
            <MaterialIcons name="flag" size={64} color="#9CA3AF" />
            <Text className="text-lg font-medium text-gray-500 mt-4 text-center">{searchText || selectedFilter !== 'all' ? 'No matching goals' : 'No goals yet'}</Text>
            <Text className="text-sm text-gray-400 mt-2 text-center">{searchText || selectedFilter !== 'all' ? 'Try adjusting your search or filter criteria' : 'Track your goals here as Aluuna identifies them or you add them'}</Text>
          </View>
        }
      />

      {/* Edit/Create Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setEditModalVisible(false)} style={{ backgroundColor: 'rgba(0,0,0,0.2)' }} />
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">{editingItem ? 'Edit Goal' : 'Create Goal'}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput className="border border-gray-300 rounded-lg p-4 text-base mb-3" placeholder="Goal title" value={editTitle} onChangeText={setEditTitle} />
            <TextInput className="border border-gray-300 rounded-lg p-4 text-base mb-3 min-h-[100px]" placeholder="Description (optional)" value={editDescription} onChangeText={setEditDescription} multiline textAlignVertical="top" />
            <View className="flex-row mb-3">
              <View className="flex-1 mr-2">
                <Text className="text-sm text-gray-700 mb-1">Priority (1-5)</Text>
                <TextInput className="border border-gray-300 rounded-lg p-3 text-base" placeholder="3" value={editPriority} onChangeText={setEditPriority} keyboardType="numeric" maxLength={1} />
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-sm text-gray-700 mb-1">Target date (YYYY-MM-DD)</Text>
                <TextInput className="border border-gray-300 rounded-lg p-3 text-base" placeholder="2025-12-31" value={editTargetDate} onChangeText={setEditTargetDate} />
              </View>
            </View>
            <View className="flex-row mb-4">
              {(['active','completed','paused','abandoned'] as GoalStatus[]).map(s => (
                <TouchableOpacity key={s} onPress={() => setEditStatus(s)} className={`px-3 py-2 rounded-full mr-2 ${editStatus === s ? 'bg-blue-custom' : 'bg-gray-100'}`}>
                  <Text className={`${editStatus === s ? 'text-white' : 'text-gray-700'}`}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row">
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="flex-1 py-3 px-4 border border-gray-300 rounded-lg mr-3">
                <Text className="text-center text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEdit} disabled={isSaving || !editTitle.trim()} className={`flex-1 py-3 px-4 rounded-lg ${isSaving || !editTitle.trim() ? 'bg-gray-300' : 'bg-blue-custom active:bg-blue-active'}`}>
                <Text className="text-center text-white font-medium">{isSaving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Profile Menu */}
      <Animated.View className="absolute top-0 bottom-0 right-0 bg-white shadow-lg" style={{ width: PROFILE_MENU_WIDTH, transform: [{ translateX: profileMenuTranslateX }], zIndex: 60 }}>
        <ProfileMenu visible={isProfileMenuOpen} onClose={toggleProfileMenu} onLogout={handleLogout} onMenuItemPress={handleMenuItemPress} />
      </Animated.View>
      {isProfileMenuOpen && (
        <TouchableOpacity className="absolute inset-0" activeOpacity={1} onPress={toggleProfileMenu} style={{ backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 50 }} />
      )}
    </SafeAreaView>
  );
}


