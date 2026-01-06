
import { GoogleGenAI, Type } from "@google/genai";
import { SearchResponse, WeatherInfo } from "../types";

export const performSearch = async (query: string): Promise<SearchResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        ユーザーの検索クエリ: 「${query}」
        
        【指示】
        1. Google検索ツールを使用して、このクエリに直接関連するウェブサイトを検索してください。
        2. 検索結果（groundingMetadata）に含まれる「実際のページ」の中から、最も関連性の高いものを抽出してください。
        3. 出力するURLは、検索結果に存在する実際のURLと1文字も違わずに完全に一致させてください。捏造は絶対に禁止です。
        
        【厳格なルール】
        - 検索結果に存在しないURLを生成しないでください。
        - リンク切れを防ぐため、具体的な記事ページや詳細ページのURLを優先してください。
      `,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING },
                  summary: { type: Type.STRING },
                },
                required: ["title", "url", "summary"],
              },
            },
          },
          required: ["results"],
        },
      },
    });

    const jsonStr = response.text || '{"results": []}';
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw new Error("検索結果の取得に失敗しました。");
  }
};

export const getWeatherAtLocation = async (lat: number, lng: number): Promise<WeatherInfo> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `緯度 ${lat}, 経度 ${lng} 付近の現在の天気をGoogle検索で調べて、以下のJSON形式で回答してください。地名は市区町村名まで特定してください。`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            location: { type: Type.STRING, description: "場所の名前 (例: 東京都渋谷区)" },
            temp: { type: Type.STRING, description: "現在の気温 (例: 18℃)" },
            condition: { type: Type.STRING, description: "天気の概況 (例: 晴れ, 曇り, 雨)" },
            high: { type: Type.STRING, description: "最高気温" },
            low: { type: Type.STRING, description: "最低気温" },
            details: { type: Type.STRING, description: "今日のアドバイス (例: 午後から雨が降るので傘が必要です)" },
          },
          required: ["location", "temp", "condition", "high", "low", "details"],
        },
      },
    });

    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Weather Fetch Error:", error);
    throw new Error("天気の取得に失敗しました。");
  }
};
