import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../config/api';

interface SiteSettings {
    siteName: string;
    siteLogo: string;
}

interface SiteSettingsContextType {
    settings: SiteSettings;
    updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
    isLoading: boolean;
    refresh: () => void;
}

const defaultSettings: SiteSettings = {
    siteName: 'Pasar UMKM',
    siteLogo: '',
};

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/site-settings`);
            const data = await response.json();
            if (data.success && data.data) {
                setSettings({
                    siteName: data.data.site_name || defaultSettings.siteName,
                    siteLogo: data.data.site_logo || defaultSettings.siteLogo,
                });
            }
        } catch (error) {
            console.error('Failed to fetch site settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateSettings = async (newSettings: Partial<SiteSettings>) => {
        try {
            const formData = new FormData();
            if (newSettings.siteName) {
                formData.append('site_name', newSettings.siteName);
            }
            // For logo, it will be handled separately via file upload

            const response = await fetch(`${API_BASE_URL}/site-settings`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                setSettings(prev => ({
                    ...prev,
                    ...newSettings,
                }));
            }
        } catch (error) {
            console.error('Failed to update site settings:', error);
            throw error;
        }
    };

    const refresh = () => {
        fetchSettings();
    };

    return (
        <SiteSettingsContext.Provider value={{ settings, updateSettings, isLoading, refresh }}>
            {children}
        </SiteSettingsContext.Provider>
    );
}

export function useSiteSettings() {
    const context = useContext(SiteSettingsContext);
    if (context === undefined) {
        throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
    }
    return context;
}
