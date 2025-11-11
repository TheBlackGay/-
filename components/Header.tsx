import React from 'react';
import { ChartBarIcon, BriefcaseIcon, Cog6ToothIcon } from './IconComponents';
import { useTranslations } from '../hooks/useTranslations';
import { useSettings } from '../contexts/SettingsContext';

interface HeaderProps {
    currentView: 'dashboard' | 'portfolio';
    onSetView: (view: 'dashboard' | 'portfolio') => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onSetView }) => {
    const { t, language, setLanguage } = useTranslations();
    const { openSettings } = useSettings();
    const navButtonClasses = "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors";
    const activeClasses = "bg-gray-700 text-white";
    const inactiveClasses = "text-gray-400 hover:bg-gray-700 hover:text-white";

    const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value as 'en' | 'zh' | 'hi');
    };

    return (
        <header className="bg-gray-800 border-b border-gray-700 p-3 flex items-center shadow-md">
            <ChartBarIcon className="h-8 w-8 text-cyan-400 mr-3" />
            <h1 className="text-xl font-bold text-white tracking-wider">TradeWise AI</h1>

            <div className="flex items-center space-x-4 ml-auto">
                <div className="flex items-center space-x-2 bg-gray-900 rounded-lg p-1">
                    <button
                        onClick={() => onSetView('dashboard')}
                        className={`${navButtonClasses} ${currentView === 'dashboard' ? activeClasses : inactiveClasses}`}
                        aria-pressed={currentView === 'dashboard'}
                    >
                        <ChartBarIcon className="h-5 w-5 mr-2" />
                        {t('header.dashboard')}
                    </button>
                    <button
                        onClick={() => onSetView('portfolio')}
                        className={`${navButtonClasses} ${currentView === 'portfolio' ? activeClasses : inactiveClasses}`}
                        aria-pressed={currentView === 'portfolio'}
                    >
                        <BriefcaseIcon className="h-5 w-5 mr-2" />
                        {t('header.portfolio')}
                    </button>
                </div>
                
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={openSettings} 
                        className="p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                        aria-label={t('settings.title')}
                    >
                        <Cog6ToothIcon className="h-6 w-6" />
                    </button>

                    <select
                        value={language}
                        onChange={handleLangChange}
                        className="bg-gray-900 border border-gray-600 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                        aria-label="Select language"
                    >
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                        <option value="hi">हिन्दी</option>
                    </select>
                </div>
            </div>
        </header>
    );
};

export default Header;