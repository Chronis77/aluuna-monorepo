import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { openAiTtsService } from './openAiTtsService';
import { voicePreferencesService } from './voicePreferencesService';

interface SpeechOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
  isUser?: boolean; // New parameter to distinguish user vs AI
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: any) => void;
}

class SpeechManager {
  private currentSpeaker: string | null = null;
  private originalAudioMode: any = null;
  private useServerTts: boolean = true; // Toggle server TTS on/off

  constructor() {
    // Don't initialize audio routing immediately to avoid conflicts
    // We'll set it up when actually speaking
  }

  // Toggle Enhanced TTS (server OpenAI TTS)
  setUseServerTts(enabled: boolean) {
    this.useServerTts = enabled;
  }

  // Get current TTS setting
  isUsingServerTts(): boolean {
    return this.useServerTts;
  }

  private async setupAudioForSpeech() {
    try {
      // Store current audio mode to restore later
      if (!this.originalAudioMode) {
        // Get current audio mode if possible
        console.log('Setting up audio for speech playback');
      }

      // Set audio mode for speech playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false, // Disable recording during speech
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false, // Use speaker on Android
      });
      console.log('Audio mode set for speech playback');
    } catch (error) {
      console.error('Error setting up audio for speech:', error);
    }
  }

  private async restoreAudioMode() {
    try {
      // Restore audio mode to allow recording again
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true, // Re-enable recording
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('Audio mode restored for recording');
    } catch (error) {
      console.error('Error restoring audio mode:', error);
    }
  }

  async speak(text: string, speakerId: string, options?: SpeechOptions): Promise<void> {
    // Stop any current speech
    if (this.currentSpeaker && this.currentSpeaker !== speakerId) {
      openAiTtsService.stop();
    }

    this.currentSpeaker = speakerId;

    console.log(`🔊 Speech request: isUser=${options?.isUser}, useServerTts=${this.useServerTts}`);

    if (!this.useServerTts) {
      throw new Error('Server TTS is disabled');
    }
    // Only use server TTS now
    await openAiTtsService.speak(text, speakerId, {
      volume: options?.volume || 1.0,
      speed: options?.rate || 1.0,
      isUser: options?.isUser || false,
      onStart: options?.onStart,
      onDone: options?.onDone,
      onError: options?.onError,
    });
  }

  private async speakWithDefault(_text: string, _speakerId: string, _options?: SpeechOptions): Promise<void> {
    throw new Error('Default speech is no longer supported. Use server TTS.');
  }

  // Method to switch audio routing based on proximity
  async setAudioRouting(useEarpiece: boolean) {
    try {
      if (Platform.OS === 'android') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: useEarpiece,
        });
        console.log(`Android audio routing set to: ${useEarpiece ? 'earpiece' : 'speaker'}`);
      } else if (Platform.OS === 'ios') {
        // For iOS, we'll use a simpler approach
        // The system will handle routing based on proximity
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false, // iOS doesn't use this
        });
        console.log(`iOS audio routing configured (system will handle proximity)`);
      }
    } catch (error) {
      console.error('Error setting audio routing:', error);
    }
  }

  stop(): void {
    openAiTtsService.stop();
    this.currentSpeaker = null;
    // Restore audio mode when stopping
    this.restoreAudioMode().catch(error => {
      console.error('Error restoring audio mode:', error);
    });
  }

  isSpeaking(speakerId?: string): boolean {
    if (speakerId) {
      return this.currentSpeaker === speakerId;
    }
    return this.currentSpeaker !== null;
  }

  getCurrentSpeaker(): string | null {
    return this.currentSpeaker;
  }

  // Reset audio session to default state
  async resetAudioSession() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true, // Enable recording
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('Audio session reset to default state (recording enabled)');
    } catch (error) {
      console.error('Error resetting audio session:', error);
    }
  }

  // Deprecated: no-op
  setPiperApiKey(_apiKey: string) {}
}

export const speechManager = new SpeechManager(); 