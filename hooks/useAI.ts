import { GoogleGenerativeAI } from "@google/generative-ai";

// Note: In a production app, this should be handled via a backend or secure vault.
// For this demo, we'll suggest the user to provide their key or use a placeholder.
const API_KEY = "YOUR_GEMINI_API_KEY"; 
const genAI = new GoogleGenerativeAI(API_KEY);

interface ScannedItem {
  name: string;
  category: string;
  expiryDate: string; // YYYY-MM-DD
}

export const scanItemWithAI = async (base64Image: string): Promise<ScannedItem | null> => {
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
      If the date is hard to find, make a best guess based on typical shelf life or return null for the date.
      If no product is found, return null.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response text (Gemini sometimes wraps it in markdown blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ScannedItem;
    }
    
    return null;
  } catch (error) {
    console.error("AI Scan Error:", error);
    return null;
  }
};

export const getRecipeSuggestion = async (items: string[]): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `I have the following items expiring soon: ${items.join(", ")}. 
    Suggest a quick, robust recipe or usage idea to avoid waste. 
    Keep it concise and premium.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Recipe Error:", error);
    return "Could not get a recipe suggestion at this time.";
  }
};
