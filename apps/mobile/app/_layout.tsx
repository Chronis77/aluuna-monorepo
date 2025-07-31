// app/_layout.tsx
import { Quicksand_400Regular, Quicksand_500Medium, Quicksand_600SemiBold } from '@expo-google-fonts/quicksand';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { AuthProvider } from '../context/AuthContext';
import { OnboardingProvider } from '../context/OnboardingContext';
import '../global.css';

export default function Layout() {
  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <OnboardingProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />      
        <Slot />
      </OnboardingProvider>
    </AuthProvider>
  );
}
