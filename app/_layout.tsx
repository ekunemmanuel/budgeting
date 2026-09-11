import '../global.css';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaListener, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Uniwind } from 'uniwind';
import { DataProvider } from '../lib/store';

SplashScreen.preventAutoHideAsync();

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f7f7f8' }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#16161a', textAlign: 'center' }}>
        Something went wrong
      </Text>
      <Text style={{ marginTop: 8, fontSize: 14, color: '#6b6b76', textAlign: 'center' }}>
        {error.message || 'An unexpected error occurred.'}
      </Text>
      <Pressable
        onPress={retry}
        style={{ marginTop: 20, backgroundColor: '#16a37a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 }}
      >
        <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'PublicSans-Regular': require('../assets/fonts/Public Sans/static/PublicSans-Regular.ttf'),
    'PublicSans-Medium': require('../assets/fonts/Public Sans/static/PublicSans-Medium.ttf'),
    'PublicSans-SemiBold': require('../assets/fonts/Public Sans/static/PublicSans-SemiBold.ttf'),
    'PublicSans-Bold': require('../assets/fonts/Public Sans/static/PublicSans-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
        <DataProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="add-transaction" options={{ presentation: 'modal' }} />
            <Stack.Screen name="edit-budget" options={{ presentation: 'modal' }} />
            <Stack.Screen name="add-category" options={{ presentation: 'modal' }} />
          </Stack>
        </DataProvider>
      </SafeAreaListener>
    </SafeAreaProvider>
  );
}
