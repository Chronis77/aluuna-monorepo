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
import { MarkdownMessage } from '../components/MarkdownMessage';
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
import { useAuth } from '../context/AuthContext';
import { config } from '../lib/config';
import { ContextService } from '../lib/contextService';
import { MemoryProcessingService } from '../lib/memoryProcessingService';
import { Message as OpenAIMessage, ConversationResponseService as OpenAIService } from '../lib/conversationResponseService';
import { ConversationService } from '../lib/conversationService';
import { speechManager } from '../lib/speechManager';
import { trpcClient } from '../lib/trpcClient';
import { voicePreferencesService } from '../lib/voicePreferencesService';
import { Conversation } from '../types/database';

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
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [dialogueMode, setDialogueMode] = useState(false);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
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
  // Note: main handleMenuItemPress lives below with onboarding handling

  const [toolActivityStatus, setToolActivityStatus] = useState<{
    visible: boolean;
    message: string;
    type: 'memory' | 'insight' | 'mantra' | 'coping' | 'goal' | 'theme' | 'relationship' | 'practice' | 'general';
  }>({
    visible: false,
    message: '',
    type: 'general',
  });

  const toolActivityTranslateY = useRef(new Animated.Value(-60)).current;
  // Queue to serialize tool activity notifications in the UI
  const toolNotificationQueueRef = useRef<{ toolName: string; data?: any }[]>([]);
  const isProcessingToolQueueRef = useRef(false);

  const sidebarTranslateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const profileMenuTranslateX = useRef(new Animated.Value(screenWidth)).current;
  const flatListRef = useRef<FlatList>(null);

  // Initialize the session screen when user is available
  useEffect(() => {
    if (user) {
      initializeSession();
    }
  }, [user]);

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

  // Enhanced scroll behavior for streaming messages
  const scrollToBottomWithOffset = (offset: number = 0) => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
      // Additional scroll after a short delay to account for content rendering
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }, 100);
  };

  // More aggressive scroll for streaming content
  const scrollToBottomForStreaming = () => {
    // Initial scroll
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
    
    // Multiple follow-up scrolls to ensure content is visible
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 300);
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 500);
  };

  // Scroll with offset to account for loading dots and text height
  const scrollToBottomWithPadding = () => {
    setTimeout(() => {
      // Try to scroll to end with some padding
      flatListRef.current?.scrollToEnd({ animated: true });
      
      // Additional scroll after content renders
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 100);
  };

  // Force scroll to bottom with extra padding
  const forceScrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 200);
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 400);
  };

  // Scroll to actual bottom of content container
  const scrollToActualBottom = () => {
    setTimeout(() => {
      // Scroll to the bottom of the content container with large offset
      flatListRef.current?.scrollToOffset({ 
        offset: 999999, // Large offset to ensure we reach the bottom
        animated: true 
      });
    }, 100);
    
    // Additional scroll attempts
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ 
        offset: 999999, 
        animated: true 
      });
    }, 300);
    
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ 
        offset: 999999, 
        animated: true 
      });
    }, 500);
  };

  // Fast scroll for streaming text updates
  const fastScrollToBottom = () => {
    // Immediate scroll
    flatListRef.current?.scrollToOffset({ 
      offset: 999999, 
      animated: false // No animation for faster response
    });
    
    // Quick follow-up scroll
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ 
        offset: 999999, 
        animated: false 
      });
    }, 10);
  };

  // Consistent scroll for completion (same as initial page load)
  const scrollToBottomOnComplete = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ 
        offset: 999999, 
        animated: true 
      });
    }, 100);
  };

  // Force scroll to actual bottom with multiple attempts
  const forceScrollToActualBottom = () => {
    // Immediate scroll
    flatListRef.current?.scrollToOffset({ 
      offset: 999999, 
      animated: false 
    });
    
    // Multiple follow-up scrolls to override any automatic scrolling
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ 
        offset: 999999, 
        animated: false 
      });
    }, 50);
    
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ 
        offset: 999999, 
        animated: false 
      });
    }, 150);
    
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ 
        offset: 999999, 
        animated: false 
      });
    }, 300);
  };

  // Smooth scroll to actual bottom for completion
  const smoothScrollToActualBottom = () => {
    // Immediate smooth scroll
    flatListRef.current?.scrollToOffset({ 
      offset: 999999, 
      animated: true 
    });
    
    // Follow-up smooth scroll to ensure we stay at bottom
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ 
        offset: 999999, 
        animated: true 
      });
    }, 200);
  };

  const initializeSession = async () => {
    try {
      setIsLoading(true);
      
      // Test database connection first
      console.log('🔍 Testing database connection...');
      await ConversationService.testDatabaseConnection();
      
      // Check authentication state
      console.log('🔐 Checking authentication state...');
      
      if (!user) {
        console.log('⚠️ No authenticated user found, redirecting to login');
        router.replace('/login' as any);
        return;
      }
      
      setCurrentUserId(user.id);
      console.log('✅ User authenticated:', user.id);

      // Check onboarding status to enable Resume/Complete Onboarding menu
      try {
        const onboardingStatus = await trpcClient.checkOnboardingStatus(user.id);
        // Show menu item when onboarding_completed_at is null (regardless of skipped flag)
        const showComplete = onboardingStatus && 'completedAt' in onboardingStatus
          ? onboardingStatus.completedAt === null
          : true;
        setShouldShowOnboarding(showComplete);
      } catch (e) {
        console.warn('⚠️ Failed to check onboarding status (menu will be hidden by default):', e);
        setShouldShowOnboarding(false);
      }

      // Load conversations
      const groups = await ConversationService.getConversations(user.id, session?.token);
      setConversations(groups);

      // Get or create current conversation
      let currentGroup = await ConversationService.getLatestConversation(user.id, session?.token);
      
      if (!currentGroup) {
        // Create new conversation without title (will be generated later)
        const contextJson = ContextService.buildContextJson();
        currentGroup = await ConversationService.createConversation(user.id, '', contextJson, session?.token);
        setConversations(prev => [currentGroup!, ...prev]);
      }

      setCurrentConversation(currentGroup);

      // Load messages for current conversation
      await loadMessages(currentGroup.id);

      // Generate default title if conversation doesn't have one
      if (!currentGroup.title || currentGroup.title.trim() === '') {
        const defaultTitle = ContextService.generateSessionTitle(new Date(currentGroup.started_at));
        console.log('Generating default title for existing conversation:', defaultTitle);
        console.log('Conversation ID:', currentGroup.id);
        console.log('Conversation started at:', currentGroup.started_at);
        
        // Test RLS policies first
        await ConversationService.testRLSPolicies(currentGroup.id);
        
        try {
          await ConversationService.updateConversation(currentGroup.id, {
            title: defaultTitle,
          }, session?.token);

          // Update local state
          setCurrentConversation(prev => prev ? { ...prev, title: defaultTitle } : null);
          setConversations(prev => 
            prev.map(group => 
              group.id === currentGroup.id 
                ? { ...group, title: defaultTitle }
                : group
            )
          );
          
          console.log('✅ Successfully updated conversation with default title');
        } catch (error) {
          console.error('❌ Failed to update conversation with default title:', error);
        }
      }

      // Add initial greeting only if this is a completely new conversation with no messages
      const dbSessions = await ConversationService.getConversationMessagesForConversation(currentGroup.id, session?.token);
      const hasExistingMessages = dbSessions.some((session: any) => 
        session.input_transcript || session.gpt_response
      );
      
      console.log('Conversation initialization check:');
      console.log('- Conversation ID:', currentGroup.id);
      console.log('- Total messages in conversation:', dbSessions.length);
      console.log('- Has existing messages:', hasExistingMessages);
      console.log('- Messages with content:', dbSessions.filter((s: any) => s.input_transcript || s.gpt_response).length);
      
      if (!hasExistingMessages) {
        console.log('✅ New conversation detected, adding greeting message');
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
        // Store only as AI response (gpt_response), not as user input
        await ConversationService.addConversationMessage(currentGroup.id, user.id, undefined, greeting);
      } else {
        console.log('✅ Existing conversation with messages, skipping greeting');
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

  const loadMessages = async (conversationId: string) => {
    try {
      console.log('Loading messages for conversation:', conversationId);
      const dbSessions = await ConversationService.getConversationMessagesForConversation(conversationId);
      console.log('Found', dbSessions.length, 'messages for this conversation');
      
      const messageList: Message[] = [];
      
      dbSessions.forEach((session: any) => {
        const hasUser = !!session.input_transcript;
        const hasAi = !!session.gpt_response;
        const isDuplicateGreeting = hasUser && hasAi && String(session.input_transcript).trim() === String(session.gpt_response).trim();

        // Add user message if it exists and is not a duplicate of AI greeting
        if (hasUser && !isDuplicateGreeting) {
          messageList.push({
            id: `${session.id}-user`,
            text: session.input_transcript,
            isUser: true,
            timestamp: new Date(session.created_at),
          });
        }
        
        // Add AI response if it exists
        if (hasAi) {
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
    if (!inputText.trim() || !currentConversation || !currentUserId || isSending) return;

    console.log('Sending message to conversation:', currentConversation.id, 'Title:', currentConversation.title);

    const userMessage = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      // Save user message to database first
      const sessionRecord = await ConversationService.addConversationMessage(currentConversation.id, currentUserId, userMessage);

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
      
      // Ensure scroll to bottom after adding messages with enhanced timing
      scrollToActualBottom();

      // Load fresh messages from database to ensure we have the correct conversation history
      const dbSessions = await ConversationService.getConversationMessagesForConversation(currentConversation.id);
      const conversationHistory: OpenAIMessage[] = [];
      
      dbSessions.forEach((session: any) => {
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
        ...ContextService.buildSessionContext({
          name: 'User', // Default name
          themes: [],
          people: [],
          coping_tools: [],
          emotional_trends: {},
          recent_insights: [],
          ongoing_goals: [],
          triggers: [],
          strengths: [],
          preferences: {
            communication_style: 'direct',
            session_length: 'medium',
            focus_areas: []
          }
        }),
        sessionId: currentConversation.id
      };
      
      // Add user ID to the context for metadata processing
      sessionContext.userProfile = {
        ...sessionContext.userProfile,
        user_id: currentUserId
      } as any;

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
      console.log('🔍 ABOUT TO CALL GENERATE STREAMING RESPONSE');
      await OpenAIService.generateStreamingResponse(
        userMessage,
        sessionContext,
        conversationHistory,
        currentConversation!.id,
        streamingMessageId,
        sessionRecordId,
        {
          onStart: () => {
            console.log('🚀 AI streaming started');
            // Scroll to show loading dots
            scrollToActualBottom();
          },
          onToolCall: (toolName: string, toolData?: any) => {
            console.log('🔧 Tool called:', toolName, toolData);
            // Enqueue tool notifications to process sequentially
            toolNotificationQueueRef.current.push({ toolName, data: toolData });
            processToolNotificationQueue();
          },
          onChunk: (chunk: string, isComplete: boolean) => {
            if (isComplete) {
              // Streaming complete
              setMessages(prev => prev.map(msg => 
                msg.id === streamingMessageId 
                  ? { ...msg, isStreaming: false }
                  : msg
              ));
              // Ensure we stay at the bottom when streaming completes
              fastScrollToBottom();
            } else {
              // Update streaming message - hide loading dots after first chunk
              setMessages(prev => prev.map(msg => 
                msg.id === streamingMessageId 
                  ? { ...msg, text: msg.text + chunk, isStreaming: false }
                  : msg
              ));
              
              // Scroll to keep text visible as it streams
              if (chunk.length > 0) {
                fastScrollToBottom();
              }
            }
          },
          onComplete: (fullResponse: string) => {
            console.log('✅ AI response completed');
            
            // Smooth scroll to actual bottom BEFORE updating the message
            smoothScrollToActualBottom();
            
            // Final update to ensure complete response
            setMessages(prev => prev.map(msg => 
              msg.id === streamingMessageId 
                ? { ...msg, text: fullResponse, isStreaming: false }
                : msg
            ));

            // Smooth scroll again AFTER updating the message
            setTimeout(() => {
              smoothScrollToActualBottom();
            }, 100);

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
      // Update the conversation message with AI response
      await ConversationService.updateConversationMessageWithResponse(sessionRecordId, aiResponse);

      // Load fresh conversation history for metadata update
      const dbSessions = await ConversationService.getConversationMessagesForConversation(currentConversation!.id);
      const conversationHistory: OpenAIMessage[] = [];
      
      dbSessions.forEach((session: any) => {
        if (session.input_transcript) {
          conversationHistory.push({ role: 'user' as const, content: session.input_transcript });
        }
        if (session.gpt_response) {
          conversationHistory.push({ role: 'assistant' as const, content: session.gpt_response });
        }
      });

      // Update conversation title and summary immediately after AI response
      const updatedConversationHistory = [...conversationHistory, { role: 'assistant' as const, content: aiResponse }];
      
      // Always update metadata after receiving AI response
      await updateConversationMetadata(updatedConversationHistory);

      // Check for crisis flags after processing
      await checkCrisisFlags();

    } catch (error) {
      console.error('Error processing memory and metadata:', error);
    }
  };

  // New function to handle dialogue mode transcription
  const handleDialogueTranscription = async (text: string) => {
    if (!currentConversation || !currentUserId || isSending) return;

    console.log('Dialogue mode: Processing transcribed text:', text);

    const userMessage = text.trim();
    setIsSending(true);
    setIsRecording(false); // Ensure recording state is reset

    try {
      // Save user message to database first
      const sessionRecord = await ConversationService.addConversationMessage(currentConversation.id, currentUserId, userMessage);

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
      const dbSessions = await ConversationService.getConversationMessagesForConversation(currentConversation.id);
      const conversationHistory: OpenAIMessage[] = [];
      
      dbSessions.forEach((session: any) => {
        if (session.input_transcript) {
          conversationHistory.push({ role: 'user' as const, content: session.input_transcript });
        }
        if (session.gpt_response) {
          conversationHistory.push({ role: 'assistant' as const, content: session.gpt_response });
        }
      });

      // Add current user message to history
      conversationHistory.push({ role: 'user' as const, content: userMessage });

      // Build session context with conversation ID for continuity tracking
      const sessionContext = {
        ...ContextService.buildSessionContext(),
        sessionId: currentConversation?.id || null
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

  const updateConversationMetadata = async (conversationHistory: OpenAIMessage[]) => {
    if (!currentConversation) return;

    try {
      console.log('Updating conversation metadata for conversation:', currentConversation.id);
      
      // Check if we should generate AI title and summary (after 4 back-and-forth interactions)
      const shouldGenerateAI = OpenAIService.shouldSummarizeSession(conversationHistory);
      const hasNoTitle = !currentConversation.title || currentConversation.title.trim() === '';
      const hasDefaultTitle = currentConversation.title && (
        currentConversation.title.includes("Today's Session") || 
        currentConversation.title.includes("Yesterday's Session") ||
        currentConversation.title.includes("Session")
      );
      const hasAISummary = currentConversation.context_summary && currentConversation.context_summary.trim() !== '';
      
      console.log('Conversation metadata update check:');
      console.log('- Should generate AI:', shouldGenerateAI);
      console.log('- Has no title:', hasNoTitle);
      console.log('- Has default title:', hasDefaultTitle);
      console.log('- Has AI summary:', hasAISummary);
      console.log('- Current title:', currentConversation.title);
      console.log('- Current summary:', currentConversation.context_summary);
      console.log('- Conversation history length:', conversationHistory.length);
      
      if (shouldGenerateAI && (hasNoTitle || hasDefaultTitle) && !hasAISummary) {
        console.log('Requesting server to generate title and summary after 4+ interactions');
        
        // Check if we're already generating a title to prevent duplicates
        const isGeneratingKey = `generating_title_${currentConversation.id}`;
        if ((globalThis as any)[isGeneratingKey]) {
          console.log('Title generation already in progress, skipping...');
          return;
        }
        (globalThis as any)[isGeneratingKey] = true;
        
        try {
          const messages = conversationHistory
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({ role: m.role as 'user'|'assistant', content: m.content }));
          // Client log: about to request title/summary generation
          try {
            const last = messages[messages.length - 1]?.content || '';
            const first = messages[0]?.content || '';
            console.log('🟣 TS: Client requesting title/summary generation', {
              userId: currentUserId,
              conversationId: currentConversation.id,
              messageCount: messages.length,
              firstMessagePreview: first.slice(0, 120),
              lastMessagePreview: last.slice(0, 120)
            });
          } catch (e) {
            console.log('🟣 TS: Client logging of request payload failed (non-fatal)', e);
          }
          const { title: newTitle, summary: newSummary } = await trpcClient.generateConversationTitleAndSummary(currentUserId!, currentConversation.id, messages);
          // Client log: received response from server
          try {
            console.log('🟣 TS: Client received title/summary from server', {
              conversationId: currentConversation.id,
              newTitle,
              newSummaryPreview: (newSummary || '').slice(0, 200),
              titleLength: newTitle?.length ?? 0,
              summaryLength: newSummary?.length ?? 0
            });
          } catch (e) {
            console.log('🟣 TS: Client logging of server response failed (non-fatal)', e);
          }

          // Client log: saving to DB
          try {
            console.log('🟣 TS: Client saving title/summary to conversation', {
              conversationId: currentConversation.id,
              titleToSave: newTitle,
              summaryPreviewToSave: (newSummary || '').slice(0, 200)
            });
          } catch {}

          await ConversationService.updateConversation(currentConversation.id, { title: newTitle, context_summary: newSummary });
          setCurrentConversation(prev => prev ? { ...prev, title: newTitle, context_summary: newSummary } : null);
          setConversations(prev => prev.map(group => group.id === currentConversation.id ? { ...group, title: newTitle, context_summary: newSummary } : group));
          console.log('🟣 TS: Client title and summary persisted locally (and via server)');
        } finally {
          (globalThis as any)[isGeneratingKey] = false;
        }
      } else if (hasNoTitle && !hasAISummary) {
        // Generate default title based on date if no title exists and no AI summary
        const defaultTitle = ContextService.generateSessionTitle(new Date(currentConversation.started_at));
        console.log('Generating default title:', defaultTitle);
        
        await ConversationService.updateConversation(currentConversation.id, {
          title: defaultTitle,
        });

        // Update local state
        setCurrentConversation(prev => prev ? { ...prev, title: defaultTitle } : null);
        setConversations(prev => 
          prev.map(group => 
            group.id === currentConversation.id 
              ? { ...group, title: defaultTitle }
              : group
          )
        );

        console.log('Successfully updated with default title');
              } else {
          if (hasAISummary) {
            console.log('Conversation already has AI-generated summary, skipping metadata update');
          } else {
            console.log('Conversation already has title, skipping metadata update');
          }
        }

    } catch (error) {
      console.error('Error updating conversation metadata:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
  };

  const handleNewSession = async () => {
    if (!currentUserId) return;

    try {
      setIsCreatingSession(true);
      
      // Create new conversation without title (will be generated later)
      const contextJson = ContextService.buildContextJson();
      const newConversation = await ConversationService.createConversation(currentUserId, '', contextJson);

      // Create session continuity record for the new session
      // Temporarily disabled to fix circular dependency
      console.log('📊 Session continuity initialization temporarily disabled');

      // Update state
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      
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
      await ConversationService.addConversationMessage(newConversation.id, currentUserId, greeting, greeting);

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

  const handleConversationSelect = async (conversation: Conversation) => {
    console.log('Selecting conversation:', conversation.id, 'Title:', conversation.title);
    setCurrentConversation(conversation);
    
    // Clear current messages first
    setMessages([]);
    
    // Load messages for the selected conversation
    await loadMessages(conversation.id);
    
    // Ensure session continuity record exists for this conversation
    // Temporarily disabled to fix circular dependency
    console.log('📊 Session continuity check temporarily disabled');
    
    // Generate default title if conversation doesn't have one
    if (!conversation.title || conversation.title.trim() === '') {
      const defaultTitle = ContextService.generateSessionTitle(new Date(conversation.started_at));
      console.log('🚨🚨🚨🚨🚨Generating default title for selected conversation:', defaultTitle);
      console.log('Conversation ID:', conversation.id);
      
      try {
        await ConversationService.updateConversation(conversation.id, {
          title: defaultTitle,
        });

                  // Update local state
          setCurrentConversation(prev => prev ? { ...prev, title: defaultTitle } : null);
          setConversations(prev =>
            prev.map(group =>
              group.id === conversation.id
                ? { ...group, title: defaultTitle }
                : group
            )
          );
        
                  console.log('✅ Successfully updated selected conversation with default title');
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
    // If opening sidebar, ensure profile menu is closed
    if (!isSidebarOpen && isProfileMenuOpen) {
      Animated.spring(profileMenuTranslateX, {
        toValue: screenWidth,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
      setIsProfileMenuOpen(false);
    }
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
    // If opening profile menu, ensure sidebar is closed
    if (!isProfileMenuOpen && isSidebarOpen) {
      Animated.spring(sidebarTranslateX, {
        toValue: -SIDEBAR_WIDTH,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
      setIsSidebarOpen(false);
    }
    Animated.spring(profileMenuTranslateX, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      // TODO: Implement logout with tRPC when ready
      console.log('Logging out...');
      router.replace('/login' as any);
    } catch (error) {
      console.error('Error during logout:', error);
      setToast({
        visible: true,
        message: 'Error during logout',
        type: 'error',
      });
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isThinking) {
      return (
        <View className="mb-3 items-start px-5">
          <View className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
            <ThreeDotLoader size={3} color="#6B7280" speed={600} />
          </View>
        </View>
      );
    }

    if (item.isStreaming) {
      return (
        <View className="mb-3 items-start px-5">
          <View className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
            {item.text ? (
              <View className="flex-row items-center">
                <View className="flex-1 pr-3">
                  <MarkdownMessage text={item.text} color="#1F2937" />
                </View>
                <View className="m-3 ml-0 pl-0">
                  <ThreeDotLoader size={3} color="#6B7280" speed={600} />
                </View>
              </View>
            ) : (
              <View className="py-2 items-center justify-center">
                <ThreeDotLoader size={3} color="#6B7280" speed={600} />
              </View>
            )}
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
    } else if (title === 'Daily Practices') {
      router.push('/daily-practices' as any);
    } else if (title === 'Goals') {
      router.push('/goals' as any);
    } else if (title === 'Complete Onboarding') {
      // Attempt to resume where the user left off
      resumeOnboarding();
    } else {
      setToast({
        visible: true,
        message: `${title} feature coming soon!`,
        type: 'info',
      });
    }
  };

  const resumeOnboarding = async () => {
    if (!currentUserId) {
      router.push('/onboarding/step1' as any);
      return;
    }
    try {
      const progress = await trpcClient.getOnboardingProgress(currentUserId);
      const data = progress?.onboarding_data || {};
      // Determine next step based on completed data
      const has1 = !!data.step1;
      const has2 = !!data.step2;
      const has3 = !!data.step3;
      const has4 = !!data.step4;
      const has5 = !!data.step5;
      let nextStep = 1;
      if (has1 && !has2) nextStep = 2;
      else if (has1 && has2 && !has3) nextStep = 3;
      else if (has1 && has2 && has3 && !has4) nextStep = 4;
      else if (has1 && has2 && has3 && has4 && !has5) nextStep = 5;
      else if (has1 && has2 && has3 && has4 && has5) nextStep = 6;
      router.push(`/onboarding/step${nextStep}` as any);
    } catch (error) {
      console.error('Failed to fetch onboarding progress, sending to step1:', error);
      router.push('/onboarding/step1' as any);
    }
  };

  // Check for crisis flags
  const checkCrisisFlags = async () => {
    if (!currentUserId) return;

    try {
      const crisisFlags = await trpcClient.getCrisisFlags(currentUserId);

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

  // Internal: process the queued tool notifications one-by-one
  const processToolNotificationQueue = () => {
    if (isProcessingToolQueueRef.current) return;
    if (toolNotificationQueueRef.current.length === 0) return;
    isProcessingToolQueueRef.current = true;
    const next = toolNotificationQueueRef.current.shift()!;
    showToolActivityNotification(next.toolName, next.data).finally(() => {
      isProcessingToolQueueRef.current = false;
      // Defer to next frame to allow layout to settle
      requestAnimationFrame(() => processToolNotificationQueue());
    });
  };

  // Show tool activity notification (returns a promise to allow sequential chaining)
  const showToolActivityNotification = async (toolName: string, data?: any) => {
    let message = '';
    let type: 'memory' | 'insight' | 'mantra' | 'coping' | 'goal' | 'theme' | 'relationship' | 'practice' | 'general' = 'general';

    switch (toolName) {
      case 'storeInsight':
        message = 'New insight saved';
        type = 'insight';
        break;
      case 'storeMantra':
        message = 'New mantra added';
        type = 'mantra';
        break;
      case 'storeCopingTool':
        message = 'New coping tool saved';
        type = 'coping';
        break;
      case 'storeGoal':
        message = 'New goal added';
        type = 'goal';
        break;
      case 'storeTheme':
        message = 'New theme identified';
        type = 'theme';
        break;
      case 'storeShadowTheme':
        message = 'Shadow theme saved';
        type = 'theme';
        break;
      case 'storePatternLoop':
        message = 'Pattern loop saved';
        type = 'theme';
        break;
      case 'storeRelationship':
        message = 'Relationship details updated';
        type = 'relationship';
        break;
      case 'storeSupportSystem':
        message = 'Support person added';
        type = 'relationship';
        break;
      case 'createDailyPractice':
      case 'logDailyPractice':
        message = 'Daily practice updated';
        type = 'practice';
        break;
      case 'getMemoryProfile':
        message = 'Loading your memory profile...';
        type = 'memory';
        break;
      case 'setValuesCompass':
        message = 'Value compass updated';
        type = 'memory';
        break;
      case 'storeRegulationStrategy':
        message = 'Regulation strategy saved';
        type = 'coping';
        break;
      case 'storeDysregulatingFactor':
        message = 'Dysregulating factor saved';
        type = 'memory';
        break;
      case 'storeStrength':
        message = 'Strength added';
        type = 'memory';
        break;
      case 'memorySearch':
        message = 'Searching your memories...';
        type = 'memory';
        break;
      case 'logMoodTrend':
        message = 'Mood trend logged';
        type = 'general';
        break;
      case 'storeInnerPart':
        message = 'Inner part added';
        type = 'memory';
        break;
      default:
        message = `${toolName} completed`;
        type = 'general';
    }

    // Wrap in a promise to coordinate sequential display
    await new Promise<void>((resolve) => {
      // Defer state updates to avoid scheduling updates during insertion phase
      requestAnimationFrame(() => {
        setToolActivityStatus({
          visible: true,
          message,
          type,
        });

        // Animate in
        Animated.spring(toolActivityTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();

        // Auto-hide after 3 seconds
        setTimeout(() => {
          Animated.spring(toolActivityTranslateY, {
            toValue: -60,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start(() => {
            setToolActivityStatus(prev => ({ ...prev, visible: false }));
            resolve();
          });
        }, 3000);
      });
    });
  };

  // Get user memory data for insights and profile
  const getUserMemoryData = async () => {
    if (!currentUserId) return null;

    try {
      const [memoryProfile, insights, innerParts] = await Promise.all([
        MemoryProcessingService.getMemoryProfile(currentUserId),
        trpcClient.getInsights(currentUserId),
        trpcClient.getInnerParts(currentUserId)
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

        {/* Tool Activity Status */}
        {toolActivityStatus.visible && (
          <Animated.View 
            className="absolute left-0 right-0"
            style={{
              top: 112, // Start at the very top
              transform: [{ translateY: toolActivityTranslateY }],
              zIndex: 5
            }}
          >
            <View className="bg-white border-b border-gray-200 shadow-sm">
              <View className="flex-row items-center justify-center px-4 py-3">
                <AluunaLoader 
                  message={toolActivityStatus.message}
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
                contentContainerStyle={{ 
                  paddingBottom: 8, // Extra padding to ensure content is visible
                  flexGrow: 1 
                }}
                onContentSizeChange={() => {
                  setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 999999, animated: true }), 100);
                }}
                onLayout={() => {
                  setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 999999, animated: true }), 100);
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
            conversations={conversations}
            currentConversation={currentConversation}
            onConversationSelect={handleConversationSelect}
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
            onboardingSkipped={shouldShowOnboarding}
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