import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeColors } from '../lib/theme';
import { Text } from './text';

export function ModalHeader({ title }: { title: string }) {
  const colors = useThemeColors();

  return (
    <View className="flex-row items-center justify-between border-b border-border bg-bg px-safe-or-5 pb-3 pt-safe-or-4">
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        className="h-9 w-9 items-center justify-center rounded-full bg-surface border border-border active:opacity-70"
      >
        <Ionicons name="chevron-back" size={18} color={colors.ink} />
      </Pressable>
      <Text className="text-base font-semibold text-ink">{title}</Text>
      <View className="h-9 w-9" />
    </View>
  );
}
