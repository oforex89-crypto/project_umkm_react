import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Clock, Store, ArrowLeft, MessageCircle, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, Upload, X, Image, Copy, CreditCard, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { orderService } from "../services/orderService";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

import { API_BASE_URL } from "../config/api";
const BASE_URL = API_BASE_URL;

// Helper to get full image URL
const getImageUrl = (imagePath: string | undefined): string => {
    if (!imagePath) return "";
    // If already a full URL, return as-is
    if (imagePath.startsWith('http')) return imagePath;
    // If it's a relative path, prepend base URL
    const cleanPath = imagePath.replace(/^\/+/, '');
    return `${BASE_URL}/${cleanPath}`;
};

interface OrderItem {
    id: string;
    product_id: string;
    jumlah: number;
    harga_satuan: number;
    subtotal: number;
    product?: {
        id: string;
        nama_produk: string;
        image_url?: string;
        gambar?: string;
    };
}

interface Order {
    id: string;
    order_number?: string;
    user_id: string;
    business_id: string;
    no_whatsapp_pembeli: string;
    catatan?: string;
    catatan_pembayaran?: string;
    lokasi_pengambilan?: string;
    total_harga: number;
    status: string;
    status_umkm?: string;
    paid_at?: string;
    completed_at?: string;
    payment_method?: string;
    created_at: string;
    updated_at: string;
    items: OrderItem[];
    business?: {
        id: number;
        nama_toko?: string;
        whatsapp?: string;
    };
}



