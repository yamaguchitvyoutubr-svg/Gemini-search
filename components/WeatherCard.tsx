
import React from 'react';
import { WeatherInfo } from '../types';

interface WeatherCardProps {
  weather: WeatherInfo;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ weather }) => {
  const getWeatherIcon = (condition: string) => {
    if (condition.includes('晴')) return 'fa-sun text-yellow-400';
    if (condition.includes('雨')) return 'fa-cloud-showers-heavy text-blue-400';
    if (condition.includes('曇')) return 'fa-cloud text-slate-400 dark:text-slate-500';
    if (condition.includes('雪')) return 'fa-snowflake text-sky-200 dark:text-sky-400';
    if (condition.includes('雷')) return 'fa-cloud-bolt text-indigo-400';
    return 'fa-cloud-sun text-blue-300 dark:text-blue-500';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm hover:shadow-xl transition-all border-b-4 border-b-blue-500 overflow-hidden relative group animate-fade-in">
      {/* Background Icon Decoration */}
      <div className="absolute -right-6 -top-6 text-slate-50 dark:text-slate-800 opacity-20 dark:opacity-10 text-[10rem] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
        <i className={`fa-solid ${getWeatherIcon(weather.condition).split(' ')[0]}`}></i>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em]">
            Live Observation
          </div>
          <span className="text-slate-600 dark:text-slate-400 text-xs font-bold tracking-tight">
            <i className="fa-solid fa-location-dot mr-2 text-blue-500 animate-bounce"></i>
            {weather.location}
          </span>
        </div>

        <div className="flex items-end gap-6 mb-6">
          <div className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
            {weather.temp}
          </div>
          <div className="flex flex-col mb-1.5">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-200 flex items-center gap-3">
              <i className={`fa-solid ${getWeatherIcon(weather.condition)}`}></i>
              {weather.condition}
            </span>
            <div className="flex gap-3 text-xs font-bold mt-1">
              <span className="text-red-500 bg-red-50 dark:bg-red-950/30 px-2.5 py-1 rounded-lg">最高 {weather.high}</span>
              <span className="text-blue-500 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-lg">最低 {weather.low}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100/50 dark:border-slate-700/50 backdrop-blur-sm">
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
            <i className="fa-solid fa-quote-left text-blue-500 opacity-20 mr-2 text-lg"></i>
            {weather.details}
          </p>
        </div>
      </div>
    </div>
  );
};
