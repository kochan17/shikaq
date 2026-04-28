import { Platform } from 'react-native';
import type { Tables } from '../types/database';

type Profile = Tables<'profiles'>;

// Calm Mode: calm_mode フラグが true、または calm_mode_until が未来の日付
export function isCalmModeActive(profile: Profile): boolean {
  if (profile.calm_mode) return true;
  if (profile.calm_mode_until === null) return false;
  const until = new Date(profile.calm_mode_until);
  return until > new Date();
}

// expo-notifications は native のみ。Web では全関数を no-op にする
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

async function getNotifications(): Promise<typeof import('expo-notifications') | null> {
  if (!isNative) return null;
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

const MORNING_REMINDER_ID = 'shikaq-morning-reminder';

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!isNative) return null;

  const Notifications = await getNotifications();
  if (Notifications === null) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

interface ScheduleMorningReminderOptions {
  time?: string;
  questionGoal?: number;
}

export async function scheduleMorningReminder({
  time = '07:30',
  questionGoal = 10,
}: ScheduleMorningReminderOptions = {}): Promise<void> {
  if (!isNative) return;

  const Notifications = await getNotifications();
  if (Notifications === null) return;

  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr ?? '7', 10);
  const minute = parseInt(minuteStr ?? '30', 10);

  // 既存の朝通知をキャンセルしてから再スケジュール
  await cancelMorningReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: MORNING_REMINDER_ID,
    content: {
      title: 'shikaq',
      body: `今日の ${questionGoal} 問が届きました`,
      sound: 'default',
    },
    trigger: {
      type: 'calendar' as const,
      repeats: true,
      hour,
      minute,
    } as Parameters<typeof Notifications.scheduleNotificationAsync>[0]['trigger'],
  });
}

export async function cancelMorningReminder(): Promise<void> {
  if (!isNative) return;

  const Notifications = await getNotifications();
  if (Notifications === null) return;

  await Notifications.cancelScheduledNotificationAsync(MORNING_REMINDER_ID);
}

const EVENING_REMINDER_ID = 'shikaq-evening-reminder';

interface ScheduleEveningReminderOptions {
  time?: string;
  calmModeActive?: boolean;
}

// 夜の音声解説リマインダー (Phase 2 opt-in)
// Calm Mode が有効の場合はスケジュールしない
// コピーはアスピレーショナル形固定 (煽り禁止)
export async function scheduleEveningReminder({
  time = '22:00',
  calmModeActive = false,
}: ScheduleEveningReminderOptions = {}): Promise<void> {
  if (!isNative) return;
  if (calmModeActive) return;

  const Notifications = await getNotifications();
  if (Notifications === null) return;

  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr ?? '22', 10);
  const minute = parseInt(minuteStr ?? '0', 10);

  await cancelEveningReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: EVENING_REMINDER_ID,
    content: {
      title: 'shikaq',
      body: '夜の音声解説が更新されました',
      sound: 'default',
    },
    trigger: {
      type: 'calendar' as const,
      repeats: true,
      hour,
      minute,
    } as Parameters<typeof Notifications.scheduleNotificationAsync>[0]['trigger'],
  });
}

export async function cancelEveningReminder(): Promise<void> {
  if (!isNative) return;

  const Notifications = await getNotifications();
  if (Notifications === null) return;

  await Notifications.cancelScheduledNotificationAsync(EVENING_REMINDER_ID);
}
