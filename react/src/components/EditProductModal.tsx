import { useState, useEffect, useRef } from "react";
import { X, Loader, Camera, Edit, Plus, Trash2, Eye, ImagePlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import type { ChangeEvent } from "react";
import { API_BASE_URL, BASE_HOST } from "../config/api";

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stok?: number;
    image: string;
    category: string;
    businessId: string;
    ownerId: string;
    status: string;
    imageFile?: File;
}

interface EditProductModalProps {
    product: Product | null;
    onClose: () => void;
    onSuccess?: () => void;
}

export function EditProductModal({
    product,
    onClose,
    onSuccess,
}: EditProductModalProps) {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        stok: "",
        category: "",
    });

    // Images state
    const [existingImages, setExistingImages] = useState<string[]>([]); // URLs from API
    const [deletedImages, setDeletedImages] = useState<string[]>([]); // paths to delete
    const [newImageFiles, setNewImageFiles] = useState<File[]>([]); // new files to upload
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]); // previews of new files
    const [mainImageFile, setMainImageFile] = useState<File | null>(null); // replacement for main img
    const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);

    // Variant state
    const [variantsEnabled, setVariantsEnabled] = useState(false);
    const [variantTypes, setVariantTypes] = useState<{
        name: string;
        options: { value: string; price_adjustment: string; stock: string; imageFile?: File; imagePreview?: string; existingImage?: string }[];
    }[]>([]);
    // Action popup & preview state for variant images
    const [variantActionPopup, setVariantActionPopup] = useState<{ typeIndex: number; optIndex: number } | null>(null);
    const [variantPreviewImage, setVariantPreviewImage] = useState<string | null>(null);
    const variantFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const addVariantType = () => {
        if (variantTypes.length >= 2) {
            toast.error("Maksimal 2 tipe varian per produk");
            return;
        }
        setVariantTypes([...variantTypes, { name: "", options: [{ value: "", price_adjustment: "", stock: "" }] }]);
    };

    const removeVariantType = (typeIndex: number) => {
        setVariantTypes(variantTypes.filter((_, i) => i !== typeIndex));
    };

    const updateVariantTypeName = (typeIndex: number, name: string) => {
        const updated = [...variantTypes];
        updated[typeIndex].name = name;
        setVariantTypes(updated);
    };

    const addVariantOption = (typeIndex: number) => {
        const updated = [...variantTypes];
        updated[typeIndex].options.push({ value: "", price_adjustment: "", stock: "" });
        setVariantTypes(updated);
    };

    const removeVariantOption = (typeIndex: number, optIndex: number) => {
        const updated = [...variantTypes];
        updated[typeIndex].options = updated[typeIndex].options.filter((_, i) => i !== optIndex);
        setVariantTypes(updated);
    };

    const updateVariantOption = (
        typeIndex: number,
        optIndex: number,
        field: "value" | "price_adjustment" | "stock",
        val: string
    ) => {
        const updated = [...variantTypes];
        updated[typeIndex].options[optIndex][field] = val;
        setVariantTypes(updated);
    };

    const handleVariantImageChange = (typeIndex: number, optIndex: number, e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Foto varian maks 2MB");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const updated = [...variantTypes];
            updated[typeIndex].options[optIndex].imageFile = file;
            updated[typeIndex].options[optIndex].imagePreview = reader.result as string;
            setVariantTypes(updated);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const removeVariantImage = (typeIndex: number, optIndex: number) => {
        const updated = [...variantTypes];
        updated[typeIndex].options[optIndex].imageFile = undefined;
        updated[typeIndex].options[optIndex].imagePreview = undefined;
        updated[typeIndex].options[optIndex].existingImage = undefined;
        setVariantTypes(updated);
        setVariantActionPopup(null);
    };

    // Load product data when modal opens
    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || "",
                description: product.description || "",
                price: product.price ? product.price.toLocaleString("id-ID") : "",
                stok: product.stok?.toString() || "",
                category: product.category || "",
            });
            setDeletedImages([]);
            setNewImageFiles([]);
            setNewImagePreviews([]);
            setMainImageFile(null);
            setMainImagePreview(null);
            setVariantsEnabled(false);
            setVariantTypes([]);

            // Fetch all images from API
            fetchProductImages(product.id);
        }
    }, [product]);

    const fetchProductImages = async (productId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}`);
            const data = await response.json();
            if (data.success && data.data) {
                const allImages: string[] = data.data.all_images || [];
                // Ensure full URLs
                const fullUrls = allImages.map((img: string) =>
                    img.startsWith("http") ? img : `${BASE_HOST}/${img}`
                );
                setExistingImages(fullUrls);

                // Load existing variants
                if (data.data.variant_types && data.data.variant_types.length > 0) {
                    setVariantsEnabled(true);
                    const loadedTypes = data.data.variant_types.map((vt: any) => ({
                        name: vt.name || "",
                        options: (vt.options || []).map((opt: any) => ({
                            value: opt.value || "",
                            price_adjustment: opt.price_adjustment ? Number(opt.price_adjustment).toLocaleString("id-ID") : "",
                            stock: opt.stock != null ? String(opt.stock) : "",
                            imagePreview: opt.image ? (opt.image.startsWith("http") ? opt.image : `${BASE_HOST}/${opt.image}`) : undefined,
                            existingImage: opt.image || undefined,
                        })),
                    }));
                    setVariantTypes(loadedTypes);
                } else {
                    setVariantsEnabled(false);
                    setVariantTypes([]);
                }
            }
        } catch (error) {
            console.error("Error fetching product images:", error);
        }
    };

    // All visible images: existing (minus deleted) + new previews
    const visibleExisting = existingImages.filter((img) => {
        const path = img.replace(`${BASE_HOST}/`, "");
        return !deletedImages.includes(path);
    });
    const allVisible = [
        ...visibleExisting.map((url, i) => ({ type: "existing" as const, src: url, index: i })),
        ...newImagePreviews.map((url, i) => ({ type: "new" as const, src: url, index: i })),
    ];
    // If main image was replaced, swap first entry preview
    const displayImages = allVisible.map((item, idx) => {
        if (idx === 0 && mainImagePreview) {
            return { ...item, src: mainImagePreview };
        }
        return item;
    });

    const totalCount = visibleExisting.length + newImageFiles.length;

    const handleRemoveImage = (item: { type: "existing" | "new"; index: number }) => {
        if (item.type === "existing") {
            const url = visibleExisting[item.index];
            const path = url.replace(`${BASE_HOST}/`, "");
            setDeletedImages((prev) => [...prev, path]);
        } else {
            setNewImageFiles((prev) => prev.filter((_, i) => i !== item.index));
            setNewImagePreviews((prev) => prev.filter((_, i) => i !== item.index));
        }
    };

    const handleAddImages = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const remaining = 5 - totalCount;
        if (remaining <= 0) {
            toast.error("Maksimal 5 foto per produk");
            return;
        }

        const validFiles: File[] = [];
        Array.from(files)
            .slice(0, remaining)
            .forEach((file: File) => {
                if (file.size > 2 * 1024 * 1024) {
                    toast.error(`File ${file.name} terlalu besar (maks 2MB)`);
                    return;
                }
                validFiles.push(file);
            });

        if (validFiles.length === 0) return;

        let loaded = 0;
        const previews: string[] = [];
        validFiles.forEach((file: File) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                previews.push(reader.result as string);
                loaded++;
                if (loaded === validFiles.length) {
                    setNewImageFiles((prev) => [...prev, ...validFiles]);
                    setNewImagePreviews((prev) => [...prev, ...previews]);
                }
            };
            reader.readAsDataURL(file);
        });

        e.target.value = "";
    };

    const formatPriceInput = (value: string): string => {
        const digits = value.replace(/\D/g, "");
        if (!digits) return "";
        return parseInt(digits, 10).toLocaleString("id-ID");
    };

    const parsePriceForSubmit = (formattedValue: string): string => {
        return formattedValue.replace(/\D/g, "");
    };

    const handleSubmit = async () => {
        if (!product || !user) return;

        setIsLoading(true);
        try {
            const isRejected = product.status === "rejected" || product.status === "inactive";

            const fd = new FormData();
            fd.append("nama_produk", formData.name);
            fd.append("deskripsi", formData.description);
            fd.append("harga", parsePriceForSubmit(formData.price));
            fd.append("stok", formData.stok || "0");
            fd.append("kategori", formData.category);

            // Main image replacement
            if (mainImageFile) {
                fd.append("gambar", mainImageFile);
            }

            // New extra images
            for (const file of newImageFiles) {
                fd.append("gambar_tambahan[]", file);
            }

            // Images to delete
            for (const path of deletedImages) {
                fd.append("hapus_gambar[]", path);
            }

            // Append variants JSON + images
            if (variantsEnabled && variantTypes.length > 0) {
                const variantsData = variantTypes
                    .filter(vt => vt.name.trim())
                    .map(vt => ({
                        name: vt.name.trim(),
                        options: vt.options
                            .filter(o => o.value.trim())
                            .map(o => ({
                                value: o.value.trim(),
                                price_adjustment: parseFloat(o.price_adjustment.replace(/\D/g, '') || '0'),
                                stock: o.stock ? parseInt(o.stock, 10) : null,
                                existing_image: o.existingImage || null,
                            })),
                    }));
                fd.append("variants", JSON.stringify(variantsData));
                // Append variant option images
                let imgIdx = 0;
                variantTypes.forEach(vt => {
                    if (!vt.name.trim()) return;
                    vt.options.forEach(opt => {
                        if (!opt.value.trim()) return;
                        if (opt.imageFile) {
                            fd.append(`variant_images[${imgIdx}]`, opt.imageFile);
                        }
                        imgIdx++;
                    });
                });
            } else {
                // If variants disabled, send empty array to clear existing variants
                fd.append("variants", JSON.stringify([]));
            }

            const endpoint = isRejected
                ? `${API_BASE_URL}/products/${product.id}/resubmit`
                : `${API_BASE_URL}/products/${product.id}`;

            if (!isRejected) {
                fd.append("_method", "PUT");
            }

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "X-User-ID": user.id.toString(),
                },
                body: fd,
            });

            const data = await response.json();

            if (data.success) {
                toast.success(
                    isRejected
                        ? "Produk berhasil dikirim ulang untuk ditinjau admin"
                        : "Produk berhasil diperbarui"
                );
                onClose();
                if (onSuccess) onSuccess();
            } else {
                toast.error(data.message || "Gagal memperbarui produk");
            }
        } catch (error) {
            console.error("Error updating product:", error);
            toast.error("Gagal memperbarui produk");
        } finally {
            setIsLoading(false);
        }
    };

    if (!product) return null;

    const isRejected = product.status === "rejected" || product.status === "inactive";

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center text-white text-sm">
                                <Edit className="size-4" />
                            </span>
                            {isRejected ? "Kirim Ulang Produk" : "Edit Produk"}
                        </h2>
                        {isRejected && (
                            <p className="text-xs text-orange-600 mt-1">
                                Produk akan dikirim ulang ke admin untuk ditinjau
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="size-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6">
                    {/* ═══════════════════════════════════════ */}
                    {/* PHOTO SECTION */}
                    {/* ═══════════════════════════════════════ */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-slate-700">
                                Foto Produk <span className="text-red-500">*</span>
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded font-medium">
                                    Foto 1:1
                                </span>
                                <span>{totalCount}/5</span>
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {/* Display all visible images */}
                            {displayImages.map((item, idx) => (
                                <div
                                    key={`${item.type}-${item.index}`}
                                    className="relative aspect-square rounded-xl overflow-hidden group border-2 border-slate-100"
                                >
                                    <img
                                        src={item.src}
                                        alt={`Photo ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Main photo overlay */}
                                    {idx === 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-5">
                                            <span className="text-white text-[11px] font-semibold flex items-center gap-1">
                                                ⭐ Foto Produk Utama
                                            </span>
                                        </div>
                                    )}
                                    {/* Delete button */}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(item)}
                                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                </div>
                            ))}

                            {/* Add Photo Slot */}
                            {totalCount < 5 && (
                                <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 hover:border-orange-400 hover:bg-orange-50/50 transition-all">
                                    <Camera className="size-7 text-slate-400" />
                                    <span className="text-[11px] text-slate-400 font-medium">
                                        + Tambah Foto
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleAddImages}
                                        className="hidden"
                                    />
                                </label>
                            )}

                            {/* Empty state */}
                            {totalCount === 0 && (
                                <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 hover:border-orange-400 hover:bg-orange-50/50 transition-all col-span-3">
                                    <Camera className="size-10 text-slate-300" />
                                    <span className="text-sm text-slate-400 font-medium">
                                        Belum ada foto, klik untuk upload
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleAddImages}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 mb-5" />

                    {/* ═══════════════════════════════════════ */}
                    {/* PRODUCT NAME */}
                    {/* ═══════════════════════════════════════ */}
                    <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-slate-700">
                                Nama Produk <span className="text-red-500">*</span>
                            </label>
                            <span className="text-xs text-slate-400">
                                {formData.name.length}/100
                            </span>
                        </div>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            maxLength={100}
                            className="w-full px-4 py-2.5 border-[1.5px] border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-0 focus:border-orange-400 outline-none transition-colors placeholder:text-slate-400"
                            placeholder="Masukkan Nama Produk"
                        />
                    </div>

                    {/* ═══════════════════════════════════════ */}
                    {/* DESCRIPTION */}
                    {/* ═══════════════════════════════════════ */}
                    <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-slate-700">
                                Deskripsi Produk <span className="text-red-500">*</span>
                            </label>
                            <span className="text-xs text-slate-400">
                                {formData.description.length}/3000
                            </span>
                        </div>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            maxLength={3000}
                            rows={4}
                            className="w-full px-4 py-2.5 border-[1.5px] border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-0 focus:border-orange-400 outline-none transition-colors resize-none placeholder:text-slate-400"
                            placeholder="Masukkan Deskripsi Produk"
                        />
                    </div>

                    <div className="h-px bg-slate-100 mb-5" />

                    {/* ═══════════════════════════════════════ */}
                    {/* CATEGORY */}
                    {/* ═══════════════════════════════════════ */}
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Kategori <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.category}
                            onChange={(e) =>
                                setFormData({ ...formData, category: e.target.value })
                            }
                            className="w-full px-4 py-2.5 border-[1.5px] border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-0 focus:border-orange-400 outline-none transition-colors placeholder:text-slate-400"
                            placeholder="Kategori produk"
                        />
                    </div>

                    {/* ═══════════════════════════════════════ */}
                    {/* PRICE with Rp prefix */}
                    {/* ═══════════════════════════════════════ */}
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Harga <span className="text-red-500">*</span>
                        </label>
                        <div className="flex border-[1.5px] border-slate-200 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors">
                            <span className="bg-slate-50 border-r border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 flex items-center">
                                Rp
                            </span>
                            <input
                                type="text"
                                value={formData.price}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        price: formatPriceInput(e.target.value),
                                    })
                                }
                                className="flex-1 px-4 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                                placeholder="50.000"
                            />
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════ */}
                    {/* STOCK */}
                    {/* ═══════════════════════════════════════ */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Stok
                        </label>
                        <input
                            type="number"
                            value={formData.stok}
                            onChange={(e) =>
                                setFormData({ ...formData, stok: e.target.value })
                            }
                            min="0"
                            className="w-full px-4 py-2.5 border-[1.5px] border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-0 focus:border-orange-400 outline-none transition-colors placeholder:text-slate-400"
                            placeholder="Masukkan jumlah stok"
                        />
                    </div>

                    {/* ═══════════════════════════════════════ */}
                    {/* VARIANT SECTION */}
                    {/* ═══════════════════════════════════════ */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-slate-700">Varian Produk</label>
                            <button
                                type="button"
                                onClick={() => {
                                    setVariantsEnabled(!variantsEnabled);
                                    if (!variantsEnabled && variantTypes.length === 0) {
                                        addVariantType();
                                    }
                                }}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${variantsEnabled ? 'bg-orange-500' : 'bg-slate-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${variantsEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {variantsEnabled && (
                            <div className="space-y-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <p className="text-xs text-slate-500">
                                    Tambahkan varian seperti Warna, Ukuran, atau Jenis. Maksimal 2 tipe varian.
                                </p>

                                {variantTypes.map((vt, typeIndex) => (
                                    <div key={typeIndex} className="bg-white rounded-lg p-4 border border-slate-200 space-y-3">
                                        {/* Variant Type Header */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded">
                                                Varian {typeIndex + 1}
                                            </span>
                                            <input
                                                type="text"
                                                value={vt.name}
                                                onChange={(e) => updateVariantTypeName(typeIndex, e.target.value)}
                                                placeholder="Nama varian (cth: Warna, Ukuran)"
                                                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-orange-400 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeVariantType(typeIndex)}
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>

                                        {/* Options */}
                                        <div className="space-y-2">
                                            {vt.options.map((opt, optIndex) => (
                                                <div key={optIndex} className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        {/* Photo button only for 1st variant type */}
                                                        {typeIndex === 0 && (
                                                            <div className="relative">
                                                                {opt.imagePreview ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setVariantActionPopup({ typeIndex, optIndex })}
                                                                        className="flex-shrink-0 w-9 h-9 rounded-lg border border-slate-200 overflow-hidden hover:ring-2 hover:ring-orange-300 transition-all"
                                                                    >
                                                                        <img src={opt.imagePreview} alt="" className="w-full h-full object-cover" />
                                                                    </button>
                                                                ) : (
                                                                    <label className="flex-shrink-0 w-9 h-9 rounded-lg border border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                                                                        <Camera className="size-4 text-slate-400" />
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            ref={el => { variantFileInputRefs.current[`${typeIndex}-${optIndex}`] = el; }}
                                                                            onChange={(e) => handleVariantImageChange(typeIndex, optIndex, e)}
                                                                            className="hidden"
                                                                        />
                                                                    </label>
                                                                )}

                                                                {/* Action Popup */}
                                                                {variantActionPopup?.typeIndex === typeIndex && variantActionPopup?.optIndex === optIndex && (
                                                                    <>
                                                                        <div className="fixed inset-0 z-40" onClick={() => setVariantActionPopup(null)} />
                                                                        <div className="absolute left-0 top-10 z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-1 w-36">
                                                                            <div className="px-3 py-1.5 border-b border-slate-100">
                                                                                <span className="text-xs font-semibold text-slate-700">Aksi</span>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setVariantPreviewImage(opt.imagePreview || null);
                                                                                    setVariantActionPopup(null);
                                                                                }}
                                                                                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                                            >
                                                                                <Eye className="size-4" /> Lihat
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setVariantActionPopup(null);
                                                                                    variantFileInputRefs.current[`${typeIndex}-${optIndex}`]?.click();
                                                                                }}
                                                                                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                                            >
                                                                                <ImagePlus className="size-4" /> Ganti
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeVariantImage(typeIndex, optIndex)}
                                                                                className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                                                                            >
                                                                                <Trash2 className="size-4" /> Hapus
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                )}

                                                                {/* Hidden file input for "Ganti" action */}
                                                                {opt.imagePreview && (
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        ref={el => { variantFileInputRefs.current[`${typeIndex}-${optIndex}`] = el; }}
                                                                        onChange={(e) => handleVariantImageChange(typeIndex, optIndex, e)}
                                                                        className="hidden"
                                                                    />
                                                                )}
                                                            </div>
                                                        )}
                                                        <input
                                                            type="text"
                                                            value={opt.value}
                                                            onChange={(e) => updateVariantOption(typeIndex, optIndex, 'value', e.target.value)}
                                                            placeholder="Opsi (cth: Merah)"
                                                            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-orange-400 outline-none"
                                                        />
                                                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                                                            <span className="bg-slate-50 px-2 py-1.5 text-xs text-slate-500 border-r border-slate-200">+Rp</span>
                                                            <input
                                                                type="text"
                                                                value={opt.price_adjustment}
                                                                onChange={(e) => updateVariantOption(typeIndex, optIndex, 'price_adjustment', formatPriceInput(e.target.value))}
                                                                placeholder="0"
                                                                className="w-20 px-2 py-1.5 text-sm outline-none"
                                                            />
                                                        </div>
                                                        <input
                                                            type="number"
                                                            value={opt.stock}
                                                            onChange={(e) => updateVariantOption(typeIndex, optIndex, 'stock', e.target.value)}
                                                            placeholder="Stok"
                                                            min="0"
                                                            className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-orange-400 outline-none"
                                                        />
                                                        {vt.options.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeVariantOption(typeIndex, optIndex)}
                                                                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <X className="size-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add Option Button */}
                                        <button
                                            type="button"
                                            onClick={() => addVariantOption(typeIndex)}
                                            className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
                                        >
                                            <Plus className="size-3" /> Tambah Opsi
                                        </button>
                                    </div>
                                ))}

                                {/* Add Variant Type Button */}
                                {variantTypes.length < 2 && (
                                    <button
                                        type="button"
                                        onClick={addVariantType}
                                        className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:text-orange-600 hover:border-orange-400 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Plus className="size-4" /> Tambah Tipe Varian
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ═══════════════════════════════════════ */}
                    {/* BUTTONS */}
                    {/* ═══════════════════════════════════════ */}
                    <div className="flex gap-3 justify-end pt-5 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 border-[1.5px] border-slate-300 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className={`px-6 py-2.5 text-white rounded-xl font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isRejected
                                ? "bg-orange-600 hover:bg-orange-700"
                                : "bg-orange-500 hover:bg-orange-600"
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader className="size-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : isRejected ? (
                                "Kirim Ulang ke Admin"
                            ) : (
                                "Simpan Perubahan"
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Variant Image Preview Modal */}
            {variantPreviewImage && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setVariantPreviewImage(null)}>
                    <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => setVariantPreviewImage(null)}
                            className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 shadow-lg hover:bg-slate-100 transition-colors z-10"
                        >
                            <X className="size-5 text-slate-700" />
                        </button>
                        <img
                            src={variantPreviewImage}
                            alt="Preview Varian"
                            className="w-full rounded-xl shadow-2xl object-contain max-h-[70vh]"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
