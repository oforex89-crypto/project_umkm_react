import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Package,
    Clock,
    User,
    Phone,
    CheckCircle,
    Truck,
    XCircle,
    ChevronDown,
    ChevronUp,
    Loader2,
    MessageCircle,
    RefreshCw,
    ArrowLeft,
    Eye,
    X,
    CreditCard,
    Search,
    Copy,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { orderService } from "../services/orderService";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

import { BASE_HOST } from "../config/api";
const BASE_URL = BASE_HOST;

// Helper to get full image URL
const getImageUrl = (imagePath: string | undefined): string => {
    if (!imagePath) return "";
    if (imagePath.startsWith('http')) return imagePath;
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
    bukti_pembayaran?: string;

    total_harga: number;
    status: string;
    paid_at?: string;
    completed_at?: string;
    payment_method?: string;
    created_at: string;
    updated_at: string;
    items: OrderItem[];
    user?: {
        id: number;
        name?: string;
        nama_lengkap?: string;
        email?: string;
        no_telepon?: string;
    };
}

export function UMKMOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "pending" | "paid" | "processing" | "shipped" | "completed">("all");

    const [paymentDetailOrder, setPaymentDetailOrder] = useState<Order | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            loadOrders();
        }
    }, [user]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await orderService.getBusinessOrders();
            setOrders(data as unknown as Order[]);
            // Default all orders to expanded
            setExpandedOrders(new Set((data as unknown as Order[]).map(o => o.id)));
        } catch (error) {
            console.error("Failed to load orders:", error);
            toast.error("Gagal memuat pesanan. Pastikan Anda memiliki toko UMKM yang aktif.");
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
                return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
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
                return "Dikirim / Siap Diambil";
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

    const handleUpdateStatus = async (orderId: string, newStatus: 'processing' | 'shipped' | 'cancelled') => {
        setUpdatingStatus(orderId);
        try {
            await orderService.updateStatusByUmkm(orderId, newStatus);
            toast.success(`Status berhasil diubah ke "${getStatusText(newStatus)}"`);
            await loadOrders();
        } catch (error: unknown) {
            console.error("Failed to update status:", error);
            const message = error instanceof Error ? error.message : "Gagal mengubah status";
            toast.error(message);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleWhatsAppCustomer = (order: Order) => {
        const phone = order.no_whatsapp_pembeli || order.user?.no_telepon;
        if (phone) {
            const cleanPhone = phone.replace(/\D/g, "").replace(/^0/, "62");
            const orderNum = order.order_number || order.id.slice(-8);
            const message = `Halo! Ini dari toko kami. Pesanan #${orderNum} Anda sedang kami proses.`;
            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
        } else {
            toast.error("Nomor WhatsApp pembeli tidak tersedia");
        }
    };

    const copyOrderNumber = (orderNumber: string) => {
        navigator.clipboard.writeText(orderNumber);
        toast.success("Nomor pesanan disalin!");
    };

    const filteredOrders = orders.filter((order) => {
        // Filter by status
        const statusMatch = filter === "all" || order.status === filter;

        // Filter by search query (order number or customer name)
        const searchLower = searchQuery.toLowerCase().trim();
        const searchMatch = !searchLower ||
            (order.order_number?.toLowerCase().includes(searchLower)) ||
            (order.id.toLowerCase().includes(searchLower)) ||
            (order.user?.nama_lengkap?.toLowerCase().includes(searchLower)) ||
            (order.user?.name?.toLowerCase().includes(searchLower));

        return statusMatch && searchMatch;
    });

    // Count orders by status
    const countByStatus = (status: string) => orders.filter(o => o.status === status).length;

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20">
                <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Silakan Login
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Anda perlu login untuk mengelola pesanan
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
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => navigate(-1)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                📦 Kelola Pesanan
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Kelola pesanan masuk dari pelanggan
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={loadOrders}
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
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: "all", label: "Semua", count: orders.length },
                            { key: "pending", label: "Menunggu Bayar", count: countByStatus("pending") },
                            { key: "paid", label: "Sudah Bayar", count: countByStatus("paid"), highlight: true },
                            { key: "processing", label: "Diproses", count: countByStatus("processing") },
                            { key: "shipped", label: "Dikirim", count: countByStatus("shipped") },
                            { key: "completed", label: "Selesai", count: countByStatus("completed") },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key as typeof filter)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === tab.key
                                    ? "bg-indigo-600 text-white shadow-lg"
                                    : tab.highlight && tab.count > 0
                                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-2 border-blue-500"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div className="mt-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nomor pesanan atau nama pelanggan..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                            >
                                <X className="size-4 text-gray-400" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="size-8 text-indigo-500 animate-spin mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">Memuat pesanan...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                        <Package className="size-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Belum ada pesanan
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {filter === "all"
                                ? "Pesanan dari pelanggan akan muncul di sini"
                                : `Tidak ada pesanan dengan status "${getStatusText(filter)}"`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order, index) => {
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
                                                <div className="flex items-center gap-2 mb-2">
                                                    {/* Order Number */}
                                                    <div className="flex items-center gap-1">
                                                        <p className="font-bold text-gray-900 dark:text-white">
                                                            {order.order_number || `#${order.id.slice(-8)}`}
                                                        </p>
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
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                                                        {getStatusText(order.status)}
                                                    </span>
                                                    {order.status === "paid" && (
                                                        <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-medium animate-pulse">
                                                            ⚠️ Perlu Diproses
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center gap-1">
                                                        <User className="size-4" />
                                                        <span>{order.user?.nama_lengkap || order.user?.name || "Pelanggan"}</span>
                                                    </div>
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

                                    {/* Expanded Content - Simplified, only action buttons */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-200 dark:border-gray-700">
                                            {/* Action Buttons */}
                                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex flex-wrap gap-2 items-center">
                                                {/* Lihat Detail Button - Always visible */}
                                                <Button
                                                    onClick={(e) => { e.stopPropagation(); setPaymentDetailOrder(order); }}
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900/30"
                                                >
                                                    <Eye className="size-4" />
                                                    Lihat Detail
                                                </Button>

                                                {/* WhatsApp Button - Always show */}
                                                <Button
                                                    onClick={(e) => { e.stopPropagation(); handleWhatsAppCustomer(order); }}
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-2"
                                                >
                                                    <MessageCircle className="size-4" />
                                                    Hubungi Pembeli
                                                </Button>

                                                {/* Status Update Buttons based on current status */}
                                                {order.status === "paid" && (
                                                    <>
                                                        <Button
                                                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'processing'); }}
                                                            disabled={isUpdating}
                                                            size="sm"
                                                            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white"
                                                        >
                                                            {isUpdating ? (
                                                                <Loader2 className="size-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle className="size-4" />
                                                            )}
                                                            Proses Pesanan
                                                        </Button>
                                                        <Button
                                                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, "cancelled"); }}
                                                            disabled={isUpdating}
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                                                        >
                                                            <XCircle className="size-4" />
                                                            Tolak
                                                        </Button>
                                                    </>
                                                )}

                                                {order.status === "processing" && (
                                                    <Button
                                                        onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, "shipped"); }}
                                                        disabled={isUpdating}
                                                        size="sm"
                                                        className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white"
                                                    >
                                                        {isUpdating ? (
                                                            <Loader2 className="size-4 animate-spin" />
                                                        ) : (
                                                            <Truck className="size-4" />
                                                        )}
                                                        Kirim / Siap Diambil
                                                    </Button>
                                                )}

                                                {order.status === "shipped" && (
                                                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium flex items-center">
                                                        📦 Menunggu pelanggan konfirmasi penerimaan...
                                                    </p>
                                                )}

                                                {order.status === "pending" && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic flex items-center">
                                                        ⏳ Menunggu pembayaran dari pelanggan...
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
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>



            {/* Payment Detail Modal */}
            {paymentDetailOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setPaymentDetailOrder(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    📋 Detail Pesanan
                                </h3>
                                <button
                                    onClick={() => setPaymentDetailOrder(null)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                                >
                                    <X className="size-5 text-gray-500" />
                                </button>
                            </div>
                            {/* Order Number */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                    {paymentDetailOrder.order_number || `#${paymentDetailOrder.id.slice(-8)}`}
                                </span>
                                <button
                                    onClick={() => copyOrderNumber(paymentDetailOrder.order_number || paymentDetailOrder.id)}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                                    title="Salin"
                                >
                                    <Copy className="size-4 text-gray-400" />
                                </button>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(paymentDetailOrder.status)}`}>
                                    {getStatusText(paymentDetailOrder.status)}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Order Timeline */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <Clock className="size-4" />
                                    Timeline Pesanan
                                </p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">📦 Pesanan Dibuat</span>
                                        <span className="text-gray-900 dark:text-white">{formatDate(paymentDetailOrder.created_at)}</span>
                                    </div>
                                    {paymentDetailOrder.paid_at && (
                                        <div className="flex justify-between">
                                            <span className="text-green-600 dark:text-green-400">💳 Pembayaran</span>
                                            <span className="text-gray-900 dark:text-white">{formatDate(paymentDetailOrder.paid_at)}</span>
                                        </div>
                                    )}
                                    {paymentDetailOrder.completed_at && (
                                        <div className="flex justify-between">
                                            <span className="text-indigo-600 dark:text-indigo-400">✅ Selesai</span>
                                            <span className="text-gray-900 dark:text-white">{formatDate(paymentDetailOrder.completed_at)}</span>
                                        </div>
                                    )}
                                    {paymentDetailOrder.payment_method && (
                                        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                                            <span className="text-gray-600 dark:text-gray-400">Metode Bayar</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{paymentDetailOrder.payment_method}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                    <User className="size-4" />
                                    Info Pelanggan
                                </p>
                                <div className="space-y-1 text-sm">
                                    <p className="text-blue-700 dark:text-blue-400">
                                        <strong>Nama:</strong> {paymentDetailOrder.user?.nama_lengkap || paymentDetailOrder.user?.name || "Pelanggan"}
                                    </p>
                                    {(paymentDetailOrder.no_whatsapp_pembeli || paymentDetailOrder.user?.no_telepon) && (
                                        <p className="text-blue-700 dark:text-blue-400">
                                            <strong>WhatsApp:</strong> {paymentDetailOrder.no_whatsapp_pembeli || paymentDetailOrder.user?.no_telepon}
                                        </p>
                                    )}
                                    {paymentDetailOrder.user?.email && (
                                        <p className="text-blue-700 dark:text-blue-400">
                                            <strong>Email:</strong> {paymentDetailOrder.user.email}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <Package className="size-4" />
                                    Item Pesanan ({paymentDetailOrder.items?.length || 0})
                                </p>
                                <div className="space-y-2">
                                    {paymentDetailOrder.items?.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-lg">
                                            {item.product?.image_url || item.product?.gambar ? (
                                                <ImageWithFallback
                                                    src={getImageUrl(item.product.image_url || item.product.gambar)}
                                                    alt={item.product?.nama_produk || "Product"}
                                                    className="w-10 h-10 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                                    <Package className="size-5 text-gray-400" />
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
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Total</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                        {formatCurrency(paymentDetailOrder.total_harga)}
                                    </span>
                                </div>
                            </div>

                            {/* Order Notes */}
                            {paymentDetailOrder.catatan && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                                        📝 Catatan Pesanan:
                                    </p>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                        {paymentDetailOrder.catatan}
                                    </p>
                                </div>
                            )}

                            {/* Payment Info */}
                            {paymentDetailOrder.catatan_pembayaran && (
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                    <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1 flex items-center gap-2">
                                        <CreditCard className="size-4" />
                                        Catatan Pembayaran:
                                    </p>
                                    <p className="text-sm text-green-700 dark:text-green-400">
                                        {paymentDetailOrder.catatan_pembayaran}
                                    </p>
                                </div>
                            )}

                            {/* Payment Proof */}
                            {paymentDetailOrder.bukti_pembayaran && (
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                                    <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
                                        🧾 Bukti Pembayaran:
                                    </p>
                                    {(() => {
                                        let imageUrl = paymentDetailOrder.bukti_pembayaran;
                                        if (!imageUrl.startsWith('http')) {
                                            const cleanPath = imageUrl.replace(/^storage\//, '');
                                            imageUrl = `${BASE_URL}/api/storage/${cleanPath}`;
                                        }
                                        return (
                                            <img
                                                src={imageUrl}
                                                alt="Bukti Pembayaran"
                                                className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition"
                                                onClick={() => window.open(imageUrl, '_blank')}
                                            />
                                        );
                                    })()}
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                                        Klik gambar untuk melihat ukuran penuh
                                    </p>
                                </div>
                            )}


                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                            <Button
                                onClick={() => setPaymentDetailOrder(null)}
                                variant="outline"
                                className="flex-1"
                            >
                                Tutup
                            </Button>
                            <Button
                                onClick={() => {
                                    handleWhatsAppCustomer(paymentDetailOrder);
                                    setPaymentDetailOrder(null);
                                }}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2"
                            >
                                <MessageCircle className="size-4" />
                                Hubungi
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
