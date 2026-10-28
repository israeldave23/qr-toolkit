import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

let hapticsOn = true;

export function setHapticsEnabled(enabled: boolean): void {
  hapticsOn = enabled;
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
