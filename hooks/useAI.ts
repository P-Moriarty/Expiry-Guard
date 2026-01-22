import { API_BASE_URL } from '@/constants/API';

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

interface ScannedItem {
  name: string;
  category: string;
  expiryDate: string; // YYYY-MM-DD
}

export const scanItemWithAI = async (base64Image: string): Promise<ScannedItem | null> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error("AI Scan Error:", error);
    return null;
  }
};

export const getRecipeSuggestion = async (items: string[]): Promise<string> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/suggestion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.suggestion;
  } catch (error) {
    console.error("AI Recipe Error:", error);
    return "Could not get a recipe suggestion at this time.";
  }
};
