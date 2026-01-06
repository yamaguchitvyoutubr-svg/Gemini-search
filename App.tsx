
import React, { useState, useCallback, useEffect } from 'react';
import { performSearch, getWeatherAtLocation } from './services/geminiService';
import { SearchResponse, WeatherInfo } from './types';
import { ResultCard } from './components/ResultCard';
import { WeatherCard } from './components/WeatherCard';
import { SkeletonLoader } from './components/SkeletonLoader';

const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0088ff" />
        <stop offset="100%" stopColor="#00e5ff" />
      </linearGradient>
    </defs>
    <path 
      d="M82,35C77.5,23 64.8,15 50,15C30.7,15 15,30.7 15,50c0,19.3 15.7,35 35,35c12,0 22.5-6 28.5-15" 
      stroke="url(#logoGradient)" 
      strokeWidth="13" 
      strokeLinecap="round" 
    />
    <path 
      d="M50,50 L83,50" 
      stroke="url(#logoGradient)" 
      strokeWidth="13" 
      strokeLinecap="round" 
    />
    <path 
      d="M76,76 L92,92" 
      stroke="url(#logoGradient)" 
      strokeWidth="13" 
      strokeLinecap="round" 
    />
  </svg>
);

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = useCallback(async () => {
    if (!navigator.geolocation) {
      setWeatherError("ブラウザが位置情報をサポートしていません。");
      return;
    }

    setWeatherLoading(true);
    setWeatherError(null);
    setWeather(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await getWeatherAtLocation(
            position.coords.latitude,
            position.coords.longitude
          );
          setWeather(data);
        } catch (err: any) {
          console.error("Weather fetch error:", err);
          setWeatherError(err.message || "天気情報の取得に失敗しました。");
        } finally {
          setWeatherLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        let msg = "位置情報を取得できませんでした。";
        if (err.code === 1) msg = "位置情報の使用を許可してください。";
        else if (err.code === 3) msg = "取得がタイムアウトしました。";
        setWeatherError(msg);
        setWeatherLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await performSearch(query);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "検索中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const resetToHome = () => {
    setResult(null);
    setQuery('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex flex-col items-center">
      {/* Header */}
      <header className={`w-full transition-all duration-500 flex flex-col items-center justify-center px-4 ${result || loading ? 'py-6 bg-white/90 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-20' : 'min-h-[40vh] pt-16'}`}>
        <div className={`flex flex-col items-center w-full max-w-4xl transition-all duration-500 ${result || loading ? 'flex-row gap-6' : 'items-center'}`}>
          <div onClick={resetToHome} className={`flex items-center gap-4 cursor-pointer group transition-transform ${result || loading ? 'scale-75 origin-left' : 'mb-12 scale-100'}`}>
            <LogoIcon className="w-16 h-16" />
            {!(result || loading) && (
              <div className="flex flex-col">
                <h1 className="text-[2.5rem] font-black tracking-tight text-slate-900 leading-none">Gemini</h1>
                <h1 className="text-[2.5rem] font-black tracking-tight text-slate-900 leading-none mt-1">Search</h1>
              </div>
            )}
          </div>
          <form onSubmit={handleSearch} className="w-full relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <i className="fa-solid fa-magnifying-glass text-slate-300"></i>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="何でも聞いてください..."
              className="w-full pl-14 pr-16 py-4 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md focus:shadow-xl focus:border-[#0088ff] outline-none transition-all text-slate-800 text-lg"
            />
            <button type="submit" disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 search-gradient text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
              {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-arrow-right"></i>}
            </button>
          </form>
        </div>
      </header>

      <main className="w-full max-w-3xl px-6 py-8">
        {loading && <SkeletonLoader />}
        
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center animate-fade-in shadow-sm">
            <i className="fa-solid fa-circle-exclamation text-red-400 text-3xl mb-4"></i>
            <p className="text-red-700 font-bold mb-4">{error}</p>
            <button onClick={() => handleSearch()} className="px-6 py-2 bg-white border border-red-200 text-red-500 rounded-full text-sm font-bold hover:bg-red-50 transition-all">
              再試行する
            </button>
          </div>
        )}

        {!result && !loading && !error && (
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-slate-900 font-bold flex items-center gap-2">
                <i className="fa-solid fa-cloud-sun text-[#0088ff]"></i>
                現在の場所と天気
              </h2>
              <button 
                onClick={loadWeather} 
                className="text-xs text-slate-400 hover:text-[#0088ff] transition-colors flex items-center gap-1"
                disabled={weatherLoading}
              >
                <i className={`fa-solid fa-rotate-right ${weatherLoading ? 'animate-spin' : ''}`}></i>
                更新
              </button>
            </div>

            {weatherLoading ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                <div className="w-10 h-10 border-4 border-blue-50 border-t-[#0088ff] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 text-sm font-medium">気象情報を検索中...</p>
              </div>
            ) : weatherError ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-slate-200">
                <i className="fa-solid fa-location-dot text-slate-200 text-2xl mb-4"></i>
                <p className="text-slate-500 text-sm mb-6">{weatherError}</p>
                <button onClick={loadWeather} className="px-6 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors">
                  再試行する
                </button>
              </div>
            ) : weather ? (
              <WeatherCard weather={weather} />
            ) : null}
          </div>
        )}

        {result && (
          <div className="animate-fade-in space-y-4">
            <div className="px-4 mb-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                Search Results
              </span>
            </div>
            {result.results.length > 0 ? (
              result.results.map((item, index) => (
                <ResultCard key={index} {...item} />
              ))
            ) : (
              <div className="bg-white rounded-3xl p-20 text-center border border-slate-100">
                <p className="text-slate-400 font-bold">結果が見つかりませんでした。</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
