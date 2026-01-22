import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as SQLite from 'expo-sqlite';

export interface ExpiryItem {
  id: number;
  name: string;
  category: string;
  expiryDate: string; // ISO format
  reminderDays: number;
  isNotified: number; // 0 or 1
}

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async () => {
  db = await SQLite.openDatabaseAsync('expiryguard.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      expiryDate TEXT NOT NULL,
      reminderDays INTEGER DEFAULT 3,
      isNotified INTEGER DEFAULT 0
    );
  `);
};

export const getItems = async (): Promise<ExpiryItem[]> => {
  if (!db) await initDatabase();
  return await db!.getAllAsync<ExpiryItem>('SELECT * FROM items ORDER BY expiryDate ASC');
};

export const addItem = async (name: string, category: string, expiryDate: string, reminderDays: number = 3) => {
  if (!db) await initDatabase();
  const result = await db!.runAsync(
    'INSERT INTO items (name, category, expiryDate, reminderDays) VALUES (?, ?, ?, ?)',
    [name, category, expiryDate, reminderDays]
  );
  return result.lastInsertRowId;
};

export const deleteItem = async (id: number) => {
  if (!db) await initDatabase();
  await db!.runAsync('DELETE FROM items WHERE id = ?', [id]);
};

export const updateItem = async (id: number, name: string, category: string, expiryDate: string, reminderDays: number) => {
  if (!db) await initDatabase();
  await db!.runAsync(
    'UPDATE items SET name = ?, category = ?, expiryDate = ?, reminderDays = ? WHERE id = ?',
    [name, category, expiryDate, reminderDays, id]
  );
};

import { API_BASE_URL } from '@/constants/API';

export const getDeviceId = () => {
  return Device.deviceName || Constants.installationId || "unknown-device";
};

export const getSyncId = async () => {
  const householdId = await AsyncStorage.getItem('expiry_guard_household_id');
  return householdId || getDeviceId();
};

const fetchWithTimeout = async (url: string, options: any = {}, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
};

export const syncData = async () => {
  const rawId = await getSyncId();
  const deviceId = encodeURIComponent(rawId);
  const localItems = await getItems();

  try {
    // 1. Push local items to server
    await fetchWithTimeout(`${API_BASE_URL}/sync/${deviceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: localItems }),
    });

    // 2. Fetch server items
    const response = await fetchWithTimeout(`${API_BASE_URL}/sync/${deviceId}`);
    const serverItems = await response.json();

    // 3. Update local database
    if (!db) await initDatabase();
    for (const item of serverItems) {
      await db!.runAsync(
        `INSERT INTO items (id, name, category, expiryDate, reminderDays) 
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           category = excluded.category,
           expiryDate = excluded.expiryDate,
           reminderDays = excluded.reminderDays`,
        [item.localId, item.name, item.category, item.expiryDate, item.reminderDays]
      );
    }
    return true;
  } catch (error) {
    console.error("Sync Error:", error);
    return false;
  }
};

export const getCloudStats = async () => {
  const rawId = await getSyncId();
  const deviceId = encodeURIComponent(rawId);
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/stats/${deviceId}`);
    return await response.json();
  } catch (error) {
    console.warn("Cloud Stats Unavailable, switching to local:", error);
    return null;
  }
};
