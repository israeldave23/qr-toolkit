import * as Haptics from 'expo-haptics';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

let hapticsOn = true;
let soundOn = true;

export function setHapticsEnabled(enabled: boolean): void {
  hapticsOn = enabled;
}

export function setSoundEnabled(enabled: boolean): void {
  soundOn = enabled;
}

// Preloaded audio player for scan beep — created once at module init.
// expo-audio (SDK 58): createAudioPlayer accepts a require() asset URI.
let beepPlayer: AudioPlayer | null = null;
try {
  beepPlayer = createAudioPlayer(require('../assets/sound/beep.wav'));
} catch {
  beepPlayer = null;
}

export function playBeep(): void {
  if (!soundOn || !beepPlayer) return;
  try {
    beepPlayer.seekTo(0);
    beepPlayer.play();
  } catch {
    /* web / no audio — safe to ignore */
  }
}

export async function hapticSuccess(): Promise<void> {
  if (!hapticsOn) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    /* unsupported / web — safe to ignore */
  }
}

export async function hapticLight(): Promise<void> {
  if (!hapticsOn) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* unsupported / web — safe to ignore */
  }
}

export async function hapticScan(): Promise<void> {
  if (!hapticsOn) return;
  try {
    if (Platform.OS === 'android') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch {
    /* unsupported / web — safe to ignore */
  }
}

export async function hapticError(): Promise<void> {
  if (!hapticsOn) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    /* unsupported / web — safe to ignore */
  }
}
