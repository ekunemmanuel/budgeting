import { useCallback, useEffect, useRef } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTour } from '../lib/tour';

/**
 * Marks a piece of UI the tour can point at.
 *
 * Wraps its children in a plain View and reports where that View landed in
 * window coordinates, so the overlay can cut a hole around it. The wrapper is
 * layout-neutral by default; pass `style` when it needs to take part in a flex
 * row, so it does not collapse the thing it is wrapping.
 */
export function TourTarget({
  id,
  children,
  style,
}: {
  id: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const ref = useRef<View>(null);
  const { measure, unmeasure, activeTarget } = useTour();

  const report = useCallback(() => {
    // measureInWindow gives coordinates relative to the window. The overlay
    // converts them into its own space, so the two agree on any device.
    ref.current?.measureInWindow((x, y, width, height) => {
      if (width === 0 && height === 0) return;
      measure(id, { x, y, width, height });
    });
  }, [id, measure]);

  // onLayout alone reports a position that was true when the view was laid
  // out. By the time the tour reaches this step the page may have scrolled,
  // text may have reflowed at a different font scale, or a row above may have
  // expanded. Re-measure when this step becomes the active one so the spotlight
  // is drawn around where the element is now.
  // Measured more than once on purpose. The screen may still be scrolling this
  // target into view when the step opens, so an immediate reading can be of
  // where it was rather than where it comes to rest.
  useEffect(() => {
    if (activeTarget !== id) return;
    report();
    const frame = requestAnimationFrame(report);
    const settled = setTimeout(report, 400);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settled);
    };
  }, [activeTarget, id, report]);

  useEffect(() => () => unmeasure(id), [id, unmeasure]);

  return (
    // collapsable={false} keeps Android from optimising the view out of the
    // native hierarchy, which would leave it unmeasurable.
    <View ref={ref} collapsable={false} onLayout={report} style={style}>
      {children}
    </View>
  );
}
