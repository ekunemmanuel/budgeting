import { useCallback, useEffect, useRef } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTour } from '../lib/tour';

/**
 * Marks a piece of UI the tour can point at.
 *
 * Wraps its children in a plain View and reports where that View landed in
 * window coordinates, so the overlay can cut a hole around it. The wrapper is
 * layout-neutral by default — pass `style` when it needs to take part in a flex
 * row, so it doesn't collapse the thing it is wrapping.
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
  const { measure, unmeasure } = useTour();

  const report = useCallback(() => {
    // measureInWindow gives coordinates relative to the window, which is what
    // the overlay uses — it sits above the navigator, not inside the screen.
    ref.current?.measureInWindow((x, y, width, height) => {
      if (width === 0 && height === 0) return;
      measure(id, { x, y, width, height });
    });
  }, [id, measure]);

  useEffect(() => () => unmeasure(id), [id, unmeasure]);

  return (
    // collapsable={false} keeps Android from optimising the view out of the
    // native hierarchy, which would leave it unmeasurable.
    <View ref={ref} collapsable={false} onLayout={report} style={style}>
      {children}
    </View>
  );
}
