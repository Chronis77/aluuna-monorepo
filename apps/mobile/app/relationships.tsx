import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ProfileMenu } from '../components/ProfileMenu';
import { Dimensions } from 'react-native';

interface RelationshipItem {
  id: string;
  name: string;
  role: string;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function RelationshipsScreen() {
  const router = useRouter();
  const [relationships, setRelationships] = useState<RelationshipItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<RelationshipItem | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editNotes, setEditNotes] = useState('');
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

  // Initialize the relationships screen
  useEffect(() => {
    initializeRelationships();
  }, []);

  const initializeRelationships = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const user = await trpcClient.getCurrentUser();
      if (!user) {
        router.replace('/login' as any);
        return;
      }
      
      setCurrentUserId(user.id);

      // Load relationships data
      await loadRelationshipsData(user.id);

    } catch (error) {
      console.error('Error initializing relationships:', error);
      setToast({
        visible: true,
        message: 'Failed to load relationships. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRelationshipsData = async (userId: string) => {
    try {
      console.log('🔄 Loading relationships data for user:', userId);
      
      const relationshipsData = await MemoryProcessingService.getUserRelationships(userId);

      console.log('🔄 Loaded relationships:', relationshipsData);

      const relationshipItems: RelationshipItem[] = relationshipsData.map((relationship: any) => ({
        id: relationship.id,
        name: relationship.name,
        role: relationship.role,
        notes: relationship.notes,
        isActive: relationship.is_active,
        createdAt: relationship.created_at,
        updatedAt: relationship.updated_at,
      }));

      setRelationships(relationshipItems);
      console.log('🔄 Relationships updated:', relationshipItems.length, 'items');

    } catch (error) {
      console.error('❌ Error loading relationships data:', error);
      setToast({
        visible: true,
        message: 'Failed to load relationships data. Please try again.',
        type: 'error',
      });
    }
  };

  const handleEditItem = (item: RelationshipItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditRole(item.role);
    setEditNotes(item.notes || '');
    setEditModalVisible(true);
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setEditName('');
    setEditRole('');
    setEditNotes('');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!currentUserId || !editName.trim() || !editRole.trim()) return;

    setIsSaving(true);
    try {
      if (editingItem) {
        console.log('✏️ Updating relationship:', editingItem.id);
        await updateRelationship(editingItem.id, editName.trim(), editRole.trim(), editNotes.trim());
        setToast({
          visible: true,
          message: 'Relationship updated successfully.',
          type: 'success',
        });
      } else {
        console.log('➕ Creating new relationship');
        await createRelationship(editName.trim(), editRole.trim(), editNotes.trim());
        setToast({
          visible: true,
          message: 'Relationship created successfully.',
          type: 'success',
        });
      }

      // Reload data
      await loadRelationshipsData(currentUserId);

    } catch (error) {
      console.error('❌ Error saving relationship:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setToast({
        visible: true,
        message: `Failed to save relationship: ${errorMessage}`,
        type: 'error',
      });
    } finally {
      setIsSaving(false);
      setEditModalVisible(false);
      setEditingItem(null);
      setEditName('');
      setEditRole('');
      setEditNotes('');
    }
  };

  const updateRelationship = async (id: string, name: string, role: string, notes: string) => {
    console.log('✏️ Updating relationship with ID:', id);
    console.log('✏️ New data:', { name, role, notes });
    
    const result = await trpcClient.updateRelationship(id, name, role, notes || null);

    console.log('✏️ Relationship update result:', result);
    if (!result.success) throw new Error('Failed to update relationship');
    console.log('✅ Relationship updated successfully');
  };

  const handleDeleteItem = (item: RelationshipItem) => {
    Alert.alert(
      'Delete Relationship',
      'Are you sure you want to delete this relationship? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => performDelete(item) }
      ]
    );
  };

  const performDelete = async (item: RelationshipItem) => {
    if (!currentUserId) return;

    try {
      console.log('🗑️ Attempting to delete relationship:', item.id);
      
      await deleteRelationship(item.id);

      console.log('✅ Delete operation completed, reloading data...');

      // Reload relationships data first to ensure the deletion was successful
      await loadRelationshipsData(currentUserId);

      console.log('✅ Data reloaded, showing success message');

      setToast({
        visible: true,
        message: 'Relationship deleted successfully.',
        type: 'success',
      });

    } catch (error) {
      console.error('❌ Error deleting relationship:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setToast({
        visible: true,
        message: `Failed to delete relationship: ${errorMessage}`,
        type: 'error',
      });
    }
  };

  const createRelationship = async (name: string, role: string, notes: string) => {
    console.log('➕ Creating new relationship:', { name, role, notes });
    
    const result = await trpcClient.createRelationship(
      currentUserId!,
      name,
      role,
      notes || null
    );

    console.log('➕ Relationship create result:', result);
    if (!result.success) throw new Error('Failed to create relationship');
    console.log('✅ Relationship created successfully');
  };

  const deleteRelationship = async (id: string) => {
    console.log('🗑️ Deleting relationship with ID:', id);
    
    const result = await trpcClient.deleteRelationship(id);

    console.log('🗑️ Relationship delete result:', result);
    if (!result.success) throw new Error('Failed to delete relationship');
    console.log('✅ Relationship deleted successfully');
  };

  const renderRelationshipItem = ({ item }: { item: RelationshipItem }) => (
    <View className="bg-white rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-sm font-medium text-gray-600">
              {item.name}
            </Text>
            <View className="ml-2 px-2 py-1 bg-teal-100 rounded-full">
              <Text className="text-xs text-teal-700 font-medium">
                {item.role}
              </Text>
            </View>
            {item.isActive ? (
              <View className="ml-2 px-2 py-1 bg-green-100 rounded-full">
                <MaterialIcons name="check-circle" size={12} color="#10B981" />
              </View>
            ) : (
              <View className="ml-2 px-2 py-1 bg-gray-100 rounded-full">
                <MaterialIcons name="cancel" size={12} color="#6B7280" />
              </View>
            )}
          </View>
          {item.notes && (
            <Text className="text-base text-gray-900 leading-5 mb-2">
              {item.notes}
            </Text>
          )}
        </View>
        <View className="flex-row ml-2">
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
      {item.createdAt && (
        <Text className="text-xs text-gray-400">
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      )}
    </View>
  );

  const onToastHide = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  // Dynamic filters based on roles
  const filterOptions = useMemo(() => {
    const roles = Array.from(
      new Set(
        relationships
          .map(r => (r.role || '').trim())
          .filter(r => r.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));

    const base = [
      { key: 'all', label: 'All', icon: 'list' },
      { key: 'active', label: 'Active', icon: 'check-circle' },
    ];

    const roleOptions = roles.map(role => ({ key: `role:${role}`, label: role, icon: 'label' }));
    return [...base, ...roleOptions];
  }, [relationships]);

  // Reset selected filter if it becomes invalid after relationships change
  useEffect(() => {
    if (selectedFilter.startsWith('role:')) {
      const role = selectedFilter.slice(5).toLowerCase();
      const exists = relationships.some(r => (r.role || '').trim().toLowerCase() === role);
      if (!exists) setSelectedFilter('all');
    }
  }, [relationships]);

  // Filter and search relationships
  const filteredRelationships = relationships.filter(item => {
    const matchesSearch = searchText === '' ||
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      ((item.role || '').toLowerCase().includes(searchText.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchText.toLowerCase()));

    const matchesFilter =
      selectedFilter === 'all' ||
      (selectedFilter === 'active' && item.isActive) ||
      (selectedFilter.startsWith('role:') && ((item.role || '').toLowerCase() === selectedFilter.slice(5).toLowerCase()));

    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Image
          source={require('../assets/images/logo.png')}
          className="w-[200px] h-[60px] mb-8"
          resizeMode="contain"
        />
        <AluunaLoader 
          message="Loading your relationships..." 
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
          Relationships
        </Text>

        <View className="flex-row">
          <TouchableOpacity 
            onPress={handleCreateNew}
            className="mr-3"
          >
            <MaterialIcons name="add" size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => loadRelationshipsData(currentUserId!)} className="mr-3">
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
          placeholder="Search relationships..."
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
        data={filteredRelationships}
        renderItem={renderRelationshipItem}
        keyExtractor={(item) => item.id}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center px-4 py-8">
            <MaterialIcons name="people" size={64} color="#9CA3AF" />
            <Text className="text-lg font-medium text-gray-500 mt-4 text-center">
              {searchText || selectedFilter !== 'all' ? 'No matching relationships' : 'No relationships yet'}
            </Text>
            <Text className="text-sm text-gray-400 mt-2 text-center">
              {searchText || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Your relationships will appear here as Aluuna identifies them during your conversations'
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
                {editingItem ? 'Edit Relationship' : 'Create New Relationship'}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text className="text-sm text-gray-500 mb-3">
              {editingItem 
                ? 'Edit the details of this relationship. Include any relevant notes about your connection.'
                : 'Create a new relationship entry. Include the person\'s name, their role in your life, and any relevant notes.'
              }
            </Text>
            
            <TextInput
              className="border border-gray-300 rounded-lg p-4 text-base mb-3"
              placeholder="Name"
              placeholderTextColor="#6B7280"
              value={editName}
              onChangeText={setEditName}
            />
            
            <TextInput
              className="border border-gray-300 rounded-lg p-4 text-base mb-3"
              placeholder="Role (e.g., Partner, Child, Parent, Friend)"
              placeholderTextColor="#6B7280"
              value={editRole}
              onChangeText={setEditRole}
            />
            
            <TextInput
              className="border border-gray-300 rounded-lg p-4 text-base mb-4 min-h-[80px]"
              placeholder="Notes (optional)"
              placeholderTextColor="#6B7280"
              value={editNotes}
              onChangeText={setEditNotes}
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
                disabled={isSaving || !editName.trim() || !editRole.trim()}
                className={`flex-1 py-3 px-4 rounded-lg ${
                  isSaving || !editName.trim() || !editRole.trim()
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