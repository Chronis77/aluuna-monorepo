import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AluunaLoader } from '../components/AluunaLoader';
import { FeedbackForm } from '../components/FeedbackForm';
import { MessageBubble } from '../components/MessageBubble';
import { ProfileMenu } from '../components/ProfileMenu';
import { ProximitySensor } from '../components/ProximitySensor';
import { Sidebar } from '../components/Sidebar';
import { ThreeDotLoader } from '../components/ThreeDotLoader';
import { Toast } from '../components/ui/Toast';
import { VoiceInput } from '../components/VoiceInput';
import { config } from '../lib/config';
import { ContextService } from '../lib/contextService';
import { MemoryProcessingService, ProcessingContext } from '../lib/memoryProcessingService';
import { Message as OpenAIMessage, OpenAIService } from '../lib/openaiService';
import { SessionContinuityManager } from '../lib/sessionContinuityManager';
import { SessionService } from '../lib/sessionService';
import { speechManager } from '../lib/speechManager';
import { supabase } from '../lib/supabase';
import { voicePreferencesService } from '../lib/voicePreferencesService';
import { SessionGroup } from '../types/database';

const { width: screenWidth } = Dimensions.get('window');
const SIDEBAR_WIDTH = screenWidth * 0.8;
const PROFILE_MENU_WIDTH = screenWidth * 0.6;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isThinking?: boolean;
  isStreaming?: boolean;
}

