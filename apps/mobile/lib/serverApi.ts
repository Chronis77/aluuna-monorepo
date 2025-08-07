import { config } from './config';

// Server API client for mobile app
class ServerApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = config.server.url;
    this.apiKey = config.server.apiKey;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Authentication endpoints
  async getUser() {
    return this.request('/api/auth/user');
  }

  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name?: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  // Conversation endpoints
  async createConversation(input: any) {
    return this.request('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async getConversations(userId: string) {
    return this.request(`/api/conversations?userId=${userId}`);
  }

  async getConversation(conversationId: string) {
    return this.request(`/api/conversations/${conversationId}`);
  }

  async updateConversation(conversationId: string, updates: any) {
    return this.request(`/api/conversations/${conversationId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Memory profile endpoints
  async getMemoryProfile(userId: string) {
    return this.request(`/api/memory-profiles/${userId}`);
  }

  async updateMemoryProfile(userId: string, updates: any) {
    return this.request(`/api/memory-profiles/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async createMemoryProfile(profile: any) {
    return this.request('/api/memory-profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  // Inner parts endpoints
  async getInnerParts(userId: string, sessionId?: string) {
    const params = sessionId ? `?userId=${userId}&sessionId=${sessionId}` : `?userId=${userId}`;
    return this.request(`/api/inner-parts${params}`);
  }

  async createInnerPart(innerPart: any) {
    return this.request('/api/inner-parts', {
      method: 'POST',
      body: JSON.stringify(innerPart),
    });
  }

  async updateInnerPart(innerPartId: string, updates: any) {
    return this.request(`/api/inner-parts/${innerPartId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Stuck points endpoints
  async getStuckPoints(userId: string, sessionId?: string) {
    const params = sessionId ? `?userId=${userId}&sessionId=${sessionId}` : `?userId=${userId}`;
    return this.request(`/api/stuck-points${params}`);
  }

  async createStuckPoint(stuckPoint: any) {
    return this.request('/api/stuck-points', {
      method: 'POST',
      body: JSON.stringify(stuckPoint),
    });
  }

  // Coping tools endpoints
  async getCopingTools(userId: string, sessionId?: string) {
    const params = sessionId ? `?userId=${userId}&sessionId=${sessionId}` : `?userId=${userId}`;
    return this.request(`/api/coping-tools${params}`);
  }

  async createCopingTool(copingTool: any) {
    return this.request('/api/coping-tools', {
      method: 'POST',
      body: JSON.stringify(copingTool),
    });
  }

  // Shadow themes endpoints
  async getShadowThemes(userId: string, sessionId?: string) {
    const params = sessionId ? `?userId=${userId}&sessionId=${sessionId}` : `?userId=${userId}`;
    return this.request(`/api/shadow-themes${params}`);
  }

  async createShadowTheme(shadowTheme: any) {
    return this.request('/api/shadow-themes', {
      method: 'POST',
      body: JSON.stringify(shadowTheme),
    });
  }

  // Pattern loops endpoints
  async getPatternLoops(userId: string, sessionId?: string) {
    const params = sessionId ? `?userId=${userId}&sessionId=${sessionId}` : `?userId=${userId}`;
    return this.request(`/api/pattern-loops${params}`);
  }

  async createPatternLoop(patternLoop: any) {
    return this.request('/api/pattern-loops', {
      method: 'POST',
      body: JSON.stringify(patternLoop),
    });
  }

  // Mantras endpoints
  async getMantras(userId: string, sessionId?: string) {
    const params = sessionId ? `?userId=${userId}&sessionId=${sessionId}` : `?userId=${userId}`;
    return this.request(`/api/mantras${params}`);
  }

  async createMantra(mantra: any) {
    return this.request('/api/mantras', {
      method: 'POST',
      body: JSON.stringify(mantra),
    });
  }

  async updateMantra(mantraId: string, updates: any) {
    return this.request(`/api/mantras/${mantraId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Relationships endpoints
  async getRelationships(userId: string, sessionId?: string) {
    const params = sessionId ? `?userId=${userId}&sessionId=${sessionId}` : `?userId=${userId}`;
    return this.request(`/api/relationships${params}`);
  }

  async createRelationship(relationship: any) {
    return this.request('/api/relationships', {
      method: 'POST',
      body: JSON.stringify(relationship),
    });
  }

  // Insights endpoints
  async getInsights(userId: string, sessionId?: string) {
    const params = sessionId ? `?userId=${userId}&sessionId=${sessionId}` : `?userId=${userId}`;
    return this.request(`/api/insights${params}`);
  }

  async createInsight(insight: any) {
    return this.request('/api/insights', {
      method: 'POST',
      body: JSON.stringify(insight),
    });
  }

  // Emotional trends endpoints
  async getEmotionalTrends(userId: string, sessionId?: string) {
    const params = sessionId ? `?userId=${userId}&sessionId=${sessionId}` : `?userId=${userId}`;
    return this.request(`/api/emotional-trends${params}`);
  }

  async createEmotionalTrend(emotionalTrend: any) {
    return this.request('/api/emotional-trends', {
      method: 'POST',
      body: JSON.stringify(emotionalTrend),
    });
  }

  // Daily practices endpoints
  async getDailyPractices(userId: string) {
    return this.request(`/api/daily-practices?userId=${userId}`);
  }

  async createDailyPractice(dailyPractice: any) {
    return this.request('/api/daily-practices', {
      method: 'POST',
      body: JSON.stringify(dailyPractice),
    });
  }

  async updateDailyPractice(practiceId: string, updates: any) {
    return this.request(`/api/daily-practices/${practiceId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Feedback endpoints
  async submitFeedback(feedback: any) {
    return this.request('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  async getFeedback(userId: string) {
    return this.request(`/api/feedback?userId=${userId}`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Export singleton instance
export const serverApi = new ServerApiClient(); 