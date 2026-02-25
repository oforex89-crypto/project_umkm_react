import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Store,
    User,
    Phone,
    Mail,
    Instagram,
    MapPin,
    Edit,
    Save,
    X,
    Camera,
    Package,
    MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { getImageUrl, getPlaceholderDataUrl } from "../utils/imageHelpers";
import { API_BASE_URL, BASE_HOST } from "../config/api";

interface UmkmDetail {
    id: number;
    user_id: number;
    nama_toko: string;
    nama_pemilik: string;
    deskripsi: string;
    foto_toko: string;
    kategori_id: number;
    whatsapp: string;
    telepon: string;
    email: string;
    instagram: string;
    about_me: string;
    alamat: string;
    kota: string;
    kode_pos: string;
    status: string;
    created_at: string;
    updated_at: string;
    user?: { name: string; email: string };
    category?: { id: number; nama_kategori: string };
    products?: Array<{
        id: number;
        nama_produk: string;
        deskripsi: string;
        harga: number;
        gambar: string;
        status: string;
    }>;
}

interface Category {
    id: number;
    nama_kategori: string;
}

// Helper to convert WhatsApp number: 62xxx → 0xxx for display
const formatWhatsAppForDisplay = (wa: string): string => {
    if (!wa) return "";
    if (wa.startsWith("62")) {
        return "0" + wa.substring(2);
    }
    return wa;
};

// Helper to convert WhatsApp number: 0xxx → 62xxx for saving
const formatWhatsAppForSave = (wa: string): string => {
    if (!wa) return "";
    if (wa.startsWith("0")) {
        return "62" + wa.substring(1);
    }
    return wa;
};

