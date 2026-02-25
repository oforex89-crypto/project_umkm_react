import { useState, useEffect } from 'react';
import { Settings, Upload, Save, Store } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL, BASE_HOST } from '../config/api';

interface SiteSettingsData {
    siteName: string;
    siteLogo: string;
}

export function SiteSettings() {
    const [siteSettings, setSiteSettings] = useState<SiteSettingsData>({
        siteName: 'Pasar UMKM',
        siteLogo: '',
    });
    const [siteSettingsForm, setSiteSettingsForm] = useState({
        siteName: '',
        logoFile: null as File | null,
        logoPreview: '',
        removeLogo: false,
    });
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch site settings from API
        fetch(`${API_BASE_URL}/site-settings`)
            .then((res) => res.json())
            .then((data) => {
                console.log('Site Settings API Response:', data);
                if (data.success && data.data) {
                    setSiteSettings({
                        siteName: data.data.site_name || 'Pasar UMKM',
                        siteLogo: data.data.site_logo || '',
                    });
                    setSiteSettingsForm({
                        siteName: data.data.site_name || 'Pasar UMKM',
                        logoFile: null,
                        logoPreview: data.data.site_logo ? `${BASE_HOST}/${data.data.site_logo}` : '',
                        removeLogo: false,
                    });
                }
            })
            .catch((error) => {
                console.error('Error fetching site settings:', error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    const handleSave = async () => {
        setIsSavingSettings(true);
        try {
            const formData = new FormData();
            formData.append('site_name', siteSettingsForm.siteName);
            if (siteSettingsForm.logoFile) {
                formData.append('site_logo', siteSettingsForm.logoFile);
            }
            if (siteSettingsForm.removeLogo) {
                formData.append('remove_logo', '1');
            }

            const response = await fetch(`${API_BASE_URL}/site-settings`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Pengaturan situs berhasil disimpan!');
                setSiteSettings({
                    siteName: data.data.site_name || siteSettingsForm.siteName,
                    siteLogo: data.data.site_logo || '',
                });
            } else {
                throw new Error(data.message || 'Gagal menyimpan');
            }
        } catch (error) {
            console.error('Error saving site settings:', error);
            toast.error('Gagal menyimpan pengaturan situs');
        } finally {
            setIsSavingSettings(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="size-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Settings className="size-5 text-indigo-600" />
                Pengaturan Situs
            </h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">
                Ubah nama dan logo marketplace Anda di sini. Perubahan akan diterapkan di seluruh situs.
            </p>

            <div className="space-y-6 max-w-xl">
                {/* Site Name Input */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                        Nama Marketplace
                    </label>
                    <input
                        type="text"
                        value={siteSettingsForm.siteName}
                        onChange={(e) => setSiteSettingsForm(prev => ({ ...prev, siteName: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Contoh: Pasar UMKM"
                    />
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                        Nama ini akan muncul di navbar dan seluruh halaman
                    </p>
                </div>

                {/* Logo Upload */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                        Logo Marketplace
                    </label>
                    <div className="flex items-start gap-4">
                        {/* Logo Preview */}
                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-gray-600 flex items-center justify-center bg-slate-50 dark:bg-gray-700 overflow-hidden">
                            {siteSettingsForm.logoPreview && !siteSettingsForm.removeLogo ? (
                                <img
                                    src={siteSettingsForm.logoPreview}
                                    alt="Logo Preview"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-3 rounded-xl shadow-lg">
                                    <Store className="size-8 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Upload Button and Info */}
                        <div className="flex-1">
                            <input
                                type="file"
                                id="site-logo-upload"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        if (file.size > 2 * 1024 * 1024) {
                                            toast.error("Ukuran file maksimal 2MB");
                                            return;
                                        }
                                        setSiteSettingsForm(prev => ({
                                            ...prev,
                                            logoFile: file,
                                            logoPreview: URL.createObjectURL(file),
                                        }));
                                    }
                                }}
                                className="hidden"
                            />
                            <label
                                htmlFor="site-logo-upload"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors"
                            >
                                <Upload className="size-4" />
                                {siteSettingsForm.logoPreview ? "Ganti Logo" : "Upload Logo"}
                            </label>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
                                Format: PNG, JPG, SVG. Ukuran maksimal 2MB
                            </p>
                            {(siteSettingsForm.logoPreview || siteSettings.siteLogo) && !siteSettingsForm.removeLogo && (
                                <button
                                    type="button"
                                    onClick={() => setSiteSettingsForm(prev => ({ ...prev, logoFile: null, logoPreview: '', removeLogo: true }))}
                                    className="text-xs text-red-600 hover:underline mt-1"
                                >
                                    Hapus Logo (Gunakan Icon Default)
                                </button>
                            )}
                            {siteSettingsForm.removeLogo && (
                                <p className="text-xs text-amber-600 mt-1">⚠️ Logo akan dihapus saat disimpan</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-slate-200 dark:border-gray-700">
                    <button
                        onClick={handleSave}
                        disabled={isSavingSettings}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSavingSettings ? (
                            <>
                                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save className="size-4" />
                                Simpan Perubahan
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
