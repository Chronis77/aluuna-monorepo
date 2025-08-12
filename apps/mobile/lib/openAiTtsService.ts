import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { config } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { voicePreferencesService } from './voicePreferencesService';

function isAbortError(err: any): boolean {
  const name = (err?.name ?? '').toString();
  const message = (err?.message ?? '').toString();
  return name.includes('Abort') || /aborted/i.test(message);
}

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

// Create a shorter lead chunk for faster first-audio, then larger chunks to reduce round-trips
function splitTextIntoChunksOptimized(text: string, leadLen: number, subsequentLen: number): string[] {
  const clean = text.trim();
  if (clean.length <= leadLen) return [clean];

  // Try to cut the lead chunk on a sentence boundary near leadLen but do not exceed ~1.15x leadLen
  const upperBound = Math.min(clean.length, Math.round(leadLen * 1.15));
  const leadWindow = clean.slice(0, upperBound);
  const boundaryMatch = leadWindow.match(/([\.!?])\s+[^\.\!?]*$/);
  let leadEnd = leadLen;
  if (boundaryMatch && boundaryMatch.index !== undefined) {
    const idx = boundaryMatch.index + boundaryMatch[0].length;
    if (idx >= Math.floor(leadLen * 0.6) && idx <= upperBound) {
      leadEnd = Math.min(idx, leadLen + Math.max(20, Math.round(leadLen * 0.15)));
    }
  }

  const leadChunk = clean.slice(0, leadEnd).trim();
  const remainder = clean.slice(leadEnd).trim();
  if (!remainder) return [leadChunk];
  return [leadChunk, ...splitTextIntoChunks(remainder, subsequentLen)];
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
  private pendingControllers: AbortController[] = [];
  private playbackSessionId: number = 0;

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
        const name = (e as any)?.name || '';
        const message = (e as any)?.message || '';
        const isAbort = String(name).includes('Abort') || /aborted/i.test(String(message));
        if (isAbort) {
          // Do not retry aborted requests (usually due to user preemption)
          throw e;
        }
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

  private async generateSpeech(text: string, options: OpenAiTtsOptions = {}, sessionId?: number): Promise<string> {
    console.log(`Generating ${options.isUser ? 'USER' : 'AI'} voice speech via server OpenAI TTS...`);

    // Use the dedicated TTS server URL to avoid mismatched base URLs
    const TTS_SERVER_URL = config.tts.serverUrl;

    // Use user-selected voice for user messages, AI-selected voice for assistant messages
    const voiceId = options.isUser ? voicePreferencesService.getUserVoice().id : voicePreferencesService.getAIVoice().id;
    console.log(`[TTS] isUser=${!!options.isUser} voiceId=${voiceId}`);
    const processedText = sanitizeMarkdownToPlainText(text);
    console.log(`[TTS] input length raw=${text.length} processed=${processedText.length}`);

    const controller = new AbortController();
    this.pendingControllers.push(controller);
    // Dynamic timeout per chunk length, capped by global config
    const lengthHint = processedText.length;
    const baseMs = 7000; // base latency budget
    const perCharMs = Math.max(20, Math.round(50 / Math.max(0.5, options.speed || 1.0))); // faster if speed>1
    const dynamicTimeout = Math.max(10000, Math.min(config.tts.timeout, baseMs + lengthHint * perCharMs));
    const timeoutId = setTimeout(() => controller.abort(), dynamicTimeout);

    const payload = JSON.stringify({ text: processedText, isUser: !!options.isUser, voiceId, format: 'mp3' });

    // Try modern endpoint first
    const token = await AsyncStorage.getItem('authToken');
    let response = await fetch(`${TTS_SERVER_URL}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: payload,
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);
    if (!response.ok && response.status === 401) {
      try {
        const { refreshTokens } = await import('./authService');
        const ok = await refreshTokens();
        if (ok) {
          const newToken = await AsyncStorage.getItem('authToken');
          response = await fetch(`${TTS_SERVER_URL}/api/tts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
            },
            body: payload,
            signal: controller.signal,
          });
        }
      } catch {}
    }
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`TTS server error: ${response.status} ${errText}`);
    }

    try {
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
    } finally {
      const idx = this.pendingControllers.indexOf(controller);
      if (idx >= 0) this.pendingControllers.splice(idx, 1);
    }
  }

  async speak(text: string, speakerId: string, options: OpenAiTtsOptions = {}): Promise<void> {
    if (this.currentSpeaker && this.currentSpeaker !== speakerId) {
      await this.stop();
    }

    // Mark stopRequested so prior flows can bail out, then set up fresh state
    // Start a new playback session and preempt previous session controllers
    this.playbackSessionId += 1;
    const sessionId = this.playbackSessionId;
    this.stopRequested = false;
    this.currentSpeaker = speakerId;
    try {
      for (const c of this.pendingControllers) {
        try { c.abort(); } catch {}
      }
      this.pendingControllers = [];
    } catch {}

    try {
      await this.setupAudioForSpeech();
      // Always prefer loudspeaker for TTS playback (not earpiece)
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch {}

      const processedText = sanitizeMarkdownToPlainText(text);
      // Faster first audio with shorter lead, then larger chunks to reduce total calls
      const chunks = splitTextIntoChunksOptimized(processedText, 220, 600);
      let hasStarted = false;

      // Prefetch pipeline: keep one or two chunks ahead to reduce gaps
      const audioUrlPromises: Array<Promise<string> | null> = new Array(chunks.length).fill(null);
      const ensurePrefetch = (idx: number) => {
        if (idx < chunks.length && !audioUrlPromises[idx]) {
          console.log(`[TTS] prefetching chunk ${idx + 1}/${chunks.length} length=${chunks[idx].length}`);
          audioUrlPromises[idx] = this.withRetries(() => this.generateSpeech(chunks[idx], options, sessionId), 3, 1200);
        }
      };

      // Start prefetch of first two chunks
      ensurePrefetch(0);
      ensurePrefetch(1);

      let abortedByPreemption = false;
      for (let index = 0; index < chunks.length; index++) {
        if (this.stopRequested || this.currentSpeaker !== speakerId || sessionId !== this.playbackSessionId) {
          break;
        }

        ensurePrefetch(index);
        // While we wait and play this chunk, start prefetch of the following one
        ensurePrefetch(index + 1);

        let audioUrl: string;
        try {
          audioUrl = await (audioUrlPromises[index] as Promise<string>);
        } catch (e: any) {
          const preempted = this.stopRequested || this.currentSpeaker !== speakerId || sessionId !== this.playbackSessionId;
          if (isAbortError(e) && preempted) {
            abortedByPreemption = true;
            break;
          }
          // Non-abort or abort without preemption => propagate to outer catch
          throw e;
        }

        // Some platforms have trouble with data: URIs for audio. Persist to a temp file when necessary.
        let playableUri = audioUrl;
        let tempFilePath: string | null = null;
        if (audioUrl.startsWith('data:audio/')) {
          try {
            const match = audioUrl.match(/^data:audio\/(\w+);base64,(.*)$/);
            const ext = match?.[1] || 'mp3';
            const base64 = match?.[2] || '';
            if (base64) {
              const fileName = `tts-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
              const filePath = `${FileSystem.cacheDirectory}${fileName}`;
              await FileSystem.writeAsStringAsync(filePath, base64, { encoding: FileSystem.EncodingType.Base64 });
              playableUri = filePath;
              tempFilePath = filePath;
            }
          } catch (e) {
            console.warn('[TTS] Failed to persist data URL to file, using data URI directly');
          }
        }

        console.log(`Creating audio sound from TTS chunk ${index + 1}/${chunks.length} for ${options.isUser ? 'USER' : 'AI'}:`,
          audioUrl.startsWith('data:audio/') ? `${audioUrl.substring(0, 50)}... (data URL)` : audioUrl
        );

        const { sound } = await Audio.Sound.createAsync(
          { uri: playableUri },
          {
            shouldPlay: false,
            volume: options.volume || 1.0,
          }
        );

        // If another speak() preempted us, stop now
        if (this.stopRequested || this.currentSpeaker !== speakerId || sessionId !== this.playbackSessionId) {
          try { await sound.unloadAsync(); } catch {}
          break;
        }

        this.sound = sound;

        await new Promise<void>(async (resolve) => {
          let resolved = false;
          const maybeResolve = () => {
            if (!resolved) {
              resolved = true;
              resolve();
            }
          };

          // Estimate duration based on words and playback speed. Fallback to char-based.
          const words = chunks[index].trim().split(/\s+/).length;
          const wpm = 165; // typical synthetic speech rate
          const speed = Math.max(0.5, options.speed || 1.0);
          const estimatedMs = Math.max(
            Math.round((words / (wpm * speed)) * 60_000),
            Math.round(chunks[index].length * (70 / speed)) // ~70ms per char baseline
          );
          const stallLimitMs = Math.min(25000, Math.max(9000, Math.round(estimatedMs * 1.6)));

          try { await sound.setProgressUpdateIntervalAsync(250); } catch {}
          sound.setOnPlaybackStatusUpdate((status) => {
            if (!status.isLoaded) return;
            if (status.isPlaying && !hasStarted) {
              hasStarted = true;
              options.onStart?.();
            }
            if ((status as any).didJustFinish || (status as any).positionMillis >= (status as any).durationMillis - 150) {
              maybeResolve();
            }
          });

          try {
            // Configure playback rate after load, before play
            if (options.speed && Math.abs((options.speed || 1) - 1.0) > 0.01) {
              try {
                // shouldCorrectPitch=true for natural sound
                await (sound as any).setRateAsync(options.speed, true);
              } catch (e) {
                console.warn('[TTS] setRateAsync not supported on this platform, proceeding with default speed');
              }
            }
            // Ensure the sound is fully loaded before play to avoid race conditions
            try {
              const status0 = await sound.getStatusAsync();
              if (!status0.isLoaded) {
                await new Promise<void>((res) => {
                  const int = setInterval(async () => {
                    const s = await sound.getStatusAsync();
                    if (s.isLoaded) {
                      clearInterval(int);
                      res();
                    }
                  }, 100);
                });
              }
            } catch {}

            // If preempted mid-setup, abort
            if (this.stopRequested || this.currentSpeaker !== speakerId || sessionId !== this.playbackSessionId) {
              try { await sound.unloadAsync(); } catch {}
              return maybeResolve();
            }

            await sound.playAsync();
            // In rare cases the callback might miss the first playing event; trigger onStart defensively
            if (!hasStarted) {
              hasStarted = true;
              options.onStart?.();
            }

            // Fallback polling with stall detection in case status updates are missed
            let pollingActive = true;
            let lastPos = 0;
            let lastProgressTs = Date.now();
            let resumeAttempts = 0;
            const pollInterval = setInterval(async () => {
              if (!pollingActive) return;
              try {
                const st = await sound.getStatusAsync();
                if (!st.isLoaded) return;
                const duration = (st as any).durationMillis ?? 0;
                const position = (st as any).positionMillis ?? 0;
                if (st.isPlaying && !hasStarted) {
                  hasStarted = true;
                  options.onStart?.();
                }
                if (duration > 0 && position >= duration - 120) {
                  clearInterval(pollInterval);
                  pollingActive = false;
                  maybeResolve();
                  return;
                }
                if (position > lastPos + 40) {
                  lastPos = position;
                  lastProgressTs = Date.now();
                }
                const stalledFor = Date.now() - lastProgressTs;
                if (!st.isPlaying && position < (duration - 200)) {
                  if (resumeAttempts < 2) {
                    try { await sound.playAsync(); } catch {}
                    resumeAttempts += 1;
                    lastProgressTs = Date.now();
                  }
                }
                if (stalledFor > stallLimitMs) {
                  // Consider done to avoid hanging indefinitely
                  clearInterval(pollInterval);
                  pollingActive = false;
                  maybeResolve();
                }
              } catch {
                // ignore
              }
            }, 400);

            // Final hard-stop timer in case neither events nor stall detection resolve
            const hardStopTimer = setTimeout(() => {
              try { sound.stopAsync(); } catch {}
              try { sound.unloadAsync(); } catch {}
              maybeResolve();
            }, stallLimitMs + 7000);

            // Ensure cleanup when promise resolves
            const originalMaybeResolve = maybeResolve;
            (function wrapCleanup() {
              const wrapped = () => {
                try { clearInterval(pollInterval); } catch {}
                try { clearTimeout(hardStopTimer); } catch {}
                pollingActive = false;
                originalMaybeResolve();
              };
              // @ts-ignore override within closure
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              (maybeResolve as any) = wrapped;
            })();
          } catch (playErr) {
            // if we created a hardStopTimer above, it will be cleared in wrapped resolver
            throw playErr;
          }
        });

        try {
          await sound.unloadAsync();
        } catch {}

        // Cleanup temp file if created
        if (tempFilePath) {
          try { await FileSystem.deleteAsync(tempFilePath, { idempotent: true }); } catch {}
        }
      }

      this.currentSpeaker = null;
      await this.restoreAudioMode();
      if (!this.stopRequested && !abortedByPreemption && sessionId === this.playbackSessionId) {
        options.onDone?.();
      }

    } catch (error: any) {
      this.currentSpeaker = null;
      await this.restoreAudioMode();
      const preempted = this.stopRequested || sessionId !== this.playbackSessionId;
      if (isAbortError(error) && preempted) {
        // Intentional interruption: do nothing
        return;
      }
      if (options.onError) {
        options.onError(error);
      }
      // Do not throw to avoid duplicate surfacing
      return;
    }
  }

  stop(): void {
    // Abort any in-flight TTS requests for immediate preemption
    try {
      for (const c of this.pendingControllers) {
        try { c.abort(); } catch {}
      }
      this.pendingControllers = [];
    } catch {}

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


