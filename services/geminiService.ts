
import { GoogleGenAI } from "@google/genai";
import { SearchResponse, WeatherInfo } from "../types";

/**
 * 有効なAPIキーを取得します。
 * localStorage に保存されたカスタムキーを最優先します。
 */
const getApiKey = (): string => {
  const customKey = localStorage.getItem('GEMINI_API_KEY');
  if (customKey && customKey.trim().length > 0) return customKey.trim();
  
  // Vercel等の環境変数 (Vite経由で注入)
  try {
    const envKey = process.env.API_KEY;
    if (envKey && envKey !== "undefined" && envKey.length > 0) return envKey;
  } catch (e) {
    // process.env がアクセスできない環境用
  }
  
  return "";
};

/**
 * 応答テキストからJSONを確実に抽出する関数。
 */
const extractJson = (text: string) => {
  if (!text) throw new Error("AIからの応答が空でした。");
  
  // JSONブロックを探す
  let jsonStr = "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  } else {
    jsonStr = text.trim();
  }

  try {
    // 引用、Markdown、制御文字をクリーンアップ
    const sanitized = jsonStr
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/\[\d+\]/g, "") // [1] などのリファレンスを除去
      .trim();
      
    return JSON.parse(sanitized);
  } catch (e) {
    console.error("Original text:", text);
    console.error("Sanitized string:", jsonStr);
    throw new Error("データの解析に失敗しました。形式が正しくありません。");
  }
};

/**
 * APIキーの有効性を確認するためのテスト。
 */
export const testApiKey = async (key: string): Promise<boolean> => {
  if (!key || key.trim().length < 5) return false;
  const ai = new GoogleGenAI({ apiKey: key.trim() });
  try {
    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Hello",
      config: { maxOutputTokens: 5 }
    });
    return true;
  } catch (e) {
    console.error("API Key Test Failed:", e);
    return false;
  }
};

export const performSearch = async (query: string): Promise<SearchResponse> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("APIキーが設定されていません。右上の「設定」から入力してください。");
  
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `クエリ: 「${query}」について最新情報を検索し、結果をJSON形式で要約してください。`,
      config: {
        systemInstruction: `
          あなたは高性能な検索エンジンです。Google Searchを使用して、信頼できる最新のソースから結果を抽出してください。
          必ず以下のJSONフォーマットのみを返してください。テキストの説明は不要です。
          {
            "results": [
              {
                "title": "ページのタイトル",
                "url": "完全なURL",
                "summary": "日本語での簡潔な要約（3文以内）"
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
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("403")) {
      throw new Error("APIキーが無効、または権限がありません。");
    }
    throw new Error(error.message || "検索の実行中にエラーが発生しました。");
  }
};

export const getWeatherAtLocation = async (lat: number, lng: number): Promise<WeatherInfo> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("APIキーが設定されていません。");

  const ai = new GoogleGenAI({ apiKey });
  try {
    // 複雑な位置・天気検索にはProモデルを使用
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `位置情報(緯度: ${lat}, 経度: ${lng})。この地点の現在の住所、天気、気温、最高/最低気温を検索してください。`,
      config: {
        systemInstruction: `
          あなたは気象情報ボットです。
          1. 与えられた座標から正確な市町村名（例：東京都新宿区）を特定してください。
          2. その場所の現在の最新の気象データ（天気、温度、最高・最低）をGoogle Searchで見つけてください。
          3. 必ず以下のJSONのみを返してください。それ以外の文字は一切出力しないでください。
          {
            "location": "地名（例: 大阪府大阪市）",
            "temp": "現在の気温（例: 12℃）",
            "condition": "天気の状態（例: 晴れ）",
            "high": "今日の最高気温",
            "low": "今日の最低気温",
            "details": "今日過ごすためのアドバイス"
          }
        `,
        tools: [{ googleSearch: {} }],
        temperature: 0,
      },
    });
    
    const data = extractJson(response.text || "{}");
    return {
      location: data.location || "不明な場所",
      temp: data.temp || "--℃",
      condition: data.condition || "取得失敗",
      high: data.high || "--℃",
      low: data.low || "--℃",
      details: data.details || "気象情報の取得を完了できませんでした。"
    };
  } catch (error: any) {
    console.error("Weather Service Error:", error);
    throw new Error("気象データの解析中にエラーが発生しました。");
  }
};
