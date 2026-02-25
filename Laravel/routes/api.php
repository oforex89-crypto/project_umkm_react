<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\BusinessController;
use App\Http\Controllers\Api\RoleUpgradeRequestController;
use App\Http\Controllers\Api\RoleRequestController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\UmkmController;
use App\Http\Controllers\Api\UmkmApiController;
use App\Http\Controllers\Api\GiftPackageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\ImageController;

// Debug route
Route::get('/test', function () {
    return response()->json(['status' => 'API is working']);
});

// TEMPORARY: Create event_products table - REMOVE AFTER USE
Route::get('/setup-event-products', function () {
    try {
        // Create event_products table
        \Illuminate\Support\Facades\DB::statement("
            CREATE TABLE IF NOT EXISTS event_products (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                event_id VARCHAR(20) NOT NULL,
                vendor_registration_id BIGINT UNSIGNED NOT NULL,
                umkm_id BIGINT UNSIGNED NOT NULL,
                nama_produk VARCHAR(100) NOT NULL,
                harga DECIMAL(12,2) DEFAULT 0,
                deskripsi TEXT NULL,
                gambar VARCHAR(255) NULL,
                stok INT DEFAULT 0,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL,
                INDEX idx_event_id (event_id),
                INDEX idx_vendor_registration_id (vendor_registration_id),
                INDEX idx_umkm_id (umkm_id)
            )
        ");
        
        // Add agreement_file column if not exists
        $hasColumn = \Illuminate\Support\Facades\Schema::hasColumn('event_vendor_registrations', 'agreement_file');
        if (!$hasColumn) {
            \Illuminate\Support\Facades\DB::statement("
                ALTER TABLE event_vendor_registrations ADD COLUMN agreement_file VARCHAR(255) NULL AFTER admin_notes
            ");
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Tables created/updated successfully',
            'event_products_created' => true,
            'agreement_file_column_added' => !$hasColumn
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

// Debug gift package creation
require __DIR__.'/test_gift.php';
// Test register endpoint
Route::post('/test-register', function (Request $request) {
    try {
        $data = $request->all();
        return response()->json([
            'received' => $data,
            'status' => 'received'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ], 500);
    }
});
// Authentication Routes
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('/admin/login', [AuthController::class, 'loginAdmin']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('profile', [AuthController::class, 'getProfile']);
    Route::put('profile', [AuthController::class, 'updateProfile']);
    Route::post('send-otp-register', [AuthController::class, 'sendOtpRegister']);
    Route::post('verify-otp-register', [AuthController::class, 'verifyOtpRegister']);
    Route::post('check-email', [AuthController::class, 'checkEmail']); // Check if email is already registered
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']); // Forgot password - send OTP
    Route::post('reset-password', [AuthController::class, 'resetPassword']); // Reset password with OTP
});

// Admin Management Routes (Protected - hanya admin yang bisa akses)
Route::prefix('admin')->group(function () {
    Route::get('/admins', [AdminController::class, 'index']);
    Route::post('/admins', [AdminController::class, 'store']);
    Route::get('/admins/{id}', [AdminController::class, 'show']);
    Route::put('/admins/{id}', [AdminController::class, 'update']);
    Route::patch('/admins/{id}/toggle-status', [AdminController::class, 'toggleStatus']);
    Route::delete('/admins/{id}', [AdminController::class, 'destroy']);

    // Get all users
    Route::get('/users', [AdminController::class, 'users']); // Changed from getAllUsers to users
    Route::put('/users/{id}/role', [AdminController::class, 'updateUserRole']);
    
    // Statistics
    Route::get('/statistics', [AdminController::class, 'statistics']);

    // Purchase Log
    Route::get('/purchase-log', [AdminController::class, 'purchaseLog']);
    Route::get('/purchase-log/export', [AdminController::class, 'exportPurchaseLog']);
});

// UMKM Public API Routes (untuk frontend)
Route::prefix('umkm')->group(function () {
    Route::get('/', [UmkmApiController::class, 'index']); // Get active UMKM
    Route::get('/pending', [UmkmApiController::class, 'pending']); // Get pending UMKM for admin
    Route::get('/my-umkm', [UmkmApiController::class, 'getUserUmkm']); // NEW: Get user's own UMKM (all statuses)
    
    // NEW: Get rejection comments for user (must be before /{id} route)
    Route::get('/rejection-comments', [UmkmController::class, 'getRejectionComments']);
    
    Route::post('/submit', [UmkmController::class, 'submit']); // Submit UMKM store
    Route::get('/{id}', [UmkmApiController::class, 'show']); // Get single UMKM (must be after /pending)
    Route::get('/{id}/products', [UmkmApiController::class, 'products']); // Get products by UMKM
    Route::post('/{id}/approve', [UmkmController::class, 'approveStore']); // Approve UMKM store
    Route::post('/{id}/reject', [UmkmController::class, 'rejectStore']); // Reject UMKM store
    Route::post('/{id}/resubmit', [UmkmController::class, 'resubmitStore']); // Resubmit rejected UMKM store
    
    // NEW: Approve with product-level control and comments
    Route::post('/{id}/approve-with-products', [UmkmController::class, 'approveStoreWithProducts']);
    
    // NEW: Add product to approved UMKM
    Route::post('/add-product', [UmkmController::class, 'addProduct']);
    
    // NEW: Bulk actions for UMKM stores
    Route::post('/bulk-approve', [UmkmController::class, 'bulkApprove']);
    Route::post('/bulk-reject', [UmkmController::class, 'bulkReject']);
    
    // DELETE UMKM store (admin only)
    Route::delete('/{id}', [UmkmController::class, 'destroy']);
    
    // User update their own UMKM store
    Route::post('/{id}', [UmkmController::class, 'updateStore']);
    
    // Admin update UMKM store (admin only)
    Route::post('/{id}/admin-update', [UmkmController::class, 'adminUpdate']);
});

// Product Admin Routes
Route::prefix('products')->group(function () {
    Route::get('/pending', [UmkmController::class, 'getPendingProducts']); // Get pending products for admin
    Route::post('/{id}/approve', [UmkmController::class, 'approveProduct']); // Approve product
    Route::post('/{id}/reject', [UmkmController::class, 'rejectProduct']); // Reject product with reason
    Route::post('/{id}/resubmit', [UmkmController::class, 'resubmitProduct']); // Resubmit rejected product for review
    Route::get('/rejection-reasons', [UmkmController::class, 'getProductRejectionReasons']); // Get user's product rejection reasons
});

// Category Routes
Route::prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::post('/', [CategoryController::class, 'store']);
    Route::put('/{id}', [CategoryController::class, 'update']);
    Route::delete('/{id}', [CategoryController::class, 'destroy']);
});

// Product Routes
Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/{id}', [ProductController::class, 'show']);
    Route::post('/', [ProductController::class, 'store']);
    Route::put('/{id}', [ProductController::class, 'update']);
    Route::put('/{id}/update-image', [ProductController::class, 'updateImage']);
    Route::post('/{id}/reduce-stock', [ProductController::class, 'reduceStock']); // NEW: Reduce stock on purchase
    Route::get('/{id}/related', [ProductController::class, 'getRelated']); // Get related products from same UMKM
    Route::get('/{id}/similar', [ProductController::class, 'getSimilar']); // Get similar products by category
    Route::get('/{id}/random-others', [ProductController::class, 'getRandomOthers']); // Get random products from other stores
    Route::delete('/{id}', [ProductController::class, 'destroy']);
    Route::get('business/{userId}', [ProductController::class, 'getByBusiness']);
});

// Role Upgrade Request Routes - TRUE role upgrades (customer → umkm)
Route::prefix('role-upgrade')->group(function () {
    Route::get('/pending', [RoleRequestController::class, 'getPending']); // Admin: get pending requests
    Route::get('/user/{userId}', [RoleRequestController::class, 'checkUserRequest']); // Check user request
    Route::post('/', [RoleRequestController::class, 'store']); // Submit role upgrade request
    Route::post('/{requestId}/approve', [RoleRequestController::class, 'approve']); // Admin: approve
    Route::post('/{requestId}/reject', [RoleRequestController::class, 'reject']); // Admin: reject
});

// Business/Store Submission Routes - UMKM owners submit their stores
// Previously named "role-requests" but actually handles business submissions
Route::prefix('role-requests')->group(function () {
    Route::get('/pending', [RoleUpgradeRequestController::class, 'getPending']); // Get pending business submissions
    Route::get('/user/{userId}', [RoleUpgradeRequestController::class, 'checkUserRequest']);
    Route::post('/', [RoleUpgradeRequestController::class, 'store']); // Submit business/store
    Route::post('/{userId}/approve', [RoleUpgradeRequestController::class, 'approve']);
    Route::post('/{userId}/reject', [RoleUpgradeRequestController::class, 'reject']);
});

// Business Routes (DEPRECATED - for backward compatibility)
Route::prefix('businesses')->group(function () {
    // Redirect to new role-requests endpoints
    Route::get('/{userId}', [RoleUpgradeRequestController::class, 'checkUserRequest']);
    Route::post('/', [RoleUpgradeRequestController::class, 'store']);
    Route::get('admin/pending', [RoleUpgradeRequestController::class, 'getPending']);
    Route::post('admin/{userId}/approve', [RoleUpgradeRequestController::class, 'approve']);
    Route::post('admin/{userId}/reject', [RoleUpgradeRequestController::class, 'reject']);
});

// Cart Routes
Route::prefix('cart')->group(function () {
    Route::get('/{userId}', [CartController::class, 'index']);
    Route::get('/{userId}/grouped', [CartController::class, 'getGroupedByBusiness']);
    Route::post('/', [CartController::class, 'add']);
    Route::put('/{userId}/{productId}', [CartController::class, 'update']);
    Route::delete('/{userId}/{productId}', [CartController::class, 'remove']);
    Route::delete('/{userId}/clear', [CartController::class, 'clear']);
    Route::post('/{userId}/checkout/{businessId}', [CartController::class, 'checkoutBusiness']);
});

// Event Routes
Route::prefix('events')->group(function () {
    Route::get('/', [EventController::class, 'index']); // Public: only shows active & upcoming events
    Route::get('/all', [EventController::class, 'indexAll']); // Admin: shows all events including expired
    Route::post('/', [EventController::class, 'store']);
    Route::post('register', [EventController::class, 'register']); // MUST BE BEFORE /{id}
    Route::post('register-vendor', [EventController::class, 'registerVendor']); // Register UMKM vendor
    Route::get('user/{userId}', [EventController::class, 'getUserEvents']);
    Route::put('/{id}', [EventController::class, 'update']);
    Route::delete('/{id}', [EventController::class, 'destroy']);
    Route::get('/{id}', [EventController::class, 'show']);
    Route::get('/{id}/participants', [EventController::class, 'getParticipants']);
    Route::get('/{id}/vendors', [EventController::class, 'getVendors']); // Get vendor registrations
    Route::put('/vendors/{id}/status', [EventController::class, 'updateVendorStatus']); // Update vendor status
    Route::post('/event-products', [EventController::class, 'storeEventProduct']); // Store event-exclusive product
    Route::get('/vendors/{vendorId}/event-products', [EventController::class, 'getEventProducts']); // Get event products
    Route::delete('/{eventId}/{userId}', [EventController::class, 'unregister']);
});

// Order Routes (NEW)
Route::prefix('orders')->group(function () {
    Route::post('/', [OrderController::class, 'create']);
    // Specific routes MUST come before parameterized routes
    Route::get('/user/all', [OrderController::class, 'getUserOrders']);
    Route::get('/business/all', [OrderController::class, 'getBusinessOrders']);
    // Parameterized routes come after
    Route::get('/{orderId}', [OrderController::class, 'getDetail']);
    Route::put('/{orderId}/status', [OrderController::class, 'updateStatus']);
    Route::put('/{orderId}/customer-status', [OrderController::class, 'updateStatusByCustomer']);
    Route::post('/{orderId}/customer-status', [OrderController::class, 'updateStatusByCustomer']); // POST for file upload
    Route::get('/{orderId}/whatsapp-link', [OrderController::class, 'getWhatsAppLink']);
});

// Gift Package Routes
Route::prefix('gift-packages')->group(function () {
    Route::get('/', [GiftPackageController::class, 'index']); // Public: active packages
    Route::get('/all', [GiftPackageController::class, 'indexAll']); // Admin: all packages
    Route::get('/pending', [GiftPackageController::class, 'getPending']); // Admin: pending review
    Route::get('/my-packages', [GiftPackageController::class, 'getMyPackages']); // UMKM: own packages
    Route::get('/active-umkm', [GiftPackageController::class, 'getActiveUmkm']); // Admin: dropdown UMKM
    Route::post('/submit', [GiftPackageController::class, 'submit']); // UMKM: submit package
    Route::post('/', [GiftPackageController::class, 'store']); // Admin: create directly
    Route::post('/{id}/approve', [GiftPackageController::class, 'approve']); // Admin: approve
    Route::post('/{id}/reject', [GiftPackageController::class, 'reject']); // Admin: reject
    Route::put('/{id}', [GiftPackageController::class, 'update']);
    Route::delete('/{id}', [GiftPackageController::class, 'destroy']);
});

// UMKM Routes
Route::prefix('umkm')->group(function () {
    Route::put('/{id}/update-image', [UmkmController::class, 'updateImage']);
});

// Notification Routes (NEW)
Route::prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/{id}', [NotificationController::class, 'destroy']);
});

// Image Management Routes (NEW)
Route::prefix('images')->group(function () {
    Route::post('/upload', [ImageController::class, 'upload']);
    Route::post('/update', [ImageController::class, 'update']);
    Route::post('/delete', [ImageController::class, 'delete']);
    Route::post('/info', [ImageController::class, 'info']);
});

// Serve storage files (for bukti pembayaran, etc.)
Route::get('/storage/{folder}/{filename}', function ($folder, $filename) {
    $path = storage_path("app/public/{$folder}/{$filename}");
    
    if (!file_exists($path)) {
        return response()->json(['error' => 'File not found'], 404);
    }
    
    $mimeType = mime_content_type($path);
    return response()->file($path, [
        'Content-Type' => $mimeType,
        'Cache-Control' => 'public, max-age=31536000',
    ]);
})->where('filename', '.*');

// Site Settings Routes (for admin)
Route::get('/site-settings', [\App\Http\Controllers\Api\SiteSettingsController::class, 'index']);
Route::post('/site-settings', [\App\Http\Controllers\Api\SiteSettingsController::class, 'update']);
