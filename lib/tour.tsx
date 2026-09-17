import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { loadToursSeen, saveToursSeen } from './storage';

export interface TourStep {
  /** Id of the TourTarget this step points at. */
  target: string;
  title: string;
  body: string;
}

export interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TourContextValue {
  /** Measured position of every target currently on screen, by id. */
  rects: Record<string, TargetRect>;
  measure: (id: string, rect: TargetRect) => void;
  unmeasure: (id: string) => void;

  /** True while a tour is running, so screens can show sample content. */
  isActive: boolean;
  /** Target id of the step being shown, so it can re-measure itself. */
  activeTarget: string | undefined;
  activeSteps: TourStep[];
  stepIndex: number;
  next: () => void;
  back: () => void;
  /** Ends the tour and records it so it never runs again. */
  finish: () => void;

  /** Starts a tour once, the first time its screen is visited. */
  startOnce: (id: string, steps: TourStep[]) => void;
  hasSeen: (id: string) => boolean;
  /** Clears the record so every tour runs again. */
  resetTours: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [rects, setRects] = useState<Record<string, TargetRect>>({});
  const [seen, setSeen] = useState<string[]>(loadToursSeen);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSteps, setActiveSteps] = useState<TourStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);

  // Read inside callbacks that must not re-subscribe when a rect changes.
  const rectsRef = useRef(rects);
  rectsRef.current = rects;

  const measure = useCallback((id: string, rect: TargetRect) => {
    setRects((prev) => {
      const current = prev[id];
      if (
        current &&
        current.x === rect.x &&
        current.y === rect.y &&
        current.width === rect.width &&
        current.height === rect.height
      ) {
        return prev;
      }
      return { ...prev, [id]: rect };
    });
  }, []);

  const unmeasure = useCallback((id: string) => {
    setRects((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  // Mirrors activeId so finish() can read it without updating state from
  // inside another state updater, which React may run more than once and which
  // could leave a finished tour unrecorded and free to start over on refocus.
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  const finish = useCallback(() => {
    const id = activeIdRef.current;
    if (id) {
      setSeen((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        saveToursSeen(next);
        return next;
      });
    }
    setActiveId(null);
    setActiveSteps([]);
    setStepIndex(0);
  }, [activeId]);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i + 1 >= activeSteps.length) {
        finish();
        return i;
      }
      return i + 1;
    });
  }, [activeSteps.length, finish]);

  const back = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);

  const startOnce = useCallback(
    (id: string, steps: TourStep[]) => {
      if (seen.includes(id) || activeId) return;
      if (steps.length === 0) return;

      // Steps are not filtered here. A target may not exist yet: sample rows
      // only appear once the tour is running, and some targets are revealed by
      // an earlier step. The overlay skips any step still unmeasured when it
      // gets there.
      setActiveId(id);
      setActiveSteps(steps);
      setStepIndex(0);
    },
    [seen, activeId]
  );

  const hasSeen = useCallback((id: string) => seen.includes(id), [seen]);

  const resetTours = useCallback(() => {
    setSeen([]);
    saveToursSeen([]);
  }, []);

  const value = useMemo<TourContextValue>(
    () => ({
      rects,
      measure,
      unmeasure,
      isActive: activeId !== null,
      activeTarget: activeSteps[stepIndex]?.target,
      activeSteps,
      stepIndex,
      next,
      back,
      finish,
      startOnce,
      hasSeen,
      resetTours,
    }),
    [rects, measure, unmeasure, activeId, activeSteps, stepIndex, next, back, finish, startOnce, hasSeen, resetTours]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within a TourProvider');
  return ctx;
}

/**
 * Decides whether a field may take focus on open, and focuses it once a tour
 * has finished.
 *
 * A field that focuses itself raises the keyboard, which moves everything the
 * tour is pointing at after the spotlight has been measured. Holding focus back
 * until the tour is done keeps the page still underneath it, and the keyboard
 * still appears immediately for everyone who has already seen the tour.
 *
 * Returns the value to pass to `autoFocus`.
 */
export function useFocusAfterTour(
  tourId: string,
  ref: React.RefObject<{ focus: () => void } | null>,
  enabled = true
): boolean {
  const { isActive, hasSeen } = useTour();
  const held = enabled && (isActive || !hasSeen(tourId));

  const wasHeld = useRef(held);
  useEffect(() => {
    if (wasHeld.current && !held) ref.current?.focus();
    wasHeld.current = held;
  }, [held, ref]);

  return !held;
}

/**
 * Runs a screen's tour the first time that screen is opened.
 *
 * Waits just long enough after focus for the first targets to lay out and
 * report their positions. Any target that is still unmeasured when the tour
 * reaches it is handled by the overlay, so this does not need to cover the
 * slowest one.
 */
export function useScreenTour(id: string, steps: TourStep[]) {
  const { startOnce, hasSeen } = useTour();

  useFocusEffect(
    useCallback(() => {
      if (hasSeen(id)) return;
      const timer = setTimeout(() => startOnce(id, steps), 150);
      return () => clearTimeout(timer);
      // steps are declared as module constants, so their identity is stable.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, hasSeen, startOnce])
  );
}
