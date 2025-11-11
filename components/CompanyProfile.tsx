import React from 'react';
import { CompanyProfile as CompanyProfileType } from '../types';
import { InformationCircleIcon } from './IconComponents';
import { useTranslations } from '../hooks/useTranslations';

interface CompanyProfileProps {
  profile: CompanyProfileType | null;
  isLoading: boolean;
  error: string | null;
}

const ProfileItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-700/50">
        <span className="text-sm text-gray-400 w-full sm:w-1/3">{label}</span>
        <span className="text-sm font-medium text-white text-left sm:text-right">{value}</span>
    </div>
);

const LoadingSkeleton: React.FC = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        <div className="h-3 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-5 bg-gray-700 rounded"></div>
            ))}
        </div>
        <div className="h-24 bg-gray-700 rounded mt-4"></div>
    </div>
);

const CompanyProfile: React.FC<CompanyProfileProps> = ({ profile, isLoading, error }) => {
    const { t } = useTranslations();

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (error) {
        return <p className="text-red-400 text-center">{error}</p>;
    }

    if (!profile) {
        return <p className="text-gray-500 text-center">{t('profile.noProfile')}</p>;
    }
    
    const isDefaultProfile = profile.description === "No company profile information is available for this ticker.";

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-bold text-white">{profile.name} ({profile.ticker})</h3>
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:underline">
                    {profile.website}
                </a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                 <ProfileItem label={t('profile.industry')} value={profile.industry} />
                 <ProfileItem label={t('profile.sector')} value={profile.sector} />
                 <ProfileItem label={t('profile.ceo')} value={profile.ceo} />
                 <ProfileItem label={t('profile.headquarters')} value={profile.headquarters} />
            </div>

            <div>
                 <h4 className="font-semibold text-gray-300 mb-2 flex items-center">
                    <InformationCircleIcon className="h-5 w-5 mr-2 text-cyan-400" />
                    {t('profile.about')}
                 </h4>
                 <p className="text-sm text-gray-400 leading-relaxed bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                    {isDefaultProfile ? t('profile.noProfile') : profile.description}
                 </p>
            </div>
        </div>
    );
};

export default CompanyProfile;