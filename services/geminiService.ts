
import { GoogleGenAI } from "@google/genai";
import { SearchResponse, WeatherInfo } from "../types";

/**
 * 有効なAPIキーを取得します。
 */
const getApiKey = (): string => {
  const customKey = localStorage.getItem('GEMINI_API_KEY');
  if (customKey && customKey.trim().length > 0) return customKey.trim();
  
  try {
    const envKey = process.env.API_KEY;
    if (envKey && envKey !== "undefined" && envKey.length > 0) return envKey;
  } catch (e) {}
  
  return "";
};

/**
 * 応答テキストからJSONを抽出
 */
const extractJson = (text: string) => {
  if (!text) throw new Error("AIからの応答が空でした。");
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : text.trim();

  try {
    const sanitized = jsonStr
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/\[\d+\]/g, "") 
      .trim();
      
    return JSON.parse(sanitized);
  } catch (e) {
    throw new Error("データの解析に失敗しました。");
  }
};

/**
 * APIエラー（429等）のメッセージを翻訳
 */
const handleApiError = (error: any) => {
  console.error("API Error:", error);
  const message = error?.message || "";
  if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
    return "APIの利用制限に達しました。1分ほど待ってから再度お試しください。";
  }
  if (message.includes("403") || message.includes("API_KEY_INVALID")) {
    return "APIキーが無効です。設定を確認してください。";
  }
  return "エラーが発生しました。時間を置いて再度お試しください。";
};

export const testApiKey = async (key: string): Promise<boolean> => {
  if (!key || key.trim().length < 5) return false;
  const ai = new GoogleGenAI({ apiKey: key.trim() });
  try {
    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "hi",
      config: { maxOutputTokens: 2 }
    });
    return true;
  } catch (e) {
    return false;
  }
};

export const performSearch = async (query: string): Promise<SearchResponse> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("APIキーが設定されていません。");
  
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `クエリ: 「${query}」について最新情報を検索し、結果をJSON形式で要約してください。`,
      config: {
        systemInstruction: "検索エンジンです。Google Searchの結果から、タイトル、URL、日本語の要約（JSON）のみを返してください。余計なテキストは一切不要です。",
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });
    return extractJson(response.text || '{"results": []}');
  } catch (error: any) {
    throw new Error(handleApiError(error));
  }
};

export const getWeatherAtLocation = async (lat: number, lng: number): Promise<WeatherInfo> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("APIキーが設定されていません。");

  const ai = new GoogleGenAI({ apiKey });
  try {
    // クォータに余裕のある Flash モデルを使用
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `座標(${lat}, ${lng})の場所を特定し、最新の天気を調べてJSONで返してください。`,
      config: {
        systemInstruction: `
          気象ボットです。Google Searchを使用して座標周辺の天気を特定し、以下のJSONのみを返してください。
          {
            "location": "地名",
            "temp": "気温",
            "condition": "天気",
            "high": "最高",
            "low": "最低",
            "details": "アドバイス"
          }
        `,
        tools: [{ googleSearch: {} }],
        temperature: 0,
      },
    });
    
    return extractJson(response.text || "{}");
  } catch (error: any) {
    throw new Error(handleApiError(error));
  }
};
