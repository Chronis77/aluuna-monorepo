import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
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
import { MemoryProcessingService } from '../lib/memoryProcessingService';
import { supabase } from '../lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

interface MemoryItem {
  id: string;
  type: 'inner_part' | 'stuck_point' | 'coping_tool' | 'memory_snapshot' | 'shadow_theme' | 'pattern_loop';
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

  // Initialize the memory profile screen
  useEffect(() => {
    initializeMemoryProfile();
  }, []);

  const initializeMemoryProfile = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
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
      
      // Load all memory data in parallel (excluding insights - they have their own screen)
      const [memoryProfile, innerParts, memorySnapshots] = await Promise.all([
        MemoryProcessingService.getMemoryProfile(userId),
        MemoryProcessingService.getUserInnerParts(userId),
        getMemorySnapshots(userId)
      ]);

      console.log('🔄 Loaded data:', {
        memoryProfile: memoryProfile ? 'exists' : 'null',
        innerPartsCount: innerParts?.length || 0,
        memorySnapshotsCount: memorySnapshots?.length || 0
      });

      const sections: MemorySection[] = [];

      // Process inner parts
      if (innerParts && innerParts.length > 0) {
        const innerPartItems: MemoryItem[] = innerParts.map(part => ({
          id: part.id,
          type: 'inner_part',
          title: part.name,
          content: `${part.role} - ${part.description}`,
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

      // Process stuck points from memory profile
      if (memoryProfile?.stuck_points && memoryProfile.stuck_points.length > 0) {
        const stuckPointItems: MemoryItem[] = memoryProfile.stuck_points.map((point: string, index: number) => ({
          id: `stuck_point_${index}`,
          type: 'stuck_point',
          title: 'Stuck Point',
          content: point,
          metadata: { originalIndex: index },
          createdAt: memoryProfile.updated_at,
          updatedAt: memoryProfile.updated_at,
        }));
        
        sections.push({
          title: 'Stuck Points',
          data: stuckPointItems,
          icon: 'block',
          color: '#EF4444'
        });
      }

      // Process coping tools from memory profile
      if (memoryProfile?.coping_tools && memoryProfile.coping_tools.length > 0) {
        const copingToolItems: MemoryItem[] = memoryProfile.coping_tools.map((tool: string, index: number) => ({
          id: `coping_tool_${index}`,
          type: 'coping_tool',
          title: 'Coping Tool',
          content: tool,
          metadata: { originalIndex: index },
          createdAt: memoryProfile.updated_at,
          updatedAt: memoryProfile.updated_at,
        }));
        
        sections.push({
          title: 'Coping Tools',
          data: copingToolItems,
          icon: 'healing',
          color: '#10B981'
        });
      }

      // Process shadow themes from memory profile
      if (memoryProfile?.shadow_themes && memoryProfile.shadow_themes.length > 0) {
        const shadowThemeItems: MemoryItem[] = memoryProfile.shadow_themes.map((theme: string, index: number) => ({
          id: `shadow_theme_${index}`,
          type: 'shadow_theme',
          title: 'Shadow Theme',
          content: theme,
          metadata: { originalIndex: index },
          createdAt: memoryProfile.updated_at,
          updatedAt: memoryProfile.updated_at,
        }));
        
        sections.push({
          title: 'Shadow Themes',
          data: shadowThemeItems,
          icon: 'dark-mode',
          color: '#6366F1'
        });
      }

      // Process pattern loops from memory profile
      if (memoryProfile?.pattern_loops && memoryProfile.pattern_loops.length > 0) {
        const patternLoopItems: MemoryItem[] = memoryProfile.pattern_loops.map((loop: string, index: number) => ({
          id: `pattern_loop_${index}`,
          type: 'pattern_loop',
          title: 'Pattern Loop',
          content: loop,
          metadata: { originalIndex: index },
          createdAt: memoryProfile.updated_at,
          updatedAt: memoryProfile.updated_at,
        }));
        
        sections.push({
          title: 'Pattern Loops',
          data: patternLoopItems,
          icon: 'loop',
          color: '#EC4899'
        });
      }

      // Process memory snapshots
      if (memorySnapshots && memorySnapshots.length > 0) {
        const snapshotItems: MemoryItem[] = memorySnapshots.map(snapshot => ({
          id: snapshot.id,
          type: 'memory_snapshot',
          title: 'Session Memory',
          content: snapshot.summary,
          metadata: { themes: snapshot.key_themes, generatedBy: snapshot.generated_by },
          createdAt: snapshot.created_at,
        }));
        
        sections.push({
          title: 'Session Memories',
          data: snapshotItems,
          icon: 'history',
          color: '#F59E0B'
        });
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
      const { data, error } = await supabase
        .from('memory_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching memory snapshots:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get memory snapshots:', error);
      return [];
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
      
      switch (editingItem.type) {
        case 'inner_part':
          await updateInnerPart(editingItem.id, editText.trim());
          break;
        case 'stuck_point':
          await updateStuckPoint(editingItem.metadata.originalIndex, editText.trim());
          break;
        case 'coping_tool':
          await updateCopingTool(editingItem.metadata.originalIndex, editText.trim());
          break;
        case 'shadow_theme':
          await updateShadowTheme(editingItem.metadata.originalIndex, editText.trim());
          break;
        case 'pattern_loop':
          await updatePatternLoop(editingItem.metadata.originalIndex, editText.trim());
          break;
        case 'memory_snapshot':
          await updateMemorySnapshot(editingItem.id, editText.trim());
          break;
      }

      console.log('✅ Edit operation completed, reloading data...');

      // Reload memory data first to ensure the edit was successful
      await loadMemoryData(currentUserId);

      console.log('✅ Data reloaded, showing success message');

      setToast({
        visible: true,
        message: 'Memory item updated successfully.',
        type: 'success',
      });

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

    const { error, count } = await supabase
      .from('inner_parts')
      .update({ 
        role: role,
        description: description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    console.log('✏️ Inner part update result:', { error, count });
    if (error) throw error;
    if (count === 0) throw new Error('No inner part found to update');
    console.log('✅ Inner part updated successfully');
  };

  const updateStuckPoint = async (index: number, newText: string) => {
    console.log('✏️ Updating stuck point at index:', index);
    console.log('✏️ New text:', newText);
    
    const { data: currentProfile } = await supabase
      .from('memory_profiles')
      .select('stuck_points')
      .eq('user_id', currentUserId)
      .single();

    if (!currentProfile) throw new Error('Memory profile not found');
    if (!currentProfile.stuck_points || currentProfile.stuck_points.length <= index) {
      throw new Error('Stuck point not found');
    }

    console.log('✏️ Current stuck points:', currentProfile.stuck_points);
    const updatedStuckPoints = [...currentProfile.stuck_points];
    updatedStuckPoints[index] = newText;
    console.log('✏️ Updated stuck points:', updatedStuckPoints);

    const { error } = await supabase
      .from('memory_profiles')
      .update({ 
        stuck_points: updatedStuckPoints,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', currentUserId);

    console.log('✏️ Stuck point update result:', { error });
    if (error) throw error;
    console.log('✅ Stuck point updated successfully');
  };

  const updateCopingTool = async (index: number, newText: string) => {
    console.log('✏️ Updating coping tool at index:', index);
    console.log('✏️ New text:', newText);
    
    const { data: currentProfile } = await supabase
      .from('memory_profiles')
      .select('coping_tools')
      .eq('user_id', currentUserId)
      .single();

    if (!currentProfile) throw new Error('Memory profile not found');
    if (!currentProfile.coping_tools || currentProfile.coping_tools.length <= index) {
      throw new Error('Coping tool not found');
    }

    console.log('✏️ Current coping tools:', currentProfile.coping_tools);
    const updatedCopingTools = [...currentProfile.coping_tools];
    updatedCopingTools[index] = newText;
    console.log('✏️ Updated coping tools:', updatedCopingTools);

    const { error } = await supabase
      .from('memory_profiles')
      .update({ 
        coping_tools: updatedCopingTools,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', currentUserId);

    console.log('✏️ Coping tool update result:', { error });
    if (error) throw error;
    console.log('✅ Coping tool updated successfully');
  };

  const updateMemorySnapshot = async (id: string, newText: string) => {
    console.log('✏️ Updating memory snapshot with ID:', id);
    console.log('✏️ New text:', newText);
    
    const { error, count } = await supabase
      .from('memory_snapshots')
      .update({ summary: newText })
      .eq('id', id);

    console.log('✏️ Memory snapshot update result:', { error, count });
    if (error) throw error;
    if (count === 0) throw new Error('No memory snapshot found to update');
    console.log('✅ Memory snapshot updated successfully');
  };

  const updateShadowTheme = async (index: number, newText: string) => {
    console.log('✏️ Updating shadow theme at index:', index);
    console.log('✏️ New text:', newText);
    
    const { data: currentProfile } = await supabase
      .from('memory_profiles')
      .select('shadow_themes')
      .eq('user_id', currentUserId)
      .single();

    if (!currentProfile) throw new Error('Memory profile not found');
    if (!currentProfile.shadow_themes || currentProfile.shadow_themes.length <= index) {
      throw new Error('Shadow theme not found');
    }

    console.log('✏️ Current shadow themes:', currentProfile.shadow_themes);
    const updatedShadowThemes = [...currentProfile.shadow_themes];
    updatedShadowThemes[index] = newText;
    console.log('✏️ Updated shadow themes:', updatedShadowThemes);

    const { error } = await supabase
      .from('memory_profiles')
      .update({ 
        shadow_themes: updatedShadowThemes,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', currentUserId);

    console.log('✏️ Shadow theme update result:', { error });
    if (error) throw error;
    console.log('✅ Shadow theme updated successfully');
  };

  const updatePatternLoop = async (index: number, newText: string) => {
    console.log('✏️ Updating pattern loop at index:', index);
    console.log('✏️ New text:', newText);
    
    const { data: currentProfile } = await supabase
      .from('memory_profiles')
      .select('pattern_loops')
      .eq('user_id', currentUserId)
      .single();

    if (!currentProfile) throw new Error('Memory profile not found');
    if (!currentProfile.pattern_loops || currentProfile.pattern_loops.length <= index) {
      throw new Error('Pattern loop not found');
    }

    console.log('✏️ Current pattern loops:', currentProfile.pattern_loops);
    const updatedPatternLoops = [...currentProfile.pattern_loops];
    updatedPatternLoops[index] = newText;
    console.log('✏️ Updated pattern loops:', updatedPatternLoops);

    const { error } = await supabase
      .from('memory_profiles')
      .update({ 
        pattern_loops: updatedPatternLoops,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', currentUserId);

    console.log('✏️ Pattern loop update result:', { error });
    if (error) throw error;
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
      
      // Perform the delete operation
      switch (item.type) {
        case 'inner_part':
          await deleteInnerPart(item.id);
          break;
        case 'stuck_point':
          await deleteStuckPoint(item.metadata.originalIndex);
          break;
        case 'coping_tool':
          await deleteCopingTool(item.metadata.originalIndex);
          break;
        case 'shadow_theme':
          await deleteShadowTheme(item.metadata.originalIndex);
          break;
        case 'pattern_loop':
          await deletePatternLoop(item.metadata.originalIndex);
          break;
        case 'memory_snapshot':
          await deleteMemorySnapshot(item.id);
          break;
      }

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
    const { error, count } = await supabase
      .from('inner_parts')
      .delete()
      .eq('id', id);

    console.log('🗑️ Inner part delete result:', { error, count });
    if (error) throw error;
    if (count === 0) throw new Error('No inner part found to delete');
    console.log('✅ Inner part deleted successfully');
  };

  const deleteStuckPoint = async (index: number) => {
    console.log('🗑️ Deleting stuck point at index:', index);
    
    const { data: currentProfile } = await supabase
      .from('memory_profiles')
      .select('stuck_points')
      .eq('user_id', currentUserId)
      .single();

    if (!currentProfile) throw new Error('Memory profile not found');
    if (!currentProfile.stuck_points || currentProfile.stuck_points.length <= index) {
      throw new Error('Stuck point not found');
    }

    console.log('🗑️ Current stuck points:', currentProfile.stuck_points);
    const updatedStuckPoints = currentProfile.stuck_points.filter((_: string, i: number) => i !== index);
    console.log('🗑️ Updated stuck points:', updatedStuckPoints);

    const { error } = await supabase
      .from('memory_profiles')
      .update({ 
        stuck_points: updatedStuckPoints,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', currentUserId);

    console.log('🗑️ Stuck point update result:', { error });
    if (error) throw error;
    console.log('✅ Stuck point deleted successfully');
  };

  const deleteCopingTool = async (index: number) => {
    console.log('🗑️ Deleting coping tool at index:', index);
    
    const { data: currentProfile } = await supabase
      .from('memory_profiles')
      .select('coping_tools')
      .eq('user_id', currentUserId)
      .single();

    if (!currentProfile) throw new Error('Memory profile not found');
    if (!currentProfile.coping_tools || currentProfile.coping_tools.length <= index) {
      throw new Error('Coping tool not found');
    }

    console.log('🗑️ Current coping tools:', currentProfile.coping_tools);
    const updatedCopingTools = currentProfile.coping_tools.filter((_: string, i: number) => i !== index);
    console.log('🗑️ Updated coping tools:', updatedCopingTools);

    const { error } = await supabase
      .from('memory_profiles')
      .update({ 
        coping_tools: updatedCopingTools,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', currentUserId);

    console.log('🗑️ Coping tool update result:', { error });
    if (error) throw error;
    console.log('✅ Coping tool deleted successfully');
  };

  const deleteMemorySnapshot = async (id: string) => {
    console.log('🗑️ Deleting memory snapshot with ID:', id);
    const { error, count } = await supabase
      .from('memory_snapshots')
      .delete()
      .eq('id', id);

    console.log('🗑️ Memory snapshot delete result:', { error, count });
    if (error) throw error;
    if (count === 0) throw new Error('No memory snapshot found to delete');
    console.log('✅ Memory snapshot deleted successfully');
  };

  const deleteShadowTheme = async (index: number) => {
    console.log('🗑️ Deleting shadow theme at index:', index);
    
    const { data: currentProfile } = await supabase
      .from('memory_profiles')
      .select('shadow_themes')
      .eq('user_id', currentUserId)
      .single();

    if (!currentProfile) throw new Error('Memory profile not found');
    if (!currentProfile.shadow_themes || currentProfile.shadow_themes.length <= index) {
      throw new Error('Shadow theme not found');
    }

    console.log('🗑️ Current shadow themes:', currentProfile.shadow_themes);
    const updatedShadowThemes = currentProfile.shadow_themes.filter((_: string, i: number) => i !== index);
    console.log('🗑️ Updated shadow themes:', updatedShadowThemes);

    const { error } = await supabase
      .from('memory_profiles')
      .update({ 
        shadow_themes: updatedShadowThemes,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', currentUserId);

    console.log('🗑️ Shadow theme update result:', { error });
    if (error) throw error;
    console.log('✅ Shadow theme deleted successfully');
  };

  const deletePatternLoop = async (index: number) => {
    console.log('🗑️ Deleting pattern loop at index:', index);
    
    const { data: currentProfile } = await supabase
      .from('memory_profiles')
      .select('pattern_loops')
      .eq('user_id', currentUserId)
      .single();

    if (!currentProfile) throw new Error('Memory profile not found');
    if (!currentProfile.pattern_loops || currentProfile.pattern_loops.length <= index) {
      throw new Error('Pattern loop not found');
    }

    console.log('🗑️ Current pattern loops:', currentProfile.pattern_loops);
    const updatedPatternLoops = currentProfile.pattern_loops.filter((_: string, i: number) => i !== index);
    console.log('🗑️ Updated pattern loops:', updatedPatternLoops);

    const { error } = await supabase
      .from('memory_profiles')
      .update({ 
        pattern_loops: updatedPatternLoops,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', currentUserId);

    console.log('🗑️ Pattern loop update result:', { error });
    if (error) throw error;
    console.log('✅ Pattern loop deleted successfully');
  };

  const renderMemoryItem = ({ item }: { item: MemoryItem }) => (
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
    { key: 'stuck_point', label: 'Stuck Points', icon: 'block' },
    { key: 'coping_tool', label: 'Coping Tools', icon: 'healing' },
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

        <TouchableOpacity onPress={() => loadMemoryData(currentUserId!)}>
          <MaterialIcons name="refresh" size={24} color="#374151" />
        </TouchableOpacity>
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
                  : editingItem.type === 'stuck_point'
                  ? 'Describe what you feel stuck on or what\'s blocking your progress'
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
    </SafeAreaView>
  );
} 