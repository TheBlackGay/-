import React from 'react';
import { AIComprehensiveAnalysisResult } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { 
    SparklesIcon, 
    ScaleIcon,
    ShieldCheckIcon,
    LightBulbIcon,
    ExclamationTriangleIcon,
    ClipboardDocumentListIcon,
    CheckCircleIcon
} from './IconComponents';

interface AIComprehensiveAnalysisProps {
  analysis: AIComprehensiveAnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  onAnalyze: () => void;
}

const LoadingSkeleton: React.FC = () => (
    <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-gray-700 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-700 rounded-lg"></div>
            <div className="h-48 bg-gray-700 rounded-lg"></div>
            <div className="h-48 bg-gray-700 rounded-lg"></div>
            <div className="h-48 bg-gray-700 rounded-lg"></div>
        </div>
    </div>
);

const AnalysisSectionCard: React.FC<{ 
    title: string; 
    summary: string; 
    points: string[];
    icon: React.ReactNode;
}> = ({ title, summary, points, icon }) => {
    // FIX: Call useTranslations hook to get the 't' function.
    const { t } = useTranslations();
    return (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 flex flex-col">
            <div className="flex items-center mb-2">
                {icon}
                <h4 className="text-lg font-bold text-cyan-400 ml-2">{title}</h4>
            </div>
            <p className="text-sm text-gray-300 italic mb-3">{summary}</p>
            <div className="border-t border-gray-700 pt-3 mt-auto">
                <h5 className="text-sm font-semibold text-gray-400 mb-2">{t('aiAnalysis.keyPoints')}</h5>
                <ul className="space-y-2 text-sm text-gray-400">
                    {points.map((point, index) => (
                        <li key={index} className="flex items-start">
                            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{point}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const AIComprehensiveAnalysis: React.FC<AIComprehensiveAnalysisProps> = ({ analysis, isLoading, error, onAnalyze }) => {
    const { t } = useTranslations();

    const renderContent = () => {
        if (isLoading) {
            return <LoadingSkeleton />;
        }
        if (error) {
            return <div className="text-red-400 bg-red-900/50 p-3 rounded text-center">{error}</div>;
        }
        if (analysis) {
            const analysisSections = [
                {
                    title: t('aiAnalysis.valuation'),
                    icon: <ScaleIcon className="h-6 w-6 text-cyan-400" />,
                    ...analysis.valuation
                },
                {
                    title: t('aiAnalysis.financialHealth'),
                    icon: <ShieldCheckIcon className="h-6 w-6 text-cyan-400" />,
                    ...analysis.financialHealth
                },
                {
                    title: t('aiAnalysis.technologicalEdge'),
                    icon: <LightBulbIcon className="h-6 w-6 text-cyan-400" />,
                    ...analysis.technologicalEdge
                },
                {
                    title: t('aiAnalysis.riskFactors'),
                    icon: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />,
                    ...analysis.riskFactors
                }
            ];
            
            return (
                <div className="space-y-6">
                    {/* Investment Thesis as a prominent callout */}
                    <div className="bg-gray-900/50 p-4 rounded-lg border-l-4 border-cyan-400">
                        <div className="flex items-center mb-2">
                            <ClipboardDocumentListIcon className="h-6 w-6 text-cyan-400" />
                            <h3 className="text-xl font-bold text-white ml-2">{t('aiAnalysis.investmentThesis')}</h3>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            {analysis.investmentThesis}
                        </p>
                    </div>

                    {/* Grid for detailed sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {analysisSections.map(section => (
                            <AnalysisSectionCard 
                                key={section.title}
                                title={section.title}
                                summary={section.summary}
                                points={section.keyPoints}
                                icon={section.icon}
                            />
                        ))}
                    </div>
                </div>
            );
        }
        return (
            <div className="text-center flex flex-col items-center justify-center h-full">
                <SparklesIcon className="h-12 w-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-white">{t('aiAnalysis.title')}</h3>
                <p className="text-gray-400 mt-2 max-w-sm">{t('aiAnalysis.prompt')}</p>
                <button
                    onClick={onAnalyze}
                    disabled={isLoading}
                    className="mt-6 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                    {isLoading ? t('aiAnalysis.analyzing') : t('aiAnalysis.analyzeButton')}
                </button>
            </div>
        );
    };

    return (
        <div className="overflow-y-auto h-full pr-2">
            {renderContent()}
        </div>
    );
};

export default AIComprehensiveAnalysis;