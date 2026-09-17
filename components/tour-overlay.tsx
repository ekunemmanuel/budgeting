import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTour } from '../lib/tour';
import { placeTourCard } from '../lib/tour-placement';
import { useThemeColors } from '../lib/theme';
import { Text } from './text';

const DIM = 'rgba(0, 0, 0, 0.72)';
/** Breathing room between the highlight ring and the element inside it. */
const PAD = 6;
const CARD_GAP = 14;
const CARD_SIDE = 20;
/** Keeps the card off the very edge of the screen on short devices. */
const EDGE = 8;
/** Below this the card is not worth showing, so it is allowed to overlap. */
const MIN_CARD = 150;

export function TourOverlay() {
  const { activeSteps, stepIndex, next, back, finish, rects } = useTour();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  const rootRef = useRef<View>(null);
  // Targets report window coordinates, but this overlay is positioned inside
  // the app's view tree. On Android those two spaces can differ by the height
  // of the status bar, which varies by device, so a spotlight aligned on one
  // phone lands off-target on another. Measuring where this overlay actually
  // sits and subtracting it makes the two spaces agree everywhere; when they
  // already agree the offset is simply zero.
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const readOrigin = useCallback(() => {
    rootRef.current?.measureInWindow((x, y) => {
      setOrigin((prev) => (prev.x === x && prev.y === y ? prev : { x, y }));
    });
  }, []);

  // Measured rather than estimated: a long body, or a device with large system
  // text, makes this card much taller than any fixed guess.
  const [cardHeight, setCardHeight] = useState(0);

  const step = activeSteps[stepIndex];
  const measured = step ? rects[step.target] : undefined;

  const target = measured
    ? {
        x: measured.x - origin.x,
        y: measured.y - origin.y,
        width: measured.width,
        height: measured.height,
      }
    : undefined;

  // A target that sits below the fold measures fine but is nowhere to be seen,
  // which would dim the screen around nothing. Treat off-screen as unusable.
  const rect =
    target &&
    target.y + target.height > 0 &&
    target.y < height &&
    target.x + target.width > 0 &&
    target.x < width
      ? target
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

  // Clamped to the screen so a partly visible target never produces a panel
  // with a negative size.
  const holeLeft = Math.max(0, Math.min(rect.x - PAD, width));
  const holeTop = Math.max(0, Math.min(rect.y - PAD, height));
  const holeRight = Math.min(width, Math.max(rect.x + rect.width + PAD, 0));
  const holeBottom = Math.min(height, Math.max(rect.y + rect.height + PAD, 0));
  const hole = {
    x: holeLeft,
    y: holeTop,
    width: Math.max(0, holeRight - holeLeft),
    height: Math.max(0, holeBottom - holeTop),
  };

  const { top: cardTop, maxHeight: cardMaxHeight } = placeTourCard({
    hole,
    screenHeight: height,
    insetTop: insets.top,
    insetBottom: insets.bottom,
    cardHeight,
    gap: CARD_GAP,
    edge: EDGE,
    minCard: MIN_CARD,
  });

  const first = stepIndex === 0;
  const last = stepIndex === activeSteps.length - 1;

  return (
    <View
      ref={rootRef}
      onLayout={readOrigin}
      style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
    >
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
            height: Math.max(0, height - (hole.y + hole.height)),
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
            width: Math.max(0, width - (hole.x + hole.width)),
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
        onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
        style={{
          position: 'absolute',
          left: CARD_SIDE,
          right: CARD_SIDE,
          top: cardTop,
          maxHeight: cardMaxHeight,
        }}
      >
        <View className="rounded-2xl bg-surface border border-border p-4" style={{ flexShrink: 1 }}>
          <Text className="text-base font-semibold text-ink">{step.title}</Text>

          {/* Only the body gives way when space is tight, so the title and the
              controls are never the part that gets cut off. */}
          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ paddingTop: 6 }}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text className="text-sm text-muted">{step.body}</Text>
          </ScrollView>

          <View className="mt-4 flex-row items-center justify-between gap-3">
            <View className="flex-1 flex-row flex-wrap items-center gap-1.5">
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

            <View className="shrink-0 flex-row items-center gap-2">
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