export default function SessionScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [sessionGroups, setSessionGroups] = useState<SessionGroup[]>([]);
  const [currentSessionGroup, setCurrentSessionGroup] = useState<SessionGroup | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [dialogueMode, setDialogueMode] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'info',
  });
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [memoryProcessingStatus, setMemoryProcessingStatus] = useState<{
    visible: boolean;
    message: string;
  }>({
    visible: false,
    message: '',
  });

  const memoryProcessingTranslateY = useRef(new Animated.Value(-60)).current;

  const sidebarTranslateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const profileMenuTranslateX = useRef(new Animated.Value(screenWidth)).current;
  const flatListRef = useRef<FlatList>(null);

  // Initialize the session screen
  useEffect(() => {
    initializeSession();
  }, []);

  // Load dialogue mode setting
  useEffect(() => {
    const loadDialogueMode = () => {
      const isEnabled = voicePreferencesService.getDialogueMode();
      setDialogueMode(isEnabled);
    };
    loadDialogueMode();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Use a longer timeout to ensure content is rendered
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true});
      }, 150); // Keep short for UI responsiveness
    }
  }, [messages]);

  const initializeSession = async () => {
    try {
      setIsLoading(true);
      
      // Test database connection first
      console.log('🔍 Testing database connection...');
      await SessionService.testDatabaseConnection();
      
      // Check authentication state
      console.log('🔐 Checking authentication state...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📋 Current session:', session ? 'Active' : 'None');
      
      // Get current user with proper error handling
      let user;
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('❌ Authentication error:', error);
          router.replace('/login' as any);
          return;
        }
        
        if (!currentUser) {
          console.log('⚠️ No authenticated user found, redirecting to login');
          router.replace('/login' as any);
          return;
        }
        
        user = currentUser;
        setCurrentUserId(user.id);
        console.log('✅ User authenticated:', user.id);
      } catch (authError) {
        console.error('❌ Error getting current user:', authError);
        router.replace('/login' as any);
        return;
      }

      // Load session groups
      const groups = await SessionService.getSessionGroups(user.id);
      setSessionGroups(groups);

      // Get or create current session group
      let currentGroup = await SessionService.getLatestSessionGroup(user.id);
      
      if (!currentGroup) {
        // Create new session group without title (will be generated later)
        const contextJson = ContextService.buildContextJson();
        currentGroup = await SessionService.createSessionGroup(user.id, '', contextJson);
        setSessionGroups(prev => [currentGroup!, ...prev]);
      }

      setCurrentSessionGroup(currentGroup);

      // Load messages for current session group
      await loadMessages(currentGroup.id);

      // Generate default title if session doesn't have one
      if (!currentGroup.title || currentGroup.title.trim() === '') {
        const defaultTitle = ContextService.generateSessionTitle(new Date(currentGroup.started_at));
        console.log('Generating default title for existing session:', defaultTitle);
        console.log('Session group ID:', currentGroup.id);
        console.log('Session started at:', currentGroup.started_at);
        
        // Test RLS policies first
        await SessionService.testRLSPolicies(currentGroup.id);
        
        try {
          await SessionService.updateSessionGroup(currentGroup.id, {
            title: defaultTitle,
          });

          // Update local state
          setCurrentSessionGroup(prev => prev ? { ...prev, title: defaultTitle } : null);
          setSessionGroups(prev => 
            prev.map(group => 
              group.id === currentGroup.id 
                ? { ...group, title: defaultTitle }
                : group
            )
          );
          
          console.log('✅ Successfully updated session group with default title');
        } catch (error) {
          console.error('❌ Failed to update session group with default title:', error);
        }
      }

      // Add initial greeting only if this is a completely new session group with no messages
      const dbSessions = await SessionService.getSessions(currentGroup.id);
      const hasExistingMessages = dbSessions.some(session => 
        session.input_transcript || session.gpt_response
      );
      
      console.log('Session initialization check:');
      console.log('- Session group ID:', currentGroup.id);
      console.log('- Total sessions in group:', dbSessions.length);
      console.log('- Has existing messages:', hasExistingMessages);
      console.log('- Sessions with content:', dbSessions.filter(s => s.input_transcript || s.gpt_response).length);
      
      if (!hasExistingMessages) {
        console.log('✅ New session group detected, adding greeting message');
        const sessionContext = ContextService.buildSessionContext();
        const greeting = ContextService.getSessionGreeting(sessionContext);
        
        const greetingMessage: Message = {
          id: 'greeting',
          text: greeting,
          isUser: false,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, greetingMessage]);
        
        // Save greeting to database
        await SessionService.addSession(currentGroup.id, user.id, greeting, greeting);
      } else {
        console.log('✅ Existing session group with messages, skipping greeting');
        console.log('- Will continue from where user left off');
      }

    } catch (error) {
      console.error('Error initializing session:', error);
      setToast({
        visible: true,
        message: 'Failed to load session. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (sessionGroupId: string) => {
    try {
      console.log('Loading messages for session group:', sessionGroupId);
      const dbSessions = await SessionService.getSessions(sessionGroupId);
      console.log('Found', dbSessions.length, 'sessions for this group');
      
      const messageList: Message[] = [];
      
      dbSessions.forEach(session => {
        // Add user message if it exists
        if (session.input_transcript) {
          messageList.push({
            id: `${session.id}-user`,
            text: session.input_transcript,
            isUser: true,
            timestamp: new Date(session.created_at),
          });
        }
        
        // Add AI response if it exists
        if (session.gpt_response) {
          messageList.push({
            id: `${session.id}-ai`,
            text: session.gpt_response,
            isUser: false,
            timestamp: new Date(session.created_at),
          });
        }
      });
      
      console.log('Loaded', messageList.length, 'messages');
      setMessages(messageList);
      
      // Scroll to bottom after messages are loaded
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100); // Keep short for UI responsiveness
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentSessionGroup || !currentUserId || isSending) return;

    console.log('Sending message to session group:', currentSessionGroup.id, 'Title:', currentSessionGroup.title);

    const userMessage = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      // Save user message to database first
      const sessionRecord = await SessionService.addSession(currentSessionGroup.id, currentUserId, userMessage);

      // Add user message to UI
      const userMessageObj: Message = {
        id: `${sessionRecord.id}-user`,
        text: userMessage,
        isUser: true,
        timestamp: new Date(),
      };
      
      // Add streaming AI message placeholder
      const streamingMessageId = `streaming-${Date.now()}`;
      const streamingMessage: Message = {
        id: streamingMessageId,
        text: '',
        isUser: false,
        timestamp: new Date(),
        isStreaming: true,
      };
      
      setMessages(prev => [...prev, userMessageObj, streamingMessage]);
      
      // Ensure scroll to bottom after adding messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);

      // Load fresh messages from database to ensure we have the correct conversation history
      const dbSessions = await SessionService.getSessions(currentSessionGroup.id);
      const conversationHistory: OpenAIMessage[] = [];
      
      dbSessions.forEach(session => {
        if (session.input_transcript) {
          conversationHistory.push({ role: 'user' as const, content: session.input_transcript });
        }
        if (session.gpt_response) {
          conversationHistory.push({ role: 'assistant' as const, content: session.gpt_response });
        }
      });

      // Add current user message to history
      conversationHistory.push({ role: 'user' as const, content: userMessage });

      // Build session context with session ID for continuity tracking
      const sessionContext = {
        ...ContextService.buildSessionContext(),
        sessionId: currentSessionGroup.id
      };

      // Use WebSocket streaming instead of direct API call
      await sendAIMessageViaWebSocket(
        userMessage,
        sessionContext,
        conversationHistory,
        streamingMessageId,
        sessionRecord.id
      );

    } catch (error) {
      console.error('Error sending message:', error);
      setToast({
        visible: true,
        message: 'Failed to send message. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  const sendAIMessageViaWebSocket = async (
    userMessage: string,
    sessionContext: any,
    conversationHistory: OpenAIMessage[],
    streamingMessageId: string,
    sessionRecordId: string
  ) => {
    try {
      await OpenAIService.generateStreamingResponse(
        userMessage,
        sessionContext,
        conversationHistory,
        currentSessionGroup!.id,
        streamingMessageId,
        sessionRecordId,
        {
          onStart: () => {
            console.log('🚀 AI streaming started');
          },
          onChunk: (chunk: string, isComplete: boolean) => {
            if (isComplete) {
              // Streaming complete
              setMessages(prev => prev.map(msg => 
                msg.id === streamingMessageId 
                  ? { ...msg, isStreaming: false }
                  : msg
              ));
            } else {
              // Update streaming message
              setMessages(prev => prev.map(msg => 
                msg.id === streamingMessageId 
                  ? { ...msg, text: msg.text + chunk }
                  : msg
              ));
            }
          },
          onComplete: (fullResponse: string) => {
            console.log('✅ AI response completed');
            // Final update to ensure complete response
            setMessages(prev => prev.map(msg => 
              msg.id === streamingMessageId 
                ? { ...msg, text: fullResponse, isStreaming: false }
                : msg
            ));

            // Process memory and update session metadata
            processMemoryAndMetadata(fullResponse, sessionContext, sessionRecordId);
          },
          onError: (error: string) => {
            console.error('❌ AI streaming error:', error);
            setToast({
              visible: true,
              message: 'AI service temporarily unavailable. Please try again.',
              type: 'error',
            });
            // Remove the streaming message from UI
            setMessages(prev => prev.filter(msg => msg.id !== streamingMessageId));
          }
        }
      );

    } catch (error) {
      console.error('Error in AI streaming:', error);
      setToast({
        visible: true,
        message: 'Failed to get AI response. Please try again.',
        type: 'error',
      });
      // Remove the streaming message from UI
      setMessages(prev => prev.filter(msg => msg.id !== streamingMessageId));
    }
  };

  const processMemoryAndMetadata = async (aiResponse: string, sessionContext: any, sessionRecordId: string) => {
    try {
      // Update the session with AI response
      await SessionService.updateSessionWithResponse(sessionRecordId, aiResponse);

      // Load fresh conversation history for metadata update
      const dbSessions = await SessionService.getSessions(currentSessionGroup!.id);
      const conversationHistory: OpenAIMessage[] = [];
      
      dbSessions.forEach(session => {
        if (session.input_transcript) {
          conversationHistory.push({ role: 'user' as const, content: session.input_transcript });
        }
        if (session.gpt_response) {
          conversationHistory.push({ role: 'assistant' as const, content: session.gpt_response });
        }
      });

      // Update session group title and summary immediately after AI response
      const updatedConversationHistory = [...conversationHistory, { role: 'assistant' as const, content: aiResponse }];
      
      // Always update metadata after receiving AI response
      await updateSessionGroupMetadata(updatedConversationHistory);

      // Check for crisis flags after processing
      await checkCrisisFlags();

    } catch (error) {
      console.error('Error processing memory and metadata:', error);
    }
  };

  // New function to handle dialogue mode transcription
  const handleDialogueTranscription = async (text: string) => {
    if (!currentSessionGroup || !currentUserId || isSending) return;

    console.log('Dialogue mode: Processing transcribed text:', text);

    const userMessage = text.trim();
    setIsSending(true);
    setIsRecording(false); // Ensure recording state is reset

    try {
      // Save user message to database first
      const sessionRecord = await SessionService.addSession(currentSessionGroup.id, currentUserId, userMessage);

      // Add user message to UI
      const userMessageObj: Message = {
        id: `${sessionRecord.id}-user`,
        text: userMessage,
        isUser: true,
        timestamp: new Date(),
      };
      
      // Add streaming AI message placeholder
      const streamingMessageId = `dialogue-${Date.now()}`;
      const streamingMessage: Message = {
        id: streamingMessageId,
        text: '',
        isUser: false,
        timestamp: new Date(),
        isStreaming: true,
      };
      
      setMessages(prev => [...prev, userMessageObj, streamingMessage]);
      
      // Ensure scroll to bottom after adding messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);

      // Load fresh messages from database
      const dbSessions = await SessionService.getSessions(currentSessionGroup.id);
      const conversationHistory: OpenAIMessage[] = [];
      
      dbSessions.forEach(session => {
        if (session.input_transcript) {
          conversationHistory.push({ role: 'user' as const, content: session.input_transcript });
        }
        if (session.gpt_response) {
          conversationHistory.push({ role: 'assistant' as const, content: session.gpt_response });
        }
      });

      // Add current user message to history
      conversationHistory.push({ role: 'user' as const, content: userMessage });

      // Build session context with session ID for continuity tracking
      const sessionContext = {
        ...ContextService.buildSessionContext(),
        sessionId: currentSessionGroup?.id || null
      };

      // Use WebSocket streaming for dialogue mode
      await sendAIMessageViaWebSocket(
        userMessage,
        sessionContext,
        conversationHistory,
        streamingMessageId,
        sessionRecord.id
      );

      // Speak the AI response immediately in dialogue mode
      try {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && !lastMessage.isUser) {
          await speechManager.speak(lastMessage.text, 'ai', {
            isUser: false,
            onStart: () => {
              console.log('🎤 AI response started speaking');
            },
            onDone: () => {
              console.log('🎤 AI response finished speaking');
            },
            onError: (error) => {
              console.error('🎤 Error speaking AI response:', error);
            }
          });
        }
      } catch (speechError) {
        console.error('🎤 Failed to speak AI response:', speechError);
      }

    } catch (error) {
      console.error('Error in dialogue mode:', error);
      setToast({
        visible: true,
        message: 'Failed to process voice message. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  const updateSessionGroupMetadata = async (conversationHistory: OpenAIMessage[]) => {
    if (!currentSessionGroup) return;

    try {
      console.log('Updating session metadata for group:', currentSessionGroup.id);
      
      // Check if we should generate AI title and summary (after 4 back-and-forth interactions)
      const shouldGenerateAI = OpenAIService.shouldSummarizeSession(conversationHistory);
      const hasNoTitle = !currentSessionGroup.title || currentSessionGroup.title.trim() === '';
      const hasDefaultTitle = currentSessionGroup.title && (
        currentSessionGroup.title.includes("Today's Session") || 
        currentSessionGroup.title.includes("Yesterday's Session") ||
        currentSessionGroup.title.includes("Session")
      );
      const hasAISummary = currentSessionGroup.context_summary && currentSessionGroup.context_summary.trim() !== '';
      
      console.log('Session metadata update check:');
      console.log('- Should generate AI:', shouldGenerateAI);
      console.log('- Has no title:', hasNoTitle);
      console.log('- Has default title:', hasDefaultTitle);
      console.log('- Has AI summary:', hasAISummary);
      console.log('- Current title:', currentSessionGroup.title);
      console.log('- Current summary:', currentSessionGroup.context_summary);
      console.log('- Conversation history length:', conversationHistory.length);
      
      if (shouldGenerateAI && (hasNoTitle || hasDefaultTitle) && !hasAISummary) {
        console.log('Generating AI title and summary after 4+ interactions (replacing default title)');
        
        // Generate new title and summary
        const [newTitle, newSummary] = await Promise.all([
          OpenAIService.generateSessionTitle(conversationHistory),
          OpenAIService.generateSessionSummary(conversationHistory),
        ]);

        console.log('Generated new title:', newTitle);
        console.log('Generated new summary:', newSummary);

        // Update session group
        await SessionService.updateSessionGroup(currentSessionGroup.id, {
          title: newTitle,
          context_summary: newSummary,
        });

        console.log('Successfully updated session group in database');

        // Update local state
        setCurrentSessionGroup(prev => prev ? { ...prev, title: newTitle, context_summary: newSummary } : null);
        setSessionGroups(prev => 
          prev.map(group => 
            group.id === currentSessionGroup.id 
              ? { ...group, title: newTitle, context_summary: newSummary }
              : group
          )
        );

        console.log('Successfully updated local state');
      } else if (hasNoTitle && !hasAISummary) {
        // Generate default title based on date if no title exists and no AI summary
        const defaultTitle = ContextService.generateSessionTitle(new Date(currentSessionGroup.started_at));
        console.log('Generating default title:', defaultTitle);
        
        await SessionService.updateSessionGroup(currentSessionGroup.id, {
          title: defaultTitle,
        });

        // Update local state
        setCurrentSessionGroup(prev => prev ? { ...prev, title: defaultTitle } : null);
        setSessionGroups(prev => 
          prev.map(group => 
            group.id === currentSessionGroup.id 
              ? { ...group, title: defaultTitle }
              : group
          )
        );

        console.log('Successfully updated with default title');
      } else {
        if (hasAISummary) {
          console.log('Session already has AI-generated summary, skipping metadata update');
        } else {
          console.log('Session already has title, skipping metadata update');
        }
      }

    } catch (error) {
      console.error('Error updating session metadata:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
  };

  const handleNewSession = async () => {
    if (!currentUserId) return;

    try {
      setIsCreatingSession(true);
      
      // Create new session group without title (will be generated later)
      const contextJson = ContextService.buildContextJson();
      const newSessionGroup = await SessionService.createSessionGroup(currentUserId, '', contextJson);

      // Create session continuity record for the new session
      try {
        await SessionContinuityManager.initializeSession(currentUserId, newSessionGroup.id);
        console.log('📊 Created session continuity record for new session:', newSessionGroup.id);
      } catch (error) {
        console.error('Error creating session continuity record:', error);
        // Don't fail the session creation if continuity tracking fails
      }

      // Update state
      setSessionGroups(prev => [newSessionGroup, ...prev]);
      setCurrentSessionGroup(newSessionGroup);
      
      // Clear messages and add initial greeting
      const sessionContext = ContextService.buildSessionContext();
      const greeting = ContextService.getSessionGreeting(sessionContext);
      
      const greetingMessage: Message = {
        id: 'greeting',
        text: greeting,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages([greetingMessage]);
      
      // Save greeting to database
      await SessionService.addSession(newSessionGroup.id, currentUserId, greeting, greeting);

      // Close sidebar with animation
      Animated.spring(sidebarTranslateX, {
        toValue: -SIDEBAR_WIDTH,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
      setIsSidebarOpen(false);

    } catch (error) {
      console.error('Error creating new session:', error);
      setToast({
        visible: true,
        message: 'Failed to create new session. Please try again.',
        type: 'error',
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleSessionGroupSelect = async (sessionGroup: SessionGroup) => {
    console.log('Selecting session group:', sessionGroup.id, 'Title:', sessionGroup.title);
    setCurrentSessionGroup(sessionGroup);
    
    // Clear current messages first
    setMessages([]);
    
    // Load messages for the selected session group
    await loadMessages(sessionGroup.id);
    
    // Ensure session continuity record exists for this session group
    try {
      const resumeContext = await SessionContinuityManager.checkSessionResume(sessionGroup.id);
      if (!resumeContext.isResuming && resumeContext.sessionPhase === 'start') {
        // No continuity record exists, create one
        await SessionContinuityManager.trackSessionProgress(
          sessionGroup.id,
          0, // Will be updated when messages are loaded
          'start',
          'rapport building',
          'neutral'
        );
        console.log('📊 Created missing session continuity record for existing session:', sessionGroup.id);
      }
    } catch (error) {
      console.error('Error checking/creating session continuity record:', error);
      // Don't fail session selection if continuity tracking fails
    }
    
    // Generate default title if session doesn't have one
    if (!sessionGroup.title || sessionGroup.title.trim() === '') {
      const defaultTitle = ContextService.generateSessionTitle(new Date(sessionGroup.started_at));
      console.log('🚨🚨🚨🚨🚨Generating default title for selected session:', defaultTitle);
      console.log('Session group ID:', sessionGroup.id);
      
      try {
        await SessionService.updateSessionGroup(sessionGroup.id, {
          title: defaultTitle,
        });

        // Update local state
        setCurrentSessionGroup(prev => prev ? { ...prev, title: defaultTitle } : null);
        setSessionGroups(prev => 
          prev.map(group => 
            group.id === sessionGroup.id 
              ? { ...group, title: defaultTitle }
              : group
          )
        );
        
        console.log('✅ Successfully updated selected session group with default title');
      } catch (error) {
        console.error('❌ Failed to update selected session group with default title:', error);
      }
    }
  
    // Close sidebar with animation
    Animated.spring(sidebarTranslateX, {
      toValue: -SIDEBAR_WIDTH,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    setIsSidebarOpen(false);
  };

  const handleVoiceTranscription = (text: string) => {
    setInputText(text);
    setIsRecording(false);
  };

  const handleVoiceError = (message: string) => {
    setToast({
      visible: true,
      message,
      type: 'error',
    });
    setIsRecording(false);
  };

  const handleVoiceInfo = (message: string) => {
    setToast({
      visible: true,
      message,
      type: 'info',
    });
  };

  const handleVoiceCancel = () => {
    setIsRecording(false);
  };

  const handleVoiceStart = () => {
    setIsRecording(true);
  };

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -SIDEBAR_WIDTH : 0;
    Animated.spring(sidebarTranslateX, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setToast({
        visible: true,
        message: error.message,
        type: 'error',
      });
    } else {
      router.replace('/login' as any);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isThinking) {
      return (
        <View className="mb-4 items-start px-5">
          <View className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
            <ThreeDotLoader size={4} color="#6B7280" speed={600} />
          </View>
        </View>
      );
    }

    if (item.isStreaming) {
      return (
        <View className="mb-4 items-start px-5">
          <View className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
            <Text className="text-gray-800 text-base">{item.text}</Text>
            <ThreeDotLoader size={4} color="#6B7280" speed={600} />
          </View>
        </View>
      );
    }
    
    return (
      <MessageBubble
        text={item.text}
        isUser={item.isUser}
        timestamp={item.timestamp}
      />
    );
  };

  const handleMenuItemPress = (title: string) => {
    if (title === 'Memory Profile') {
      router.push('/memory-profile' as any);
    } else if (title === 'Insights') {
      router.push('/insights' as any);
    } else if (title === 'Mantras') {
      router.push('/mantras' as any);
    } else if (title === 'Relationships') {
      router.push('/relationships' as any);
    } else if (title === 'Feedback History') {
      router.push('/feedback-history' as any);
    } else if (title === 'Settings') {
      router.push('/settings' as any);
    } else {
      setToast({
        visible: true,
        message: `${title} feature coming soon!`,
        type: 'info',
      });
    }
  };

  // Check for crisis flags
  const checkCrisisFlags = async () => {
    if (!currentUserId) return;

    try {
      const { data: crisisFlags, error } = await supabase
        .from('crisis_flags')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('reviewed', false)
        .order('triggered_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking crisis flags:', error);
        return;
      }

      if (crisisFlags && crisisFlags.length > 0) {
        console.log('🚨 Crisis flag detected for user:', currentUserId);
        setToast({
          visible: true,
          message: 'Crisis resources are available. Please reach out for support.',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error in crisis detection:', error);
    }
  };

  // Get user memory data for insights and profile
  const getUserMemoryData = async () => {
    if (!currentUserId) return null;

    try {
      const [memoryProfile, insights, innerParts] = await Promise.all([
        MemoryProcessingService.getMemoryProfile(currentUserId),
        MemoryProcessingService.getUserInsights(currentUserId, 5),
        MemoryProcessingService.getUserInnerParts(currentUserId)
      ]);

      return {
        memoryProfile,
        insights,
        innerParts
      };
    } catch (error) {
      console.error('Error getting user memory data:', error);
      return null;
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100); // Keep short for UI responsiveness
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    setShowScrollToBottom(!isAtBottom);
  };

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
          message="Loading your session..." 
          size="large" 
          showMessage={true}
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1 bg-white">
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={onToastHide}
        />

        {/* Header */}
        <View 
          className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200"
          style={{ zIndex: 10 }}
        >
          <TouchableOpacity onPress={toggleSidebar}>
            <MaterialIcons name="menu" size={24} color="#374151" />
          </TouchableOpacity>

          <Image
            source={require('../assets/images/logo.png')}
            className="h-8 w-24"
            resizeMode="contain"
          />

          <View className="flex-row items-center space-x-2">
            <TouchableOpacity 
              onPress={() => setIsFeedbackModalOpen(true)}
              className="mr-2"
            >
              <MaterialIcons name="bug-report" size={24} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleProfileMenu}>
              <MaterialIcons name="account-circle" size={28} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Memory Processing Status */}
        {memoryProcessingStatus.visible && (
          <Animated.View 
            className="absolute left-0 right-0"
            style={{
              top: 112, // Start at the very top
              transform: [{ translateY: memoryProcessingTranslateY }],
              zIndex: 5
            }}
          >
            <View className="bg-white border-b border-gray-200 shadow-sm">
              <View className="flex-row items-center justify-center px-4 py-3">
                <AluunaLoader 
                  message={memoryProcessingStatus.message}
                  size="small"
                  showMessage={true}
                  containerClassName="flex-row items-center"
                  messageClassName="text-sm text-gray-600 ml-3"
                />
              </View>
            </View>
          </Animated.View>
        )}

        {/* Main Content */}
        <KeyboardAvoidingView 
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ProximitySensor>
            {/* Messages */}
            <View className="flex-1">
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                className="flex-1 p-5"
                onContentSizeChange={() => {
                  setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
                }}
                onLayout={() => {
                  setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
                }}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                maintainVisibleContentPosition={{
                  minIndexForVisible: 0,
                }}
              />
              {showScrollToBottom && (
                <TouchableOpacity
                  onPress={scrollToBottom}
                  className="absolute left-1/2 bottom-2 w-9 h-9 rounded-full bg-white border-2 border-gray-400 items-center justify-center shadow-sm"
                  style={{ transform: [{ translateX: -18 }] }}
                >
                  <MaterialIcons name="arrow-downward" size={20} className="text-gray-400" />
                </TouchableOpacity>
              )}
            </View>

            {/* Input Area */}
            <View className="flex-row items-center px-4 py-3 border-t border-gray-200 bg-white">
              {!isRecording && (
                <TextInput
                  className="flex-1 border border-gray-300 rounded-2xl px-4 py-3 mr-3 text-base"
                  placeholder="Type your message..."
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                  editable={!isSending}
                />
              )}
              
              <VoiceInput
                onTranscription={handleVoiceTranscription}
                onError={handleVoiceError}
                onInfo={handleVoiceInfo}
                onCancel={handleVoiceCancel}
                onStart={handleVoiceStart}
                dialogueMode={dialogueMode}
                onDialogueTranscription={handleDialogueTranscription}
                disabled={isSending}
              />

              {!isRecording && (
                <TouchableOpacity
                  onPress={handleSendMessage}
                  disabled={isSending || !inputText.trim()}
                  className={`w-12 h-12 rounded-full items-center justify-center ml-2 ${
                    isSending || !inputText.trim() ? 'bg-gray-400' : 'bg-blue-custom active:bg-blue-active'
                  }`}
                >
                  {isSending ? (
                    <ThreeDotLoader size={4} color="white" speed={500} />
                  ) : (
                    <MaterialIcons name="send" size={20} color="white" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </ProximitySensor>
        </KeyboardAvoidingView>

        {/* Sidebar */}
        <Animated.View
          className="absolute top-0 bottom-0 left-0 bg-white shadow-lg"
          style={{
            width: SIDEBAR_WIDTH,
            transform: [{ translateX: sidebarTranslateX }],
            zIndex: 60,
          }}
        >
          <Sidebar
            sessionGroups={sessionGroups}
            currentSessionGroup={currentSessionGroup}
            onSessionGroupSelect={handleSessionGroupSelect}
            onNewSession={handleNewSession}
            isCreatingSession={isCreatingSession}
          />
        </Animated.View>

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
            onClose={() => {
              toggleProfileMenu();
            }}
            onLogout={handleLogout}
            onMenuItemPress={handleMenuItemPress}
          />
        </Animated.View>

        {/* Overlay for sidebar */}
        {isSidebarOpen && (
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={toggleSidebar}
            style={{ 
              backgroundColor: 'rgba(0,0,0,0.2)',
              zIndex: 50
            }}
          />
        )}

        {/* Overlay for profile menu */}
        {isProfileMenuOpen && (
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={toggleProfileMenu}
            style={{ 
              backgroundColor: 'rgba(0,0,0,0.2)',
              zIndex: 50
            }}
          />
        )}

        {/* Feedback Form Modal */}
        <FeedbackForm
          visible={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
} 