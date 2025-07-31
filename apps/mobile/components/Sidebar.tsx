import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SessionGroup } from '../types/database';

interface SidebarProps {
  sessionGroups: SessionGroup[];
  currentSessionGroup: SessionGroup | null;
  onSessionGroupSelect: (sessionGroup: SessionGroup) => void;
  onNewSession: () => void;
  isCreatingSession?: boolean;
}

export function Sidebar({ 
  sessionGroups, 
  currentSessionGroup, 
  onSessionGroupSelect, 
  onNewSession,
  isCreatingSession = false
}: SidebarProps) {
  const renderSessionGroupItem = ({ item }: { item: SessionGroup }) => (
    <TouchableOpacity
      className={`p-4 border-b border-gray-200 ${
        currentSessionGroup?.id === item.id ? 'bg-blue-50' : 'bg-white'
      }`}
      onPress={() => onSessionGroupSelect(item)}
    >
      <Text className="font-semibold text-gray-800 mb-1">{item.title || 'Untitled Session'}</Text>
      <Text className="text-sm text-gray-600 mb-1">{item.context_summary || 'No summary available'}</Text>
      <Text className="text-xs text-gray-400">
        {new Date(item.started_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1">
      <View className="p-4 border-b border-gray-200">
        <Text className="text-xl font-semibold text-gray-800 mb-2">
          Sessions
        </Text>
        <Text className="text-sm text-gray-600">
          Your therapeutic conversations
        </Text>
      </View>

      <FlatList
        data={sessionGroups}
        renderItem={renderSessionGroupItem}
        keyExtractor={(item) => item.id}
        className="flex-1"
      />

      <TouchableOpacity
        className={`m-4 p-4 rounded-lg items-center ${
          isCreatingSession ? 'bg-gray-400' : 'bg-purple-custom'
        }`}
        onPress={onNewSession}
        disabled={isCreatingSession}
      >
        {isCreatingSession ? (
          <View className="flex-row items-center justify-center">
            <MaterialIcons name="hourglass-empty" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Creating session...</Text>
          </View>
        ) : (
          <View className="flex-row items-center justify-center">
            <MaterialIcons name="add" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">New Session</Text>
          </View>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
} 