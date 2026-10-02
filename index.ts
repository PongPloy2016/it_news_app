import { registerRootComponent } from 'expo';

import { getMessaging } from '@react-native-firebase/messaging';
import App from './App';

// Register background message handler for Firebase Cloud Messaging
getMessaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[FCM Background] Message received:', remoteMessage);
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
