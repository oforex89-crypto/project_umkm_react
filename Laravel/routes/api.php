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

// Temporary route to seed dummy UMKM stores
Route::get('/seed-dummy-stores', function () {
    $waNumber = '6281175447460'; // Same WA number for all

    $stores = [
        [
            'nama_toko' => 'Warung Makan Sederhana',
            'nama_pemilik' => 'Budi Santoso',
            'deskripsi' => 'Warung makan khas Jawa Timur menyajikan aneka masakan rumahan dengan cita rasa otentik. Nasi campur, rawon, dan soto ayam menjadi menu andalan kami.',
            'category_id' => 1,
            'foto_toko' => 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
            'products' => [
                ['nama' => 'Nasi Campur Spesial', 'harga' => 25000, 'deskripsi' => 'Nasi campur dengan lauk lengkap pilihan', 'gambar' => 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400'],
                ['nama' => 'Rawon Daging Sapi', 'harga' => 30000, 'deskripsi' => 'Rawon khas Surabaya dengan daging sapi empuk', 'gambar' => 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400'],
                ['nama' => 'Soto Ayam Lamongan', 'harga' => 20000, 'deskripsi' => 'Soto ayam gurih dengan koya dan sambal', 'gambar' => 'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6?w=400'],
            ],
        ],
        [
            'nama_toko' => 'Batik Nusantara',
            'nama_pemilik' => 'Siti Rahayu',
            'deskripsi' => 'Toko batik tulis dan cap berkualitas tinggi dari pengrajin lokal. Tersedia berbagai motif batik tradisional dan modern.',
            'category_id' => 2,
            'foto_toko' => 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
            'products' => [
                ['nama' => 'Batik Tulis Motif Parang', 'harga' => 350000, 'deskripsi' => 'Batik tulis asli dengan motif parang klasik', 'gambar' => 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400'],
                ['nama' => 'Kemeja Batik Modern', 'harga' => 185000, 'deskripsi' => 'Kemeja batik slim fit cocok untuk kerja', 'gambar' => 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400'],
            ],
        ],
        [
            'nama_toko' => 'Kerajinan Tangan Ibu Maria',
            'nama_pemilik' => 'Maria Kristiani',
            'deskripsi' => 'Kerajinan tangan handmade dari bahan-bahan lokal. Aksesori, tas rajut, dan hiasan rumah unik buatan tangan.',
            'category_id' => 3,
            'foto_toko' => 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
            'products' => [
                ['nama' => 'Tas Rajut Handmade', 'harga' => 150000, 'deskripsi' => 'Tas rajut cantik buatan tangan', 'gambar' => 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400'],
                ['nama' => 'Gelang Manik-Manik', 'harga' => 45000, 'deskripsi' => 'Gelang manik-manik warna-warni handmade', 'gambar' => 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400'],
                ['nama' => 'Hiasan Dinding Macrame', 'harga' => 120000, 'deskripsi' => 'Hiasan dinding macrame bohemian style', 'gambar' => 'https://images.unsplash.com/photo-1524549207578-1a08292e1059?w=400'],
            ],
        ],
        [
            'nama_toko' => 'Kopi Nusantara Roastery',
            'nama_pemilik' => 'Agus Prasetyo',
            'deskripsi' => 'Roastery kopi lokal pilihan dari berbagai daerah di Indonesia. Biji kopi segar yang di-roast dengan sempurna.',
            'category_id' => 1,
            'foto_toko' => 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
            'products' => [
                ['nama' => 'Kopi Toraja 250gr', 'harga' => 85000, 'deskripsi' => 'Biji kopi Toraja medium roast', 'gambar' => 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400'],
                ['nama' => 'Kopi Gayo Aceh 250gr', 'harga' => 95000, 'deskripsi' => 'Biji kopi Gayo premium grade', 'gambar' => 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=400'],
                ['nama' => 'Drip Bag Coffee (10 pcs)', 'harga' => 65000, 'deskripsi' => 'Drip bag praktis untuk kopi nikmat di mana saja', 'gambar' => 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'],
            ],
        ],
    ];

    $created = [];
    foreach ($stores as $store) {
        // Check if store already exists
        $existing = \DB::table('tumkm')->where('nama_toko', $store['nama_toko'])->first();
        if ($existing) {
            $created[] = $store['nama_toko'] . ' (already exists)';
            continue;
        }

        $umkmId = \DB::table('tumkm')->insertGetId([
            'nama_toko' => $store['nama_toko'],
            'nama_pemilik' => $store['nama_pemilik'],
            'deskripsi' => $store['deskripsi'],
            'category_id' => $store['category_id'],
            'foto_toko' => $store['foto_toko'],
            'whatsapp' => $waNumber,
            'email' => strtolower(str_replace(' ', '.', $store['nama_pemilik'])) . '@demo.com',
            'status' => 'active',
            'menyediakan_jasa_kirim' => true,
            'nama_bank' => 'BNI',
            'no_rekening' => '4879902571',
            'atas_nama_rekening' => $store['nama_pemilik'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ($store['products'] as $product) {
            \DB::table('tproduk')->insert([
                'umkm_id' => $umkmId,
                'nama_produk' => $product['nama'],
                'harga' => $product['harga'],
                'deskripsi' => $product['deskripsi'],
                'gambar' => $product['gambar'],
                'stok' => rand(10, 100),
                'status' => 'active',
                'approval_status' => 'approved',
                'kategori' => 'product',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $created[] = $store['nama_toko'] . ' (' . count($store['products']) . ' products)';
    }

    return response()->json([
        'success' => true,
        'message' => 'Dummy stores created',
        'stores' => $created,
    ]);
});

// TEMPORARY: Add google_id and last_login_at to users table - REMOVE AFTER USE
Route::get('/setup-users-columns', function () {
    try {
        $results = [];
        
        if (!\Illuminate\Support\Facades\Schema::hasColumn('users', 'google_id')) {
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL AFTER foto_profil");
            $results[] = 'google_id added';
        } else {
            $results[] = 'google_id already exists';
        }
        
        if (!\Illuminate\Support\Facades\Schema::hasColumn('users', 'last_login_at')) {
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL AFTER status");
            $results[] = 'last_login_at added';
        } else {
            $results[] = 'last_login_at already exists';
        }
        
        return response()->json(['success' => true, 'results' => $results]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
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
    Route::post('google', [AuthController::class, 'loginWithGoogle']); // Login/Register with Google
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
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
    
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

// Serve uploaded files (toko photos, products, site logo, etc.)
// PHP built-in server doesn't reliably serve static files on Railway
Route::get('/uploads/{path}', function ($path) {
    $filePath = public_path("uploads/{$path}");
    
    if (!file_exists($filePath)) {
        \Log::warning("Upload file not found: uploads/{$path}");
        return response()->json(['error' => 'File not found'], 404);
    }
    
    $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';
    return response()->file($filePath, [
        'Content-Type' => $mimeType,
        'Cache-Control' => 'public, max-age=31536000',
        'Access-Control-Allow-Origin' => '*',
    ]);
})->where('path', '.*');

// TEMPORARY: Cleanup duplicate categories - REMOVE AFTER USE
Route::get('/cleanup-duplicate-categories', function () {
    try {
        // Find duplicate categories (same id, same nama_kategori)
        $duplicates = \Illuminate\Support\Facades\DB::select("
            SELECT id, nama_kategori, COUNT(*) as cnt 
            FROM categories 
            GROUP BY id, nama_kategori 
            HAVING COUNT(*) > 1
        ");
        
        $deletedCount = 0;
        
        foreach ($duplicates as $dup) {
            // Keep the first row (by internal rowid), delete the rest
            // Get all rows with this id and nama_kategori
            $rows = \Illuminate\Support\Facades\DB::table('categories')
                ->where('id', $dup->id)
                ->where('nama_kategori', $dup->nama_kategori)
                ->get();
            
            // Skip the first one, delete the rest
            $skip = true;
            foreach ($rows as $row) {
                if ($skip) {
                    $skip = false;
                    continue;
                }
                \Illuminate\Support\Facades\DB::table('categories')
                    ->where('id', $row->id)
                    ->where('nama_kategori', $row->nama_kategori)
                    ->limit(1)
                    ->delete();
                $deletedCount++;
            }
        }
        
        // Verify after cleanup
        $remaining = \Illuminate\Support\Facades\DB::table('categories')->get();
        
        return response()->json([
            'success' => true,
            'message' => "Cleanup complete. Deleted {$deletedCount} duplicate category rows.",
            'duplicates_found' => count($duplicates),
            'deleted_count' => $deletedCount,
            'remaining_categories' => $remaining
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

