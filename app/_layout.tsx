import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../services/supabase';
import { AppProvider } from '../context/AppContext';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          await supabase.auth.signInAnonymously();
        }
      } catch (e) {
        // If anon auth fails (e.g. network), proceed anyway
        console.warn('Auth init failed:', e);
      }
      setReady(true);
    };
    init();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#7c3aed" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0f172a' },
            animation: 'slide_from_right',
          }}
        />
      </AppProvider>
    </SafeAreaProvider>
  );
}
