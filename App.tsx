
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
    {/* G Shape Body */}
    <path 
      d="M82,35C77.5,23 64.8,15 50,15C30.7,15 15,30.7 15,50c0,19.3 15.7,35 35,35c12,0 22.5-6 28.5-15" 
      stroke="url(#logoGradient)" 
      strokeWidth="13" 
      strokeLinecap="round" 
    />
    {/* G Middle Bar */}
    <path 
      d="M50,50 L83,50" 
      stroke="url(#logoGradient)" 
      strokeWidth="13" 
      strokeLinecap="round" 
    />
    {/* Magnifier Handle Extension */}
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
      setWeatherError("お使いのブラウザは位置情報をサポートしていません。");
      return;
    }
    
    setWeatherLoading(true);
    setWeatherError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await getWeatherAtLocation(
            position.coords.latitude,
            position.coords.longitude
          );
          setWeather(data);
          setWeatherError(null);
        } catch (err) {
          console.error("Failed to load weather", err);
          setWeatherError("天気の取得に失敗しました。");
        } finally {
          setWeatherLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation error", err);
        let msg = "位置情報の取得に失敗しました。";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "位置情報の利用が拒否されました。設定を確認してください。";
        } else if (err.code === err.TIMEOUT) {
          msg = "位置情報の取得がタイムアウトしました。";
        }
        setWeatherError(msg);
        setWeatherLoading(false);
      },
      options
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
      <header className={`w-full transition-all duration-500 flex flex-col items-center justify-center px-4 ${result || loading ? 'py-6 bg-white/90 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-20' : 'min-h-[45vh] pt-16'}`}>
        
        {/* Top Navigation - Back to Home Button */}
        {(result || loading) && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2">
            <button 
              onClick={resetToHome}
              className="group flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-[#0088ff] hover:bg-blue-50 rounded-2xl transition-all"
            >
              <i className="fa-solid fa-house text-sm transition-transform group-hover:scale-110"></i>
              <span className="text-xs font-bold hidden sm:inline">ホーム</span>
            </button>
          </div>
        )}

        <div className={`flex flex-col items-center w-full max-w-4xl transition-all duration-500 ${result || loading ? 'items-center flex-row gap-6' : 'items-center'}`}>
          
          <div 
            onClick={resetToHome}
            className={`flex items-center gap-4 cursor-pointer group transition-transform shrink-0 ${result || loading ? 'mb-0 scale-[0.55] origin-left' : 'mb-14'}`}
          >
            <LogoIcon className={`${result || loading ? 'w-12 h-12' : 'w-24 h-24'} transition-all`} />
            {!(result || loading) && (
              <div className="flex flex-col">
                <h1 className="text-[3rem] font-bold tracking-tight text-[#1a1a1a] leading-[0.8]">
                  Gemini
                </h1>
                <h1 className="text-[3rem] font-bold tracking-tight text-[#1a1a1a] leading-[0.8] mt-1">
                  Search
                </h1>
              </div>
            )}
          </div>

          <form onSubmit={handleSearch} className="w-full relative group max-w-3xl">
            <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none">
              <i className="fa-solid fa-magnifying-glass text-slate-300 group-focus-within:text-[#0088ff] transition-colors text-lg"></i>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="知りたいことを入力..."
              className="w-full pl-16 pr-20 py-5 bg-white border border-slate-200 rounded-[35px] shadow-sm hover:shadow-md focus:shadow-2xl focus:ring-4 focus:ring-blue-50 focus:border-[#0088ff] outline-none transition-all text-slate-800 text-lg md:text-xl font-medium"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-14 h-14 search-gradient text-white rounded-full flex items-center justify-center hover:shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <i className="fa-solid fa-spinner animate-spin text-lg"></i>
              ) : (
                <i className="fa-solid fa-arrow-right text-lg"></i>
              )}
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-3xl px-6 py-10 mb-20">
        {loading && <SkeletonLoader />}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-[32px] p-8 text-center animate-fade-in shadow-sm">
            <div className="bg-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <i className="fa-solid fa-circle-exclamation text-red-500 text-xl"></i>
            </div>
            <h3 className="text-red-900 font-bold mb-1 text-lg">エラーが発生しました</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Home Page Initial Content: Weather */}
        {!result && !loading && !error && (
          <div className="animate-fade-in max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
              <div className="bg-blue-50 text-[#0088ff] w-12 h-12 rounded-[18px] flex items-center justify-center shadow-sm">
                <i className="fa-solid fa-sun text-xl"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1.5">Local Discovery</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-80">Real-time Weather Info</p>
              </div>
            </div>

            {weatherLoading ? (
              <div className="h-56 bg-white border border-slate-100 rounded-[40px] flex flex-col items-center justify-center gap-4 shadow-sm">
                <div className="w-12 h-12 border-4 border-blue-50 border-t-[#0088ff] rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm font-semibold animate-pulse">位置情報を取得中...</p>
              </div>
            ) : (
              <div>
                {weatherError ? (
                  <div className="text-center py-12 px-6 bg-white rounded-[40px] border border-dashed border-slate-200 shadow-sm">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fa-solid fa-location-dot text-slate-200 text-2xl"></i>
                    </div>
                    <p className="text-slate-500 text-sm font-semibold mb-6 max-w-[240px] mx-auto leading-relaxed">{weatherError}</p>
                    <button 
                      onClick={loadWeather}
                      className="px-6 py-2.5 bg-slate-100 hover:bg-[#0088ff] hover:text-white text-slate-600 rounded-full text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      位置情報を再試行
                    </button>
                  </div>
                ) : weather ? (
                  <WeatherCard weather={weather} />
                ) : (
                  <div className="text-center py-16 bg-white rounded-[40px] border border-dashed border-slate-200">
                    <i className="fa-solid fa-location-arrow text-slate-200 text-4xl mb-4"></i>
                    <p className="text-slate-400 text-sm font-semibold mb-4">位置情報をONにして現地の情報を取得</p>
                    <button 
                      onClick={loadWeather}
                      className="px-8 py-3 search-gradient text-white rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all"
                    >
                      天気をチェック
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-20 text-center">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 opacity-70">Popular Suggestions</p>
              <div className="flex flex-wrap justify-center gap-3">
                {["近くの美味しいカフェ", "今週末の天気予報", "最新のテクノロジーニュース", "健康に良い朝食レシピ"].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => { setQuery(suggestion); handleSearch(undefined, suggestion); }}
                    className="px-6 py-3 bg-white text-slate-600 rounded-full text-sm font-semibold hover:bg-[#0088ff] hover:text-white transition-all border border-slate-100 shadow-sm active:scale-95"
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
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center justify-between mb-6 px-4">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                Verified Sources ({result.results.length})
              </span>
            </div>

            {result.results.length > 0 ? (
              <div className="flex flex-col">
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
              <div className="py-24 text-center bg-white rounded-[40px] border border-slate-100">
                <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fa-solid fa-magnifying-glass text-slate-200 text-4xl"></i>
                </div>
                <p className="text-slate-900 font-bold text-xl">結果が見つかりませんでした</p>
                <p className="text-slate-400 mt-2 text-sm">別の言葉で検索してみてください</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-50 py-12 text-center bg-white mt-auto">
        <div className="flex items-center justify-center gap-3 mb-4">
          <LogoIcon className="w-6 h-6 opacity-30 grayscale" />
          <span className="text-slate-300 text-xs font-black tracking-[0.2em] uppercase">Gemini Search Engine</span>
        </div>
        <div className="max-w-md mx-auto px-6">
          <p className="text-slate-400 text-[10px] font-bold tracking-tight uppercase leading-relaxed opacity-60">
            Powered by Gemini AI and Real-time Search Grounding.<br/>
            Optimized for speed, accuracy, and local intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