export function AdminUmkmDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useAuth();
    const [umkm, setUmkm] = useState<UmkmDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Edit form state
    const [editForm, setEditForm] = useState({
        nama_toko: "",
        nama_pemilik: "",
        deskripsi: "",
        whatsapp: "",
        email: "",
        instagram: "",
        about_me: "",
        alamat: "",
        kota: "",
        kode_pos: "",
        status: "",
        kategori_id: 0,
    });
    const [newImage, setNewImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");

    // Check if user is admin - wait for auth loading to complete
    useEffect(() => {
        if (!authLoading && user?.role !== "admin") {
            toast.error("Akses ditolak. Hanya admin yang dapat mengakses halaman ini.");
            navigate("/");
        }
    }, [user, authLoading, navigate]);

    // Fetch UMKM detail
    useEffect(() => {
        if (id) {
            fetchUmkmDetail();
            fetchCategories();
        }
    }, [id]);

    const fetchUmkmDetail = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/umkm/${id}`);
            const data = await response.json();

            if (data.success && data.data) {
                setUmkm(data.data);
                setEditForm({
                    nama_toko: data.data.nama_toko || "",
                    nama_pemilik: data.data.nama_pemilik || "",
                    deskripsi: data.data.deskripsi || "",
                    whatsapp: formatWhatsAppForDisplay(data.data.whatsapp || ""),
                    email: data.data.email || "",
                    instagram: data.data.instagram || "",
                    about_me: data.data.about_me || "",
                    alamat: data.data.alamat || "",
                    kota: data.data.kota || "",
                    kode_pos: data.data.kode_pos || "",
                    status: data.data.status || "",
                    kategori_id: data.data.kategori_id || 0,
                });
            } else {
                toast.error("UMKM tidak ditemukan");
                navigate("/");
            }
        } catch (error) {
            console.error("Error fetching UMKM:", error);
            toast.error("Gagal memuat data UMKM");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`);
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!umkm) return;

        setIsSaving(true);
        try {
            const formData = new FormData();

            // Append all form fields with WhatsApp conversion
            Object.entries(editForm).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    // Convert WhatsApp 0xxx back to 62xxx for saving
                    if (key === "whatsapp") {
                        formData.append(key, formatWhatsAppForSave(String(value)));
                    } else {
                        formData.append(key, String(value));
                    }
                }
            });

            // Append new image if selected
            if (newImage) {
                formData.append("foto_toko", newImage);
            }

            const response = await fetch(`${API_BASE_URL}/umkm/${id}/admin-update`, {
                method: "POST",
                headers: {
                    "X-Admin-ID": user?.id || "",
                },
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Data UMKM berhasil diperbarui");
                setIsEditing(false);
                setNewImage(null);
                setImagePreview("");
                fetchUmkmDetail();
            } else {
                throw new Error(data.message || "Gagal menyimpan perubahan");
            }
        } catch (error) {
            console.error("Error saving UMKM:", error);
            toast.error(error instanceof Error ? error.message : "Gagal menyimpan perubahan");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setNewImage(null);
        setImagePreview("");
        if (umkm) {
            setEditForm({
                nama_toko: umkm.nama_toko || "",
                nama_pemilik: umkm.nama_pemilik || "",
                deskripsi: umkm.deskripsi || "",
                whatsapp: umkm.whatsapp || "",
                telepon: umkm.telepon || "",
                email: umkm.email || "",
                instagram: umkm.instagram || "",
                about_me: umkm.about_me || "",
                alamat: umkm.alamat || "",
                kota: umkm.kota || "",
                kode_pos: umkm.kode_pos || "",
                status: umkm.status || "",
                kategori_id: umkm.kategori_id || 0,
            });
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            case "pending":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
            case "rejected":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Memuat data UMKM...</p>
                </div>
            </div>
        );
    }

    if (!umkm) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">UMKM tidak ditemukan</p>
                    <button
                        onClick={() => navigate("/")}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Kembali
                    </button>
                </div>
            </div>
        );
    }

    const imageUrl = imagePreview || getImageUrl(umkm.foto_toko, BASE_HOST, getPlaceholderDataUrl("No Image"));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sticky Header */}
            <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="size-5" />
                            Kembali ke Admin Panel
                        </button>

                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-lg"
                            >
                                <Edit className="size-5" />
                                Edit UMKM
                            </button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                                >
                                    <X className="size-5" />
                                    Batal
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold shadow-lg"
                                >
                                    <Save className="size-5" />
                                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Image & Basic Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Store Image */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                            <div className="relative aspect-square">
                                <img
                                    src={imageUrl}
                                    alt={umkm.nama_toko}
                                    className="w-full h-full object-cover"
                                />
                                {isEditing && (
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer hover:bg-black/60 transition-colors">
                                        <div className="text-center text-white">
                                            <Camera className="size-10 mx-auto mb-2" />
                                            <span>Ganti Foto</span>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                            <div className="p-4">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(umkm.status)}`}>
                                    {umkm.status === "active" ? "Aktif" : umkm.status === "pending" ? "Menunggu" : umkm.status}
                                </span>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Statistik</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Total Produk</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{umkm.products?.length || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">ID UMKM</span>
                                    <span className="font-medium text-gray-900 dark:text-white">#{umkm.id}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Store className="size-5 text-indigo-600" />
                                Informasi Toko
                            </h3>

                            {isEditing ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Toko</label>
                                        <input
                                            type="text"
                                            value={editForm.nama_toko}
                                            onChange={(e) => setEditForm({ ...editForm, nama_toko: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Pemilik</label>
                                        <input
                                            type="text"
                                            value={editForm.nama_pemilik}
                                            onChange={(e) => setEditForm({ ...editForm, nama_pemilik: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
                                        <textarea
                                            value={editForm.deskripsi}
                                            onChange={(e) => setEditForm({ ...editForm, deskripsi: e.target.value })}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
                                        <select
                                            value={editForm.kategori_id}
                                            onChange={(e) => setEditForm({ ...editForm, kategori_id: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value={0}>Pilih Kategori</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.nama_kategori}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                        <select
                                            value={editForm.status}
                                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="pending">Menunggu</option>
                                            <option value="active">Aktif</option>
                                            <option value="rejected">Ditolak</option>
                                            <option value="inactive">Tidak Aktif</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Nama Toko</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{umkm.nama_toko}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Nama Pemilik</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{umkm.nama_pemilik}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Deskripsi</p>
                                        <p className="text-gray-900 dark:text-white">{umkm.deskripsi || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Kategori</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{umkm.category?.nama_kategori || "-"}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Contact Information */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Phone className="size-5 text-green-600" />
                                Informasi Kontak
                            </h3>

                            {isEditing ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp</label>
                                        <input
                                            type="text"
                                            value={editForm.whatsapp}
                                            onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                                            placeholder="628xxxxxxxxxx"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instagram</label>
                                        <input
                                            type="text"
                                            value={editForm.instagram}
                                            onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                                            placeholder="@username"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <MessageCircle className="size-5 text-green-500" />
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">WhatsApp</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{umkm.whatsapp || "-"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Mail className="size-5 text-red-500" />
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{umkm.email || "-"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Instagram className="size-5 text-pink-500" />
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Instagram</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{umkm.instagram || "-"}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Address Information */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <MapPin className="size-5 text-red-600" />
                                Alamat
                            </h3>

                            {isEditing ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-3">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alamat Lengkap</label>
                                        <textarea
                                            value={editForm.alamat}
                                            onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kota</label>
                                        <input
                                            type="text"
                                            value={editForm.kota}
                                            onChange={(e) => setEditForm({ ...editForm, kota: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kode Pos</label>
                                        <input
                                            type="text"
                                            value={editForm.kode_pos}
                                            onChange={(e) => setEditForm({ ...editForm, kode_pos: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-gray-900 dark:text-white">{umkm.alamat || "-"}</p>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {umkm.kota && umkm.kode_pos ? `${umkm.kota}, ${umkm.kode_pos}` : umkm.kota || umkm.kode_pos || ""}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* About Me */}
                        {(umkm.about_me || isEditing) && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <User className="size-5 text-purple-600" />
                                    Tentang Pemilik
                                </h3>

                                {isEditing ? (
                                    <textarea
                                        value={editForm.about_me}
                                        onChange={(e) => setEditForm({ ...editForm, about_me: e.target.value })}
                                        rows={4}
                                        placeholder="Ceritakan tentang pemilik UMKM..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                    />
                                ) : (
                                    <p className="text-gray-900 dark:text-white whitespace-pre-line">{umkm.about_me}</p>
                                )}
                            </div>
                        )}

                        {/* Products List */}
                        {umkm.products && umkm.products.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Package className="size-5 text-orange-600" />
                                    Produk ({umkm.products.length})
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {umkm.products.map((product) => (
                                        <div
                                            key={product.id}
                                            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                        >
                                            <div className="aspect-square bg-gray-100 dark:bg-gray-700">
                                                <img
                                                    src={getImageUrl(product.gambar, BASE_HOST, getPlaceholderDataUrl("No Image"))}
                                                    alt={product.nama_produk}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="p-3">
                                                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                                    {product.nama_produk}
                                                </p>
                                                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">
                                                    {formatPrice(product.harga)}
                                                </p>
                                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${getStatusBadgeClass(product.status)}`}>
                                                    {product.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
