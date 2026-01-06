
import { GoogleGenAI } from "@google/genai";
import { SearchResponse, WeatherInfo } from "../types";

/**
 * AIの応答からJSONを確実に抜き出すための超強力な抽出関数。
 * 引用記号 [1] や、前後の余計なテキストを無視します。
 */
const extractJson = (text: string) => {
  if (!text) throw new Error("AIからの応答が空でした。");

  // Markdownのコードブロック記号を除去
  let cleaned = text.replace(/```json\s?|```/g, "").trim();
  
  // 最初の '{' から最後の '}' までを最短一致ではなく最長一致で抜き出す
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  
  if (start === -1 || end === -1) {
    console.error("No JSON found. Raw text:", text);
    throw new Error("有効なデータが見つかりませんでした。");
  }
  
  const jsonStr = cleaned.substring(start, end + 1);
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // 引用記号や改行、余計なカンマをよりアグレッシブに除去
    try {
      const sanitized = jsonStr
        .replace(/\[\d+\]/g, '') // [1] のような引用を消す
        .replace(/,\s*([}\]])/g, '$1'); // 末尾のカンマを消す
      return JSON.parse(sanitized);
    } catch (e2) {
      console.error("Critical JSON Parse Error:", jsonStr);
      throw new Error("情報の解析に失敗しました。もう一度お試しください。");
    }
  }
};

export const performSearch = async (query: string): Promise<SearchResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `検索クエリ: 「${query}」に関連する最新のウェブサイトを検索し、要約付きのJSONで返してください。`,
      config: {
        systemInstruction: `
          あなたは優秀な検索エンジンです。
          Google Searchを使用して正確な結果を見つけ、以下のJSONのみを出力してください。
          解説や引用記号は一切不要です。
          
          {
            "results": [
              {
                "title": "タイトル",
                "url": "完全なURL",
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
    throw new Error("検索中にエラーが発生しました。");
  }
};

export const getWeatherAtLocation = async (lat: number, lng: number): Promise<WeatherInfo> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // Google Mapsツールを使わずに、Google Searchのみで座標から場所と天気を特定するのが最も安定します
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `緯度:${lat}, 経度:${lng} の地点を特定し、その場所の現在の天気、気温、最高/最低気温を取得してください。`,
      config: {
        systemInstruction: `
          あなたは気象情報botです。
          Google Searchツールを使用して、与えられた座標の最新情報を検索してください。
          必ず以下のJSONのみで回答し、他のテキストや引用[1]などは含めないでください。
          
          {
            "location": "地名（例: 東京都千代田区）",
            "temp": "気温（例: 20℃）",
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
      location: data.location || "不明な地点",
      temp: data.temp || "--℃",
      condition: data.condition || "取得中",
      high: data.high || "--℃",
      low: data.low || "--℃",
      details: data.details || "データの取得に失敗しました。"
    };
  } catch (error: any) {
    console.error("Weather Service Error:", error);
    throw new Error("天気情報の取得に失敗しました。しばらくしてから再度お試しください。");
  }
};
