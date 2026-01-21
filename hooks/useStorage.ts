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
