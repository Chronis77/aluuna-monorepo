import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { config } from './config';
import { voicePreferencesService } from './voicePreferencesService';

interface GoogleTtsOptions {
  voice?: string;
  speed?: number;
  volume?: number;
  isUser?: boolean;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: any) => void;
}

class GoogleTtsService {
  private currentSpeaker: string | null = null;
  private sound: Audio.Sound | null = null;

  constructor() {
    // Initialize Google TTS service
  }

  // Set up audio for speech playback
  private async setupAudioForSpeech() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('Audio mode set for Google TTS playback');
    } catch (error) {
      console.error('Error setting up audio for Google TTS:', error);
    }
  }

  // Restore audio mode for recording
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

  // Get voice parameters based on speaker type
  private getVoiceParams(isUser: boolean = false): { voice: string; languageCode: string } {
    const voiceParams = voicePreferencesService.getVoiceParams(isUser);
    return {
      voice: voiceParams.googleVoice,
      languageCode: 'en-US'
    };
  }

  // Test if a URL returns valid audio content
  private async testAudioUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`URL test failed with status: ${response.status} for ${url.substring(0, 50)}...`);
        return false;
      }
      
      const contentType = response.headers.get('content-type');
      // Accept audio content types and also allow missing content-type (some services don't set it)
      const isAudio = !contentType || contentType.includes('audio') || contentType.includes('mp3') || contentType.includes('mpeg');
      
      if (!isAudio && contentType) {
        console.log(`URL returned non-audio content: ${contentType} for ${url.substring(0, 50)}...`);
      }
      
      return isAudio;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`URL test error: ${errorMessage} for ${url.substring(0, 50)}...`);
      return false;
    }
  }

  // Try Vercel TTS server first
  private async tryVercelTts(text: string, options: GoogleTtsOptions = {}): Promise<string | null> {
    try {
      const voiceParams = this.getVoiceParams(options.isUser);
      
      console.log('🎯 Trying Vercel TTS server...');
      console.log('📍 Server URL:', config.tts.serverUrl);
      console.log('⏱️ Timeout:', config.tts.timeout, 'ms');
      console.log('🔧 API Key available:', !!config.tts.apiKey);
      console.log('📝 Text length:', text.length, 'characters');
      console.log('📱 Platform:', Platform.OS);
      
      const TTS_SERVER_URL = config.tts.serverUrl;
      const API_KEY = config.tts.apiKey;
      
      if (!API_KEY) {
        console.log('❌ No TTS API key configured');
        return null;
      }
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Vercel TTS server request timed out');
        controller.abort();
      }, config.tts.timeout);
      
      try {
        console.log('📡 Sending request to Vercel TTS server...');
        console.log('🌐 Full URL:', `${TTS_SERVER_URL}/tts`);
        
        const response = await fetch(`${TTS_SERVER_URL}/tts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
          },
          body: JSON.stringify({
            text: text,
            voice: {
              languageCode: voiceParams.languageCode,
              name: voiceParams.voice,
              ssmlGender: options.isUser ? 'MALE' : 'FEMALE'
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: options.speed || voicePreferencesService.getVoiceParams(options.isUser || false).rate,
              pitch: voicePreferencesService.getVoiceParams(options.isUser || false).pitch > 1.0 ? 2.0 : -2.0,
              volumeGainDb: 0.0
            }
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('📥 Vercel TTS server response status:', response.status);

        const result = await response.json();
        
        // Log a clean version of the response (truncate audioData)
        const logResult = { ...result };
        if (logResult.audioData) {
          logResult.audioData = `${logResult.audioData.substring(0, 50)}... (truncated)`;
        }
        console.log('📋 Vercel TTS server response:', logResult);
        
        if (result.success || result.audioData) {
          console.log('✅ Vercel TTS server working, using it');
          
          // Vercel returns audioData (base64), we need to convert it to a playable URL
          if (result.audioData) {
            // Convert base64 audio data to a data URL for React Native
            const audioUrl = `data:audio/mp3;base64,${result.audioData}`;
            console.log('🎵 Created data URL from Vercel response');
            return audioUrl;
          } else if (result.audioUrl) {
            // Fallback to audioUrl if provided
            return result.audioUrl;
          } else {
            console.log('❌ Vercel response missing audio data');
            return null;
          }
        } else {
          console.log('❌ Vercel TTS server failed:', result.error);
          return null;
        }
      } catch (error) {
        clearTimeout(timeoutId);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('❌ Vercel TTS server not available:', errorMessage);
        console.log('🔍 Error details:', error);
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('❌ Vercel TTS server not available:', errorMessage);
      return null;
    }
  }

  // Generate speech using reliable TTS services
  private async generateSpeech(text: string, options: GoogleTtsOptions = {}): Promise<string> {
    try {
      console.log(`Generating ${options.isUser ? 'USER' : 'AI'} voice speech with TTS...`);

      // First, try the Vercel TTS server
      const vercelTtsResult = await this.tryVercelTts(text, options);
      if (vercelTtsResult) {
        return vercelTtsResult;
      }

      // If Vercel server fails, fall back to online services
      console.log('Vercel TTS failed, falling back to online services...');
      
      // Clean text for better compatibility (remove special characters but keep full length)
      const cleanText = text.replace(/[^\w\s.,!?-]/g, '');
      const encodedText = encodeURIComponent(cleanText);
      
      // Try multiple reliable TTS services in order of preference
      const services = [
        // Service 1: Simple TTS service (most reliable)
        `https://text-to-speech-api.vercel.app/api/tts?text=${encodedText}&voice=en-US`,
        
        // Service 2: Google Translate TTS (alternative)
        `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en-US&client=tw-ob`,
        
        // Service 3: Alternative Google Translate endpoint
        `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`,
        
        // Service 4: VoiceRSS (fallback)
        `https://api.voicerss.org/?key=free&hl=en-us&src=${encodedText}&c=MP3&f=44khz_16bit_stereo&r=0`
      ];

      // Test each service until we find one that works
      for (let i = 0; i < services.length; i++) {
        const serviceUrl = services[i];
        console.log(`Trying online TTS service ${i + 1}: ${serviceUrl.substring(0, 50)}...`);
        
        if (await this.testAudioUrl(serviceUrl)) {
          console.log(`Online TTS service ${i + 1} working, using it`);
          return serviceUrl;
        }
      }
      
      // If all services fail, use the most reliable one as fallback
      console.log('All TTS services failed, using Simple TTS as fallback');
      return services[0];
      
    } catch (error) {
      console.error('Error generating TTS speech:', error);
      throw new Error('Unable to generate speech');
    }
  }

  async speak(text: string, speakerId: string, options: GoogleTtsOptions = {}): Promise<void> {
    // Stop any current speech
    if (this.currentSpeaker && this.currentSpeaker !== speakerId) {
      await this.stop();
    }

    this.currentSpeaker = speakerId;

    try {
      // Set up audio for speech
      await this.setupAudioForSpeech();

      // Generate speech audio
      const audioUrl = await this.generateSpeech(text, options);

      console.log(`Creating audio sound from TTS for ${options.isUser ? 'USER' : 'AI'}:`, 
        audioUrl.startsWith('data:audio/mp3;base64,') 
          ? `${audioUrl.substring(0, 50)}... (data URL)` 
          : audioUrl
      );

      // Create and play the audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        {
          shouldPlay: true,
          volume: options.volume || 1.0,
          rate: options.speed || 1.0,
        }
      );

      this.sound = sound;

      // Set up event listeners
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

  // Reset audio session to default state
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

export const googleTtsService = new GoogleTtsService(); 