import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VoiceOption {
  id: string; // OpenAI voice id (e.g., 'alloy', 'shimmer')
  name: string;
  gender: 'male' | 'female';
  description: string;
  pitch: number;
  rate: number;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  // Strictly limited to the requested OpenAI voices and genders
  { id: 'verse',   name: 'Verse',   gender: 'male',   description: 'Clear and professional (male)', pitch: 1.0, rate: 1.0 },
  { id: 'shimmer', name: 'Aluuna', gender: 'female', description: 'Bright and expressive (female)', pitch: 1.4, rate: 0.95 },
  { id: 'alloy',   name: 'Alloy',   gender: 'female', description: 'Balanced and natural (female)', pitch: 1.3, rate: 1.0 },
  { id: 'sage',    name: 'Sage',    gender: 'female', description: 'Calm and steady (female)',      pitch: 1.3, rate: 0.95 },
  { id: 'echo',    name: 'Echo',    gender: 'male',   description: 'Warm and friendly (male)',      pitch: 1.0, rate: 1.0 },
];

interface VoicePreferences {
  userVoiceId: string;
  aiVoiceId: string;
  dialogueMode: boolean; // New setting for dialogue mode
}

const VOICE_PREFERENCES_KEY = 'voice_preferences';

class VoicePreferencesService {
  private preferences: VoicePreferences = {
    userVoiceId: 'alloy',
    aiVoiceId: 'shimmer',
    dialogueMode: false
  };

  constructor() {
    this.loadPreferences();
  }

  async loadPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(VOICE_PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Handle migration from old format that didn't have dialogueMode
        this.preferences = {
          ...this.preferences,
          ...parsed,
          dialogueMode: parsed.dialogueMode !== undefined ? parsed.dialogueMode : false
        };
      }
    } catch (error) {
      console.error('Error loading voice preferences:', error);
    }
  }

  async savePreferences(preferences: VoicePreferences): Promise<void> {
    try {
      this.preferences = preferences;
      await AsyncStorage.setItem(VOICE_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving voice preferences:', error);
      throw error;
    }
  }

  getVoiceOption(voiceId: string): VoiceOption | undefined {
    return VOICE_OPTIONS.find(v => v.id === voiceId);
  }

  getUserVoice(): VoiceOption {
    return this.getVoiceOption(this.preferences.userVoiceId) || VOICE_OPTIONS[0];
  }

  getAIVoice(): VoiceOption {
    return this.getVoiceOption(this.preferences.aiVoiceId) || VOICE_OPTIONS[3];
  }

  getCurrentPreferences(): VoicePreferences {
    return { ...this.preferences };
  }

  // Get dialogue mode setting
  getDialogueMode(): boolean {
    return this.preferences.dialogueMode;
  }

  // Update dialogue mode setting
  async updateDialogueMode(enabled: boolean): Promise<void> {
    this.preferences.dialogueMode = enabled;
    await this.savePreferences(this.preferences);
  }

  async updateUserVoice(voiceId: string): Promise<void> {
    this.preferences.userVoiceId = voiceId;
    await this.savePreferences(this.preferences);
  }

  async updateAIVoice(voiceId: string): Promise<void> {
    this.preferences.aiVoiceId = voiceId;
    await this.savePreferences(this.preferences);
  }

  // Get available voices; avoid only exact duplicate of the other selection
  getAvailableVoices(isUser: boolean): VoiceOption[] {
    const otherId = isUser ? this.getAIVoice().id : this.getUserVoice().id;
    return VOICE_OPTIONS.filter(v => v.id !== otherId);
  }

  // Get voice parameters for speech manager
  getVoiceParams(isUser: boolean): { pitch: number; rate: number; volume: number } {
    const voice = isUser ? this.getUserVoice() : this.getAIVoice();
    let enhancedPitch = voice.pitch;
    let enhancedRate = voice.rate;
    if (voice.gender === 'female') {
      enhancedPitch = Math.max(1.3, voice.pitch);
      enhancedRate = Math.min(0.95, voice.rate);
    } else {
      enhancedPitch = Math.min(0.95, voice.pitch);
      enhancedRate = Math.max(0.95, voice.rate);
    }
    return { pitch: enhancedPitch, rate: enhancedRate, volume: 1.0 };
  }
}

export const voicePreferencesService = new VoicePreferencesService(); 