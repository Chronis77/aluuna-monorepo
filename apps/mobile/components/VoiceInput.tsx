import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { config, validateConfig } from '../lib/config';

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  onError: (message: string) => void;
  onInfo: (message: string) => void;
  onCancel: () => void;
  onStart: () => void;
  dialogueMode?: boolean; // New prop for dialogue mode
  onDialogueTranscription?: (text: string) => void; // New callback for dialogue mode
  disabled?: boolean; // New prop to disable the microphone button
}

export function VoiceInput({ 
  onTranscription, 
  onError, 
  onInfo, 
  onCancel, 
  onStart,
  dialogueMode = false,
  onDialogueTranscription,
  disabled = false
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isWhisperAvailable, setIsWhisperAvailable] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const recordingAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(1)).current;

  // Dynamic wave animations based on audio input - more waves for better visual effect
  const wave1 = useRef(new Animated.Value(0.05)).current;
  const wave2 = useRef(new Animated.Value(0.05)).current;
  const wave3 = useRef(new Animated.Value(0.05)).current;
  const wave4 = useRef(new Animated.Value(0.05)).current;
  const wave5 = useRef(new Animated.Value(0.05)).current;
  const wave6 = useRef(new Animated.Value(0.05)).current;
  const wave7 = useRef(new Animated.Value(0.05)).current;
  const wave8 = useRef(new Animated.Value(0.05)).current;
  const wave9 = useRef(new Animated.Value(0.05)).current;
  const wave10 = useRef(new Animated.Value(0.05)).current;

  // Initialize the recorder safely
  useEffect(() => {
    const initializeRecorder = async () => {
      try {
        //console.log('Initializing audio recorder with expo-av...');
        //console.log('Platform:', Platform.OS);
        
        // Request permissions
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          //console.log('Permission to access microphone was denied');
          setHasError(true);
          onError('Permission to access microphone is required');
          return;
        }

        // Set audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        // Check Whisper API availability without crashing
        try {
          const whisperAvailable = validateConfig();
          setIsWhisperAvailable(whisperAvailable);
          if (!whisperAvailable) {
            console.log('Whisper API not configured - voice transcription will be disabled');
          }
        } catch (configError) {
          console.log('Error checking Whisper configuration:', configError);
          setIsWhisperAvailable(false);
        }
        
        setIsInitialized(true);
        //console.log('Audio recorder initialized successfully');
      } catch (error) {
        console.error('Error initializing audio recorder:', error);
        setHasError(true);
        onError('Failed to initialize audio recording');
      }
    };

    initializeRecorder();

    // Cleanup function to dispose of any active recording when component unmounts
    return () => {
      if (recording) {
        try {
          recording.stopAndUnloadAsync();
        } catch (cleanupError) {
          console.log('Error cleaning up recording on unmount:', cleanupError);
        }
      }
    };
  }, []);

  // Whisper API transcription function with retry logic
  const transcribeAudio = async (audioUri: string): Promise<string> => {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second base delay
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check if Whisper is available before attempting transcription
        if (!isWhisperAvailable) {
          throw new Error('Voice transcription is not available. Please configure your OpenAI API key.');
        }

        // Validate configuration
        if (!validateConfig()) {
          throw new Error('OpenAI API key not configured');
        }

        // Create form data for the audio file
        const formData = new FormData();
        formData.append('file', {
          uri: audioUri,
          type: 'audio/m4a',
          name: 'recording.m4a',
        } as any);
        formData.append('model', 'whisper-1');
        formData.append('response_format', 'json');

        // Make request to Whisper API
        const response = await fetch(config.openai.whisperEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.openai.apiKey}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error?.message || response.statusText;
          
          // Check if it's a retryable error (overload, rate limit, etc.)
          const isRetryable = errorMessage.includes('overloaded') || 
                             errorMessage.includes('rate limit') || 
                             errorMessage.includes('try again') ||
                             response.status >= 500;
          
          if (isRetryable && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`🔄 Whisper API overloaded, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
            onInfo(`Transcription overloaded, retrying... (${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue; // Try again
          } else {
            throw new Error(`Whisper API error: ${errorMessage}`);
          }
        }

        const data = await response.json();
        return data.text || '';
        
      } catch (error) {
        console.error(`Transcription error (attempt ${attempt}/${maxRetries}):`, error);
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }
        
        // For non-retryable errors, throw immediately
        if (error instanceof Error && !error.message.includes('overloaded') && 
            !error.message.includes('rate limit') && !error.message.includes('try again')) {
          throw error;
        }
        
        // Otherwise, wait and retry
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`🔄 Transcription failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        onInfo(`Transcription failed, retrying... (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Transcription failed after all retry attempts');
  };

  // Update wave animations based on audio metering
  useEffect(() => {
    if (isRecording && recording) {
      let lastLogTime = 0;
      let lastMeteringValue: number | null = null;
      let lastAudioTime = 0;
      let cooldownActive = false;
      let hasHadAudio = false;
      let recordingStartTime = Date.now();
      let consecutiveAudioCount = 0;
      let consecutiveSilenceCount = 0;
      let isPollingActive = true; // Flag to track if polling should continue

      // Ensure waves start completely flat
      Animated.parallel([
        Animated.timing(wave1, { toValue: 0.05, duration: 0, useNativeDriver: true }),
        Animated.timing(wave2, { toValue: 0.05, duration: 0, useNativeDriver: true }),
        Animated.timing(wave3, { toValue: 0.05, duration: 0, useNativeDriver: true }),
        Animated.timing(wave4, { toValue: 0.05, duration: 0, useNativeDriver: true }),
        Animated.timing(wave5, { toValue: 0.05, duration: 0, useNativeDriver: true }),
        Animated.timing(wave6, { toValue: 0.05, duration: 0, useNativeDriver: true }),
        Animated.timing(wave7, { toValue: 0.05, duration: 0, useNativeDriver: true }),
        Animated.timing(wave8, { toValue: 0.05, duration: 0, useNativeDriver: true }),
        Animated.timing(wave9, { toValue: 0.05, duration: 0, useNativeDriver: true }),
        Animated.timing(wave10, { toValue: 0.05, duration: 0, useNativeDriver: true }),
      ]).start();

      // Poll for metering data
      const pollInterval = setInterval(async () => {
        try {
          // Check if polling should continue
          if (!isPollingActive || !recording) {
            console.log('Polling stopped - recording not available or polling disabled');
            clearInterval(pollInterval);
            return;
          }

          // Check if recording is properly prepared before getting status
          let status;
          try {
            status = await recording.getStatusAsync();
          } catch (statusError) {
            // If we can't get status, the recording might not be properly prepared
            console.log('Recording status unavailable, stopping polling');
            isPollingActive = false;
            clearInterval(pollInterval);
            return;
          }

          // Only log occasionally to avoid performance issues
          const now = Date.now();
          if (now - lastLogTime > 1000) {
            //console.log('Recording status:', status);
            //console.log('Platform:', Platform.OS);
            lastLogTime = now;
          }

          if (status.metering !== undefined) {
            // Only log if metering value changed significantly
            if (lastMeteringValue === null || Math.abs(status.metering - lastMeteringValue) > 5) {
              //console.log('Metering value:', status.metering);
              lastMeteringValue = status.metering;
            }

            // Convert metering value to animation scale
            const normalizedMetering = Math.max(0, (status.metering + 160) / 160);
            const amplitudeScale = 0.05 + (normalizedMetering * 2.45);

            // Audio detection thresholds
            const audioThreshold = -30;
            const hasAudioInput = status.metering > audioThreshold;

            // Consecutive audio detection
            if (hasAudioInput) {
              consecutiveAudioCount++;
              consecutiveSilenceCount = 0;
            } else {
              consecutiveSilenceCount++;
              consecutiveAudioCount = 0;
            }

            const requiredConsecutiveAudio = 3;
            const hasConfirmedAudio = consecutiveAudioCount >= requiredConsecutiveAudio;

            //console.log(`DEBUG: Metering=${status.metering}, Threshold=${audioThreshold}, HasAudio=${hasAudioInput}, Consecutive=${consecutiveAudioCount}, Confirmed=${hasConfirmedAudio}`);

            if (hasConfirmedAudio) {
              hasHadAudio = true;
            }

            // Cooldown logic
            const timeSinceLastAudio = now - lastAudioTime;

            if (hasConfirmedAudio) {
              lastAudioTime = now;
              cooldownActive = false;
              // console.log('🎤 Fresh audio detected!');
            } else if (!hasConfirmedAudio && hasHadAudio) {
              if (!cooldownActive && timeSinceLastAudio > 150) {
                cooldownActive = true;
                //console.log('🔇 Audio stopped, starting cooldown period');
              }
            }

            // Animation logic
            const recordingStartDelay = 500;
            const timeSinceRecordingStart = now - recordingStartTime;
            const shouldAnimate = hasConfirmedAudio && !cooldownActive && (timeSinceRecordingStart > recordingStartDelay);

            //console.log(`🎬 Should animate: ${shouldAnimate}`);

            if (shouldAnimate) {
              //console.log('🎵 ANIMATING WAVES!');
              const time = Date.now() / 1000;
              const frequencies = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
              const phases = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5];

              const variations = frequencies.map((freq, index) => {
                const sineValue = Math.sin(time * freq + phases[index]);
                const frequencyComponent = 0.5 + (0.5 * sineValue);
                const combinedScale = amplitudeScale * frequencyComponent;
                const multipliers = [0.6, 1.4, 0.5, 1.3, 0.7, 1.2, 0.8, 0.6, 1.1, 0.7];
                return combinedScale * multipliers[index];
              });

              Animated.parallel([
                Animated.timing(wave1, { toValue: variations[0], duration: 150, useNativeDriver: true }),
                Animated.timing(wave2, { toValue: variations[1], duration: 180, useNativeDriver: true }),
                Animated.timing(wave3, { toValue: variations[2], duration: 120, useNativeDriver: true }),
                Animated.timing(wave4, { toValue: variations[3], duration: 160, useNativeDriver: true }),
                Animated.timing(wave5, { toValue: variations[4], duration: 140, useNativeDriver: true }),
                Animated.timing(wave6, { toValue: variations[5], duration: 170, useNativeDriver: true }),
                Animated.timing(wave7, { toValue: variations[6], duration: 130, useNativeDriver: true }),
                Animated.timing(wave8, { toValue: variations[7], duration: 155, useNativeDriver: true }),
                Animated.timing(wave9, { toValue: variations[8], duration: 145, useNativeDriver: true }),
                Animated.timing(wave10, { toValue: variations[9], duration: 165, useNativeDriver: true }),
              ]).start();
            } else {
              //console.log('🔇 Keeping waves flat');
              Animated.parallel([
                Animated.timing(wave1, { toValue: 0.05, duration: 300, useNativeDriver: true }),
                Animated.timing(wave2, { toValue: 0.05, duration: 300, useNativeDriver: true }),
                Animated.timing(wave3, { toValue: 0.05, duration: 300, useNativeDriver: true }),
                Animated.timing(wave4, { toValue: 0.05, duration: 300, useNativeDriver: true }),
                Animated.timing(wave5, { toValue: 0.05, duration: 300, useNativeDriver: true }),
                Animated.timing(wave6, { toValue: 0.05, duration: 300, useNativeDriver: true }),
                Animated.timing(wave7, { toValue: 0.05, duration: 300, useNativeDriver: true }),
                Animated.timing(wave8, { toValue: 0.05, duration: 300, useNativeDriver: true }),
                Animated.timing(wave9, { toValue: 0.05, duration: 300, useNativeDriver: true }),
                Animated.timing(wave10, { toValue: 0.05, duration: 300, useNativeDriver: true }),
              ]).start();
            }
          } else {
            // No metering data - keep waves at minimum height
            Animated.parallel([
              Animated.timing(wave1, { toValue: 0.05, duration: 300, useNativeDriver: true }),
              Animated.timing(wave2, { toValue: 0.05, duration: 300, useNativeDriver: true }),
              Animated.timing(wave3, { toValue: 0.05, duration: 300, useNativeDriver: true }),
              Animated.timing(wave4, { toValue: 0.05, duration: 300, useNativeDriver: true }),
              Animated.timing(wave5, { toValue: 0.05, duration: 300, useNativeDriver: true }),
              Animated.timing(wave6, { toValue: 0.05, duration: 300, useNativeDriver: true }),
              Animated.timing(wave7, { toValue: 0.05, duration: 300, useNativeDriver: true }),
              Animated.timing(wave8, { toValue: 0.05, duration: 300, useNativeDriver: true }),
              Animated.timing(wave9, { toValue: 0.05, duration: 300, useNativeDriver: true }),
              Animated.timing(wave10, { toValue: 0.05, duration: 300, useNativeDriver: true }),
            ]).start();
          }
        } catch (error) {
          console.error('Error polling recording status:', error);
        }
      }, 200);

      return () => {
        isPollingActive = false;
        clearInterval(pollInterval);
      };
    }
  }, [isRecording, recording]);

  const startRecording = async () => {
    try {
      if (!isInitialized) {
        onError('Audio recorder not ready yet');
        return;
      }

      if (!isWhisperAvailable) {
        onError('Voice transcription is not available. Please configure your OpenAI API key in the .env file.');
        return;
      }

      // Prevent multiple recording sessions
      if (isRecording || recording || isStartingRecording) {
        console.log('Recording already in progress or starting, ignoring start request');
        return;
      }

      setIsStartingRecording(true);
      //console.log('Starting recording...');

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          //console.log('Recording status update:', status);
        },
        200 // Update interval for metering
      );

      // Verify the recording is properly prepared before setting state
      if (!newRecording) {
        throw new Error('Failed to create recording object');
      }

      // Test that we can get status from the recording
      try {
        await newRecording.getStatusAsync();
      } catch (statusError) {
        console.error('Recording not properly prepared:', statusError);
        throw new Error('Recording not properly prepared');
      }

      setRecording(newRecording);
      //console.log('Recording started');

      // Add a small delay to ensure recording is fully ready before starting polling
      setTimeout(() => {
        // Fade out the mic button
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setIsRecording(true);
          onStart();

          // Fade in the recording interface
          Animated.timing(fadeAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        });
      }, 100); // Small delay to ensure recording is ready

      // Start recording animation (pulsing red dot)
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

    } catch (error) {
      console.error('Error starting recording:', error);
      onError('Failed to start recording');
    } finally {
      setIsStartingRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) {
        onError('No recording in progress');
        return;
      }

      //console.log('Stopping recording...');

      // Stop recording
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      //console.log('Recording stopped, URI:', uri);

      if (!uri) {
        onError('No audio recording available - please try again');
        return;
      }

      // Reset wave animations to base values
      Animated.parallel([
        Animated.timing(wave1, { toValue: 0.2, duration: 200, useNativeDriver: true }),
        Animated.timing(wave2, { toValue: 0.3, duration: 200, useNativeDriver: true }),
        Animated.timing(wave3, { toValue: 0.25, duration: 200, useNativeDriver: true }),
        Animated.timing(wave4, { toValue: 0.4, duration: 200, useNativeDriver: true }),
        Animated.timing(wave5, { toValue: 0.2, duration: 200, useNativeDriver: true }),
        Animated.timing(wave6, { toValue: 0.35, duration: 200, useNativeDriver: true }),
        Animated.timing(wave7, { toValue: 0.3, duration: 200, useNativeDriver: true }),
        Animated.timing(wave8, { toValue: 0.25, duration: 200, useNativeDriver: true }),
        Animated.timing(wave9, { toValue: 0.4, duration: 200, useNativeDriver: true }),
        Animated.timing(wave10, { toValue: 0.2, duration: 200, useNativeDriver: true }),
      ]).start();

      // Start transcription process
      setIsTranscribing(true);

      // Start spinner animation
      Animated.loop(
        Animated.timing(recordingAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();

      // Transcribe the audio
      const transcribedText = await transcribeAudio(uri);

      if (transcribedText.trim()) {
        // Handle dialogue mode vs normal mode
        if (dialogueMode && onDialogueTranscription) {
          // In dialogue mode, automatically send the transcribed text
          onDialogueTranscription(transcribedText);
        } else {
          // Normal mode - just set the input text
          onTranscription(transcribedText);
        }
      } else {
        onError('No speech detected in the recording');
      }

    } catch (error) {
      console.error('Error stopping recording:', error);
      onError('Failed to transcribe audio');
    } finally {
      // Reset states
      setIsTranscribing(false);
      
      // Properly dispose of the recording object
      if (recording) {
        try {
          // Ensure recording is stopped and unloaded
          await recording.stopAndUnloadAsync();
        } catch (disposeError) {
          console.log('Error disposing recording:', disposeError);
        }
      }
      setRecording(null);
      recordingAnimation.stopAnimation();

      // Fade out the recording interface
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIsRecording(false);

        // Fade in the mic button
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const cancelRecording = async () => {
    try {
      //console.log('Canceling recording...');
      
      // Stop recording if it's active
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (stopError) {
          console.log('Error stopping recording during cancel:', stopError);
        }
      }
    } catch (error) {
      console.error('Error canceling recording:', error);
    }

    // Reset wave animations to base values
    Animated.parallel([
      Animated.timing(wave1, { toValue: 0.2, duration: 200, useNativeDriver: true }),
      Animated.timing(wave2, { toValue: 0.3, duration: 200, useNativeDriver: true }),
      Animated.timing(wave3, { toValue: 0.25, duration: 200, useNativeDriver: true }),
      Animated.timing(wave4, { toValue: 0.4, duration: 200, useNativeDriver: true }),
      Animated.timing(wave5, { toValue: 0.2, duration: 200, useNativeDriver: true }),
      Animated.timing(wave6, { toValue: 0.35, duration: 200, useNativeDriver: true }),
      Animated.timing(wave7, { toValue: 0.3, duration: 200, useNativeDriver: true }),
      Animated.timing(wave8, { toValue: 0.25, duration: 200, useNativeDriver: true }),
      Animated.timing(wave9, { toValue: 0.4, duration: 200, useNativeDriver: true }),
      Animated.timing(wave10, { toValue: 0.2, duration: 200, useNativeDriver: true }),
    ]).start();

    // Fade out the recording interface
    Animated.timing(fadeAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsRecording(false);
      setRecording(null);
      recordingAnimation.stopAnimation();
      onCancel();

      // Fade in the mic button
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handlePress = () => {
    if (disabled) {
      return; // Don't allow recording when disabled
    }

    if (!isInitialized) {
      onError('Audio recorder not ready yet');
      return;
    }

    if (!isWhisperAvailable) {
      onError('Voice transcription is not available. Please configure your OpenAI API key in the .env file.');
      return;
    }

    if (!isRecording && !isStartingRecording) {
      startRecording();
    }
  };

  // Don't render if not initialized
  if (!isInitialized) {
    return (
      <View>
        <TouchableOpacity
          className="w-12 h-12 rounded-full bg-gray-400 items-center justify-center"
          disabled={true}
        >
          <MaterialIcons name="mic" size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  // Show error state if there was an error
  if (hasError) {
    return (
      <View>
        <TouchableOpacity
          className="w-12 h-12 rounded-full bg-red-500 items-center justify-center"
          disabled={true}
        >
          <MaterialIcons name="mic" size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  // Show disabled state if Whisper is not available
  if (!isWhisperAvailable) {
    return (
      <View>
        <TouchableOpacity
          className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center"
          disabled={true}
        >
          <MaterialIcons name="mic-off" size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  if (isRecording) {
    return (
      <Animated.View
        className="flex-row items-center justify-between px-4 py-3 bg-gray-50 rounded-2xl flex-1"
        style={{ opacity: fadeAnimation }}
      >
        {/* Cancel Button - Far Left */}
        <TouchableOpacity
          onPress={cancelRecording}
          className="w-10 h-10 rounded-full border-2 border-gray-400 items-center justify-center"
        >
          <MaterialIcons name="close" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Center Content */}
        <View className="flex-row items-center space-x-4">
          {/* Audio Wave Animation - Responsive to actual audio input */}
          <View className="flex-row items-center space-x-0.5">
            <Animated.View
              className="w-1.5 bg-blue-custom rounded-full h-6"
              style={{
                transform: [{
                  scaleY: wave1,
                }],
              }}
            />
            <Animated.View
              className="w-1.5 bg-blue-custom rounded-full h-8"
              style={{
                transform: [{
                  scaleY: wave2,
                }],
              }}
            />
            <Animated.View
              className="w-1.5 bg-blue-custom rounded-full h-5"
              style={{
                transform: [{
                  scaleY: wave3,
                }],
              }}
            />
            <Animated.View
              className="w-1.5 bg-blue-custom rounded-full h-7"
              style={{
                transform: [{
                  scaleY: wave4,
                }],
              }}
            />
            <Animated.View
              className="w-1.5 bg-blue-custom rounded-full h-6"
              style={{
                transform: [{
                  scaleY: wave5,
                }],
              }}
            />
            <Animated.View
              className="w-1.5 bg-blue-custom rounded-full h-8"
              style={{
                transform: [{
                  scaleY: wave6,
                }],
              }}
            />
            <Animated.View
              className="w-1.5 bg-blue-custom rounded-full h-5"
              style={{
                transform: [{
                  scaleY: wave7,
                }],
              }}
            />
            <Animated.View
              className="w-1.5 bg-blue-custom rounded-full h-7"
              style={{
                transform: [{
                  scaleY: wave8,
                }],
              }}
            />
            <Animated.View
              className="w-1.5 bg-blue-custom rounded-full h-6"
              style={{
                transform: [{
                  scaleY: wave9,
                }],
              }}
            />
            <Animated.View
              className="w-1.5 bg-blue-custom rounded-full h-8"
              style={{
                transform: [{
                  scaleY: wave10,
                }],
              }}
            />
          </View>

          {/* Listening Text */}
          <Text className="text-lg font-semibold text-gray-800 ml-5">
            {isTranscribing ? 'Transcribing...' : 'Listening...'}
          </Text>
        </View>

        {/* Confirm Button - Far Right */}
        <TouchableOpacity
          onPress={stopRecording}
          disabled={isTranscribing}
          className={`w-10 h-10 rounded-full items-center justify-center ${isTranscribing ? 'bg-gray-400' : 'bg-blue-custom'
            }`}
        >
          {isTranscribing ? (
            <Animated.View
              style={{
                transform: [{
                  rotate: recordingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                }],
              }}
            >
              <MaterialIcons name="sync" size={20} color="white" />
            </Animated.View>
          ) : (
            <MaterialIcons name="check" size={20} color="white" />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ opacity: fadeAnimation }}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || isStartingRecording}
        className={`w-12 h-12 rounded-full items-center justify-center ${
          disabled || isStartingRecording ? 'bg-gray-400' : 'bg-blue-custom'
        }`}
      >
        <MaterialIcons name="mic" size={20} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
}

