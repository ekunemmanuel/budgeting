import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';

const BOTTOM_SPACING = 24;

interface Measurable {
  measure(
    callback: (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => void
  ): void;
}

export function useKeyboardAwareScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const keyboardHeight = useRef(0);
  const [keyboardPadding, setKeyboardPadding] = useState(0);
  const focusedInput = useRef<RefObject<Measurable | null> | null>(null);
  const { height: windowHeight } = useWindowDimensions();

  const reveal = useCallback(
    (inputRef: RefObject<Measurable | null>) => {
      const node = inputRef.current;
      const scrollNode = scrollRef.current;
      if (!node || !scrollNode) return;

      node.measure((_x, _y, _width, height, _pageX, pageY) => {
        const visibleBottom = windowHeight - keyboardHeight.current;
        const overlap = pageY + height + BOTTOM_SPACING - visibleBottom;
        if (overlap > 0) {
          scrollNode.scrollTo({ y: Math.max(0, scrollY.current + overlap), animated: true });
        }
      });
    },
    [windowHeight]
  );

  useEffect(() => {
    const showEventName = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEventName = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEventName, (e: KeyboardEvent) => {
      keyboardHeight.current = e.endCoordinates.height;
      setKeyboardPadding(e.endCoordinates.height);
      if (focusedInput.current) {
        // Wait a beat for the extra bottom padding to land before scrolling into it.
        requestAnimationFrame(() => reveal(focusedInput.current!));
      }
    });
    const hideSub = Keyboard.addListener(hideEventName, () => {
      keyboardHeight.current = 0;
      setKeyboardPadding(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [reveal]);

  const onFocusInput = useCallback(
    (inputRef: RefObject<Measurable | null>) => {
      focusedInput.current = inputRef;
      requestAnimationFrame(() => reveal(inputRef));
    },
    [reveal]
  );

  const onBlurInput = useCallback((inputRef: RefObject<Measurable | null>) => {
    if (focusedInput.current === inputRef) focusedInput.current = null;
  }, []);

  const onContentSizeChangeInput = useCallback(
    (inputRef: RefObject<Measurable | null>) => {
      if (focusedInput.current === inputRef) {
        requestAnimationFrame(() => reveal(inputRef));
      }
    },
    [reveal]
  );

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  }, []);

  return { scrollRef, keyboardPadding, onFocusInput, onBlurInput, onContentSizeChangeInput, onScroll };
}
