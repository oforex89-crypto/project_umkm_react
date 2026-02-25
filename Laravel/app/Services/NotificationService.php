<?php

namespace App\Services;

use App\Models\Notification;

class NotificationService
{
    /**
     * Create a new notification
     * 
     * @param string $category 'personal' for user notifications, 'store' for UMKM store notifications
     */
    public static function create(
        int $userId,
        string $type,
        string $title,
        string $message,
        string $category = 'personal',
        ?string $actionUrl = null,
        ?array $data = null
    ): Notification {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'category' => $category,
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'data' => $data,
        ]);
    }

    // ==========================================
    // STORE NOTIFICATIONS (for UMKM owners)
    // ==========================================

    /**
     * Notify when new order is created (for UMKM) - STORE notification
     */
    public static function notifyNewOrder(int $umkmUserId, string $orderId, string $customerName, float $total): Notification
    {
        return self::create(
            $umkmUserId,
            'order',
            '🛒 Pesanan Baru!',
            "Pesanan baru dari {$customerName} sebesar Rp " . number_format($total, 0, ',', '.'),
            'store', // STORE category
            "/umkm-orders",
            ['order_id' => $orderId]
        );
    }

    /**
     * Notify UMKM when stock is low - STORE notification
     */
    public static function notifyLowStock(int $umkmUserId, string $productName, int $currentStock): Notification
    {
        return self::create(
            $umkmUserId,
            'stock',
            '⚠️ Stok Menipis',
            "Stok {$productName} tinggal {$currentStock} unit. Segera restok!",
            'store', // STORE category
            null,
            ['product_name' => $productName, 'stock' => $currentStock]
        );
    }

    /**
     * Notify UMKM when product is approved - STORE notification
     */
    public static function notifyProductApproved(int $umkmUserId, string $productName): Notification
    {
        return self::create(
            $umkmUserId,
            'approval',
            '✅ Produk Disetujui',
            "Produk \"{$productName}\" telah disetujui dan aktif dijual",
            'store', // STORE category
            null,
            ['product_name' => $productName]
        );
    }

    /**
     * Notify UMKM when product is rejected - STORE notification
     */
    public static function notifyProductRejected(int $umkmUserId, string $productName, string $reason): Notification
    {
        return self::create(
            $umkmUserId,
            'rejection',
            '❌ Produk Ditolak',
            "Produk \"{$productName}\" ditolak. Alasan: {$reason}",
            'store', // STORE category
            null,
            ['product_name' => $productName, 'reason' => $reason]
        );
    }

    // ==========================================
    // PERSONAL NOTIFICATIONS (for customers/users)
    // ==========================================

    /**
     * Notify customer when order is confirmed by UMKM - PERSONAL notification
     */
    public static function notifyOrderConfirmed(int $customerId, string $orderId, string $storeName): Notification
    {
        return self::create(
            $customerId,
            'order',
            '✅ Pesanan Dikonfirmasi',
            "Pesanan Anda telah dikonfirmasi oleh {$storeName}",
            'personal', // PERSONAL category
            "/orders",
            ['order_id' => $orderId]
        );
    }

    /**
     * Notify customer when payment is verified - PERSONAL notification
     */
    public static function notifyPaymentVerified(int $customerId, string $orderId): Notification
    {
        return self::create(
            $customerId,
            'payment',
            '💳 Pembayaran Diterima',
            "Pembayaran untuk pesanan #{$orderId} telah dikonfirmasi",
            'personal', // PERSONAL category
            "/orders",
            ['order_id' => $orderId]
        );
    }

    /**
     * Notify customer when order is ready - PERSONAL notification
     */
    public static function notifyOrderReady(int $customerId, string $orderId, string $storeName): Notification
    {
        return self::create(
            $customerId,
            'order',
            '📦 Pesanan Siap Diambil',
            "Pesanan Anda di {$storeName} siap untuk diambil!",
            'personal', // PERSONAL category
            "/orders",
            ['order_id' => $orderId]
        );
    }

    /**
     * Notify customer when order is completed - PERSONAL notification
     */
    public static function notifyOrderCompleted(int $customerId, string $orderId): Notification
    {
        return self::create(
            $customerId,
            'order',
            '🎉 Pesanan Selesai',
            "Terima kasih! Pesanan #{$orderId} telah selesai. Jangan lupa berikan review!",
            'personal', // PERSONAL category
            "/orders",
            ['order_id' => $orderId]
        );
    }

    /**
     * Notify user when UMKM application is approved - PERSONAL notification
     */
    public static function notifyUmkmApproved(int $userId, string $storeName): Notification
    {
        return self::create(
            $userId,
            'approval',
            '🎉 Toko Disetujui!',
            "Selamat! Toko \"{$storeName}\" Anda telah disetujui. Mulai berjualan sekarang!",
            'personal', // PERSONAL category - about their application
            null,
            ['store_name' => $storeName]
        );
    }

    /**
     * Notify user when UMKM application is rejected - PERSONAL notification
     */
    public static function notifyUmkmRejected(int $userId, string $reason): Notification
    {
        return self::create(
            $userId,
            'rejection',
            '❌ Pengajuan Ditolak',
            "Pengajuan UMKM Anda ditolak. Alasan: {$reason}",
            'personal', // PERSONAL category - about their application
            null,
            ['reason' => $reason]
        );
    }

    /**
     * Notify user when event vendor registration is rejected - STORE notification
     */
    public static function notifyEventVendorRejected(int $userId, string $eventName, ?string $reason = null): Notification
    {
        $message = "Pendaftaran toko Anda untuk event \"{$eventName}\" ditolak.";
        if ($reason) {
            $message .= " Alasan: {$reason}";
        }
        $message .= " Anda dapat mendaftar ulang dengan perbaikan.";
        
        return self::create(
            $userId,
            'rejection',
            '❌ Pendaftaran Event Ditolak',
            $message,
            'store', // STORE category - about their store participation
            null,
            ['event_name' => $eventName, 'reason' => $reason]
        );
    }

    /**
     * Notify user when event vendor registration is approved - STORE notification
     */
    public static function notifyEventVendorApproved(int $userId, string $eventName): Notification
    {
        return self::create(
            $userId,
            'approval',
            '✅ Pendaftaran Event Disetujui',
            "Selamat! Pendaftaran toko Anda untuk event \"{$eventName}\" telah disetujui. Bersiaplah untuk berjualan di event tersebut.",
            'store', // STORE category - about their store participation
            null,
            ['event_name' => $eventName]
        );
    }

    // ==========================================
    // ADMIN NOTIFICATIONS
    // ==========================================

    /**
     * Notify all admins when new UMKM registration is submitted
     */
    public static function notifyAdminNewUmkm(string $storeName, string $ownerName, int $productCount): array
    {
        // Get all admin users
        $admins = \App\Models\User::where('role', 'admin')->get();
        $notifications = [];
        
        foreach ($admins as $admin) {
            $notifications[] = self::create(
                $admin->id,
                'umkm_registration',
                '🏪 Pendaftaran UMKM Baru!',
                "Toko \"{$storeName}\" oleh {$ownerName} dengan {$productCount} produk menunggu persetujuan.",
                'personal', // Admin personal notification
                '/admin-panel', // Link to admin panel
                [
                    'store_name' => $storeName,
                    'owner_name' => $ownerName,
                    'product_count' => $productCount
                ]
            );
        }
        
        return $notifications;
    }

    /**
     * Send WhatsApp notification to admin for new UMKM registration
     * Note: This logs the notification info since direct WhatsApp sending requires external API
     * Admin can be notified via in-app notification instead
     */
    public static function sendWhatsAppToAdmin(string $storeName, string $ownerName, string $whatsappNumber, int $productCount): bool
    {
        try {
            // Get admin WhatsApp number from settings or config
            $adminWhatsapp = config('services.whatsapp.admin_number') ?? env('ADMIN_WHATSAPP_NUMBER');
            
            if (!$adminWhatsapp) {
                \Log::info('Admin WhatsApp number not configured - skipping WhatsApp notification');
                return true; // Return true so it doesn't fail the submission
            }

            // Prepare message for logging
            $message = "🏪 Pendaftaran UMKM Baru\n\n";
            $message .= "Nama Toko: {$storeName}\n";
            $message .= "Pemilik: {$ownerName}\n";
            $message .= "Jumlah Produk: {$productCount}\n";
            $message .= "WhatsApp: {$whatsappNumber}\n\n";
            $message .= "Silakan cek Admin Panel untuk mereview pengajuan ini.";

            // Generate wa.me link for admin to click (stored in notification data)
            $waLink = "https://wa.me/{$whatsappNumber}";

            // Log the notification for manual follow-up or future automation
            \Log::info("New UMKM Registration - Admin notification", [
                'admin_wa' => $adminWhatsapp,
                'store_name' => $storeName,
                'owner_name' => $ownerName,
                'wa_link_to_owner' => $waLink,
                'product_count' => $productCount,
                'message' => $message
            ]);

            return true;
        } catch (\Exception $e) {
            \Log::error('Failed to process WhatsApp notification for admin: ' . $e->getMessage());
            return true; // Return true so it doesn't fail the submission
        }
    }
}
