import { View } from 'react-native';

export function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View className="h-2 w-full rounded-full bg-border overflow-hidden">
      <View style={{ width: `${pct * 100}%`, backgroundColor: color }} className="h-full rounded-full" />
    </View>
  );
}
