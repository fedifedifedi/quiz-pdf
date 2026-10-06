import "server-only";
import { GoogleGenAI } from "@google/genai";

// Seul point de contact avec Gemini. La clé reste côté serveur (server-only) et n'est jamais loguée.
export async function callGemini(prompt: string, jsonSchema: object) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey || !model) throw new Error("GEMINI_API_KEY et GEMINI_MODEL doivent être définis dans .env");

  const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 90_000 } });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: jsonSchema,
      temperature: 0.2,
    },
  });
  return response.text ?? "";
}
