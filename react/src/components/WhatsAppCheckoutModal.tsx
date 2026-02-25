import { useState } from "react";
import { motion } from "motion/react";
import {
    X,
    MessageCircle,
    Store,
    CreditCard,
    Banknote,
    Wallet,
    CheckCircle2,
    Loader2,
    MapPin,
    Truck,
    Home,
} from "lucide-react";
import { CartItem } from "../types";
import { orderService } from "../services/orderService";
import { toast } from "sonner";

interface WhatsAppCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    umkmName: string;
    umkmWhatsapp: string;
    umkmLocation?: string;
    buyerName?: string;
    buyerPhone?: string;
    businessId: string;
    items: CartItem[];
    total: number;
    onCheckoutComplete: (orderId?: string) => void;
    // Bank account info
    namaBank?: string;
    noRekening?: string;
    atasNama?: string;
    // Delivery option
    menyediakanJasaKirim?: boolean;
}

const paymentMethods = [
    { id: "transfer", name: "Transfer Bank", icon: CreditCard },
    { id: "cod", name: "Bayar di Tempat (COD)", icon: Banknote },
    { id: "ewallet", name: "E-Wallet", icon: Wallet },
];

export function WhatsAppCheckoutModal({
    isOpen,
    onClose,
    umkmName,
    umkmWhatsapp,
    umkmLocation,
    buyerName,
    buyerPhone,
    businessId,
    items,
    total,
    onCheckoutComplete,
    namaBank,
    noRekening,
    atasNama,
    menyediakanJasaKirim = true, // Default true for now
}: WhatsAppCheckoutModalProps) {
    const [selectedPayment, setSelectedPayment] = useState<string>("");
    const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    const getPaymentMethodName = (id: string) => {
        const method = paymentMethods.find((m) => m.id === id);
        return method?.name || id;
    };

    const generateWhatsAppMessage = () => {
        // Format: Halo [UMKM Name], saya [Buyer Name] mau beli:
        const greeting = buyerName
            ? `Halo ${umkmName}, saya ${buyerName} mau beli:`
            : `Halo ${umkmName}, saya mau beli:`;

        let message = `${greeting}\n\n`;
        message += `*Daftar Pesanan:*\n`;

        items.forEach((item, index) => {
            const subtotal = item.price * item.quantity;
            // Include variant info if available
            let variantSuffix = '';
            if (item.selectedVariants && Object.keys(item.selectedVariants).length > 0) {
                const variantDetails = Object.entries(item.selectedVariants)
                    .map(([typeName, v]) => `${typeName}: ${v.value}`)
                    .join(', ');
                variantSuffix = ` (${variantDetails})`;
            }
            message += `${index + 1}. ${item.name}${variantSuffix} x${item.quantity} - ${formatPrice(subtotal)}\n`;
        });

        message += `\n*Total:* ${formatPrice(total)}\n`;
        message += `*Pembayaran:* ${getPaymentMethodName(selectedPayment)}\n`;

        // Add delivery method info
        if (menyediakanJasaKirim) {
            if (deliveryMethod === "pickup") {
                message += `*Pengambilan:* Ambil di tempat\n`;
            } else {
                message += `*Pengambilan:* Dikirim ke lokasi\n`;
                if (deliveryAddress) {
                    message += `*Alamat:* ${deliveryAddress}\n`;
                }
            }
        }

        // Add bank account info for transfer payment
        if (selectedPayment === "transfer" && namaBank && noRekening) {
            message += `\n*Info Transfer:*\n`;
            message += `Bank: ${namaBank}\n`;
            message += `No. Rekening: ${noRekening}\n`;
            if (atasNama) {
                message += `Atas Nama: ${atasNama}\n`;
            }
        }

        // Add location info
        if (umkmLocation) {
            message += `\n*Info:* Saya menemukan toko Anda di ${umkmLocation}\n`;
        } else {
            message += `\n*Info:* Saya menemukan toko Anda di Pasar UMKM Digital\n`;
        }

        message += `\nTerima kasih!`;

        return message;
    };

    const formatWhatsAppNumber = (number: string) => {
        // Remove all non-digit characters
        let cleaned = number.replace(/\D/g, "");

        // If starts with 0, replace with 62 (Indonesia country code)
        if (cleaned.startsWith("0")) {
            cleaned = "62" + cleaned.substring(1);
        }

        // If doesn't start with 62, add it
        if (!cleaned.startsWith("62")) {
            cleaned = "62" + cleaned;
        }

        return cleaned;
    };

    const handleSendToWhatsApp = async () => {
        if (!selectedPayment) {
            return;
        }

        setIsSaving(true);

        try {
            // Save order to database first
            const order = await orderService.createOrder({
                business_id: businessId,
                no_whatsapp_pembeli: buyerPhone || "",
                catatan: `Pembayaran: ${getPaymentMethodName(selectedPayment)}`,
                payment_method: getPaymentMethodName(selectedPayment), // Save payment method from checkout
                items: items.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    price: item.price || 0,
                    name: item.name,
                })),
                total: total,
            });

            setIsRedirecting(true);

            const message = generateWhatsAppMessage();
            const phoneNumber = formatWhatsAppNumber(umkmWhatsapp);
            const encodedMessage = encodeURIComponent(message);
            const waLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

            // Open WhatsApp in new tab
            window.open(waLink, "_blank");

            toast.success("Pesanan berhasil disimpan! Silakan lanjutkan chat dengan penjual.");

            // Call checkout complete callback after a short delay
            setTimeout(() => {
                setIsRedirecting(false);
                setIsSaving(false);
                onCheckoutComplete(order?.id);
                onClose();
            }, 1000);
        } catch (error) {
            console.error("Failed to create order:", error);
            // Log more details about the error
            if (error instanceof Error) {
                console.error("Error message:", error.message);
            }
            // @ts-ignore - Check for axios error response
            if (error?.response) {
                // @ts-ignore
                console.error("Server response:", error.response.data);
                // @ts-ignore
                console.error("Status code:", error.response.status);
            }
            setIsSaving(false);

            // Check if it's a stock error
            const errorMessage = error instanceof Error ? error.message : String(error);
            const isStockError = errorMessage.toLowerCase().includes('stok');

            if (isStockError) {
                // Show specific stock error and DON'T redirect to WhatsApp
                toast.error(errorMessage, { duration: 5000 });
                return; // Don't proceed with WhatsApp
            }

            // For other errors, still allow WhatsApp redirect
            setIsRedirecting(true);
            const message = generateWhatsAppMessage();
            const phoneNumber = formatWhatsAppNumber(umkmWhatsapp);
            const encodedMessage = encodeURIComponent(message);
            const waLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
            window.open(waLink, "_blank");

            toast.warning("Pesanan dikirim ke WhatsApp, tetapi gagal menyimpan ke riwayat.");

            setTimeout(() => {
                setIsRedirecting(false);
                onCheckoutComplete();
                onClose();
            }, 1000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-green-500 to-green-600">
                    <div className="flex items-center gap-3 text-white">
                        <MessageCircle className="size-6" />
                        <h2 className="text-lg font-semibold">Checkout via WhatsApp</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 min-h-0">
                    {/* UMKM Info */}
                    <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                                <Store className="size-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Toko UMKM
                                </p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {umkmName}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                            Ringkasan Pesanan
                        </h3>
                        <div className="space-y-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between text-sm"
                                >
                                    <div>
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {item.quantity}x {item.name}
                                        </span>
                                        {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                {Object.entries(item.selectedVariants).map(([typeName, variant]) => (
                                                    <span
                                                        key={typeName}
                                                        className="text-[10px] bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded"
                                                    >
                                                        {typeName}: {variant.value}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatPrice(item.price * item.quantity)}
                                    </span>
                                </div>
                            ))}
                            <div className="pt-3 mt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    Total
                                </span>
                                <span className="font-bold text-lg text-green-600 dark:text-green-400">
                                    {formatPrice(total)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="p-5">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                            Pilih Metode Pembayaran
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {paymentMethods.map((method) => {
                                const Icon = method.icon;
                                const isSelected = selectedPayment === method.id;
                                return (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => setSelectedPayment(method.id)}
                                        className={`p-4 border-2 rounded-xl transition-all flex items-center gap-3 ${isSelected
                                            ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                                            }`}
                                    >
                                        <div
                                            className={`p-2 rounded-full ${isSelected
                                                ? "bg-green-500 text-white"
                                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                                }`}
                                        >
                                            <Icon className="size-5" />
                                        </div>
                                        <span
                                            className={`font-medium ${isSelected
                                                ? "text-green-700 dark:text-green-400"
                                                : "text-gray-700 dark:text-gray-300"
                                                }`}
                                        >
                                            {method.name}
                                        </span>
                                        {isSelected && (
                                            <CheckCircle2 className="size-5 text-green-500 ml-auto" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Delivery Method - Only show if UMKM provides delivery */}
                    {menyediakanJasaKirim && (
                        <div className="p-5 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                                Metode Pengambilan
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {/* Pickup Option */}
                                <button
                                    type="button"
                                    onClick={() => setDeliveryMethod("pickup")}
                                    className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center gap-2 ${deliveryMethod === "pickup"
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                                        }`}
                                >
                                    <div className={`p-2 rounded-full ${deliveryMethod === "pickup"
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                        }`}>
                                        <Home className="size-5" />
                                    </div>
                                    <span className={`font-medium text-sm ${deliveryMethod === "pickup"
                                        ? "text-blue-700 dark:text-blue-400"
                                        : "text-gray-700 dark:text-gray-300"
                                        }`}>
                                        Ambil di Tempat
                                    </span>
                                </button>

                                {/* Delivery Option */}
                                <button
                                    type="button"
                                    onClick={() => setDeliveryMethod("delivery")}
                                    className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center gap-2 ${deliveryMethod === "delivery"
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                                        }`}
                                >
                                    <div className={`p-2 rounded-full ${deliveryMethod === "delivery"
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                        }`}>
                                        <Truck className="size-5" />
                                    </div>
                                    <span className={`font-medium text-sm ${deliveryMethod === "delivery"
                                        ? "text-blue-700 dark:text-blue-400"
                                        : "text-gray-700 dark:text-gray-300"
                                        }`}>
                                        Kirim ke Lokasi
                                    </span>
                                </button>
                            </div>

                            {/* Address Input - Show when delivery is selected */}
                            {deliveryMethod === "delivery" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4"
                                >
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <MapPin className="size-4 inline mr-1" />
                                        Alamat Pengiriman
                                    </label>
                                    <textarea
                                        value={deliveryAddress}
                                        onChange={(e) => setDeliveryAddress(e.target.value)}
                                        placeholder="Masukkan alamat lengkap untuk pengiriman..."
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        rows={3}
                                    />
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer with Action Button */}
                <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <button
                        onClick={handleSendToWhatsApp}
                        disabled={!selectedPayment || isRedirecting}
                        className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all ${selectedPayment && !isRedirecting
                            ? "bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl"
                            : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        <MessageCircle className="size-5" />
                        {isRedirecting
                            ? "Membuka WhatsApp..."
                            : selectedPayment
                                ? `Kirim ke WhatsApp (${formatPrice(total)})`
                                : "Pilih metode pembayaran"}
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                        Pesanan akan dikirim langsung ke WhatsApp toko {umkmName}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