export function OrderHistoryPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [paymentNotes, setPaymentNotes] = useState<Record<string, string>>({});
    const [paymentProofs, setPaymentProofs] = useState<Record<string, File | null>>({});
    const [paymentProofPreviews, setPaymentProofPreviews] = useState<Record<string, string>>({});
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const [filter, setFilter] = useState<"all" | "pending" | "paid" | "processing" | "completed" | "cancelled">("all");
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            loadOrders();
            // Auto-refresh every 30 seconds to get latest status from UMKM
            const interval = setInterval(() => {
                loadOrders();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await orderService.getUserOrders();
            setOrders(data as unknown as Order[]);
            // Default all orders to expanded
            setExpandedOrders(new Set((data as unknown as Order[]).map(o => o.id)));
        } catch (error) {
            console.error("Failed to load orders:", error);
            toast.error("Gagal memuat riwayat pesanan");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(dateString));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
            case "paid":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
            case "processing":
                return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400";
            case "shipped":
                return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"; // Same as processing
            case "completed":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            case "cancelled":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "pending":
                return "Menunggu Pembayaran";
            case "paid":
                return "Sudah Dibayar";
            case "processing":
                return "Sedang Diproses";
            case "shipped":
                return "Sedang Diproses"; // Combined with processing for customer view
            case "completed":
                return "Selesai";
            case "cancelled":
                return "Dibatalkan";
            default:
                return status;
        }
    };

    const toggleExpand = (orderId: string) => {
        setExpandedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    const handleUpdateStatus = async (orderId: string, newStatus: 'paid' | 'completed' | 'cancelled') => {
        setUpdatingStatus(orderId);
        try {
            const note = paymentNotes[orderId];
            const proofFile = paymentProofs[orderId];
            await orderService.updateStatusByCustomer(orderId, newStatus, note, proofFile || undefined);
            toast.success(`Status berhasil diubah ke "${getStatusText(newStatus)}"`);
            // Clear the proof and payment method after successful update
            setPaymentProofs(prev => ({ ...prev, [orderId]: null }));
            setPaymentProofPreviews(prev => {
                const newPreviews = { ...prev };
                delete newPreviews[orderId];
                return newPreviews;
            });
            await loadOrders();
        } catch (error: unknown) {
            console.error("Failed to update status:", error);
            const message = error instanceof Error ? error.message : "Gagal mengubah status";
            toast.error(message);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleResendWhatsApp = async (order: Order) => {
        try {
            const data = await orderService.getWhatsAppLink(order.id);
            window.open(data.whatsapp_link, "_blank");
        } catch {
            // Fallback: generate link manually
            const businessPhone = order.business?.whatsapp || "";
            if (businessPhone) {
                const cleanPhone = businessPhone.replace(/\D/g, "").replace(/^0/, "62");
                const waLink = `https://wa.me/${cleanPhone}`;
                window.open(waLink, "_blank");
            } else {
                toast.error("Nomor WhatsApp UMKM tidak tersedia");
            }
        }
    };

    const getBusinessName = (order: Order) => {
        return order.business?.nama_toko || "UMKM";
    };

    const copyOrderNumber = (orderNumber: string) => {
        navigator.clipboard.writeText(orderNumber);
        toast.success("Nomor pesanan disalin!");
    };

    const filteredOrders = orders.filter((order) => {
        if (filter === "all") return true;
        // For customer view, "Diproses" includes both processing AND shipped
        if (filter === "processing") {
            return order.status === "processing" || order.status === "shipped";
        }
        return order.status === filter;
    });

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20">
                <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Silakan Login
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Anda perlu login untuk melihat riwayat pesanan
                    </p>
                    <Button onClick={() => navigate("/")} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Beranda
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        onClick={() => navigate(-1)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Riwayat Pesanan
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Lihat semua pesanan Anda
                        </p>
                    </div>
                    <Button
                        onClick={() => loadOrders()}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {[
                        { key: "all", label: "Semua" },
                        { key: "pending", label: "Menunggu Pembayaran" },
                        { key: "paid", label: "Sudah Dibayar" },
                        { key: "processing", label: "Diproses" },
                        { key: "completed", label: "Selesai" },
                        { key: "cancelled", label: "Dibatalkan" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key as typeof filter)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === tab.key
                                ? "bg-purple-600 text-white shadow-lg"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                                }`}
                        >
                            {tab.label}
                            {tab.key === "all" && ` (${orders.length})`}
                            {tab.key === "processing" && ` (${orders.filter((o) => o.status === "processing" || o.status === "shipped").length})`}
                            {tab.key !== "all" && tab.key !== "processing" &&
                                ` (${orders.filter((o) => o.status === tab.key).length})`}
                        </button>
                    ))}
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="size-8 text-indigo-500 animate-spin mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">Memuat pesanan...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                        <Package className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Belum ada pesanan
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {filter === "all"
                                ? "Pesanan Anda akan muncul di sini setelah checkout"
                                : `Tidak ada pesanan dengan status "${getStatusText(filter)}"`}
                        </p>
                        <Button onClick={() => navigate("/products")}>
                            Mulai Belanja
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => {
                            const isExpanded = expandedOrders.has(order.id);
                            const isUpdating = updatingStatus === order.id;

                            return (
                                <div
                                    key={order.id}
                                    className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm"
                                >
                                    {/* Order Header */}
                                    <div
                                        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                                        onClick={() => toggleExpand(order.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                {/* Order Number */}
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                                        {order.order_number || `#${order.id.slice(-8)}`}
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            copyOrderNumber(order.order_number || order.id);
                                                        }}
                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                                                        title="Salin nomor pesanan"
                                                    >
                                                        <Copy className="size-3 text-gray-400" />
                                                    </button>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                                                        {getStatusText(order.status)}
                                                    </span>
                                                </div>
                                                {/* Store Name */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {getBusinessName(order)}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="size-4" />
                                                        <span>{formatDate(order.created_at)}</span>
                                                    </div>
                                                    {order.paid_at && (
                                                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                            <CreditCard className="size-4" />
                                                            <span>Bayar: {formatDate(order.paid_at)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-2">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                                                    <p className="font-bold text-indigo-600 dark:text-indigo-400">
                                                        {formatCurrency(order.total_harga)}
                                                    </p>
                                                </div>
                                                {isExpanded ? (
                                                    <ChevronUp className="size-5 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="size-5 text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-200 dark:border-gray-700">
                                            {/* Order Items */}
                                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                    Item Pesanan ({order.items?.length || 0})
                                                </p>
                                                <div className="space-y-2">
                                                    {order.items?.map((item) => (
                                                        <div key={item.id} className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-lg">
                                                            {item.product?.image_url || item.product?.gambar ? (
                                                                <ImageWithFallback
                                                                    src={getImageUrl(item.product.image_url || item.product.gambar)}
                                                                    alt={item.product?.nama_produk || "Product"}
                                                                    className="w-12 h-12 rounded-lg object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                                    <Package className="size-6 text-gray-400" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                    {item.product?.nama_produk || "Produk"}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {item.jumlah}x {formatCurrency(item.harga_satuan)}
                                                                </p>
                                                            </div>
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                {formatCurrency(item.subtotal)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {order.status === "pending" && (
                                                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                                    {/* Show Payment Method from Checkout */}
                                                    {order.payment_method && (
                                                        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                                                                💳 Metode Pembayaran:
                                                            </p>
                                                            <p className="text-sm text-blue-700 dark:text-blue-400 font-semibold">
                                                                {order.payment_method}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        📝 Catatan Pembayaran (opsional)
                                                    </label>
                                                    <textarea
                                                        value={paymentNotes[order.id] || ""}
                                                        onChange={(e) => setPaymentNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                                                        placeholder="Contoh: Transfer via BCA Rp 150.000 an. John Doe"
                                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                                        rows={2}
                                                    />

                                                    {/* Payment Proof Upload */}
                                                    <div className="mt-3 flex items-center gap-3">
                                                        {paymentProofPreviews[order.id] ? (
                                                            <div className="relative">
                                                                <div
                                                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                                                    onClick={() => setPreviewImageUrl(paymentProofPreviews[order.id])}
                                                                    title="Klik untuk memperbesar"
                                                                >
                                                                    <img
                                                                        src={paymentProofPreviews[order.id]}
                                                                        alt="Bukti Pembayaran"
                                                                        className="w-16 h-16 object-cover rounded-lg border-2 border-green-400 dark:border-green-500"
                                                                    />
                                                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Klik untuk lihat</p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPaymentProofs(prev => ({ ...prev, [order.id]: null }));
                                                                        setPaymentProofPreviews(prev => {
                                                                            const newPreviews = { ...prev };
                                                                            delete newPreviews[order.id];
                                                                            return newPreviews;
                                                                        });
                                                                        // Reset file input
                                                                        if (fileInputRefs.current[order.id]) {
                                                                            fileInputRefs.current[order.id]!.value = '';
                                                                        }
                                                                    }}
                                                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                                                                    title="Hapus foto"
                                                                >
                                                                    <X className="size-3" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => fileInputRefs.current[order.id]?.click()}
                                                                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-600 dark:text-gray-400"
                                                            >
                                                                <Upload className="size-4" />
                                                                Upload Bukti
                                                            </button>
                                                        )}
                                                        <span className="text-xs text-gray-400">JPG, PNG (Maks 5MB)</span>
                                                    </div>

                                                    <input
                                                        type="file"
                                                        ref={(el) => { fileInputRefs.current[order.id] = el; }}
                                                        accept="image/jpeg,image/png,image/jpg"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                if (file.size > 5 * 1024 * 1024) {
                                                                    toast.error("Ukuran file maksimal 5MB");
                                                                    return;
                                                                }
                                                                setPaymentProofs(prev => ({ ...prev, [order.id]: file }));
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    setPaymentProofPreviews(prev => ({ ...prev, [order.id]: reader.result as string }));
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {/* Existing Payment Note */}
                                            {order.catatan_pembayaran && (
                                                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                                                        📝 Catatan Pembayaran:
                                                    </p>
                                                    <p className="text-sm text-blue-700 dark:text-blue-400">
                                                        {order.catatan_pembayaran}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
                                                {/* WhatsApp Button - Always show */}
                                                <Button
                                                    onClick={(e) => { e.stopPropagation(); handleResendWhatsApp(order); }}
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-2"
                                                >
                                                    <MessageCircle className="size-4" />
                                                    Chat WhatsApp
                                                </Button>

                                                {/* Status Update Buttons based on current status */}
                                                {order.status === "pending" && (
                                                    <>
                                                        <Button
                                                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, "paid"); }}
                                                            disabled={isUpdating}
                                                            size="sm"
                                                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
                                                        >
                                                            {isUpdating ? (
                                                                <Loader2 className="size-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle className="size-4" />
                                                            )}
                                                            Sudah Bayar
                                                        </Button>
                                                        <Button
                                                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, "cancelled"); }}
                                                            disabled={isUpdating}
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                                                        >
                                                            <XCircle className="size-4" />
                                                            Batalkan
                                                        </Button>
                                                    </>
                                                )}

                                                {(order.status === "processing" || order.status === "shipped") && (
                                                    <>
                                                        <Button
                                                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, "completed"); }}
                                                            disabled={isUpdating}
                                                            size="sm"
                                                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
                                                        >
                                                            {isUpdating ? (
                                                                <Loader2 className="size-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle className="size-4" />
                                                            )}
                                                            ✓ Sudah Diterima
                                                        </Button>
                                                    </>
                                                )}

                                                {order.status === "paid" && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                        Menunggu konfirmasi dari UMKM...
                                                    </p>
                                                )}

                                                {order.status === "completed" && (
                                                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                                        ✅ Pesanan selesai
                                                    </p>
                                                )}

                                                {order.status === "cancelled" && (
                                                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                                        ❌ Pesanan dibatalkan
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                    }
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Image Preview Modal */}
            {previewImageUrl && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4"
                    onClick={() => setPreviewImageUrl(null)}
                >
                    <div className="max-w-4xl max-h-[90vh] relative">
                        <img
                            src={previewImageUrl}
                            alt="Bukti Pembayaran"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        />
                        <p className="text-center text-white text-sm mt-2">Klik di mana saja untuk menutup</p>
                    </div>
                </div>
            )}
        </div >
    );
}
