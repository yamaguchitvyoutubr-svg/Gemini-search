
import { GoogleGenAI } from "@google/genai";
import { SearchResponse, WeatherInfo } from "../types";

/**
 * 有効なAPIキーを取得します。
 * localStorage に保存されたカスタムキーがあればそれを優先し、なければ環境変数を使用します。
 */
const getApiKey = () => {
  const customKey = localStorage.getItem('GEMINI_API_KEY');
  return customKey || process.env.API_KEY || "";
};

/**
 * 応答テキストからJSONを確実に抽出する関数。
 */
const extractJson = (text: string) => {
  if (!text) throw new Error("AIからの応答が空でした。");
  let cleaned = text.replace(/```json\s?|```/g, "").trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error("有効なデータが見つかりませんでした。");
  const jsonStr = cleaned.substring(start, end + 1);
  try {
    return JSON.parse(jsonStr.replace(/\[\d+\]/g, '').replace(/,\s*([}\]])/g, '$1'));
  } catch (e) {
    throw new Error("データの解析に失敗しました。");
  }
};

/**
 * APIキーの有効性を確認するための軽量なテスト。
 */
export const testApiKey = async (key: string): Promise<boolean> => {
  const ai = new GoogleGenAI({ apiKey: key });
  try {
    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "hi",
      config: { maxOutputTokens: 1 }
    });
    return true;
  } catch (e) {
    return false;
  }
};

export const performSearch = async (query: string): Promise<SearchResponse> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("APIキーが設定されていません。設定から入力してください。");
  
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `クエリ: 「${query}」に関連する最新のウェブサイトを検索し、要約付きのJSONで返してください。`,
      config: {
        systemInstruction: `
          あなたはプロの検索エンジンです。Google Searchを使用して正確な結果を見つけ、以下のJSONのみを出力してください。
          {
            "results": [
              {
                "title": "タイトル",
                "url": "URL",
                "summary": "日本語での2-3文の要約"
              }
            ]
          }
        `,
        tools: [{ googleSearch: {} }],
        temperature: 0,
      },
    });
    return extractJson(response.text || '{"results": []}');
  } catch (error: any) {
    console.error("Search Error:", error);
    throw new Error(error.message?.includes("API_KEY_INVALID") ? "APIキーが無効です。" : "検索中にエラーが発生しました。");
  }
};

export const getWeatherAtLocation = async (lat: number, lng: number): Promise<WeatherInfo> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("APIキー未設定");

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `座標(${lat}, ${lng})の地点を特定し、その場所の現在の天気、気温、最高/最低気温を取得してください。`,
      config: {
        systemInstruction: `
          気象情報botです。Google Searchを使用して座標の最新情報を検索し、以下のJSONのみで回答してください。
          {
            "location": "地名",
            "temp": "気温",
            "condition": "天気",
            "high": "最高気温",
            "low": "最低気温",
            "details": "アドバイス"
          }
        `,
        tools: [{ googleSearch: {} }],
        temperature: 0,
      },
    });
    const data = extractJson(response.text || "{}");
    return {
      location: data.location || "現在地",
      temp: data.temp || "--℃",
      condition: data.condition || "取得中",
      high: data.high || "--℃",
      low: data.low || "--℃",
      details: data.details || "データを取得できませんでした。"
    };
  } catch (error: any) {
    throw new Error("天気情報の取得に失敗しました。");
  }
};
