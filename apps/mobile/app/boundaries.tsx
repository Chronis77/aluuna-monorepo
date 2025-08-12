import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AluunaLoader } from '../components/AluunaLoader';
import { Toast } from '../components/ui/Toast';
import { MemoryProcessingService } from '../lib/memoryProcessingService';
import { trpcClient } from '../lib/trpcClient';
import { useAuth } from '../context/AuthContext';
import { ProfileMenu } from '../components/ProfileMenu';
import { Dimensions } from 'react-native';

interface Boundary {
  id: string;
  boundary_text: string;
  related_context: string | null;
  firmness_level: number | null;
  is_active: boolean;
  created_at: string;
}

export default function BoundariesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [boundaries, setBoundaries] = useState<Boundary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingBoundary, setEditingBoundary] = useState<Boundary | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editText, setEditText] = useState('');
  const [editContext, setEditContext] = useState('');
  const [editFirmness, setEditFirmness] = useState('5');
  const [isSaving, setIsSaving] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info'; }>({ visible: false, message: '', type: 'info' });

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
    else if (title === 'Boundaries') router.push('/boundaries' as any);
    else if (title === 'Mantras') router.push('/mantras' as any);
    else if (title === 'Daily Practices') router.push('/daily-practices' as any);
    else if (title === 'Goals') router.push('/goals' as any);
    else if (title === 'Relationships') router.push('/relationships' as any);
    else if (title === 'Feedback History') router.push('/feedback-history' as any);
    else if (title === 'Settings') router.push('/settings' as any);
    else router.push('/conversation' as any);
  };

  const handleLogout = async () => {
    try {
      await trpcClient.signOut();
      router.replace('/login' as any);
    } catch {
      setToast({ visible: true, message: 'Error during logout', type: 'error' });
    }
  };

  useEffect(() => { initialize(); }, []);

  const initialize = async () => {
    try {
      setIsLoading(true);
      if (!session?.token) { router.replace('/login' as any); return; }
      const user = await trpcClient.getCurrentUser(session.token);
      if (!user) { router.replace('/login' as any); return; }
      setCurrentUserId(user.id);
      await loadBoundaries(user.id);
    } catch (error) {
      console.error('Error initializing boundaries:', error);
      setToast({ visible: true, message: 'Failed to load boundaries. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBoundaries = async (userId: string) => {
    try {
      const data = await MemoryProcessingService.getUserBoundaries(userId);
      setBoundaries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading boundaries:', error);
      setBoundaries([]);
      setToast({ visible: true, message: 'Failed to load boundaries. Please try again.', type: 'error' });
    }
  };

  const handleEditBoundary = (boundary: Boundary) => {
    setEditingBoundary(boundary);
    setEditText(boundary.boundary_text);
    setEditContext(boundary.related_context || '');
    setEditFirmness((boundary.firmness_level || 5).toString());
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingBoundary || !currentUserId || !editText.trim()) return;
    setIsSaving(true);
    try {
      const updates: any = {
        boundary_text: editText.trim(),
        related_context: editContext.trim() || undefined,
        firmness_level: parseInt(editFirmness) || 5,
      };
      await trpcClient.updateBoundary(editingBoundary.id, updates);
      await loadBoundaries(currentUserId);
      setToast({ visible: true, message: 'Boundary updated successfully.', type: 'success' });
    } catch (error) {
      console.error('Error updating boundary:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setToast({ visible: true, message: `Failed to update boundary: ${errorMessage}`, type: 'error' });
    } finally {
      setIsSaving(false);
      setEditModalVisible(false);
      setEditingBoundary(null);
      setEditText('');
      setEditContext('');
      setEditFirmness('5');
    }
  };

  const handleDeleteBoundary = (boundary: Boundary) => {
    Alert.alert('Delete Boundary', 'Are you sure you want to delete this boundary?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => performDelete(boundary) }
    ]);
  };

  const performDelete = async (boundary: Boundary) => {
    if (!currentUserId) return;
    try {
      await trpcClient.deleteBoundary(boundary.id);
      await loadBoundaries(currentUserId);
      setToast({ visible: true, message: 'Boundary deleted successfully.', type: 'success' });
    } catch (error) {
      console.error('Error deleting boundary:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setToast({ visible: true, message: `Failed to delete boundary: ${errorMessage}`, type: 'error' });
    }
  };

  const filtered = boundaries.filter(b => {
    const matchesSearch = searchText === '' || b.boundary_text.toLowerCase().includes(searchText.toLowerCase()) || (b.related_context && b.related_context.toLowerCase().includes(searchText.toLowerCase()));
    const matchesActive = !showOnlyActive || b.is_active;
    return matchesSearch && matchesActive;
  });

  const onToastHide = useCallback(() => { setToast(prev => ({ ...prev, visible: false })); }, []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Image source={require('../assets/images/logo.png')} className="w-[200px] h-[60px] mb-8" resizeMode="contain" />
        <AluunaLoader message="Loading your boundaries..." size="large" showMessage={true} />
      </View>
    );
  }

  const renderBoundary = ({ item }: { item: Boundary }) => (
    <View className="bg-white rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-sm font-medium text-gray-600">{item.related_context || 'General'}</Text>
            <View className="ml-2 flex-row items-center">
              <MaterialIcons name={ (item.firmness_level ?? 5) >= 7 ? 'shield' : (item.firmness_level ?? 5) >= 4 ? 'shield-moon' : 'shield-outline' as any } size={14} color="#066285" />
              <Text className="text-xs text-gray-500 ml-1">{item.firmness_level ?? 5}/10</Text>
            </View>
            {!item.is_active && (
              <View className="ml-2 px-2 py-1 bg-gray-100 rounded-full">
                <Text className="text-xs text-gray-600 font-medium">Inactive</Text>
              </View>
            )}
          </View>
          <Text className="text-base text-gray-900 leading-5">{item.boundary_text}</Text>
        </View>
        <View className="flex-row ml-2">
          <TouchableOpacity onPress={() => handleEditBoundary(item)} className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-2">
            <MaterialIcons name="edit" size={16} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteBoundary(item)} className="w-8 h-8 rounded-full bg-orange-100 items-center justify-center">
            <MaterialIcons name="delete" size={16} color="#F7941D" />
          </TouchableOpacity>
        </View>
      </View>
      <Text className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={onToastHide} />
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.replace('/conversation' as any)} className="mr-2">
          <Image source={require('../assets/images/logo-square-small.png')} style={{ width: 40, height: 40, borderRadius: 6 }} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Boundaries</Text>
        <View className="flex-row">
          <TouchableOpacity onPress={() => setEditModalVisible(true)} className="mr-3">
            <MaterialIcons name="add" size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => currentUserId && loadBoundaries(currentUserId)} className="mr-3">
            <MaterialIcons name="refresh" size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleProfileMenu}>
            <MaterialIcons name="account-circle" size={28} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <TextInput className="border border-gray-300 rounded-lg px-4 py-2 text-base mb-3" placeholder="Search boundaries..." placeholderTextColor="#6B7280" value={searchText} onChangeText={setSearchText} />
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => setShowOnlyActive(!showOnlyActive)} className={`px-3 py-2 rounded-full mr-2 ${showOnlyActive ? 'bg-blue-custom' : 'bg-gray-100'}`}>
            <Text className={`text-sm font-medium ${showOnlyActive ? 'text-white' : 'text-gray-600'}`}>{showOnlyActive ? 'Showing Active' : 'All'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList data={filtered} renderItem={renderBoundary} keyExtractor={(item) => item.id} className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }} ListEmptyComponent={
        <View className="flex-1 justify-center items-center px-4 py-8">
          <MaterialIcons name="shield" size={64} color="#9CA3AF" />
          <Text className="text-lg font-medium text-gray-500 mt-4 text-center">{searchText || showOnlyActive ? 'No matching boundaries' : 'No boundaries yet'}</Text>
          <Text className="text-sm text-gray-400 mt-2 text-center">Keep track of the limits you set to protect your wellbeing.</Text>
        </View>
      } />

      {/* Create/Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setEditModalVisible(false)} style={{ backgroundColor: 'rgba(0,0,0,0.2)' }} />
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">{editingBoundary ? 'Edit Boundary' : 'New Boundary'}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TextInput className="border border-gray-300 rounded-lg p-4 text-base mb-4 min-h-[80px]" placeholder="Boundary text (what you will or won't do)" placeholderTextColor="#6B7280" value={editText} onChangeText={setEditText} multiline textAlignVertical="top" />
            <TextInput className="border border-gray-300 rounded-lg p-4 text-base mb-4" placeholder="Related context (optional)" placeholderTextColor="#6B7280" value={editContext} onChangeText={setEditContext} />
            <TextInput className="border border-gray-300 rounded-lg p-4 text-base mb-4" placeholder="Firmness 1-10 (default 5)" placeholderTextColor="#6B7280" value={editFirmness} onChangeText={setEditFirmness} keyboardType="numeric" maxLength={2} />
            <View className="flex-row">
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="flex-1 py-3 px-4 border border-gray-300 rounded-lg mr-3"><Text className="text-center text-gray-700 font-medium">Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                if (!currentUserId || !editText.trim()) return;
                if (editingBoundary) { await handleSaveEdit(); }
                else {
                  try {
                    await trpcClient.createBoundary({ user_id: currentUserId, boundary_text: editText.trim(), related_context: editContext.trim() || undefined, firmness_level: parseInt(editFirmness) || 5 });
                    await loadBoundaries(currentUserId);
                    setToast({ visible: true, message: 'Boundary created.', type: 'success' });
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Unknown error';
                    setToast({ visible: true, message: `Failed to create boundary: ${msg}`, type: 'error' });
                  } finally {
                    setEditModalVisible(false);
                    setEditingBoundary(null);
                    setEditText('');
                    setEditContext('');
                    setEditFirmness('5');
                  }
                }
              }} disabled={isSaving || !editText.trim()} className={`flex-1 py-3 px-4 rounded-lg ${isSaving || !editText.trim() ? 'bg-gray-300' : 'bg-blue-custom'}`}>
                <Text className="text-center text-white font-medium">{editingBoundary ? (isSaving ? 'Saving...' : 'Save') : 'Create'}</Text>
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

