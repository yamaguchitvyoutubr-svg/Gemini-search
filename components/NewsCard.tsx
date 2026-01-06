
import React from 'react';
import { NewsItem } from '../types';

export const NewsCard: React.FC<{ item: NewsItem }> = ({ item }) => {
  const getDomain = (urlStr: string) => {
    try {
      return new URL(urlStr).hostname;
    } catch {
      return urlStr;
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group border-l-4 border-l-indigo-500 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
            item.category === '国内' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
          }`}>
            {item.category}
          </span>
          <span className="text-slate-400 text-[10px] font-medium truncate max-w-[120px]">
            {getDomain(item.url)}
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            {item.title}
          </a>
        </h3>
        <p className="text-slate-500 text-sm mb-4 line-clamp-3 leading-relaxed">
          {item.summary}
        </p>
      </div>
      <div className="pt-2 border-t border-slate-50">
        <a 
          href={item.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline flex items-center justify-between font-medium group/link"
        >
          <span>この記事を読む</span>
          <i className="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-0 group-hover/link:opacity-100 transition-opacity"></i>
        </a>
      </div>
    </div>
  );
};
