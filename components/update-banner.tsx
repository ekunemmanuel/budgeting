import { useCallback, useEffect, useState } from 'react';
import { AppState, LayoutAnimation, Platform, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addUpdateListener, checkForUpdate, startUpdate } from 'expo-in-app-updates';
import { useThemeColors } from '../lib/theme';
import { Text } from './text';

type Phase = 'hidden' | 'available' | 'downloading' | 'ready';

/**
 * Tells the user when a newer version is on the Play Store and lets them take
 * it without leaving the app.
 *
 * This is a store update, not an over-the-air one: Play reports that a newer
 * build exists, downloads it in the background, and installs on restart. It
 * only ever reports an update for a build installed from Play, so it stays
 * quiet in development and on sideloaded APKs.
 */
export function UpdateBanner() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [phase, setPhase] = useState<Phase>('hidden');

  const look = useCallback(async () => {
    // Android is the only platform with a real in-app update flow. On iOS this
    // package falls back to the App Store, which needs an AppStoreID that this
    // app does not have yet.
    if (Platform.OS !== 'android') return;

    try {
      const result = await checkForUpdate();
      if (result.updateAvailable) setPhase('available');
    } catch {
      // Not installed from Play, offline, or Play services unavailable. An
      // update prompt is never important enough to surface an error for.
    }
  }, []);

  useEffect(() => {
    look();

    // Check again when the user comes back, so a long-running session still
    // finds out about a release.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') look();
    });
    return () => sub.remove();
  }, [look]);

  useEffect(() => {
    const offDownloaded = addUpdateListener('updateDownloaded', () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setPhase('ready');
    });
    const offCancelled = addUpdateListener('updateCancelled', () => setPhase('available'));
    return () => {
      offDownloaded();
      offCancelled();
    };
  }, []);

  if (phase === 'hidden') return null;

  const begin = async () => {
    setPhase('downloading');
    try {
      // Flexible rather than immediate: it downloads in the background and the
      // user carries on, instead of being held on a full screen Play dialog.
      const started = await startUpdate(false);
      if (!started) setPhase('available');
    } catch {
      setPhase('available');
    }
  };

  const dismiss = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPhase('hidden');
  };

  const ready = phase === 'ready';
  const busy = phase === 'downloading';

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, top: insets.top + 8, paddingHorizontal: 20 }}
    >
      <View className="flex-row items-center gap-3 rounded-2xl bg-surface border border-border p-3">
        <View
          className="h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${colors.primary}22` }}
        >
          <Ionicons
            name={ready ? 'checkmark-circle-outline' : 'arrow-down-circle-outline'}
            size={18}
            color={colors.primary}
          />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-medium text-ink">
            {ready ? 'Update ready' : 'Update available'}
          </Text>
          <Text className="text-xs text-muted">
            {ready
              ? 'Restart the app to finish installing it.'
              : busy
                ? 'Downloading in the background.'
                : 'A newer version of Budgeting is on the Play Store.'}
          </Text>
        </View>

        {!busy && !ready && (
          <Pressable onPress={begin} className="rounded-full bg-primary px-3.5 py-2 active:opacity-80">
            <Text className="text-xs font-semibold text-white">Update</Text>
          </Pressable>
        )}

        {!busy && (
          <Pressable onPress={dismiss} hitSlop={8} className="active:opacity-70">
            <Ionicons name="close" size={16} color={colors.muted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
