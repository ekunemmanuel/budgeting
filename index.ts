// Must come first: it seeds a global that Reanimated reads during its own
// import, and expo-router/entry pulls in gesture-handler, which pulls Reanimated.
import './lib/reanimated-logger-fix';
import 'expo-router/entry';
