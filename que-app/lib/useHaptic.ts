import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

type HapticType = 'selection' | 'success' | 'warning' | 'impact';

async function fireHaptic(type: HapticType): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    switch (type) {
      case 'selection':
        await Haptics.selectionAsync();
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'impact':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
    }
  } catch {
    // Low Power Mode や Haptics off などで失敗してもサイレントに無視
  }
}

export function useHaptic(): (type: HapticType) => void {
  return (type: HapticType) => {
    void fireHaptic(type);
  };
}
