import React from 'react';
import { NewsArticle } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface NewsFeedProps {
  articles: NewsArticle[];
  isLoading: boolean;
  error: string | null;
  ticker: string;
}

const NewsItemSkeleton: React.FC = () => (
    <div className="py-3 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-full mb-3"></div>
        <div className="h-3 bg-gray-700 rounded w-5/6"></div>
        <div className="h-2 bg-gray-700 rounded w-1/4 mt-2"></div>
    </div>
);

const NewsFeed: React.FC<NewsFeedProps> = ({ articles, isLoading, error, ticker }) => {
    const { t } = useTranslations();
    
    const timeSince = (date: string): string => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    }

    return (
        <div className="overflow-y-auto h-full pr-2 space-y-2 divide-y divide-gray-700/50">
            {isLoading && (
                <>
                    <NewsItemSkeleton />
                    <NewsItemSkeleton />
                    <NewsItemSkeleton />
                </>
            )}
            {error && <p className="text-red-400 p-4 text-center">{error}</p>}
            {!isLoading && !error && articles.length === 0 && (
                <p className="text-gray-500 p-4 text-center">{t('news.noNews', { ticker })}</p>
            )}
            {!isLoading && !error && articles.map(article => (
                <a href={article.url} key={article.id} target="_blank" rel="noopener noreferrer" className="block p-3 hover:bg-gray-700/50 rounded-md transition-colors">
                    <h3 className="font-semibold text-white leading-tight">{article.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{article.summary}</p>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                        <span>{article.source}</span>
                        <span>{timeSince(article.publishedAt)}</span>
                    </div>
                </a>
            ))}
        </div>
    );
};

export default NewsFeed;
