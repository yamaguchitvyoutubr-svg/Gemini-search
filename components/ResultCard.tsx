
import React from 'react';

interface ResultCardProps {
  title: string;
  url: string;
  summary: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({ title, url, summary }) => {
  const getDomain = (urlStr: string) => {
    try {
      return new URL(urlStr).hostname.replace('www.', '');
    } catch {
      return urlStr;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all px-6 py-8 rounded-[32px] group border border-transparent hover:border-blue-100 dark:hover:border-blue-900/50 shadow-sm">
      <div className="flex flex-col">
        {/* Domain and Source Tag */}
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest">
            Source
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-xs font-bold truncate tracking-tight">
            {getDomain(url)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2 leading-[1.3] transition-colors">
          <a href={url} target="_blank" rel="noopener noreferrer">
            {title}
          </a>
        </h3>
        
        {/* Summary */}
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base mb-4 font-medium">
          {summary}
        </p>

        {/* URL Link */}
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-slate-300 dark:text-slate-600 text-[11px] hover:text-blue-500 truncate flex items-center gap-2 font-medium transition-colors"
        >
          <i className="fa-solid fa-link text-[10px]"></i>
          {url}
        </a>
      </div>
    </div>
  );
};
