
export interface SearchResult {
  title: string;
  url: string;
  summary: string;
}

export interface SearchResponse {
  results: SearchResult[];
}

export interface NewsItem {
  title: string;
  url: string;
  summary: string;
  category: string;
}

export interface WeatherInfo {
  location: string;
  temp: string;
  condition: string;
  details: string;
  high: string;
  low: string;
}
