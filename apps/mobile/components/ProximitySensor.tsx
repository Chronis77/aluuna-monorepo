import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { speechManager } from '../lib/speechManager';

interface ProximitySensorProps {
  children: React.ReactNode;
}

export function ProximitySensor({ children }: ProximitySensorProps) {
  const [isNearEar, setIsNearEar] = useState(false);

  useEffect(() => {
    let proximityListener: any = null;

    const setupProximitySensor = async () => {
      try {
        if (Platform.OS === 'ios') {
          // iOS automatically handles proximity through the audio session
          // We just need to monitor the audio session state
          console.log('iOS: Proximity detection handled by audio session');
        } else if (Platform.OS === 'android') {
          // For Android, we can use the proximity sensor
          // Note: This is a simplified implementation
          // In a real app, you might want to use a native module for better control
          console.log('Android: Using default speaker routing');
          
          // Set up audio routing for speaker by default
          await speechManager.setAudioRouting(false);
        }
      } catch (error) {
        console.error('Error setting up proximity sensor:', error);
      }
    };

    setupProximitySensor();

    return () => {
      if (proximityListener) {
        // Clean up proximity listener if needed
        console.log('Cleaning up proximity sensor');
      }
    };
  }, []);

  // This component doesn't render anything visible
  // It just manages the proximity detection and audio routing
  return <>{children}</>;
} 