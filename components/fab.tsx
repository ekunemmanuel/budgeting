import { Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

export function Fab({ href }: { href: '/add-transaction' }) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(href);
      }}
      className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80"
      style={{ boxShadow: '0 4px 12px rgba(22, 163, 122, 0.4)' }}
    >
      <Ionicons name="add" size={28} color="white" />
    </Pressable>
  );
}
