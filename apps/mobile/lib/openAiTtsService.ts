import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { config } from './config';
import { voicePreferencesService } from './voicePreferencesService';

interface OpenAiTtsOptions {
  voice?: string;
  speed?: number;
  volume?: number;
  isUser?: boolean;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: any) => void;
}

class OpenAiTtsService {
  private currentSpeaker: string | null = null;
  private sound: Audio.Sound | null = null;

  private async setupAudioForSpeech() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('Audio mode set for OpenAI TTS playback');
    } catch (error) {
      console.error('Error setting up audio for OpenAI TTS:', error);
    }
  }

  private async restoreAudioMode() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
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

  private async generateSpeech(text: string, options: OpenAiTtsOptions = {}): Promise<string> {
    console.log(`Generating ${options.isUser ? 'USER' : 'AI'} voice speech via server OpenAI TTS...`);

    const TTS_SERVER_URL = config.server.url;
    const API_KEY = config.tts.apiKey;
    if (!API_KEY) {
      throw new Error('Missing API key for services server');
    }

    // Use user-selected voice for user messages, AI-selected voice for assistant messages
    const voiceId = options.isUser ? voicePreferencesService.getUserVoice().id : voicePreferencesService.getAIVoice().id;
    console.log(`[TTS] isUser=${!!options.isUser} voiceId=${voiceId}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.tts.timeout);

    const response = await fetch(`${TTS_SERVER_URL}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ text, isUser: !!options.isUser, voiceId, format: 'mp3' }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`TTS server error: ${response.status} ${errText}`);
    }

    const result: any = await response.json();
    if (result?.audioUrl && typeof result.audioUrl === 'string') {
      return result.audioUrl; // data URL
    }
    throw new Error('TTS server returned invalid response');
  }

  async speak(text: string, speakerId: string, options: OpenAiTtsOptions = {}): Promise<void> {
    if (this.currentSpeaker && this.currentSpeaker !== speakerId) {
      await this.stop();
    }

    this.currentSpeaker = speakerId;

    try {
      await this.setupAudioForSpeech();

      const audioUrl = await this.generateSpeech(text, options);

      console.log(`Creating audio sound from TTS for ${options.isUser ? 'USER' : 'AI'}:`,
        audioUrl.startsWith('data:audio/') ? `${audioUrl.substring(0, 50)}... (data URL)` : audioUrl
      );

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        {
          shouldPlay: true,
          volume: options.volume || 1.0,
          rate: options.speed || 1.0,
        }
      );

      this.sound = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.isPlaying && options.onStart) {
            options.onStart();
          }
          if (status.didJustFinish) {
            this.currentSpeaker = null;
            this.restoreAudioMode().catch(error => {
              console.error('Error restoring audio mode:', error);
            });
            if (options.onDone) {
              options.onDone();
            }
          }
        }
      });

    } catch (error) {
      this.currentSpeaker = null;
      await this.restoreAudioMode();
      if (options.onError) {
        options.onError(error);
      }
      throw error;
    }
  }

  stop(): void {
    if (this.sound) {
      this.sound.stopAsync();
      this.sound.unloadAsync();
      this.sound = null;
    }
    this.currentSpeaker = null;
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

  async resetAudioSession() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
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
}

export const openAiTtsService = new OpenAiTtsService();


