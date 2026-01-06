
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
      d="M85 50C85 69.33 69.33 85 50 85C30.67 85 15 69.33 15 50C15 30.67 30.67 15 50 15C62.5 15 73.5 21.5 80 31.5" 
      stroke="url(#logoGradient)" 
      strokeWidth="12" 
      strokeLinecap="round" 
    />
    <path 
      d="M50 50H85" 
      stroke="url(#logoGradient)" 
      strokeWidth="12" 
      strokeLinecap="round" 
    />
    <path 
      d="M75 75L92 92" 
      stroke="url(#logoGradient)" 
      strokeWidth="12" 
      strokeLinecap="round" 
    />
  </svg>
);

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = useCallback(async () => {
    if (!navigator.geolocation) return;
    
    setWeatherLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await getWeatherAtLocation(
            position.coords.latitude,
            position.coords.longitude
          );
          setWeather(data);
        } catch (err) {
          console.error("Failed to load weather", err);
        } finally {
          setWeatherLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation error", err);
        setWeatherLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const handleSearch = useCallback(async (e?: React.FormEvent, searchOverride?: string) => {
    if (e) e.preventDefault();
    const effectiveQuery = searchOverride !== undefined ? searchOverride : query;
    if (!effectiveQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await performSearch(effectiveQuery);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "予期せぬエラーが発生しました。");
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
      {/* Header / Search Input Section */}
      <header className={`w-full transition-all duration-500 flex flex-col items-center justify-center px-4 ${result || loading ? 'py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-20' : 'min-h-[40vh] pt-16'}`}>
        
        {/* Top Navigation - Back to Home Button */}
        {(result || loading) && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <button 
              onClick={resetToHome}
              className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-[#0088ff] hover:bg-blue-50 rounded-xl transition-all border border-transparent"
            >
              <i className="fa-solid fa-house text-sm"></i>
              <span className="text-xs font-bold hidden sm:inline">ホーム</span>
            </button>
          </div>
        )}

        <div className={`flex flex-col items-center w-full max-w-3xl transition-all duration-500 ${result || loading ? 'items-center flex-row gap-4' : 'items-center'}`}>
          
          <div 
            onClick={resetToHome}
            className={`flex items-center gap-4 cursor-pointer transition-transform hover:opacity-80 ${result || loading ? 'mb-0 scale-[0.65] origin-left' : 'mb-10'}`}
          >
            <LogoIcon className={`${result || loading ? 'w-10 h-10' : 'w-16 h-16'}`} />
            {!(result || loading) && (
              <div className="flex flex-col">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-none">
                  Gemini <span className="text-brand-gradient">Search</span>
                </h1>
                <p className="text-slate-400 text-xs mt-1 font-medium tracking-widest uppercase">Intelligent Discovery</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSearch} className="w-full relative group max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <i className="fa-solid fa-magnifying-glass text-slate-300 group-focus-within:text-[#0088ff] transition-colors"></i>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="知りたいことを入力..."
              className="w-full pl-12 pr-14 py-4 bg-white border border-slate-200 rounded-[24px] shadow-sm hover:shadow-md focus:shadow-xl focus:ring-0 focus:border-[#0088ff] outline-none transition-all text-slate-700 text-lg"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2.5 top-2.5 bottom-2.5 w-11 h-11 search-gradient text-white rounded-full flex items-center justify-center hover:shadow-lg hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? (
                <i className="fa-solid fa-spinner animate-spin text-sm"></i>
              ) : (
                <i className="fa-solid fa-arrow-up text-sm"></i>
              )}
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-3xl px-4 py-8 mb-20">
        {loading && <SkeletonLoader />}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-[24px] p-8 text-center animate-fade-in">
            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
            </div>
            <h3 className="text-red-900 font-bold mb-1 text-lg">エラーが発生しました</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Home Page Initial Content: Weather */}
        {!result && !loading && !error && (
          <div className="animate-fade-in max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-5">
              <div className="bg-blue-50 text-[#0088ff] w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm">
                <i className="fa-solid fa-cloud-sun text-lg"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">Local Weather</h2>
                <p className="text-slate-400 text-xs font-medium">現在地の最新状況</p>
              </div>
            </div>

            {weatherLoading ? (
              <div className="h-48 bg-slate-50 animate-pulse rounded-[32px] border border-slate-100"></div>
            ) : (
              <div>
                {weather ? (
                  <WeatherCard weather={weather} />
                ) : (
                  <div className="text-center py-12 bg-white rounded-[32px] border border-dashed border-slate-200">
                    <i className="fa-solid fa-location-crosshairs text-slate-200 text-4xl mb-4"></i>
                    <p className="text-slate-400 text-sm font-medium">位置情報を許可すると天気を表示します</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-16 text-center">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Trending Searches</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["近くの美味しいレストラン", "明日の東京の天気", "最新のAIトレンド", "時短レシピ"].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => { setQuery(suggestion); handleSearch(undefined, suggestion); }}
                    className="px-5 py-2.5 bg-white text-slate-600 rounded-full text-sm font-medium hover:bg-[#0088ff] hover:text-white transition-all border border-slate-100 shadow-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Results Content */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                Search Results • {result.results.length} items
              </span>
            </div>

            {result.results.length > 0 ? (
              <div className="flex flex-col gap-1">
                {result.results.map((item, index) => (
                  <ResultCard 
                    key={index} 
                    title={item.title} 
                    url={item.url} 
                    summary={item.summary} 
                  />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fa-regular fa-face-frown text-slate-300 text-4xl"></i>
                </div>
                <p className="text-slate-900 font-bold text-xl">結果が見つかりませんでした</p>
                <p className="text-slate-400 mt-2 text-sm">別のキーワードでお試しください</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-50 py-10 text-center bg-white mt-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <LogoIcon className="w-5 h-5 opacity-40 grayscale" />
          <span className="text-slate-300 text-xs font-bold tracking-widest uppercase">Gemini Search Engine</span>
        </div>
        <p className="text-slate-400 text-[10px] font-bold tracking-tighter uppercase opacity-60">Powered by Google AI & Real-time Web Grounding</p>
      </footer>
    </div>
  );
};

export default App;
