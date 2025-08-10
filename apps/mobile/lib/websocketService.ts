import { io, Socket } from 'socket.io-client';
import { config } from './config';

export interface StreamingMessage {
  type: 'start' | 'chunk' | 'end' | 'error';
  sessionId: string;
  messageId: string;
  content?: string;
  error?: string;
  structuredData?: any;
}

export interface TrueStreamingMessage {
  type: 'start' | 'token' | 'done' | 'error';
  sessionId: string;
  messageId: string;
  token?: string;
  error?: string;
  chunkIndex?: number;
  totalChunks?: number;
  timestamp: string;
}

export interface StreamingRequest {
  userMessage: string;
  sessionContext: any;
  conversationHistory: any[];
  sessionId: string;
  messageId: string;
}

export interface TrueStreamingRequest {
  userMessage: string;
  currentContext: any;
  conversationHistory: any[];
  sessionId: string;
  messageId: string;
  temperature?: number;
  maxTokens?: number;
  userId?: string;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  // Initialize WebSocket connection
  async connect(): Promise<void> {
    if (this.socket && this.isConnected) {
      return;
    }

    // Validate WebSocket URL
    if (!config.websocket.url || config.websocket.url.trim() === '') {
      console.log('🔌 WebSocket URL not configured, skipping WebSocket connection');
      return;
    }

    try {
      // Connect to WebSocket server
      this.socket = io(config.websocket.url, {
        transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        forceNew: true,
        autoConnect: true,
        // Add headers for Railway
        extraHeaders: {
          'User-Agent': 'Aluuna-Mobile-App',
        },
        // Add query parameters for debugging
        query: {
          client: 'mobile-app',
          version: '1.0.0',
        },
      });

      this.socket.on('connect', () => {
        console.log('🔌 WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔌 WebSocket connection error:', error);
        this.isConnected = false;
        // Only attempt reconnection if we haven't exceeded max attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.handleReconnect();
        } else {
          console.log('🔌 Max reconnection attempts reached, stopping reconnection attempts');
        }
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('🔌 WebSocket reconnected after', attemptNumber, 'attempts');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.socket.on('reconnect_failed', () => {
        console.error('🔌 WebSocket reconnection failed');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      throw error;
    }
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Send streaming request
  async sendStreamingRequest(request: StreamingRequest): Promise<void> {
    if (!this.socket || !this.isConnected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('WebSocket not connected - check if WebSocket URL is configured'));
        return;
      }

      this.socket.emit('streaming_request', request, (ack: any) => {
        if (ack.success) {
          resolve();
        } else {
          reject(new Error(ack.error || 'Failed to send streaming request'));
        }
      });
    });
  }

  // Send true streaming request (new endpoint)
  async sendTrueStreamingRequest(request: TrueStreamingRequest): Promise<void> {
    console.log('🔌 sendTrueStreamingRequest called');
    console.log('🔌 Socket connected:', this.isSocketConnected());
    
    if (!this.socket || !this.isConnected) {
      console.log('🔌 WebSocket not connected, attempting to connect...');
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        console.error('❌ WebSocket still not connected after connect attempt');
        reject(new Error('WebSocket not connected - check if WebSocket URL is configured'));
        return;
      }

      console.log('🔌 Sending true_streaming_request via socket.emit');
      console.log('🔌 Current socket ID:', this.socket.id);
      console.log('🔌 Socket connected status:', this.socket.connected);
      console.log('🔌 Request details:', {
        messageId: request.messageId,
        sessionId: request.sessionId,
        userMessageLength: request.userMessage?.length,
        currentContextKeys: request.currentContext ? Object.keys(request.currentContext).length : 0
      });

      this.socket.emit('true_streaming_request', request, (ack: any) => {
        console.log('🔌 Received acknowledgment from server:', ack);
        if (ack.success) {
          console.log('🔌 True streaming request sent successfully');
          resolve();
        } else {
          console.error('❌ Server rejected true streaming request:', ack.error);
          reject(new Error(ack.error || 'Failed to send true streaming request'));
        }
      });
    });
  }

  // Listen for streaming messages
  onStreamingMessage(callback: (message: StreamingMessage) => void): void {
    if (!this.socket) {
      console.warn('WebSocket not connected, cannot listen for messages');
      return;
    }

    this.socket.on('streaming_message', callback);
  }

  // Listen for true streaming messages (new endpoint)
  onTrueStreamingMessage(callback: (message: TrueStreamingMessage) => void): void {
    if (!this.socket) {
      console.warn('WebSocket not connected, cannot listen for true streaming messages');
      return;
    }

    // If socket is not connected yet, wait for connection
    if (!this.socket.connected || !this.socket.id) {
      this.socket.once('connect', () => {
        this.setupTrueStreamingListener(callback);
      });
      return;
    }
    
    this.setupTrueStreamingListener(callback);
  }

  private setupTrueStreamingListener(callback: (message: TrueStreamingMessage) => void): void {
    if (!this.socket) return;
    
    // Remove any existing listeners first
    this.socket.off('true_streaming_message');
    
    this.socket.on('true_streaming_message', (message: TrueStreamingMessage) => {
      callback(message);
    });
  }

  // Remove streaming message listener
  offStreamingMessage(callback: (message: StreamingMessage) => void): void {
    if (this.socket) {
      this.socket.off('streaming_message', callback);
    }
  }

  // Remove true streaming message listener
  offTrueStreamingMessage(callback: (message: TrueStreamingMessage) => void): void {
    if (this.socket) {
      this.socket.off('true_streaming_message', callback);
    }
  }

  // Check connection status
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Handle reconnection logic
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000); // Exponential backoff, max 10s
      
      setTimeout(() => {
        console.log(`🔌 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay);
    }
  }

  // Get connection status
  getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
    };
  }
}

// Export singleton instance
export const websocketService = WebSocketService.getInstance(); 