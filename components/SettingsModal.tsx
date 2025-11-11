import React, { useState } from 'react';
import { XCircleIcon, TrashIcon, SpinnerIcon, CheckCircleIcon } from './IconComponents';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslations } from '../hooks/useTranslations';
import { AI_MODELS } from '../constants';
import { AIModel } from '../types';
import { testCustomModelConnection } from '../services/geminiService';
import Tooltip from './Tooltip';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslations();
    const { 
        selectedModelId, 
        setSelectedModelId, 
        customModels, 
        addCustomModel, 
        removeCustomModel 
    } = useSettings();
    
    const [tempSelectedModelId, setTempSelectedModelId] = useState<string>(selectedModelId);
    const [newModelName, setNewModelName] = useState('');
    const [newModelUrl, setNewModelUrl] = useState('');
    const [testResults, setTestResults] = useState<Record<string, { status: 'idle' | 'testing' | 'success' | 'error', message: string }>>({});
    
    if (!isOpen) return null;

    const handleSave = () => {
        setSelectedModelId(tempSelectedModelId);
        onClose();
    };

    const handleAddCustomModel = (e: React.FormEvent) => {
        e.preventDefault();
        if (newModelName.trim() && newModelUrl.trim()) {
            try {
                // Basic URL validation
                new URL(newModelUrl);
                const newId = addCustomModel({ name: newModelName, url: newModelUrl });
                setTempSelectedModelId(newId); // Auto-select the new model
                setNewModelName('');
                setNewModelUrl('');
            } catch (error) {
                alert("Please enter a valid URL.");
            }
        }
    };

    const handleTestConnection = async (model: AIModel) => {
        if (!model.url) return;
        setTestResults(prev => ({ ...prev, [model.id]: { status: 'testing', message: t('settings.testStatus.testing') } }));
        
        const result = await testCustomModelConnection(model.url);
        
        const status = result.ok ? 'success' : 'error';
        const message = result.ok ? t('settings.testStatus.success') : `${t('settings.testStatus.error')}: ${result.message}`;
        
        setTestResults(prev => ({ ...prev, [model.id]: { status, message } }));

        // Clear status indicator after 5 seconds, but keep the message for the tooltip
        setTimeout(() => {
            setTestResults(prev => ({ ...prev, [model.id]: { ...prev[model.id], status: 'idle' } }));
        }, 5000);
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg flex flex-col p-6 border border-gray-700 max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4 flex-shrink-0">
                    <h2 id="settings-modal-title" className="text-2xl font-bold text-white">
                        {t('settings.title')}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label={t('settings.closeButton')}>
                        <XCircleIcon className="h-8 w-8" />
                    </button>
                </div>
                
                <div className="space-y-6 overflow-y-auto pr-2">
                    {/* Model Selection */}
                    <div>
                        <label htmlFor="ai-model-select" className="block text-sm font-medium text-gray-300 mb-2">
                            {t('settings.modelLabel')}
                        </label>
                        <select
                            id="ai-model-select"
                            value={tempSelectedModelId}
                            onChange={(e) => setTempSelectedModelId(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                        >
                            <optgroup label={t('settings.groupBuiltIn')}>
                                {AI_MODELS.map(modelOption => (
                                    <option key={modelOption.id} value={modelOption.id}>
                                        {t(modelOption.nameKey)}
                                    </option>
                                ))}
                            </optgroup>
                            {customModels.length > 0 && (
                                <optgroup label={t('settings.groupCustom')}>
                                    {customModels.map(modelOption => (
                                        <option key={modelOption.id} value={modelOption.id}>
                                            {modelOption.nameKey}
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                    </div>

                    {/* Custom Model Management */}
                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="text-lg font-semibold text-white mb-3">{t('settings.manageCustomModels')}</h3>
                        
                        {/* Add Form */}
                        <form onSubmit={handleAddCustomModel} className="bg-gray-900/50 p-3 rounded-md space-y-3 mb-4">
                            <h4 className="text-md font-medium text-gray-300">{t('settings.addCustomModel')}</h4>
                            <div>
                                <label htmlFor="model-name" className="text-xs text-gray-400">{t('settings.modelNameLabel')}</label>
                                <input id="model-name" type="text" value={newModelName} onChange={e => setNewModelName(e.target.value)} placeholder={t('settings.modelNamePlaceholder')} className="w-full mt-1 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                            </div>
                             <div>
                                <label htmlFor="model-url" className="text-xs text-gray-400">{t('settings.modelUrlLabel')}</label>
                                <input id="model-url" type="url" value={newModelUrl} onChange={e => setNewModelUrl(e.target.value)} placeholder={t('settings.modelUrlPlaceholder')} className="w-full mt-1 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                            </div>
                            <button type="submit" className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-semibold py-1.5 text-sm rounded transition-colors">{t('settings.addButton')}</button>
                        </form>

                        {/* Custom Model List */}
                        <div className="space-y-2">
                            {customModels.length > 0 ? customModels.map(model => {
                                const testResult = testResults[model.id] || { status: 'idle', message: '' };
                                return (
                                    <div key={model.id} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                                        <div>
                                            <p className="font-semibold text-sm">{model.nameKey}</p>
                                            <p className="text-xs text-gray-400 font-mono break-all">{model.url}</p>
                                        </div>
                                        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                            <Tooltip text={testResult.message || t('settings.testTooltip')}>
                                                <div className="w-6 h-6 flex items-center justify-center">
                                                    {testResult.status === 'testing' && <SpinnerIcon className="h-5 w-5 text-cyan-400" />}
                                                    {testResult.status === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-400" />}
                                                    {testResult.status === 'error' && <XCircleIcon className="h-5 w-5 text-red-400" />}
                                                </div>
                                            </Tooltip>
                                            <button
                                                onClick={() => handleTestConnection(model)}
                                                disabled={testResult.status === 'testing'}
                                                className="text-sm px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded disabled:opacity-50 disabled:cursor-wait"
                                            >
                                                {t('settings.testButton')}
                                            </button>
                                            <button onClick={() => removeCustomModel(model.id)} className="text-red-500 hover:text-red-400 p-1" aria-label={t('settings.deleteButtonLabel')}>
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            }) : (
                                <p className="text-sm text-gray-500 text-center py-4">{t('settings.noCustomModels')}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700 flex-shrink-0">
                     <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                    >
                        {t('settings.closeButton')}
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-500 transition-colors"
                    >
                        {t('settings.saveButton')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;