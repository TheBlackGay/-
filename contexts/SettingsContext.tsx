import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { AIModel } from '../types';
import { AI_MODELS } from '../constants';

// A helper function to safely get from localStorage
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

// A helper function to safely set to localStorage
const setInStorage = <T,>(key: string, value: T): void => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error setting localStorage key “${key}”:`, error);
    }
};

interface SettingsContextType {
    selectedModelId: string;
    setSelectedModelId: (id: string) => void;
    customModels: AIModel[];
    addCustomModel: (model: { name: string; url: string }) => string;
    removeCustomModel: (id: string) => void;
    activeModel: AIModel | undefined;
    isSettingsOpen: boolean;
    openSettings: () => void;
    closeSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedModelId, setSelectedModelId] = useState<string>(() => getFromStorage('selectedModelId', AI_MODELS[0].id));
    const [customModels, setCustomModels] = useState<AIModel[]>(() => getFromStorage('customModels', []));
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        setInStorage('selectedModelId', selectedModelId);
    }, [selectedModelId]);

    useEffect(() => {
        setInStorage('customModels', customModels);
    }, [customModels]);


    const openSettings = () => setIsSettingsOpen(true);
    const closeSettings = () => setIsSettingsOpen(false);

    const addCustomModel = (model: { name: string, url: string }): string => {
        const newModel: AIModel = {
            id: `custom-${Date.now()}`,
            provider: 'custom',
            nameKey: model.name, // For custom models, nameKey is just the name
            url: model.url,
        };
        setCustomModels(prev => [...prev, newModel]);
        return newModel.id;
    };

    const removeCustomModel = (id: string) => {
        setCustomModels(prev => prev.filter(m => m.id !== id));
        // If the deleted model was the selected one, revert to default
        if (selectedModelId === id) {
            setSelectedModelId(AI_MODELS[0].id);
        }
    };
    
    const activeModel = useMemo(() => {
        const allModels = [...AI_MODELS, ...customModels];
        return allModels.find(m => m.id === selectedModelId);
    }, [selectedModelId, customModels]);


    return (
        <SettingsContext.Provider value={{ 
            selectedModelId, 
            setSelectedModelId, 
            customModels,
            addCustomModel,
            removeCustomModel,
            activeModel,
            isSettingsOpen, 
            openSettings, 
            closeSettings 
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};