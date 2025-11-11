import { useContext, useCallback } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

type InterpolationValues = Record<string, string | number>;

export const useTranslations = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslations must be used within a LanguageProvider');
    }
    const { translations } = context;

    const t = useCallback((key: string, values?: InterpolationValues) => {
        let translation = translations[key] || key;
        if (values) {
            Object.keys(values).forEach(valueKey => {
                const regex = new RegExp(`\\{${valueKey}\\}`, 'g');
                translation = translation.replace(regex, String(values[valueKey]));
            });
        }
        return translation;
    }, [translations]);

    return { t, ...context };
};
