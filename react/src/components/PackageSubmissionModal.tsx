import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Package, Calendar, Upload, Loader2, Gift, Store } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { API_BASE_URL } from "../config/api";

interface PackageSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface UmkmStore {
    id: number;
    nama_toko: string;
    nama_pemilik: string;
    status: string;
    products?: StoreProduct[];
}

interface StoreProduct {
    id: number;
    nama_produk: string;
    harga: number;
    status?: string;
}

export function PackageSubmissionModal({
    isOpen,
    onClose,
    onSuccess,
}: PackageSubmissionModalProps) {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stores, setStores] = useState<UmkmStore[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState("");
    const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [productSearch, setProductSearch] = useState("");

    const [formData, setFormData] = useState({
        umkm_id: "",
        name: "",
        description: "",
        price: "",
        stok: "100",
        items: [""],
        tanggal_mulai: "",
        tanggal_akhir: "",
    });

    useEffect(() => {
        if (isOpen && user) {
            fetchUserStores();
        }
    }, [isOpen, user]);

    const fetchUserStores = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/umkm/my-umkm`,
                {
                    headers: {
                        "X-User-ID": user?.id || "",
                    },
                }
            );
            const data = await response.json();

            if (data.success) {
                // Only show active stores
                const activeStores = data.data.filter((s: UmkmStore) => s.status === "active");
                setStores(activeStores);

                // Auto-select if only one store
                if (activeStores.length === 1) {
                    setFormData(prev => ({ ...prev, umkm_id: activeStores[0].id.toString() }));
                    // Set products from the store
                    const products = activeStores[0].products || [];
                    setStoreProducts(products.filter((p: StoreProduct) => p.status === 'active'));
                }
            }
        } catch (error) {
            console.error("Error fetching stores:", error);
            toast.error("Gagal memuat data toko");
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Ukuran file maksimal 2MB");
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, ""],
        });
    };

    const removeItem = (index: number) => {
        const items = [...formData.items];
        items.splice(index, 1);
        setFormData({ ...formData, items });
    };

    const updateItem = (index: number, value: string) => {
        const items = [...formData.items];
        items[index] = value;
        setFormData({ ...formData, items });
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.umkm_id) {
            toast.error("Pilih toko terlebih dahulu");
            return;
        }
        if (!formData.name.trim()) {
            toast.error("Nama paket wajib diisi");
            return;
        }
        if (!formData.description.trim()) {
            toast.error("Deskripsi wajib diisi");
            return;
        }
        if (!formData.price || parseInt(formData.price) <= 0) {
            toast.error("Harga harus diisi dan lebih dari 0");
            return;
        }
        if (!formData.stok || parseInt(formData.stok) < 0) {
            toast.error("Stok harus diisi");
            return;
        }

        const validItems = formData.items.filter(item => item.trim() !== "");
        if (validItems.length === 0) {
            toast.error("Tambahkan minimal 1 item dalam paket");
            return;
        }

        setIsSubmitting(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("umkm_id", formData.umkm_id);
            formDataToSend.append("name", formData.name);
            formDataToSend.append("description", formData.description);
            formDataToSend.append("price", formData.price.toString());
            formDataToSend.append("stok", formData.stok.toString());

            validItems.forEach((item, index) => {
                formDataToSend.append(`items[${index}]`, item);
            });

            if (formData.tanggal_mulai) {
                formDataToSend.append("tanggal_mulai", formData.tanggal_mulai);
            }
            if (formData.tanggal_akhir) {
                formDataToSend.append("tanggal_akhir", formData.tanggal_akhir);
            }

            if (imageFile) {
                formDataToSend.append("image", imageFile);
            }

            const response = await fetch(`${API_BASE_URL}/gift-packages/submit`, {
                method: "POST",
                body: formDataToSend,
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Paket berhasil diajukan! Menunggu persetujuan admin.");
                onSuccess?.();
                handleClose();
            } else {
                toast.error(data.message || "Gagal mengajukan paket");
            }
        } catch (error) {
            console.error("Error submitting package:", error);
            toast.error("Gagal mengajukan paket");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            umkm_id: "",
            name: "",
            description: "",
            price: 0,
            stok: 100,
            items: [""],
            tanggal_mulai: "",
            tanggal_akhir: "",
        });
        setImageFile(null);
        setImagePreview("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Gift className="size-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Ajukan Paket Spesial
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Buat paket hadiah untuk dijual di marketplace
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X className="size-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="size-8 animate-spin text-indigo-600" />
                        </div>
                    ) : stores.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="size-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Belum Ada Toko Aktif
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Anda perlu memiliki toko yang sudah disetujui admin untuk mengajukan paket.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Store Info (Auto-selected) */}
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
                                <label className="block text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-2">
                                    🏪 Toko Saya
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                                        <Store className="size-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {stores[0]?.nama_toko}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Paket akan diajukan atas nama toko ini
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Package Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nama Paket *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: Paket Lebaran Berkah"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Deskripsi *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Deskripsi lengkap tentang paket..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Price & Stock */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Harga (Rp) *
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formData.price ? parseInt(formData.price).toLocaleString('id-ID') : ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setFormData({ ...formData, price: val });
                                        }}
                                        placeholder="Contoh: 350.000"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Stok *
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formData.stok}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setFormData({ ...formData, stok: val });
                                        }}
                                        placeholder="Contoh: 100"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Item dalam Paket *
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {storeProducts.length > 0 && (
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowProductPicker(!showProductPicker)}
                                                    className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"
                                                >
                                                    <Package className="size-4" />
                                                    Ambil dari Produk
                                                </button>
                                                {/* Product Picker Dropdown */}
                                                {showProductPicker && (
                                                    <div className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                                                        {/* Search Input */}
                                                        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                                            <input
                                                                type="text"
                                                                value={productSearch}
                                                                onChange={(e) => setProductSearch(e.target.value)}
                                                                placeholder="Cari produk..."
                                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        {/* Product List */}
                                                        <div className="max-h-40 overflow-y-auto">
                                                            {storeProducts
                                                                .filter(p => p.nama_produk.toLowerCase().includes(productSearch.toLowerCase()))
                                                                .map(product => (
                                                                    <button
                                                                        key={product.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            // Add product name to items
                                                                            const newItems = [...formData.items];
                                                                            // Replace first empty item or add new
                                                                            const emptyIndex = newItems.findIndex(i => i.trim() === '');
                                                                            if (emptyIndex >= 0) {
                                                                                newItems[emptyIndex] = product.nama_produk;
                                                                            } else {
                                                                                newItems.push(product.nama_produk);
                                                                            }
                                                                            setFormData({ ...formData, items: newItems });
                                                                            setShowProductPicker(false);
                                                                            setProductSearch("");
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                                                                    >
                                                                        <span className="text-gray-900 dark:text-white">{product.nama_produk}</span>
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                                                            Rp {Math.round(product.harga).toLocaleString('id-ID')}
                                                                        </span>
                                                                    </button>
                                                                ))}
                                                            {storeProducts.filter(p => p.nama_produk.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 p-3 text-center">Tidak ada produk ditemukan</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                        >
                                            <Plus className="size-4" />
                                            Tambah Item
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={item}
                                                onChange={(e) => updateItem(index, e.target.value)}
                                                placeholder={`Item ${index + 1}`}
                                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                            />
                                            {formData.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                >
                                                    <Trash2 className="size-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Validity Period */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    <Calendar className="size-4 inline mr-2" />
                                    Masa Berlaku (Opsional)
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            Tanggal Mulai
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.tanggal_mulai}
                                            onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            Tanggal Akhir
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.tanggal_akhir}
                                            onChange={(e) => setFormData({ ...formData, tanggal_akhir: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Kosongkan jika paket berlaku tanpa batas waktu
                                </p>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <Upload className="size-4 inline mr-2" />
                                    Gambar Paket
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                {imagePreview && (
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="mt-3 h-40 object-cover rounded-lg"
                                    />
                                )}
                            </div>

                            {/* Info Box */}
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    💡 Paket yang diajukan akan direview oleh admin sebelum ditampilkan di marketplace.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {stores.length > 0 && !isLoading && (
                    <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-4">
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin mr-2" />
                                    Mengajukan...
                                </>
                            ) : (
                                <>
                                    <Gift className="size-4 mr-2" />
                                    Ajukan Paket
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={handleClose}
                            variant="outline"
                            className="px-6"
                        >
                            Batal
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
