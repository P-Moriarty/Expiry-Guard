import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }
}

export async function scheduleExpiryNotification(id: number, name: string, expiryDate: string, reminderDays: number) {
  const trigger = new Date(expiryDate);
  trigger.setDate(trigger.getDate() - reminderDays);
  trigger.setHours(9, 0, 0, 0); // Morning of the reminder day

  if (trigger < new Date()) return; // Already passed

  await Notifications.scheduleNotificationAsync({
    identifier: `expiry-${id}`,
    content: {
      title: "Expiry Alert! 🚨",
      body: `${name} is expiring in ${reminderDays} days.`,
      data: { itemId: id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
    },
  });
}

export async function cancelExpiryNotification(id: number) {
  await Notifications.cancelScheduledNotificationAsync(`expiry-${id}`);
}
