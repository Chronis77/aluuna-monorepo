import { Audio } from 'expo-av';

interface FreeTtsOptions {
  voice?: string;
  speed?: number;
  volume?: number;
  isUser?: boolean; // New parameter to distinguish user vs AI
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: any) => void;
}

class FreeTtsService {
  private currentSpeaker: string | null = null;
  private sound: Audio.Sound | null = null;

  constructor() {
    // Initialize with default settings
  }

  // Set up audio for speech playback
  private async setupAudioForSpeech() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false, // Disable recording during speech
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false, // Use speaker on Android
      });
      console.log('Audio mode set for TTS playback');
    } catch (error) {
      console.error('Error setting up audio for TTS:', error);
    }
  }

  // Restore audio mode for recording
  private async restoreAudioMode() {
    try {
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

  // Test if a URL returns valid audio content
  private async testAudioUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url);
      if (!response.ok) return false;
      
      const contentType = response.headers.get('content-type');
      return !!(contentType && contentType.includes('audio'));
    } catch (error) {
      return false;
    }
  }

  // Get voice parameters based on speaker type
  private getVoiceParams(isUser: boolean = false) {
    if (isUser) {
      // User voice - different character/voice
      return {
        googleVoice: 'en-US', // Standard US voice
        voiceRssVoice: 'en-us',
        pitch: 1.0,
        rate: 0.9,
        volume: 1.0
      };
    } else {
      // AI voice - different character/voice
      return {
        googleVoice: 'en-GB', // British accent for AI
        voiceRssVoice: 'en-gb',
        pitch: 1.1, // Slightly higher pitch
        rate: 0.85, // Slightly slower
        volume: 1.0
      };
    }
  }

  // Generate speech using a reliable free TTS service
  private async generateSpeech(text: string, options: FreeTtsOptions = {}): Promise<string> {
    try {
      const voiceParams = this.getVoiceParams(options.isUser);
      const encodedText = encodeURIComponent(text);
      
      console.log(`Generating ${options.isUser ? 'USER' : 'AI'} voice speech...`);
      
      // Service 1: Google Translate TTS with different voices
      const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${voiceParams.googleVoice}&client=tw-ob`;
      console.log('Trying Google Translate TTS...');
      
      if (await this.testAudioUrl(googleUrl)) {
        console.log('Google Translate TTS working, using it');
        return googleUrl;
      }
      
      // Service 2: VoiceRSS with different voices
      const voiceRssUrl = `https://api.voicerss.org/?key=free&hl=${voiceParams.voiceRssVoice}&src=${encodedText}&c=MP3&f=44khz_16bit_stereo&r=0`;
      console.log('Trying VoiceRSS TTS...');
      
      if (await this.testAudioUrl(voiceRssUrl)) {
        console.log('VoiceRSS TTS working, using it');
        return voiceRssUrl;
      }
      
      // Service 3: Alternative service
      const alternativeUrl = `https://text-to-speech-api.vercel.app/api/tts?text=${encodedText}&voice=${voiceParams.googleVoice}`;
      console.log('Trying alternative TTS...');
      
      if (await this.testAudioUrl(alternativeUrl)) {
        console.log('Alternative TTS working, using it');
        return alternativeUrl;
      }
      
      // Service 4: Simple TTS service
      const simpleUrl = `https://api.voicerss.org/?key=free&hl=${voiceParams.voiceRssVoice}&src=${encodedText}&c=MP3`;
      console.log('Trying simple TTS...');
      
      if (await this.testAudioUrl(simpleUrl)) {
        console.log('Simple TTS working, using it');
        return simpleUrl;
      }
      
      throw new Error('All TTS services failed');
    } catch (error) {
      console.error('Error generating speech:', error);
      throw new Error('Unable to generate speech. Please check your internet connection.');
    }
  }

  async speak(text: string, speakerId: string, options: FreeTtsOptions = {}): Promise<void> {
    // Stop any current speech
    if (this.currentSpeaker && this.currentSpeaker !== speakerId) {
      await this.stop();
    }

    this.currentSpeaker = speakerId;

    try {
      // Set up audio for speech
      await this.setupAudioForSpeech();

      // Generate speech audio URL
      const audioUrl = await this.generateSpeech(text, options);

      console.log(`Creating audio sound from URL for ${options.isUser ? 'USER' : 'AI'}:`, audioUrl);

      // Get voice parameters for playback
      const voiceParams = this.getVoiceParams(options.isUser);

      // Create and play the audio directly from URL
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        {
          shouldPlay: true,
          volume: options.volume || voiceParams.volume,
          rate: options.speed || voiceParams.rate,
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

  // Set API key (not used in this simplified version)
  setApiKey(apiKey: string) {
    // Not used in this simplified version
  }

  // Get current API key status
  hasApiKey(): boolean {
    return false; // Not needed for this service
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
}

export const piperTtsService = new FreeTtsService(); 