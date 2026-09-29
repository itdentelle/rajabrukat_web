import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

export const geminiApiKey = process.env.GEMINI_API_KEY || '';
export const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

export const FALLBACK_MODELS = [
  'gemini-flash-latest',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-8b',
];

export async function generateContentWithFallback(genAIInstance: any, contentsPayload: any[]) {
  let lastError: any = null;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAIInstance.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(contentsPayload);
      const text = result.response.text().trim();
      if (text) {
        return { text, usedModel: modelName };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(
        `[AI Fallback] Model ${modelName} hit limit or failed (${err?.message?.substring(0, 80)}). Retrying with next model...`
      );
    }
  }
  throw lastError || new Error('All Gemini AI models failed or hit quota limits.');
}
