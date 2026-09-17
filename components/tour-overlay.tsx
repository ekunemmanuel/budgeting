import { useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTour } from '../lib/tour';
import { useThemeColors } from '../lib/theme';
import { Text } from './text';

const DIM = 'rgba(0, 0, 0, 0.72)';
/** Breathing room between the highlight ring and the element inside it. */
const PAD = 6;
const CARD_GAP = 14;
const CARD_SIDE = 20;
/** Enough for the title, body and controls; the card is placed against this. */
const CARD_ESTIMATE = 190;

export function TourOverlay() {
  const { activeSteps, stepIndex, next, back, finish, rects } = useTour();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  const step = activeSteps[stepIndex];
  const measured = step ? rects[step.target] : undefined;

  // A target that sits below the fold measures fine but is nowhere to be seen,
  // which would dim the screen around nothing. Treat off-screen as unusable.
  const rect =
    measured &&
    measured.y + measured.height > 0 &&
    measured.y < height &&
    measured.x + measured.width > 0 &&
    measured.x < width
      ? measured
      : undefined;

  // A target can also be legitimately absent: the list is empty, or the row it
  // points at has not been revealed yet. Give it a moment to lay out and
  // report, then move on rather than sitting on a blank dim.
  useEffect(() => {
    if (!step || rect) return;
    const timer = setTimeout(next, 600);
    return () => clearTimeout(timer);
  }, [step, rect, next]);

  if (!step || !rect) return null;

  const hole = {
    x: Math.max(0, rect.x - PAD),
    y: Math.max(0, rect.y - PAD),
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };

  // Put the card under the highlight when there is room, otherwise above it.
  const below = hole.y + hole.height + CARD_GAP;
  const fitsBelow = below + CARD_ESTIMATE < height - insets.bottom;
  const cardStyle = fitsBelow
    ? { top: below }
    : { bottom: height - hole.y + CARD_GAP };

  const first = stepIndex === 0;
  const last = stepIndex === activeSteps.length - 1;

  return (
    <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      {/* One transparent catcher across the whole screen, underneath the dim.
          It covers the spotlight hole too, so the screen behind cannot be
          tapped or scrolled while the tour is explaining it. Tapping anywhere
          advances. */}
      <Pressable onPress={next} style={StyleSheet.absoluteFill} />

      {/* Four dim panels around the target rather than a cut-out mask, which
          would need an SVG dependency. Purely visual, so they never interfere
          with the catcher below them. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={{ position: 'absolute', left: 0, top: 0, right: 0, height: hole.y, backgroundColor: DIM }} />
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: hole.y + hole.height,
            right: 0,
            height: height - (hole.y + hole.height),
            backgroundColor: DIM,
          }}
        />
        <View
          style={{ position: 'absolute', left: 0, top: hole.y, width: hole.x, height: hole.height, backgroundColor: DIM }}
        />
        <View
          style={{
            position: 'absolute',
            left: hole.x + hole.width,
            top: hole.y,
            width: width - (hole.x + hole.width),
            height: hole.height,
            backgroundColor: DIM,
          }}
        />

        {/* The ring around the highlighted element. */}
        <View
          style={{
            position: 'absolute',
            left: hole.x,
            top: hole.y,
            width: hole.width,
            height: hole.height,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: colors.primary,
          }}
        />
      </View>

      <View
        style={{
          position: 'absolute',
          left: CARD_SIDE,
          right: CARD_SIDE,
          ...cardStyle,
        }}
      >
        <View className="rounded-2xl bg-surface border border-border p-4">
          <Text className="text-base font-semibold text-ink">{step.title}</Text>
          <Text className="mt-1.5 text-sm text-muted">{step.body}</Text>

          <View className="mt-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              {activeSteps.map((s, i) => (
                <View
                  key={s.target}
                  style={{
                    width: i === stepIndex ? 16 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === stepIndex ? colors.primary : colors.border,
                  }}
                />
              ))}
            </View>

            <View className="flex-row items-center gap-2">
              {!first && (
                <Pressable onPress={back} hitSlop={8} className="px-3 py-2 active:opacity-70">
                  <Text className="text-sm font-medium text-muted">Back</Text>
                </Pressable>
              )}
              <Pressable
                onPress={next}
                className="rounded-full bg-primary px-4 py-2 active:opacity-80"
              >
                <Text className="text-sm font-semibold text-white">{last ? 'Got it' : 'Next'}</Text>
              </Pressable>
            </View>
          </View>

          {!last && (
            <Pressable onPress={finish} hitSlop={8} className="mt-1 items-center py-1 active:opacity-70">
              <Text className="text-xs text-muted">Skip this tour</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
