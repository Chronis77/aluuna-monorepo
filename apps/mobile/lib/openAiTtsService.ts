import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { config } from './config';
import { voicePreferencesService } from './voicePreferencesService';

function sanitizeMarkdownToPlainText(markdown: string): string {
  let text = markdown;
  // Remove fenced code blocks
  text = text.replace(/```[\s\S]*?```/g, ' ');
  // Remove inline code backticks but keep code content
  text = text.replace(/`([^`]+)`/g, '$1');
  // Remove images entirely
  text = text.replace(/!\[[^\]]*\]\([^\)]*\)/g, '');
  // Replace links with their text
  text = text.replace(/\[([^\]]+)\]\([^\)]*\)/g, '$1');
  // Strip HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Remove heading markers
  text = text.replace(/^\s{0,3}#{1,6}\s+/gm, '');
  // Remove blockquote markers
  text = text.replace(/^\s*>\s?/gm, '');
  // Remove list markers
  text = text.replace(/^\s*[-+*]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');
  // Remove bold/italic markers
  text = text.replace(/\*\*|__/g, '');
  text = text.replace(/\*|_/g, '');
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function splitTextIntoChunks(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const sentences = text.split(/(?<=[\.!?])\s+/);
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if ((current + ' ' + s).trim().length > maxLen) {
      if (current) chunks.push(current.trim());
      if (s.length > maxLen) {
        for (let i = 0; i < s.length; i += maxLen) {
          chunks.push(s.slice(i, i + maxLen));
        }
        current = '';
      } else {
        current = s;
      }
    } else {
      current = (current ? current + ' ' : '') + s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

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
  private stopRequested: boolean = false;

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

  private async withRetries<T>(fn: () => Promise<T>, retries: number, backoffMs: number): Promise<T> {
    let lastErr: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt)));
          continue;
        }
      }
    }
    throw lastErr;
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

    // Use the dedicated TTS server URL to avoid mismatched base URLs
    const TTS_SERVER_URL = config.tts.serverUrl;
    const API_KEY = config.tts.apiKey;
    if (!API_KEY) {
      throw new Error('Missing API key for services server');
    }

    // Use user-selected voice for user messages, AI-selected voice for assistant messages
    const voiceId = options.isUser ? voicePreferencesService.getUserVoice().id : voicePreferencesService.getAIVoice().id;
    console.log(`[TTS] isUser=${!!options.isUser} voiceId=${voiceId}`);
    const processedText = sanitizeMarkdownToPlainText(text);
    console.log(`[TTS] input length raw=${text.length} processed=${processedText.length}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.tts.timeout);

    const payload = JSON.stringify({ text: processedText, isUser: !!options.isUser, voiceId, format: 'mp3' });

    // Try modern endpoint first
    let response = await fetch(`${TTS_SERVER_URL}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: payload,
      signal: controller.signal,
    });

    // Fallback to legacy endpoint on 404
    if (response.status === 404) {
      try { await response.text(); } catch {}
      response = await fetch(`${TTS_SERVER_URL}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: payload,
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`TTS server error: ${response.status} ${errText}`);
    }

    const result: any = await response.json();
    if (result?.audioUrl && typeof result.audioUrl === 'string') {
      return result.audioUrl; // data URL
    }
    // Legacy shape: { audioData: base64, audioFormat: 'base64' | 'mp3' }
    if (result?.audioData && typeof result.audioData === 'string') {
      const usedFormat = typeof result?.audioFormat === 'string' && result.audioFormat !== 'base64' ? result.audioFormat : 'mp3';
      return `data:audio/${usedFormat};base64,${result.audioData}`;
    }
    throw new Error('TTS server returned invalid response');
  }

  async speak(text: string, speakerId: string, options: OpenAiTtsOptions = {}): Promise<void> {
    if (this.currentSpeaker && this.currentSpeaker !== speakerId) {
      await this.stop();
    }

    this.currentSpeaker = speakerId;
    this.stopRequested = false;

    try {
      await this.setupAudioForSpeech();

      const processedText = sanitizeMarkdownToPlainText(text);
      const chunks = splitTextIntoChunks(processedText, 400);
      let hasStarted = false;

      for (let index = 0; index < chunks.length; index++) {
        if (this.stopRequested || this.currentSpeaker !== speakerId) {
          break;
        }

        console.log(`[TTS] requesting chunk ${index + 1}/${chunks.length} length=${chunks[index].length}`);
        const audioUrl = await this.withRetries(() => this.generateSpeech(chunks[index], options), 2, 800);

        console.log(`Creating audio sound from TTS chunk ${index + 1}/${chunks.length} for ${options.isUser ? 'USER' : 'AI'}:`,
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

        await new Promise<void>((resolve) => {
          sound.setOnPlaybackStatusUpdate((status) => {
            if (!status.isLoaded) return;
            if (status.isPlaying && !hasStarted) {
              hasStarted = true;
              options.onStart?.();
            }
            if (status.didJustFinish) {
              resolve();
            }
          });
        });

        try {
          await sound.unloadAsync();
        } catch {}
      }

      this.currentSpeaker = null;
      await this.restoreAudioMode();
      if (!this.stopRequested) {
        options.onDone?.();
      }

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
    this.stopRequested = true;
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


