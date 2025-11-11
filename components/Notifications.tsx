import React, { useEffect } from 'react';
import { NotificationMessage } from '../types';
import { XCircleIcon, InformationCircleIcon, CheckCircleIcon } from './IconComponents';
import { useTranslations } from '../hooks/useTranslations';

interface NotificationsProps {
  notifications: NotificationMessage[];
  onDismiss: (id: string) => void;
}

const NotificationItem: React.FC<{ notification: NotificationMessage; onDismiss: (id: string) => void; }> = ({ notification, onDismiss }) => {
    const { t } = useTranslations();
    
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(notification.id);
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [notification.id, onDismiss]);

    const config = {
        info: {
            title: t('notifications.priceAlertTitle'),
            icon: <InformationCircleIcon className="h-6 w-6 text-cyan-400" aria-hidden="true" />,
        },
        success: {
            title: t('notifications.successTitle'),
            icon: <CheckCircleIcon className="h-6 w-6 text-green-400" aria-hidden="true" />,
        },
        error: {
            title: t('notifications.errorTitle'),
            icon: <XCircleIcon className="h-6 w-6 text-red-400" aria-hidden="true" />,
        }
    };

    const notificationConfig = config[notification.type] || config.info;
    const bgColor = "bg-gray-800";

    return (
        <div className={`w-full max-w-sm ${bgColor} rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border border-gray-700`}>
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {notificationConfig.icon}
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-white">{notificationConfig.title}</p>
                        <p className="mt-1 text-sm text-gray-300">{notification.message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            className="rounded-md inline-flex text-gray-400 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                            onClick={() => onDismiss(notification.id)}
                        >
                            <span className="sr-only">{t('notifications.close')}</span>
                            <XCircleIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Notifications: React.FC<NotificationsProps> = ({ notifications, onDismiss }) => {
    return (
        <div
            aria-live="assertive"
            className="fixed inset-0 flex items-start px-4 py-6 pointer-events-none sm:p-6 z-50"
        >
            <div className="w-full flex flex-col items-end space-y-4">
                {notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} onDismiss={onDismiss} />
                ))}
            </div>
        </div>
    );
};

export default Notifications;