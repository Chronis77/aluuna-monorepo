import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './context/AuthContext';
import JournalScreen from './screens/JournalScreen';
import LoginScreen from './screens/LoginScreen';

const Stack = createNativeStackNavigator();

function MainNavigator() {
  const { session } = useAuth();

  return (
    <Stack.Navigator>
      {session ? (
        <Stack.Screen name="Journal" component={JournalScreen} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
