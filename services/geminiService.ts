
import { GoogleGenAI } from "@google/genai";
import { SearchResponse, WeatherInfo } from "../types";

/**
 * 有効なAPIキーを取得します。
 * localStorage に保存されたカスタムキーがあればそれを優先し、なければ環境変数を使用します。
 */
const getApiKey = () => {
  const customKey = localStorage.getItem('GEMINI_API_KEY');
  if (customKey) return customKey;
  // process.env.API_KEY がビルド時に注入されている場合がある
  return (typeof process !== 'undefined' && process.env?.API_KEY) || "";
};

/**
 * 応答テキストからJSONを確実に抽出する関数。
 */
const extractJson = (text: string) => {
  if (!text) throw new Error("AIからの応答が空でした。");
  let cleaned = text.replace(/```json\s?|```/g, "").trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    console.error("Failed to find JSON in text:", text);
    throw new Error("有効なデータが見つかりませんでした。");
  }
  const jsonStr = cleaned.substring(start, end + 1);
  try {
    // 引用記号 [1] や、末尾のカンマ、不要な改行をより強力に除去
    const sanitized = jsonStr
      .replace(/\[\d+\]/g, '') 
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/\n/g, ' ');
    return JSON.parse(sanitized);
  } catch (e) {
    console.error("JSON Parse Error. String was:", jsonStr);
    throw new Error("データの解析に失敗しました。");
  }
};

/**
 * APIキーの有効性を確認するためのテスト。
 */
export const testApiKey = async (key: string): Promise<boolean> => {
  if (!key) return false;
  const ai = new GoogleGenAI({ apiKey: key });
  try {
    // 最小限の生成でテスト
    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "API test. Answer 'ok'.",
    });
    return true;
  } catch (e) {
    console.error("API Key Test Failed:", e);
    return false;
  }
};

export const performSearch = async (query: string): Promise<SearchResponse> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("APIキーが設定されていません。設定画面から入力してください。");
  
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `クエリ: 「${query}」に関連する最新情報を検索し、要約付きのJSONで返してください。`,
      config: {
        systemInstruction: `
          あなたはプロの検索エンジンです。Google Searchを使用して正確な結果を見つけ、以下のJSONのみを出力してください。
          解説や引用記号（[1]など）は絶対に出さないでください。
          {
            "results": [
              {
                "title": "タイトル",
                "url": "URL",
                "summary": "日本語での簡潔な要約"
              }
            ]
          }
        `,
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });
    return extractJson(response.text || '{"results": []}');
  } catch (error: any) {
    console.error("Search Error:", error);
    if (error.message?.includes("API_KEY_INVALID")) throw new Error("APIキーが無効です。");
    throw new Error("検索中にエラーが発生しました。");
  }
};

export const getWeatherAtLocation = async (lat: number, lng: number): Promise<WeatherInfo> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("APIキー未設定");

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `緯度: ${lat}, 経度: ${lng} の場所を特定し、その地点の現在の天気と気温をGoogle Searchで調べてください。`,
      config: {
        systemInstruction: `
          あなたは気象情報エージェントです。
          1. 座標から住所（都市名）を特定してください。
          2. 特定した場所の天気を検索してください。
          3. 以下のJSONのみを返してください。
          {
            "location": "地名（例: 東京都港区）",
            "temp": "気温（例: 15℃）",
            "condition": "天気（例: 晴れ）",
            "high": "最高気温",
            "low": "最低気温",
            "details": "今日のアドバイス"
          }
        `,
        tools: [{ googleSearch: {} }],
        temperature: 0,
      },
    });
    const data = extractJson(response.text || "{}");
    return {
      location: data.location || "現在地付近",
      temp: data.temp || "--℃",
      condition: data.condition || "不明",
      high: data.high || "--℃",
      low: data.low || "--℃",
      details: data.details || "天気情報を取得できませんでした。"
    };
  } catch (error: any) {
    console.error("Weather error:", error);
    throw new Error("気象データの取得に失敗しました。");
  }
};
