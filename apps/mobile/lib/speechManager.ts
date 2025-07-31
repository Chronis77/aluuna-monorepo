import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { googleTtsService } from './googleTtsService';
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
  private useFreeTts: boolean = true; // Toggle between Free TTS and default speech

  constructor() {
    // Don't initialize audio routing immediately to avoid conflicts
    // We'll set it up when actually speaking
  }

  // Set whether to use Free TTS or default speech
  setUsePiperTts(useFree: boolean) {
    this.useFreeTts = useFree;
  }

  // Get current TTS setting
  isUsingPiperTts(): boolean {
    return this.useFreeTts;
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
      await Speech.stop();
      googleTtsService.stop();
    }

    this.currentSpeaker = speakerId;

    console.log(`🔊 Speech request: isUser=${options?.isUser}, useFreeTts=${this.useFreeTts}`);

    if (this.useFreeTts) {
      // Use Google TTS for natural-sounding speech
      try {
        await googleTtsService.speak(text, speakerId, {
          volume: options?.volume || 1.0,
          speed: options?.rate || 1.0,
          isUser: options?.isUser || false, // Pass the isUser parameter
          onStart: options?.onStart,
          onDone: options?.onDone,
          onError: options?.onError,
        });
      } catch (error) {
        console.error('Google TTS failed, falling back to default speech:', error);
        // Fall back to default speech if Google TTS fails
        await this.speakWithDefault(text, speakerId, options);
      }
    } else {
      // Use default expo-speech
      await this.speakWithDefault(text, speakerId, options);
    }
  }

  private async speakWithDefault(text: string, speakerId: string, options?: SpeechOptions): Promise<void> {
    // Set up audio for speech
    await this.setupAudioForSpeech();

    // Get voice parameters from preferences
    const isUser = options?.isUser || false;
    const voiceParams = voicePreferencesService.getVoiceParams(isUser);

    console.log(`🎤 Default speech params: isUser=${isUser}, pitch=${voiceParams.pitch}, rate=${voiceParams.rate}`);

    // Set higher volume and proper audio routing
    const speechOptions = {
      language: 'en',
      pitch: voiceParams.pitch,
      rate: voiceParams.rate,
      volume: voiceParams.volume || 1.0,
      ...options,
    };

    return new Promise((resolve, reject) => {
      Speech.speak(text, {
        ...speechOptions,
        onStart: () => {
          if (options?.onStart) {
            options.onStart();
          }
        },
        onDone: () => {
          this.currentSpeaker = null;
          // Restore audio mode for recording (fire and forget)
          this.restoreAudioMode().catch(error => {
            console.error('Error restoring audio mode:', error);
          });
          if (options?.onDone) {
            options.onDone();
          }
          resolve();
        },
        onError: (error) => {
          this.currentSpeaker = null;
          // Restore audio mode for recording (fire and forget)
          this.restoreAudioMode().catch(restoreError => {
            console.error('Error restoring audio mode:', restoreError);
          });
          if (options?.onError) {
            options.onError(error);
          }
          reject(error);
        },
      });
    });
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
    Speech.stop();
    googleTtsService.stop();
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

  // Set API key for Google TTS
  setPiperApiKey(apiKey: string) {
    // Google TTS doesn't need API key setting in this implementation
    console.log('Google TTS API key set (not used in current implementation)');
  }
}

export const speechManager = new SpeechManager(); 