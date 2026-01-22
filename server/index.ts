import { GoogleGenerativeAI } from "@google/generative-ai";
import Database from 'better-sqlite3';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Database Setup
const db = new Database('sync.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS server_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deviceId TEXT NOT NULL,
    localId INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    expiryDate TEXT NOT NULL,
    reminderDays INTEGER DEFAULT 3,
    UNIQUE(deviceId, localId)
  )
`);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

app.get('/', (req, res) => {
  res.send('Expiry Guard API is running...');
});

// Sync Endpoints
app.get('/api/sync/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const items = db.prepare('SELECT * FROM server_items WHERE deviceId = ?').all(deviceId);
  res.json(items);
});

app.get('/api/stats/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const items = db.prepare('SELECT * FROM server_items WHERE deviceId = ?').all(deviceId);
  
  const now = new Date();
  let expiringSoon = 0;
  let expired = 0;

  items.forEach((item: any) => {
    const diff = Math.ceil((new Date(item.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) expired++;
    else if (diff <= 3) expiringSoon++;
  });

  res.json({
    total: items.length,
    expiringSoon,
    expired,
    saved: items.length - expired
  });
});

app.post('/api/sync/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const { items } = req.body; // Array of ExpiryItem

  const insert = db.prepare(`
    INSERT INTO server_items (deviceId, localId, name, category, expiryDate, reminderDays)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(deviceId, localId) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      expiryDate = excluded.expiryDate,
      reminderDays = excluded.reminderDays
  `);

  const transaction = db.transaction((items) => {
    for (const item of items) {
      insert.run(deviceId, item.id, item.name, item.category, item.expiryDate, item.reminderDays);
    }
  });

  transaction(items);
  res.json({ success: true });
});

app.delete('/api/sync/:deviceId/:localId', (req, res) => {
  const { deviceId, localId } = req.params;
  db.prepare('DELETE FROM server_items WHERE deviceId = ? AND localId = ?').run(deviceId, localId);
  res.json({ success: true });
});

// AI Scanning Endpoint (Existing)
app.post('/api/scan', async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: "Image is required" });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Analyze this image of a product. Extract the product name and its expiration date.
      Return the result strictly in JSON format as follows:
      {
        "name": "Product Name",
        "category": "One of: Food, Medicine, Document, Other",
        "expiryDate": "YYYY-MM-DD"
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: { data: image, mimeType: "image/jpeg" },
      },
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Failed to parse AI response" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// AI Recipe Suggestion Endpoint (Existing)
app.post('/api/suggestion', async (req, res) => {
  const { items } = req.body;
  if (!items) return res.status(400).json({ error: "Items are required" });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `I have the following items expiring soon: ${items.join(", ")}. 
    Suggest a quick, robust recipe or usage idea to avoid waste. 
    Keep it concise and premium.`;

    const result = await model.generateContent(prompt);
    res.json({ suggestion: result.response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
