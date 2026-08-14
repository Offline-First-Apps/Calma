import {
  AndroidImportance,
  setNotificationChannelAsync,
} from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * The two Android channels, created at boot before anything is scheduled.
 *
 * Android drops a notification whose channel does not exist, silently. Doing
 * this at boot rather than lazily means the ordering cannot be got wrong by a
 * future call site.
 *
 * `gentle` is `LOW` on purpose: no heads-up, no sound, no vibration. The
 * streak nudge and the weekly check-in are notes to find later, not
 * interruptions, and the importance level is the only place that distinction
 * can actually be enforced — copy cannot make a heads-up banner feel gentle.
 */
export async function createChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await setNotificationChannelAsync('worry-window', {
    name: 'Worry window',
    importance: AndroidImportance.DEFAULT,
    vibrationPattern: [0, 120],
    sound: 'default',
  });

  await setNotificationChannelAsync('gentle', {
    name: 'Gentle notes',
    importance: AndroidImportance.LOW,
    vibrationPattern: null,
    sound: null,
  });
}
