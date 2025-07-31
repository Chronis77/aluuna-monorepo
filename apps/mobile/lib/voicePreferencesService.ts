import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
  description: string;
  googleVoice: string;
  pitch: number;
  rate: number;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  // Male voices
  { id: 'male-1', name: 'James', gender: 'male', description: 'Warm and friendly', googleVoice: 'en-US-Standard-D', pitch: 0.8, rate: 0.95 },
  { id: 'male-2', name: 'Michael', gender: 'male', description: 'Deep and authoritative', googleVoice: 'en-US-Standard-A', pitch: 0.7, rate: 0.9 },
  { id: 'male-3', name: 'David', gender: 'male', description: 'Calm and soothing', googleVoice: 'en-US-Standard-B', pitch: 0.85, rate: 0.85 },
  
  // Female voices - optimized for better distinction in default speech
  { id: 'female-1', name: 'Sarah', gender: 'female', description: 'Warm and nurturing', googleVoice: 'en-US-Wavenet-F', pitch: 1.5, rate: 0.75 },
  { id: 'female-2', name: 'Emma', gender: 'female', description: 'Clear and professional', googleVoice: 'en-US-Wavenet-C', pitch: 1.4, rate: 0.8 },
  { id: 'female-3', name: 'Sophia', gender: 'female', description: 'Gentle and caring', googleVoice: 'en-US-Wavenet-E', pitch: 1.6, rate: 0.7 },
];

interface VoicePreferences {
  userVoiceId: string;
  aiVoiceId: string;
  dialogueMode: boolean; // New setting for dialogue mode
}

const VOICE_PREFERENCES_KEY = 'voice_preferences';

class VoicePreferencesService {
  private preferences: VoicePreferences = {
    userVoiceId: 'male-1',
    aiVoiceId: 'female-1',
    dialogueMode: false // Default to false
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

  // Get available voices for selection, ensuring different voices when same gender
  getAvailableVoices(isUser: boolean): VoiceOption[] {
    const currentUserVoice = this.getUserVoice();
    const currentAIVoice = this.getAIVoice();
    
    return VOICE_OPTIONS.filter(voice => {
      if (isUser) {
        // For user voice selection, exclude the current AI voice if same gender
        if (voice.gender === currentAIVoice.gender) {
          return voice.id !== currentAIVoice.id;
        }
      } else {
        // For AI voice selection, exclude the current user voice if same gender
        if (voice.gender === currentUserVoice.gender) {
          return voice.id !== currentUserVoice.id;
        }
      }
      return true;
    });
  }

  // Get voice parameters for speech manager
  getVoiceParams(isUser: boolean): { pitch: number; rate: number; volume: number; googleVoice: string } {
    const voice = isUser ? this.getUserVoice() : this.getAIVoice();
    
    // Enhanced voice parameters for better distinction
    let enhancedPitch = voice.pitch;
    let enhancedRate = voice.rate;
    
    if (voice.gender === 'female') {
      // Make female voices more distinctly feminine
      enhancedPitch = Math.max(1.3, voice.pitch); // Ensure much higher pitch for females
      enhancedRate = Math.min(0.85, voice.rate); // Slower for more deliberate speech
    } else {
      // Make male voices more distinctly masculine
      enhancedPitch = Math.min(0.85, voice.pitch); // Ensure lower pitch for males
      enhancedRate = Math.max(0.95, voice.rate); // Slightly faster for natural speech
    }
    
    return {
      pitch: enhancedPitch,
      rate: enhancedRate,
      volume: 1.0,
      googleVoice: voice.googleVoice
    };
  }
}

export const voicePreferencesService = new VoicePreferencesService(); 