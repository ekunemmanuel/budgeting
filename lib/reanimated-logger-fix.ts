/**
 * Works around a bug in react-native-reanimated 4.5.1.
 *
 * `logger/logger.ts` reads `__reanimatedLoggerConfig` as a bare global, but
 * nothing puts it there on the React Native runtime: the native side never
 * installs it (no reference to it anywhere in Common/, android/ or apple/), and
 * the only JS caller of `registerLoggerConfig` runs inside a worklet on a
 * freshly created worklet runtime. So the first time anything logs during
 * Reanimated's own import — before any worklet runtime exists — the bare read
 * throws `ReferenceError: Property '__reanimatedLoggerConfig' doesn't exist`
 * and takes down whatever imported it, which is every consumer of
 * react-native-gesture-handler's root entry.
 *
 * Seeding the global with Reanimated's own DEFAULT_LOGGER_CONFIG shape turns
 * that fatal crash back into the warning it was always meant to be. Imported
 * for its side effect from index.ts, ahead of everything else.
 *
 * Remove once Reanimated registers this itself on the RN runtime.
 */

type LogData = { level: string; message: { content: string } };

declare global {
  // eslint-disable-next-line no-var
  var __reanimatedLoggerConfig: unknown;
}

if (globalThis.__reanimatedLoggerConfig === undefined) {
  globalThis.__reanimatedLoggerConfig = {
    logFunction: (data: LogData) => {
      if (data.level === 'warn') console.warn(data.message.content);
      else console.error(data.message.content);
    },
    level: 1, // LogLevel.warn
    // Reanimated defaults this to true, which promotes its advisories to
    // errors. Left off so a stray advisory can never be fatal again.
    strict: false,
  };
}

export {};
