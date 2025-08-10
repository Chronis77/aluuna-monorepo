import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  Dimensions,
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

const { width: screenWidth } = Dimensions.get('window');

interface MemoryItem {
  id: string;
  type: 'inner_part' | 'coping_tool' | 'memory_snapshot' | 'shadow_theme' | 'pattern_loop' | 'regulation_strategy' | 'dysregulating_factor' | 'strength' | 'support_system';
  title: string;
  content: string;
  metadata?: any;
  createdAt: string;
  updatedAt?: string;
}

interface MemorySection {
  title: string;
  data: MemoryItem[];
  icon: string;
  color: string;
}

export default function MemoryProfileScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [memorySections, setMemorySections] = useState<MemorySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MemoryItem | null>(null);
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

  // Initialize the memory profile screen
  useEffect(() => {
    if (session) {
      initializeMemoryProfile();
    } else {
      // If no session, redirect to login
      router.replace('/login' as any);
    }
  }, [session]);

  const initializeMemoryProfile = async () => {
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

      // Load all memory data
      await loadMemoryData(user.id);

    } catch (error) {
      console.error('Error initializing memory profile:', error);
      setToast({
        visible: true,
        message: 'Failed to load memory profile. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMemoryData = async (userId: string) => {
    try {
      console.log('🔄 Loading memory data for user:', userId);
      
      // Load inner parts and memory snapshots first (these work)
      const [innerParts, memorySnapshots] = await Promise.all([
        MemoryProcessingService.getUserInnerParts(userId),
        getMemorySnapshots(userId)
      ]);

      console.log('🔄 Loaded basic data:', {
        innerPartsCount: innerParts?.length || 0,
        memorySnapshotsCount: memorySnapshots?.length || 0
      });

      const sections: MemorySection[] = [];

          // Process inner parts
          if (innerParts && innerParts.length > 0) {
            const innerPartItems: MemoryItem[] = innerParts.map((part: any) => ({
              id: part.id,
              type: 'inner_part',
              title: part.name,
              content: [part.role, part.description].filter(Boolean).join(' - '),
              metadata: { role: part.role, tone: part.tone },
              createdAt: part.updated_at,
              updatedAt: part.updated_at,
            }));
            
            sections.push({
              title: 'Inner Parts',
              data: innerPartItems,
              icon: 'psychology',
              color: '#8B5CF6'
            });
          }

          // Process memory snapshots
          if (memorySnapshots && memorySnapshots.length > 0) {
            const snapshotItems: MemoryItem[] = memorySnapshots.map((snapshot: any) => ({
              id: snapshot.id,
              type: 'memory_snapshot',
              title: 'Session Memory',
              content: snapshot.summary,
              metadata: { themes: snapshot.key_themes || [], generatedBy: snapshot.generated_by },
              createdAt: snapshot.created_at,
            }));
        
        sections.push({
          title: 'Session Memories',
          data: snapshotItems,
          icon: 'history',
          color: '#F59E0B'
        });
      }

      // Try to load memory profile components (with error handling)
      try {
        const memoryProfile = await getMemoryProfile(userId);
        
        if (memoryProfile) {
          console.log('🔄 Memory profile loaded successfully');
          
          // Process coping tools
          if (memoryProfile.coping_tools && memoryProfile.coping_tools.length > 0) {
            const copingToolItems: MemoryItem[] = memoryProfile.coping_tools.map((tool: any) => ({
              id: tool.id,
              type: 'coping_tool',
              title: tool.tool_name,
              content: tool.description || tool.tool_category || 'Coping tool',
              metadata: {
                tool_category: tool.tool_category,
                effectiveness_rating: tool.effectiveness_rating,
                when_to_use: tool.when_to_use,
              },
              createdAt: tool.created_at,
              updatedAt: tool.updated_at,
            }));
            
            sections.push({
              title: 'Coping Tools',
              data: copingToolItems,
              icon: 'healing',
              color: '#10B981'
            });
          }

          // Process shadow themes
          if (memoryProfile.shadow_themes && memoryProfile.shadow_themes.length > 0) {
            const shadowThemeItems: MemoryItem[] = memoryProfile.shadow_themes.map((theme: any) => ({
              id: theme.id,
              type: 'shadow_theme',
              title: theme.theme_name,
              content: theme.theme_description || 'Shadow theme',
              metadata: {
                triggers: theme.triggers,
                avoidance_behaviors: theme.avoidance_behaviors,
                integration_strategies: theme.integration_strategies,
              },
              createdAt: theme.created_at,
              updatedAt: theme.updated_at,
            }));
            
            sections.push({
              title: 'Shadow Themes',
              data: shadowThemeItems,
              icon: 'dark-mode',
              color: '#6366F1'
            });
          }

          // Process pattern loops
          if (memoryProfile.pattern_loops && memoryProfile.pattern_loops.length > 0) {
            const patternLoopItems: MemoryItem[] = memoryProfile.pattern_loops.map((loop: any) => ({
              id: loop.id,
              type: 'pattern_loop',
              title: loop.loop_name,
              content: loop.automatic_response || loop.trigger_situation || loop.consequences || 'Pattern loop',
              metadata: {
                trigger_situation: loop.trigger_situation,
                consequences: loop.consequences,
                alternative_responses: loop.alternative_responses,
              },
              createdAt: loop.created_at,
              updatedAt: loop.updated_at,
            }));
            
            sections.push({
              title: 'Pattern Loops',
              data: patternLoopItems,
              icon: 'loop',
              color: '#8B5CF6'
            });
          }

          // Process regulation strategies
          if (memoryProfile.regulation_strategies && memoryProfile.regulation_strategies.length > 0) {
            const items: MemoryItem[] = memoryProfile.regulation_strategies.map((row: any) => ({
              id: row.id,
              type: 'regulation_strategy',
              title: row.strategy_name,
              content: row.notes || row.when_to_use || row.strategy_type || 'Regulation strategy',
              metadata: {
                strategy_type: row.strategy_type,
                when_to_use: row.when_to_use,
                effectiveness_rating: row.effectiveness_rating,
              },
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            }));

            sections.push({
              title: 'Regulation Strategies',
              data: items,
              icon: 'self-improvement',
              color: '#06B6D4'
            });
          }

          // Process dysregulating factors
          if (memoryProfile.dysregulating_factors && memoryProfile.dysregulating_factors.length > 0) {
            const items: MemoryItem[] = memoryProfile.dysregulating_factors.map((row: any) => ({
              id: row.id,
              type: 'dysregulating_factor',
              title: row.factor_name,
              content: row.factor_type || (row.triggers && row.triggers.length > 0 ? `Triggers: ${row.triggers.join(', ')}` : 'Dysregulating factor'),
              metadata: {
                factor_type: row.factor_type,
                impact_level: row.impact_level,
                triggers: row.triggers,
                coping_strategies: row.coping_strategies,
              },
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            }));

            sections.push({
              title: 'Dysregulating Factors',
              data: items,
              icon: 'warning',
              color: '#F43F5E'
            });
          }

          // Process strengths
          if (memoryProfile.strengths && memoryProfile.strengths.length > 0) {
            const items: MemoryItem[] = memoryProfile.strengths.map((row: any) => ({
              id: row.id,
              type: 'strength',
              title: row.strength_name,
              content: row.how_utilized || row.how_developed || row.strength_category || 'Strength',
              metadata: {
                strength_category: row.strength_category,
                confidence_level: row.confidence_level,
                how_developed: row.how_developed,
                how_utilized: row.how_utilized,
              },
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            }));

            sections.push({
              title: 'Strengths',
              data: items,
              icon: 'star',
              color: '#F59E0B'
            });
          }

          // Support system temporarily hidden
        }
      } catch (memoryProfileError) {
        console.log('⚠️ Memory profile failed to load, continuing with basic data only:', memoryProfileError);
        // Continue without memory profile data - the page will still work with inner parts and snapshots
      }

      setMemorySections(sections);
      console.log('🔄 Memory sections updated:', sections.map(s => `${s.title}: ${s.data.length} items`));

    } catch (error) {
      console.error('❌ Error loading memory data:', error);
      setToast({
        visible: true,
        message: 'Failed to load memory data. Please try again.',
        type: 'error',
      });
    }
  };

  const getMemorySnapshots = async (userId: string) => {
    try {
      const result = await trpcClient.getMemorySnapshots(userId);

      if (!result.success) {
        console.error('Error fetching memory snapshots:', result);
        throw new Error('Failed to get memory snapshots');
      }

      return result.snapshots || [];
    } catch (error) {
      console.error('Failed to get memory snapshots:', error);
      return [];
    }
  };

  const getMemoryProfile = async (userId: string) => {
    try {
      const result = await trpcClient.getMemoryProfile(userId);

      if (!result.success) {
        console.error('Error fetching memory profile:', result);
        return null;
      }

      return result.profile || null;
    } catch (error) {
      console.error('Failed to get memory profile:', error);
      return null;
    }
  };

  const handleEditItem = (item: MemoryItem) => {
    setEditingItem(item);
    setEditText(item.content);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !currentUserId || !editText.trim()) return;

    setIsSaving(true);
    try {
      console.log('✏️ Attempting to edit memory item:', editingItem.type, editingItem.id);
      console.log('✏️ New text:', editText.trim());
      
      let success = false;
      
      switch (editingItem.type) {
        case 'inner_part':
          await updateInnerPart(editingItem.id, editText.trim());
          success = true;
          break;
        case 'memory_snapshot':
          await updateMemorySnapshot(editingItem.id, editText.trim());
          success = true;
          break;
        case 'coping_tool':
          await updateById('user_coping_tools', editingItem.id, { description: editText.trim() });
          success = true;
          break;
        case 'shadow_theme':
          await updateById('user_shadow_themes', editingItem.id, { theme_description: editText.trim() });
          success = true;
          break;
        case 'pattern_loop':
          await updateById('user_pattern_loops', editingItem.id, { automatic_response: editText.trim() });
          success = true;
          break;
        case 'regulation_strategy':
          await updateById('user_regulation_strategies', editingItem.id, { notes: editText.trim() });
          success = true;
          break;
        case 'dysregulating_factor':
          await updateById('user_dysregulating_factors', editingItem.id, { factor_type: editText.trim() });
          success = true;
          break;
        case 'strength':
          await updateById('user_strengths', editingItem.id, { how_utilized: editText.trim() });
          success = true;
          break;
        case 'support_system':
          await updateById('user_support_system', editingItem.id, { relationship_type: editText.trim() });
          success = true;
          break;
        default:
          throw new Error(`Unknown item type: ${editingItem.type}`);
      }

      if (success) {
        console.log('✅ Edit operation completed, reloading data...');

        // Reload memory data first to ensure the edit was successful
        await loadMemoryData(currentUserId);

        console.log('✅ Data reloaded, showing success message');

        setToast({
          visible: true,
          message: 'Memory item updated successfully.',
          type: 'success',
        });
      }

    } catch (error) {
      console.error('❌ Error updating memory item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setToast({
        visible: true,
        message: `Failed to update memory item: ${errorMessage}`,
        type: 'error',
      });
    } finally {
      setIsSaving(false);
      setEditModalVisible(false);
      setEditingItem(null);
      setEditText('');
    }
  };

  const updateInnerPart = async (id: string, newText: string) => {
    console.log('✏️ Updating inner part with ID:', id);
    console.log('✏️ New text:', newText);
    
    // Parse the new text to extract role and description
    const parts = newText.split(' - ');
    const role = parts[0] || '';
    const description = parts.slice(1).join(' - ') || '';

    console.log('✏️ Parsed role:', role);
    console.log('✏️ Parsed description:', description);

    const result = await trpcClient.updateInnerPart(id, role, description);

    console.log('✏️ Inner part update result:', result);
    if (!result.success) throw new Error('Failed to update inner part');
    console.log('✅ Inner part updated successfully');
  };

  const updateCopingTool = async (index: number, newText: string) => {
    console.log('✏️ Updating coping tool at index:', index);
    console.log('✏️ New text:', newText);
    
    const result = await trpcClient.updateCopingTool(currentUserId!, index, newText);

    console.log('✏️ Coping tool update result:', result);
    if (!result.success) throw new Error('Failed to update coping tool');
    console.log('✅ Coping tool updated successfully');
  };

  // Generic update/delete by id via server router
  const updateById = async (tableName: string, id: string, updates: any) => {
    const result = await trpcClient.updateMemoryItem(tableName, id, updates);
    if (!result || result.error) throw new Error('Failed to update item');
  };

  const deleteById = async (tableName: string, id: string) => {
    const result = await trpcClient.deleteMemoryItem(tableName, id);
    if (!result || result.error) throw new Error('Failed to delete item');
  };

  const updateMemorySnapshot = async (id: string, newText: string) => {
    console.log('✏️ Updating memory snapshot with ID:', id);
    console.log('✏️ New text:', newText);
    
    const result = await trpcClient.updateMemorySnapshot(id, newText);

    console.log('✏️ Memory snapshot update result:', result);
    if (!result.success) throw new Error('Failed to update memory snapshot');
    console.log('✅ Memory snapshot updated successfully');
  };

  const updateShadowTheme = async (index: number, newText: string) => {
    console.log('✏️ Updating shadow theme at index:', index);
    console.log('✏️ New text:', newText);
    
    const result = await trpcClient.updateShadowTheme(currentUserId!, index, newText);

    console.log('✏️ Shadow theme update result:', result);
    if (!result.success) throw new Error('Failed to update shadow theme');
    console.log('✅ Shadow theme updated successfully');
  };

  const updatePatternLoop = async (index: number, newText: string) => {
    console.log('✏️ Updating pattern loop at index:', index);
    console.log('✏️ New text:', newText);
    
    const result = await trpcClient.updatePatternLoop(currentUserId!, index, newText);

    console.log('✏️ Pattern loop update result:', result);
    if (!result.success) throw new Error('Failed to update pattern loop');
    console.log('✅ Pattern loop updated successfully');
  };

  const handleDeleteItem = (item: MemoryItem) => {
    Alert.alert(
      'Delete Memory Item',
      'Are you sure you want to delete this memory item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => performDelete(item) }
      ]
    );
  };

  const performDelete = async (item: MemoryItem) => {
    if (!currentUserId) return;

    try {
      console.log('🗑️ Attempting to delete memory item:', item.type, item.id);
      
      let success = false;
      
      // Perform the delete operation
      switch (item.type) {
        case 'inner_part':
          await deleteInnerPart(item.id);
          success = true;
          break;
        case 'memory_snapshot':
          await deleteMemorySnapshot(item.id);
          success = true;
          break;
        case 'coping_tool':
          await deleteById('user_coping_tools', item.id);
          success = true;
          break;
        case 'shadow_theme':
          await deleteById('user_shadow_themes', item.id);
          success = true;
          break;
        case 'pattern_loop':
          await deleteById('user_pattern_loops', item.id);
          success = true;
          break;
        case 'regulation_strategy':
          await deleteById('user_regulation_strategies', item.id);
          success = true;
          break;
        case 'dysregulating_factor':
          await deleteById('user_dysregulating_factors', item.id);
          success = true;
          break;
        case 'strength':
          await deleteById('user_strengths', item.id);
          success = true;
          break;
        case 'support_system':
          await deleteById('user_support_system', item.id);
          success = true;
          break;
        default:
          throw new Error(`Unknown item type: ${item.type}`);
      }

      if (success) {
        console.log('✅ Delete operation completed, reloading data...');

        // Reload memory data first to ensure the deletion was successful
        await loadMemoryData(currentUserId);

        console.log('✅ Data reloaded, showing success message');

        // Only show success message after confirming the data was refreshed
        setToast({
          visible: true,
          message: 'Memory item deleted successfully.',
          type: 'success',
        });
      }

    } catch (error) {
      console.error('❌ Error deleting memory item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setToast({
        visible: true,
        message: `Failed to delete memory item: ${errorMessage}`,
        type: 'error',
      });
    }
  };



  const deleteInnerPart = async (id: string) => {
    console.log('🗑️ Deleting inner part with ID:', id);
    const result = await trpcClient.deleteInnerPart(id);

    console.log('🗑️ Inner part delete result:', result);
    if (!result.success) throw new Error('Failed to delete inner part');
    console.log('✅ Inner part deleted successfully');
  };

  const deleteCopingTool = async (index: number) => {
    console.log('🗑️ Deleting coping tool at index:', index);
    
    const result = await trpcClient.deleteCopingTool(currentUserId!, index);

    console.log('🗑️ Coping tool delete result:', result);
    if (!result.success) throw new Error('Failed to delete coping tool');
    console.log('✅ Coping tool deleted successfully');
  };

  const deleteMemorySnapshot = async (id: string) => {
    console.log('🗑️ Deleting memory snapshot with ID:', id);
    const result = await trpcClient.deleteMemorySnapshot(id);

    console.log('🗑️ Memory snapshot delete result:', result);
    if (!result.success) throw new Error('Failed to delete memory snapshot');
    console.log('✅ Memory snapshot deleted successfully');
  };

  const deleteShadowTheme = async (index: number) => {
    console.log('🗑️ Deleting shadow theme at index:', index);
    
    const result = await trpcClient.deleteShadowTheme(currentUserId!, index);

    console.log('🗑️ Shadow theme delete result:', result);
    if (!result.success) throw new Error('Failed to delete shadow theme');
    console.log('✅ Shadow theme deleted successfully');
  };

  const deletePatternLoop = async (index: number) => {
    console.log('🗑️ Deleting pattern loop at index:', index);
    
    const result = await trpcClient.deletePatternLoop(currentUserId!, index);

    console.log('🗑️ Pattern loop delete result:', result);
    if (!result.success) throw new Error('Failed to delete pattern loop');
    console.log('✅ Pattern loop deleted successfully');
  };

  const renderMemoryItem = ({ item }: { item: MemoryItem }) => {
    // Check if this item type requires memory profile data and might not be editable
    const requiresMemoryProfile = false;
    const hasValidMetadata = true;
    const isEditable = true;

    return (
      <View className="bg-white rounded-2xl p-4 mb-3">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="text-sm font-medium text-gray-600">
                {item.title}
              </Text>

              {item.type === 'inner_part' && item.metadata?.tone && (
                <View className="ml-2 px-2 py-1 bg-purple-100 rounded-full">
                  <Text className="text-xs text-purple-700 font-medium">
                    {item.metadata.tone}
                  </Text>
                </View>
              )}
              
              {!isEditable && (
                <View className="ml-2 px-2 py-1 bg-gray-100 rounded-full">
                  <Text className="text-xs text-gray-500 font-medium">
                    Read Only
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-base text-gray-900 leading-5">
              {item.content}
            </Text>
            {item.type === 'memory_snapshot' && item.metadata?.themes && (
              <View className="mt-2 flex-row flex-wrap">
                {item.metadata.themes.map((theme: string, index: number) => (
                  <View key={index} className="mr-2 mb-1 px-2 py-1 bg-yellow-100 rounded-full">
                    <Text className="text-xs text-yellow-700 font-medium">
                      {theme}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <View className="flex-row ml-2">
            <TouchableOpacity
              onPress={() => handleEditItem(item)}
              disabled={!isEditable}
              className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${
                isEditable ? 'bg-gray-100' : 'bg-gray-50'
              }`}
            >
              <MaterialIcons 
                name="edit" 
                size={16} 
                color={isEditable ? "#6B7280" : "#D1D5DB"} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteItem(item)}
              disabled={!isEditable}
              className={`w-8 h-8 rounded-full items-center justify-center ${
                isEditable ? 'bg-orange-100' : 'bg-gray-50'
              }`}
            >
              <MaterialIcons 
                name="delete" 
                size={16} 
                color={isEditable ? "#F7941D" : "#D1D5DB"} 
              />
            </TouchableOpacity>
          </View>
        </View>
        <Text className="text-xs text-gray-400">
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  const renderSection = ({ item }: { item: MemorySection }) => (
    <View className="mb-6">
      <View className="flex-row items-center mb-3 px-4">
        <View 
          className="w-8 h-8 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: item.color }}
        >
          <MaterialIcons name={item.icon as any} size={20} color="white" />
        </View>
        <Text className="text-lg font-semibold text-gray-900">
          {item.title} ({item.data.length})
        </Text>
      </View>
      {item.data.map((memoryItem) => (
        <View key={memoryItem.id} className="px-4">
          {renderMemoryItem({ item: memoryItem })}
        </View>
      ))}
    </View>
  );

  const onToastHide = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  // Filter and search memory sections
  const filteredSections = memorySections.map(section => {
    const filteredData = section.data.filter(item => {
      const matchesSearch = searchText === '' || 
        item.title.toLowerCase().includes(searchText.toLowerCase()) ||
        item.content.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesFilter = selectedFilter === 'all' || item.type === selectedFilter;
      
      return matchesSearch && matchesFilter;
    });
    
    return {
      ...section,
      data: filteredData
    };
  }).filter(section => section.data.length > 0);

  const filterOptions = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'inner_part', label: 'Inner Parts', icon: 'psychology' },
    { key: 'coping_tool', label: 'Coping Tools', icon: 'healing' },
    { key: 'regulation_strategy', label: 'Regulation', icon: 'self-improvement' },
    { key: 'dysregulating_factor', label: 'Dysregulating', icon: 'warning' },
    { key: 'strength', label: 'Strengths', icon: 'star' },
    { key: 'shadow_theme', label: 'Shadow Themes', icon: 'dark-mode' },
    { key: 'pattern_loop', label: 'Pattern Loops', icon: 'loop' },
    { key: 'memory_snapshot', label: 'Memories', icon: 'history' },
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
          message="Loading your memory profile..." 
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
          Memory Profile
        </Text>

        <View className="flex-row">
          <TouchableOpacity onPress={() => loadMemoryData(currentUserId!)} className="mr-3">
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
          placeholder="Search memory items..."
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
        data={filteredSections}
        renderItem={renderSection}
        keyExtractor={(item) => item.title}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center px-4 py-8">
            <MaterialIcons name="psychology" size={64} color="#9CA3AF" />
            <Text className="text-lg font-medium text-gray-500 mt-4 text-center">
              {searchText || selectedFilter !== 'all' ? 'No matching memory items' : 'No memory items yet'}
            </Text>
            <Text className="text-sm text-gray-400 mt-2 text-center">
              {searchText || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Your memory profile will populate as you have conversations with Aluuna'
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
                Edit {editingItem?.title}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {editingItem && (
              <Text className="text-sm text-gray-500 mb-3">
                {editingItem.type === 'inner_part' 
                  ? 'Format: Role - Description (e.g., "Protector - Keeps me safe from emotional harm")'
                  : editingItem.type === 'coping_tool'
                  ? 'Describe the coping strategy or tool that helps you'
                  : editingItem.type === 'shadow_theme'
                  ? 'Describe the shadow theme or unconscious pattern you\'re working with'
                  : editingItem.type === 'pattern_loop'
                  ? 'Describe the recurring pattern or cycle you\'ve identified'
                  : 'Edit the content of this memory item'
                }
              </Text>
            )}
            
            <TextInput
              className="border border-gray-300 rounded-lg p-4 text-base mb-4 min-h-[120px]"
              placeholder="Edit memory item content..."
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