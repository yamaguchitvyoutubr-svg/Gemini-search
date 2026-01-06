
import React, { useState, useCallback, useEffect } from 'react';
import { performSearch, getWeatherAtLocation, testApiKey } from './services/geminiService';
import { SearchResponse, WeatherInfo } from './types';
import { ResultCard } from './components/ResultCard';
import { WeatherCard } from './components/WeatherCard';
import { SkeletonLoader } from './components/SkeletonLoader';

const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
    <path d="M82,35C77.5,23 64.8,15 50,15C30.7,15 15,30.7 15,50c0,19.3 15.7,35 35,35c12,0 22.5-6 28.5-15" stroke="url(#logoGradient)" strokeWidth="13" strokeLinecap="round" />
    <path d="M50,50 L83,50" stroke="url(#logoGradient)" strokeWidth="13" strokeLinecap="round" />
    <path d="M76,76 L92,92" stroke="url(#logoGradient)" strokeWidth="13" strokeLinecap="round" />
  </svg>
);

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings States
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem('GEMINI_API_KEY') || '');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const loadWeather = useCallback(async () => {
    if (!navigator.geolocation) return;
    setWeatherLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await getWeatherAtLocation(pos.coords.latitude, pos.coords.longitude);
          setWeather(data);
        } catch (e) {
          console.error(e);
        } finally {
          setWeatherLoading(false);
        }
      },
      () => setWeatherLoading(false),
      { timeout: 10000 }
    );
  }, []);

  useEffect(() => { loadWeather(); }, [loadWeather]);

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const saveApiKey = async () => {
    setTestStatus('testing');
    const isValid = await testApiKey(apiKeyInput);
    if (isValid) {
      localStorage.setItem('GEMINI_API_KEY', apiKeyInput);
      setTestStatus('success');
      setTimeout(() => setShowSettings(false), 1000);
    } else {
      setTestStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] dark:bg-slate-950 transition-colors duration-500 flex flex-col items-center">
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-gear text-blue-500"></i>
                設定
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <div className="space-y-8">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="font-bold text-slate-700 dark:text-slate-300">ダークモード</span>
                <button 
                  onClick={() => setIsDark(!isDark)}
                  className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${isDark ? 'bg-blue-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isDark ? 'translate-x-6' : 'translate-x-0'} flex items-center justify-center`}>
                    <i className={`fa-solid ${isDark ? 'fa-moon text-blue-500' : 'fa-sun text-amber-500'} text-[10px]`}></i>
                  </div>
                </button>
              </div>

              {/* API Key Input */}
              <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 px-1">Gemini API Key</label>
                <div className="relative">
                  <input 
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => { setApiKeyInput(e.target.value); setTestStatus('idle'); }}
                    placeholder="AI Studioから取得したキーを入力"
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white text-sm"
                  />
                  {testStatus === 'success' && <i className="fa-solid fa-circle-check text-green-500 absolute right-4 top-1/2 -translate-y-1/2"></i>}
                  {testStatus === 'error' && <i className="fa-solid fa-circle-xmark text-red-500 absolute right-4 top-1/2 -translate-y-1/2"></i>}
                </div>
                <p className="mt-2 text-[10px] text-slate-400 px-1 font-medium">キーはブラウザのローカルストレージにのみ保存されます。</p>
              </div>

              <button 
                onClick={saveApiKey}
                disabled={testStatus === 'testing' || !apiKeyInput}
                className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95 ${testStatus === 'testing' ? 'bg-slate-400' : 'search-gradient hover:brightness-110'}`}
              >
                {testStatus === 'testing' ? <i className="fa-solid fa-spinner animate-spin"></i> : '設定を確認して保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`w-full transition-all duration-500 flex flex-col items-center justify-center px-4 z-20 ${result || loading ? 'py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 sticky top-0' : 'min-h-[40vh] pt-16'}`}>
        <div className="absolute right-6 top-6">
          <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-all shadow-sm">
            <i className="fa-solid fa-sliders text-sm"></i>
          </button>
        </div>

        <div className={`flex flex-col items-center w-full max-w-4xl transition-all duration-500 ${result || loading ? 'flex-row gap-6' : 'items-center'}`}>
          <div onClick={() => {setResult(null); setQuery('');}} className={`flex items-center gap-4 cursor-pointer transition-transform ${result || loading ? 'scale-75 origin-left' : 'mb-12'}`}>
            <LogoIcon className="w-16 h-16" />
            {!(result || loading) && (
              <div className="flex flex-col">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white leading-none">Gemini</h1>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white leading-none mt-1">Search</h1>
              </div>
            )}
          </div>
          <form onSubmit={handleSearch} className="w-full relative max-w-2xl group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <i className="fa-solid fa-magnifying-glass text-slate-300 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors"></i>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="気になることを検索..."
              className="w-full pl-14 pr-16 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm hover:shadow-md focus:shadow-xl focus:border-blue-500 outline-none transition-all dark:text-white text-lg"
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
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-3xl p-8 text-center animate-fade-in">
            <i className="fa-solid fa-triangle-exclamation text-red-400 mb-4 text-3xl"></i>
            <p className="text-red-700 dark:text-red-300 font-bold">{error}</p>
            {!localStorage.getItem('GEMINI_API_KEY') && (
              <button onClick={() => setShowSettings(true)} className="mt-4 text-sm text-blue-600 font-bold underline">APIキーを設定する</button>
            )}
          </div>
        )}

        {!result && !loading && !error && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-slate-900 dark:text-white font-black flex items-center gap-2">
                <i className="fa-solid fa-sun text-blue-500"></i>
                TODAY
              </h2>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local Insight</span>
            </div>
            {weatherLoading ? (
              <div className="bg-white dark:bg-slate-900 rounded-[32px] p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="w-8 h-8 border-3 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 text-xs font-bold animate-pulse">WEATHER FETCHING...</p>
              </div>
            ) : weather ? (
              <WeatherCard weather={weather} />
            ) : (
              <button onClick={loadWeather} className="w-full py-8 bg-white dark:bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-bold hover:border-blue-200 transition-all">
                位置情報から天気を表示
              </button>
            )}
          </div>
        )}

        {result && (
          <div className="animate-fade-in space-y-4 pb-20">
            {result.results.map((item, index) => <ResultCard key={index} {...item} />)}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
