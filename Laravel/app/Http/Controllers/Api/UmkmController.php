<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Tumkm;
use App\Models\Tproduk;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;


class UmkmController extends Controller
{
    public function submit(Request $request)
    {
        try {
            $userId = $request->header('X-User-ID');

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided'
                ], 400);
            }

            // Validate user exists and has UMKM role
            $user = User::find($userId);
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            if ($user->role !== 'umkm') {
                return response()->json([
                    'success' => false,
                    'message' => 'User must have UMKM role to submit a store'
                ], 403);
            }

            // Debug log - check what fields are received
            \Log::info('UMKM Submit - Received data:', [
                'paroki' => $request->paroki,
                'umat' => $request->umat,
                'nama_bank' => $request->nama_bank,
                'no_rekening' => $request->no_rekening,
                'atas_nama_rekening' => $request->atas_nama_rekening,
                'menyediakan_jasa_kirim' => $request->menyediakan_jasa_kirim,
                'has_dokumen' => $request->hasFile('dokumen_perjanjian'),
            ]);

            // Validate request
            $validator = Validator::make($request->all(), [
                'nama_toko' => 'required|string|max:255',
                'nama_pemilik' => 'required|string|max:255',
                'deskripsi' => 'required|string',
                'foto_toko' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048',
                'dokumen_perjanjian' => 'nullable|mimes:pdf,doc,docx,jpeg,jpg,png|max:10240', // Allow document files
                'kategori_id' => 'nullable', // Allow any type, will be converted to string
                'kategori' => 'nullable|string|max:100', // Category name from frontend
                'whatsapp' => 'nullable|string|max:20',
                'telepon' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'instagram' => 'nullable|string|max:100',
                'about_me' => 'nullable|string|max:1000',
                'paroki' => 'nullable|string|max:255',
                'umat' => 'nullable|string|max:255',
                'nama_bank' => 'nullable|string|max:100',
                'no_rekening' => 'nullable|string|max:50',
                'atas_nama_rekening' => 'nullable|string|max:255',
                'menyediakan_jasa_kirim' => 'nullable|in:0,1,true,false',
                'produk' => 'required|string', // JSON string
            ]);

            if ($validator->fails()) {
                \Log::error('UMKM Submit Validation Failed', [
                    'errors' => $validator->errors()->toArray(),
                    'input' => $request->except(['foto_toko', 'produk_image_0', 'produk_image_1']),
                    'all_input' => $request->all()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Generate kodepengguna from user_id
            $kodepengguna = 'U' . str_pad($userId, 3, '0', STR_PAD_LEFT);

            // Map category name to kategori_id
            $kategoriId = '1'; // Default
            if ($request->kategori_id) {
                $kategoriId = (string)$request->kategori_id;
            } elseif ($request->kategori) {
                // Map category name to ID from database
                $category = DB::table('categories')
                    ->where('nama_kategori', 'like', '%' . $request->kategori . '%')
                    ->first();
                if ($category) {
                    $kategoriId = (string)$category->id;
                } else {
                    // Fallback mapping for common category names
                    $categoryMapping = [
                        'Fashion' => '1',
                        'Kerajinan' => '2',
                        'Kuliner' => '3',
                        'Kecantikan' => '4',
                        'Aksesoris' => '5',
                        'UMKM' => '6',
                    ];
                    $kategoriId = $categoryMapping[$request->kategori] ?? '1';
                }
            }
            
            // Note: tpengguna table is now for event visitors only
            // No need to insert into tpengguna for UMKM submissions

            // Parse products from JSON string
            $produkArray = json_decode($request->produk, true);
            if (!$produkArray || !is_array($produkArray) || count($produkArray) < 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'At least one product is required'
                ], 422);
            }

            // Handle foto_toko upload
            $fotoTokoPath = null;
            if ($request->hasFile('foto_toko')) {
                $file = $request->file('foto_toko');
                $sanitizedName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $request->nama_toko);
                $filename = 'toko_' . $sanitizedName . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('uploads/toko'), $filename);
                $fotoTokoPath = 'uploads/toko/' . $filename;
            }

            // Handle dokumen_perjanjian upload
            $dokumenPath = null;
            if ($request->hasFile('dokumen_perjanjian')) {
                $file = $request->file('dokumen_perjanjian');
                $sanitizedName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $request->nama_toko);
                $filename = 'perjanjian_' . $sanitizedName . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('uploads/dokumen'), $filename);
                $dokumenPath = 'uploads/dokumen/' . $filename;
            }

            // Check if user already has UMKM store
            $umkm = Tumkm::where('user_id', $userId)->first();

            if ($umkm) {
                // Update existing UMKM store
                $updateData = [
                    'nama_toko' => $request->nama_toko,
                    'nama_pemilik' => $request->nama_pemilik,
                    'deskripsi' => $request->deskripsi,
                    'kategori_id' => $kategoriId,
                    'status' => 'pending', // Reset to pending when resubmitting
                ];
                
                if ($fotoTokoPath) {
                    $updateData['foto_toko'] = $fotoTokoPath;
                }
                
                if ($dokumenPath) {
                    $updateData['dokumen_perjanjian'] = $dokumenPath;
                }
                
                if ($request->whatsapp) $updateData['whatsapp'] = $request->whatsapp;
                if ($request->telepon) $updateData['telepon'] = $request->telepon;
                if ($request->email) $updateData['email'] = $request->email;
                if ($request->instagram) $updateData['instagram'] = $request->instagram;
                if ($request->about_me) $updateData['about_me'] = $request->about_me;
                if ($request->paroki) $updateData['paroki'] = $request->paroki;
                if ($request->umat) $updateData['umat'] = $request->umat;
                if ($request->nama_bank) $updateData['nama_bank'] = $request->nama_bank;
                if ($request->no_rekening) $updateData['no_rekening'] = $request->no_rekening;
                if ($request->atas_nama_rekening) $updateData['atas_nama_rekening'] = $request->atas_nama_rekening;
                $updateData['menyediakan_jasa_kirim'] = filter_var($request->menyediakan_jasa_kirim, FILTER_VALIDATE_BOOLEAN);

                $umkm->update($updateData);
            } else {
                // Create new UMKM store
                $createData = [
                    'user_id' => $userId,
                    'nama_toko' => $request->nama_toko,
                    'nama_pemilik' => $request->nama_pemilik,
                    'deskripsi' => $request->deskripsi,
                    'kategori_id' => $kategoriId,
                    'status' => 'pending',
                ];
                
                if ($fotoTokoPath) {
                    $createData['foto_toko'] = $fotoTokoPath;
                }
                
                if ($dokumenPath) {
                    $createData['dokumen_perjanjian'] = $dokumenPath;
                }
                
                if ($request->whatsapp) $createData['whatsapp'] = $request->whatsapp;
                if ($request->telepon) $createData['telepon'] = $request->telepon;
                if ($request->email) $createData['email'] = $request->email;
                if ($request->instagram) $createData['instagram'] = $request->instagram;
                if ($request->about_me) $createData['about_me'] = $request->about_me;
                if ($request->paroki) $createData['paroki'] = $request->paroki;
                if ($request->umat) $createData['umat'] = $request->umat;
                if ($request->nama_bank) $createData['nama_bank'] = $request->nama_bank;
                if ($request->no_rekening) $createData['no_rekening'] = $request->no_rekening;
                if ($request->atas_nama_rekening) $createData['atas_nama_rekening'] = $request->atas_nama_rekening;
                $createData['menyediakan_jasa_kirim'] = filter_var($request->menyediakan_jasa_kirim, FILTER_VALIDATE_BOOLEAN);

                $umkm = Tumkm::create($createData);
            }

            // Save products to tproduk table
            // First, delete old products for this UMKM
            DB::table('tproduk')->where('umkm_id', $umkm->id)->delete();

            // Insert new products
            foreach ($produkArray as $index => $produk) {
                // Handle product image from separate file upload
                $gambarPath = null;
                $imageKey = 'produk_image_' . $index;
                
                if ($request->hasFile($imageKey)) {
                    $file = $request->file($imageKey);
                    $sanitizedName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $produk['nama_produk'] ?? 'product');
                    $filename = 'product_' . $umkm->id . '_' . $index . '_' . time() . '.' . $file->getClientOriginalExtension();
                    
                    if (!file_exists(public_path('uploads/products'))) {
                        mkdir(public_path('uploads/products'), 0777, true);
                    }
                    
                    $file->move(public_path('uploads/products'), $filename);
                    $gambarPath = 'uploads/products/' . $filename;
                    \Log::info("Product image uploaded", ['path' => $gambarPath, 'umkm_id' => $umkm->id]);
                } elseif (!empty($produk['gambar'])) {
                    // Fallback: handle base64 image if sent in JSON
                    if (strpos($produk['gambar'], 'data:image') === 0) {
                        $image = $produk['gambar'];
                        $image = str_replace('data:image/png;base64,', '', $image);
                        $image = str_replace('data:image/jpg;base64,', '', $image);
                        $image = str_replace('data:image/jpeg;base64,', '', $image);
                        $image = str_replace(' ', '+', $image);
                        $imageName = 'product_' . $umkm->id . '_' . $index . '_' . time() . '.png';
                        
                        $imagePath = public_path('uploads/products/' . $imageName);
                        if (!file_exists(public_path('uploads/products'))) {
                            mkdir(public_path('uploads/products'), 0777, true);
                        }
                        file_put_contents($imagePath, base64_decode($image));
                        $gambarPath = 'uploads/products/' . $imageName;
                        \Log::info("Base64 image saved", ['path' => $gambarPath]);
                    } else {
                        $gambarPath = $produk['gambar'];
                    }
                }
                
                // For new tproduk table structure: umkm_id, nama_produk, deskripsi, harga, kategori, stok, gambar, status
                DB::table('tproduk')->insert([
                    'umkm_id' => $umkm->id,
                    'nama_produk' => $produk['nama_produk'] ?? $produk['nama'] ?? '',
                    'deskripsi' => $produk['deskripsi'] ?? '',
                    'harga' => $produk['harga'] ?? 0,
                    'kategori' => $produk['kategori'] ?? 'product',
                    'stok' => $produk['stok'] ?? 0,
                    'gambar' => $gambarPath,
                    'status' => 'pending', // Products start as pending, waiting for admin approval
                    'approval_status' => 'pending', // Track approval status separately
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::commit();

            // Notify admins about new UMKM registration
            try {
                $productCount = count($produkArray);
                $whatsappNumber = $request->whatsapp ?? '';
                
                // Send in-app notifications to all admins
                NotificationService::notifyAdminNewUmkm(
                    $request->nama_toko,
                    $request->nama_pemilik,
                    $productCount
                );
                
                // Send WhatsApp notification to admin
                NotificationService::sendWhatsAppToAdmin(
                    $request->nama_toko,
                    $request->nama_pemilik,
                    $whatsappNumber,
                    $productCount
                );
                
                \Log::info("Admin notifications sent for new UMKM: " . $request->nama_toko);
            } catch (\Exception $notifError) {
                // Don't fail the submission if notification fails
                \Log::warning("Failed to send admin notifications: " . $notifError->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'UMKM store submitted successfully',
                'data' => $umkm
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create UMKM store',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function index(Request $request)
    {
        try {
            $umkm = Tumkm::with(['user', 'category', 'products'])
                ->where('status', 'active')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $umkm
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch UMKM stores',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $umkm = Tumkm::with(['user', 'category', 'products.images'])
                ->where('id', $id)
                ->first();

            if (!$umkm) {
                return response()->json([
                    'success' => false,
                    'message' => 'UMKM store not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $umkm
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch UMKM store',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getPending()
    {
        try {
            $umkm = Tumkm::with(['user', 'category'])
                ->where('status', 'pending')
                ->orderBy('created_at', 'desc')
                ->get();

            // Transform to array and manually add products
            $result = [];
            foreach ($umkm as $store) {
                $storeArray = $store->toArray();
                
                // Explicitly add fields that may not be in toArray() due to schema caching
                // Get raw data from database to ensure all fields are included
                $rawStore = DB::table('tumkm')->where('id', $store->id)->first();
                \Log::info("getPending DEBUG - Store ID: {$store->id}, rawStore: " . ($rawStore ? 'FOUND' : 'NULL'));
                if ($rawStore) {
                    \Log::info("getPending DEBUG - rawStore paroki: " . ($rawStore->paroki ?? 'PROPERTY NULL'));
                    $storeArray['paroki'] = $rawStore->paroki ?? null;
                    $storeArray['umat'] = $rawStore->umat ?? null;
                    $storeArray['nama_bank'] = $rawStore->nama_bank ?? null;
                    $storeArray['no_rekening'] = $rawStore->no_rekening ?? null;
                    $storeArray['atas_nama_rekening'] = $rawStore->atas_nama_rekening ?? null;
                    $storeArray['dokumen_perjanjian'] = $rawStore->dokumen_perjanjian ?? null;
                    $storeArray['menyediakan_jasa_kirim'] = $rawStore->menyediakan_jasa_kirim ?? false;
                    $storeArray['about_me'] = $rawStore->about_me ?? null;
                    \Log::info("getPending DEBUG - after assignment paroki: " . ($storeArray['paroki'] ?? 'ARRAY KEY NULL'));
                }
                
                // Manually load products using direct DB query
                $products = DB::table('tproduk')
                    ->where('umkm_id', $store->id)
                    ->get()
                    ->toArray();
                
                $storeArray['products'] = $products;
                $result[] = $storeArray;
                
                \Log::info("Store {$store->id} ({$store->nama_toko}) has " . count($products) . " products");
            }

            return response()->json([
                'success' => true,
                'data' => $result
            ], 200);
        } catch (\Exception $e) {
            \Log::error("getPending error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending UMKM stores',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function approveStore($id)
    {
        try {
            $umkm = Tumkm::find($id);

            if (!$umkm) {
                return response()->json([
                    'success' => false,
                    'message' => 'UMKM store not found'
                ], 404);
            }

            $umkm->update(['status' => 'active']);

            return response()->json([
                'success' => true,
                'message' => 'UMKM store approved successfully',
                'data' => $umkm
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve UMKM store',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function rejectStore(Request $request, $id)
    {
        try {
            $umkm = Tumkm::find($id);

            if (!$umkm) {
                return response()->json([
                    'success' => false,
                    'message' => 'UMKM store not found'
                ], 404);
            }

            // Get rejection reason from request
            $reason = $request->input('reason') ?? $request->input('comment') ?? 'Pengajuan toko ditolak oleh admin';
            $adminId = $request->header('X-User-ID', 1);

            DB::beginTransaction();

            // 1. Reject the store
            $umkm->update(['status' => 'rejected']);

            // 2. Auto-reject all products in this store
            DB::table('tproduk')
                ->where('umkm_id', $id)
                ->update([
                    'status' => 'inactive',
                    'approval_status' => 'rejected',
                    'updated_at' => now()
                ]);

            // 3. Save rejection comment
            DB::table('umkm_rejection_comments')->insert([
                'kodepengguna' => $umkm->user_id,
                'comment' => $reason,
                'status' => 'rejected',
                'admin_id' => $adminId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            \Log::info("UMKM store rejected with all products", [
                'umkm_id' => $id,
                'reason' => $reason
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Toko dan semua produk berhasil ditolak',
                'data' => $umkm
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("rejectStore error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject UMKM store',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getUserStore(Request $request)
    {
        try {
            $userId = $request->header('X-User-ID');

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided'
                ], 400);
            }

            $umkm = Tumkm::with(['category', 'products'])
                ->where('user_id', $userId)
                ->first();

            return response()->json([
                'success' => true,
                'data' => $umkm
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user UMKM store',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateStore(Request $request, $id)
    {
        try {
            $userId = $request->header('X-User-ID');

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided'
                ], 400);
            }

            $umkm = Tumkm::where('id', $id)
                ->where('user_id', $userId)
                ->first();

            if (!$umkm) {
                return response()->json([
                    'success' => false,
                    'message' => 'UMKM store not found or unauthorized'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'nama_toko' => 'nullable|string|max:255',
                'nama_pemilik' => 'nullable|string|max:255',
                'deskripsi' => 'nullable|string',
                'foto_toko' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048',
                'whatsapp' => 'nullable|string|max:20',
                'telepon' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'instagram' => 'nullable|string|max:100',
                'about_me' => 'nullable|string',
                'nama_bank' => 'nullable|string|max:100',
                'no_rekening' => 'nullable|string|max:50',
                'atas_nama_rekening' => 'nullable|string|max:255',
                'menyediakan_jasa_kirim' => 'nullable|in:0,1,true,false',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Handle file upload
            $updateData = $request->only([
                'nama_toko',
                'nama_pemilik',
                'deskripsi',
                'whatsapp',
                'telepon',
                'email',
                'instagram',
                'about_me',
                'nama_bank',
                'no_rekening',
                'atas_nama_rekening'
            ]);

            // Handle menyediakan_jasa_kirim boolean
            if ($request->has('menyediakan_jasa_kirim')) {
                $updateData['menyediakan_jasa_kirim'] = filter_var($request->menyediakan_jasa_kirim, FILTER_VALIDATE_BOOLEAN);
            }

            if ($request->hasFile('foto_toko')) {
                \Log::info('📸 New image file received: ' . $request->file('foto_toko')->getClientOriginalName());

                // Delete old image if exists
                if ($umkm->foto_toko && file_exists(public_path($umkm->foto_toko))) {
                    \Log::info('🗑️ Deleting old image: ' . $umkm->foto_toko);
                    unlink(public_path($umkm->foto_toko));
                }

                // Save new image
                $file = $request->file('foto_toko');
                $sanitizedName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $request->nama_toko ?? 'toko');
                $filename = 'toko_' . $sanitizedName . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('uploads/toko'), $filename);
                $updateData['foto_toko'] = 'uploads/toko/' . $filename;
                \Log::info('✅ Image saved: ' . $updateData['foto_toko']);
            } else {
                \Log::info('ℹ️ No new image file in request');
            }

            $umkm->update($updateData);

            // Reverse sync: UMKM → User profile
            if ($umkm->user_id) {
                $userUpdate = [];
                if (isset($updateData['whatsapp']) && $updateData['whatsapp']) {
                    $userUpdate['no_telepon'] = $updateData['whatsapp'];
                }
                if (isset($updateData['nama_pemilik']) && $updateData['nama_pemilik']) {
                    $userUpdate['nama_lengkap'] = $updateData['nama_pemilik'];
                }
                if (!empty($userUpdate)) {
                    User::where('id', $umkm->user_id)->update($userUpdate);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'UMKM store updated successfully',
                'data' => $umkm->load(['category', 'products'])
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update UMKM store',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateProduct(Request $request, $id)
    {
        try {
            $userId = $request->header('X-User-ID');

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided'
                ], 400);
            }

            $product = Tproduk::where('id', $id)->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            // Verify ownership through UMKM
            $umkm = Tumkm::where('id', $product->umkm_id)
                ->where('user_id', $userId)
                ->first();

            if (!$umkm) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to update this product'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'nama_produk' => 'nullable|string|max:255',
                'deskripsi' => 'nullable|string',
                'harga' => 'nullable|numeric|min:0',
                'kategori' => 'nullable|string|max:50',
                'gambar' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Handle file upload
            $updateData = $request->only([
                'nama_produk',
                'deskripsi',
                'harga',
                'kategori'
            ]);

            if ($request->hasFile('gambar')) {
                // Delete old image if exists
                if ($product->gambar && file_exists(public_path($product->gambar))) {
                    unlink(public_path($product->gambar));
                }

                // Save new image
                $file = $request->file('gambar');
                $sanitizedName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $request->nama_produk ?? 'produk');
                $filename = 'produk_' . $sanitizedName . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('uploads/produk'), $filename);
                $updateData['gambar'] = 'uploads/produk/' . $filename;
            }

            $product->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Product updated successfully',
                'data' => $product
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve UMKM store with option to reject specific products
     */
    public function approveStoreWithProducts(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'umkm_comment' => 'nullable|string',
                'umkm_action' => 'required|in:approve,reject',
                'products' => 'required|array',
                'products.*.kodeproduk' => 'nullable|string',
                'products.*.id' => 'nullable|integer',
                'products.*.action' => 'required|in:approve,reject',
                'products.*.comment' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $umkm = Tumkm::find($id);
            if (!$umkm) {
                return response()->json([
                    'success' => false,
                    'message' => 'UMKM store not found'
                ], 404);
            }

            // Count approved products
            $approvedCount = 0;
            $rejectedCount = 0;
            
            foreach ($request->products as $productData) {
                if ($productData['action'] === 'approve') {
                    $approvedCount++;
                } else {
                    $rejectedCount++;
                }
            }

            // Logic: Jika ada minimal 1 produk approved, toko bisa disetujui
            // Jika semua produk ditolak, toko otomatis ditolak
            $finalUmkmStatus = 'pending';
            
            if ($request->umkm_action === 'reject') {
                // Admin explicitly reject the store
                $finalUmkmStatus = 'rejected';
            } else if ($approvedCount > 0) {
                // Ada produk yang di-approve, toko bisa aktif
                $finalUmkmStatus = 'active';
            } else {
                // Semua produk ditolak, toko tidak bisa aktif
                $finalUmkmStatus = 'rejected';
            }

            $umkm->update(['status' => $finalUmkmStatus]);

            // Save UMKM rejection comment if rejected
            if ($finalUmkmStatus === 'rejected' && $request->umkm_comment) {
                DB::table('umkm_rejection_comments')->insert([
                    'kodepengguna' => $umkm->user_id,
                    'comment' => $request->umkm_comment,
                    'status' => 'rejected',
                    'admin_id' => $request->header('X-User-ID', 1),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Process each product
            foreach ($request->products as $productData) {
                // Get product ID (support both id and kodeproduk for compatibility)
                $productId = $productData['id'] ?? null;
                
                if (!$productId) {
                    continue;
                }

                $product = DB::table('tproduk')->where('id', $productId)->first();

                if ($product) {
                    if ($productData['action'] === 'approve') {
                        // Approve product - set status active
                        DB::table('tproduk')
                            ->where('id', $productId)
                            ->update([
                                'status' => 'active',
                                'approval_status' => 'approved',
                                'updated_at' => now()
                            ]);
                    } else {
                        // Reject product - set status inactive
                        DB::table('tproduk')
                            ->where('id', $productId)
                            ->update([
                                'status' => 'inactive',
                                'approval_status' => 'rejected',
                                'updated_at' => now()
                            ]);

                        // Save product rejection comment
                        if (!empty($productData['comment'])) {
                            DB::table('product_rejection_comments')->insert([
                                'kodeproduk' => 'P' . $productId,
                                'kodepengguna' => 'U' . $umkm->user_id,
                                'comment' => $productData['comment'],
                                'status' => 'rejected',
                                'admin_id' => $request->header('X-User-ID', 1),
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }
            }

            DB::commit();

            // Prepare response message
            $message = '';
            if ($finalUmkmStatus === 'active') {
                if ($rejectedCount > 0) {
                    $message = "Toko disetujui dengan {$approvedCount} produk. {$rejectedCount} produk ditolak dan perlu diperbaiki.";
                } else {
                    $message = 'Toko dan semua produk berhasil disetujui!';
                }
            } else if ($finalUmkmStatus === 'rejected') {
                if ($request->umkm_action === 'reject') {
                    $message = 'Toko ditolak oleh admin.';
                } else {
                    $message = 'Toko ditolak karena semua produk ditolak. User dapat memperbaiki produk dan mengajukan kembali.';
                }
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'umkm_status' => $finalUmkmStatus,
                    'approved_products' => $approvedCount,
                    'rejected_products' => $rejectedCount,
                ]
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to process UMKM approval',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get rejection comments for a user's UMKM and products
     */
    public function getRejectionComments(Request $request)
    {
        try {
            $userId = $request->header('X-User-ID');
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided'
                ], 400);
            }

            \Log::info("Getting rejection comments for user ID: $userId");

            // Get user's UMKM
            $umkm = DB::table('tumkm')->where('user_id', $userId)->first();

            $result = [
                'umkm_comments' => [],
                'product_comments' => []
            ];

            if (!$umkm) {
                \Log::info("No UMKM found for user $userId");
                return response()->json([
                    'success' => true,
                    'data' => $result,
                    'message' => 'No UMKM found for this user'
                ]);
            }

            \Log::info("UMKM found: ID {$umkm->id}, Name: {$umkm->nama_toko}");

            // Get UMKM rejection comments - include store name and image
            $umkmComments = DB::table('umkm_rejection_comments')
                ->where('kodepengguna', $userId)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($comment) use ($umkm) {
                    $comment->nama_toko = $umkm->nama_toko;
                    $comment->foto_toko = $umkm->foto_toko;
                    return $comment;
                });

            \Log::info("UMKM comments found: " . $umkmComments->count());

            $result['umkm_comments'] = $umkmComments;

            // Get product rejection comments for this user's products
            $productComments = DB::table('product_rejection_comments as prc')
                ->join('tproduk as p', function($join) {
                    $join->on('prc.kodeproduk', '=', DB::raw("CONCAT('P', p.id)"));
                })
                ->where('p.umkm_id', $umkm->id)
                ->select(
                    'prc.*',
                    'p.nama_produk',
                    'p.id as product_id',
                    'p.gambar as product_image'
                )
                ->orderBy('prc.created_at', 'desc')
                ->get();

            \Log::info("Product comments found: " . $productComments->count());

            $result['product_comments'] = $productComments;

            return response()->json([
                'success' => true,
                'data' => $result
            ], 200);

        } catch (\Exception $e) {
            \Log::error("Error in getRejectionComments: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch rejection comments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add new product to approved UMKM store
     */
    public function addProduct(Request $request)
    {
        try {
            $userId = $request->header('X-User-ID');
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided'
                ], 400);
            }

            // Check if user has approved UMKM (using new structure)
            $umkm = DB::table('tumkm')
                ->where('user_id', $userId)
                ->where('status', 'active')
                ->first();

            if (!$umkm) {
                return response()->json([
                    'success' => false,
                    'message' => 'You must have an approved UMKM store to add products'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'nama_produk' => 'required|string|max:255',
                'harga' => 'required|numeric|min:0',
                'deskripsi' => 'nullable|string',
                'stok' => 'nullable|integer|min:0',
                'kategori' => 'nullable|string|max:50',
                'gambar' => 'nullable|image|mimes:jpeg,jpg,png,gif,webp|max:2048',
            'gambar_tambahan.*' => 'nullable|image|mimes:jpeg,jpg,png,gif,webp|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Handle image upload
            $gambarPath = null;
            if ($request->hasFile('gambar')) {
                $file = $request->file('gambar');
                $sanitizedName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $request->nama_produk);
                $filename = 'product_' . $umkm->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                
                if (!file_exists(public_path('uploads/products'))) {
                    mkdir(public_path('uploads/products'), 0777, true);
                }
                
                $file->move(public_path('uploads/products'), $filename);
                $gambarPath = 'uploads/products/' . $filename;
            }

            // Create product with pending status (needs admin approval)
            $productId = DB::table('tproduk')->insertGetId([
                'umkm_id' => $umkm->id,
                'nama_produk' => $request->nama_produk,
                'harga' => $request->harga,
                'stok' => $request->stok ?? 0,
                'deskripsi' => $request->deskripsi ?? '',
                'gambar' => $gambarPath,
                'kategori' => $request->kategori ?? 'product',
                'approval_status' => 'pending',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Handle additional images
            if ($request->hasFile('gambar_tambahan')) {
                $extraFiles = $request->file('gambar_tambahan');
                $sortOrder = 1;
                foreach ($extraFiles as $extraFile) {
                    $extraFilename = 'product_' . $umkm->id . '_' . time() . '_' . $sortOrder . '.' . $extraFile->getClientOriginalExtension();
                    $extraFile->move(public_path('uploads/products'), $extraFilename);
                    
                    DB::table('product_images')->insert([
                        'product_id' => $productId,
                        'image_path' => 'uploads/products/' . $extraFilename,
                        'sort_order' => $sortOrder,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $sortOrder++;
                }
            }

            $product = DB::table('tproduk')->where('id', $productId)->first();
            $extraImages = DB::table('product_images')->where('product_id', $productId)->orderBy('sort_order')->pluck('image_path')->toArray();

            $allImages = [];
            if ($product->gambar) {
                $allImages[] = $product->gambar;
            }
            $allImages = array_merge($allImages, $extraImages);

            // Handle variants
            if ($request->has('variants')) {
                $variants = is_string($request->variants) ? json_decode($request->variants, true) : $request->variants;
                if ($variants && is_array($variants)) {
                    $globalOptIdx = 0; // tracks flat index across all options for variant_images matching
                    foreach ($variants as $typeIndex => $variantType) {
                        $typeId = DB::table('product_variant_types')->insertGetId([
                            'product_id' => $productId,
                            'name' => $variantType['name'],
                            'display_order' => $typeIndex,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        if (isset($variantType['options']) && is_array($variantType['options'])) {
                            foreach ($variantType['options'] as $optIndex => $option) {
                                // Handle variant option image upload
                                $optionImagePath = null;
                                if ($request->hasFile("variant_images.$globalOptIdx")) {
                                    $vFile = $request->file("variant_images.$globalOptIdx");
                                    if (!file_exists(public_path('uploads/variants'))) {
                                        mkdir(public_path('uploads/variants'), 0777, true);
                                    }
                                    $vFilename = 'variant_' . $productId . '_' . $typeIndex . '_' . $optIndex . '_' . time() . '.' . $vFile->getClientOriginalExtension();
                                    $vFile->move(public_path('uploads/variants'), $vFilename);
                                    $optionImagePath = 'uploads/variants/' . $vFilename;
                                }

                                DB::table('product_variant_options')->insert([
                                    'variant_type_id' => $typeId,
                                    'value' => $option['value'],
                                    'image' => $optionImagePath,
                                    'price_adjustment' => $option['price_adjustment'] ?? 0,
                                    'stock' => $option['stock'] ?? null,
                                    'display_order' => $optIndex,
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                                $globalOptIdx++;
                            }
                        }
                    }
                }
            }

            $productData = (array) $product;
            $productData['images'] = $allImages;

            \Log::info("New product added", ['product_id' => $productId, 'umkm_id' => $umkm->id, 'user_id' => $userId, 'total_images' => count($allImages)]);

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil ditambahkan. Menunggu persetujuan admin.',
                'data' => $productData
            ], 201);

        } catch (\Exception $e) {
            \Log::error("Error adding product: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to add product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all pending products for admin review
     */
    public function getPendingProducts(Request $request)
    {
        try {
            $products = DB::table('tproduk')
                ->join('tumkm', 'tproduk.umkm_id', '=', 'tumkm.id')
                ->where('tproduk.approval_status', 'pending')
                ->where('tumkm.status', 'active') // Only from approved stores!
                ->whereRaw('LOWER(COALESCE(tproduk.kategori, \'\')) != ?', ['paket']) // Exclude gift packages
                ->select(
                    'tproduk.id',
                    'tproduk.nama_produk',
                    'tproduk.harga',
                    'tproduk.stok',
                    'tproduk.deskripsi',
                    'tproduk.gambar',
                    'tproduk.kategori',
                    'tproduk.status',
                    'tproduk.approval_status',
                    'tumkm.nama_toko',
                    'tumkm.nama_pemilik',
                    'tumkm.id as umkm_id'
                )
                ->get();

            return response()->json([
                'success' => true,
                'data' => $products
            ]);

        } catch (\Exception $e) {
            \Log::error("Error fetching pending products: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve a pending product
     */
    public function approveProduct($id)
    {
        try {
            // Find product by ID (not kodeproduk)
            $product = DB::table('tproduk')->where('id', $id)->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            DB::table('tproduk')
                ->where('id', $id)
                ->update([
                    'approval_status' => 'approved',
                    'status' => 'active',
                    'updated_at' => now()
                ]);

            \Log::info("Product approved", ['product_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Product approved successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error("Error approving product: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resubmit rejected UMKM store for review
     */
    public function resubmitStore(Request $request, $id)
    {
        try {
            $store = DB::table('tumkm')->where('id', $id)->first();

            if (!$store) {
                return response()->json([
                    'success' => false,
                    'message' => 'Store not found'
                ], 404);
            }

            // Check if store belongs to user
            $userId = $request->header('X-User-ID');
            if ($store->user_id != $userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Check if store is rejected
            if ($store->status !== 'rejected') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only rejected stores can be resubmitted'
                ], 400);
            }

            // Build update data - only include fields if provided
            $updateData = [
                'status' => 'pending', // Set back to pending for review
                'updated_at' => now()
            ];

            // Add store data fields if provided
            if ($request->has('nama_toko')) {
                $updateData['nama_toko'] = $request->input('nama_toko');
            }
            if ($request->has('nama_pemilik')) {
                $updateData['nama_pemilik'] = $request->input('nama_pemilik');
            }
            if ($request->has('alamat_toko') || $request->has('alamat')) {
                $updateData['alamat'] = $request->input('alamat_toko') ?? $request->input('alamat');
            }
            if ($request->has('whatsapp')) {
                $updateData['whatsapp'] = $request->input('whatsapp');
            }
            
            // Update basic fields first
            DB::table('tumkm')->where('id', $id)->update($updateData);
            
            // Try to update optional fields (may not exist in all database schemas)
            $optionalFields = [];
            if ($request->has('paroki')) {
                $optionalFields['paroki'] = $request->input('paroki');
            }
            if ($request->has('umat')) {
                $optionalFields['umat'] = $request->input('umat');
            }
            if ($request->has('nama_bank')) {
                $optionalFields['nama_bank'] = $request->input('nama_bank');
            }
            if ($request->has('no_rekening')) {
                $optionalFields['no_rekening'] = $request->input('no_rekening');
            }
            if ($request->has('atas_nama')) {
                $optionalFields['atas_nama'] = $request->input('atas_nama');
            }
            if ($request->has('about')) {
                $optionalFields['about'] = $request->input('about');
            }
            if ($request->has('jasa_kirim')) {
                $optionalFields['jasa_kirim'] = $request->boolean('jasa_kirim') ? 1 : 0;
            }
            
            // Try to update optional fields one by one
            foreach ($optionalFields as $field => $value) {
                try {
                    DB::table('tumkm')->where('id', $id)->update([$field => $value]);
                } catch (\Exception $e) {
                    \Log::info("Could not update field $field: " . $e->getMessage());
                }
            }

            // Delete rejection comments since store is being resubmitted
            try {
                DB::table('rejection_comments')
                    ->where('kodepengguna', 'U' . $store->user_id)
                    ->delete();
            } catch (\Exception $e) {
                // Ignore if table doesn't exist
                \Log::info("Could not delete rejection comments: " . $e->getMessage());
            }

            // Also reset all products back to pending for re-review
            $productsUpdated = DB::table('tproduk')
                ->where('umkm_id', $id)
                ->update([
                    'status' => 'active',
                    'approval_status' => 'pending',
                    'updated_at' => now()
                ]);

            // Delete product rejection comments too
            try {
                $productIds = DB::table('tproduk')->where('umkm_id', $id)->pluck('id');
                if ($productIds->count() > 0) {
                    $kodeProdukList = $productIds->map(fn($pid) => 'P' . $pid)->toArray();
                    DB::table('product_rejection_comments')
                        ->whereIn('kodeproduk', $kodeProdukList)
                        ->delete();
                }
            } catch (\Exception $e) {
                \Log::info("Could not delete product rejection comments: " . $e->getMessage());
            }

            \Log::info("Store resubmitted for review", [
                'store_id' => $id,
                'user_id' => $userId
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Toko berhasil dikirim ulang untuk ditinjau admin'
            ]);

        } catch (\Exception $e) {
            \Log::error("Error resubmitting store: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to resubmit store',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a pending product with reason
     */
    public function rejectProduct(Request $request, $id)
    {
        try {
            // Find product by ID (not kodeproduk)
            $product = DB::table('tproduk')->where('id', $id)->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            \Log::info("Rejecting product", [
                'product_id' => $id,
                'request_data' => $request->all()
            ]);

            $validator = Validator::make($request->all(), [
                'comment' => 'required_without:reason|string|min:10',
                'reason' => 'required_without:comment|string|min:10',
            ]);

            if ($validator->fails()) {
                \Log::warning("Product rejection validation failed", [
                    'errors' => $validator->errors(),
                    'data' => $request->all()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $comment = $request->input('comment') ?? $request->input('reason');
            $adminId = $request->header('X-User-ID', 1);

            // Update product status to inactive (rejected) and approval_status
            DB::table('tproduk')
                ->where('id', $id)
                ->update([
                    'approval_status' => 'rejected',
                    'status' => 'inactive',
                    'updated_at' => now()
                ]);

            // Save rejection comment
            DB::table('product_rejection_comments')->insert([
                'kodeproduk' => 'P' . $id,
                'kodepengguna' => 'U' . ($product->umkm_id ?? 0),
                'comment' => $comment,
                'status' => 'rejected',
                'admin_id' => $adminId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            \Log::info("Product rejected successfully", ['product_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Product rejected successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error("Error rejecting product: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get product rejection reasons for a user
     * Get rejection reasons for a user's products
     */
    public function getProductRejectionReasons(Request $request)
    {
        try {
            $userId = $request->header('X-User-ID');
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided'
                ], 400);
            }

            $kodepengguna = 'U' . str_pad($userId, 3, '0', STR_PAD_LEFT);

            $rejections = DB::table('product_rejection_reasons')
                ->join('tproduk', 'product_rejection_reasons.kodeproduk', '=', 'tproduk.kodeproduk')
                ->where('tproduk.kodepengguna', $kodepengguna)
                ->select(
                    'product_rejection_reasons.id',
                    'product_rejection_reasons.kodeproduk',
                    'tproduk.namaproduk as product_name',
                    'product_rejection_reasons.reason',
                    'product_rejection_reasons.created_at'
                )
                ->orderBy('product_rejection_reasons.created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $rejections
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch rejection reasons',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resubmit rejected product for review
     */
    public function resubmitProduct(Request $request, $id)
    {
        try {
            // Check if request has product data (for edit+resubmit flow)
            $hasProductData = $request->has('nama_produk') || $request->has('deskripsi');
            
            // Only validate if product data is being updated
            if ($hasProductData) {
                $validator = Validator::make($request->all(), [
                    'nama_produk' => 'required|string|max:255',
                    'deskripsi' => 'required|string',
                    'harga' => 'required|numeric|min:0',
                    'kategori' => 'required|string',
                ]);

                if ($validator->fails()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Validation failed',
                        'errors' => $validator->errors()
                    ], 422);
                }
            }

            $product = DB::table('tproduk')->where('id', $id)->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            // Check if product belongs to user's UMKM
            $userId = $request->header('X-User-ID');
            $umkm = DB::table('tumkm')->where('user_id', $userId)->first();

            if (!$umkm || $product->umkm_id != $umkm->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Check if product is rejected/inactive (check both status and approval_status)
            $currentStatus = !empty($product->approval_status) ? $product->approval_status : $product->status;
            
            \Log::info("Resubmit attempt", [
                'product_id' => $id,
                'status' => $product->status,
                'approval_status' => $product->approval_status,
                'currentStatus' => $currentStatus
            ]);
            
            if (!in_array($currentStatus, ['rejected', 'inactive'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only rejected products can be resubmitted',
                    'debug' => [
                        'current_status' => $currentStatus,
                        'status' => $product->status,
                        'approval_status' => $product->approval_status
                    ]
                ], 400);
            }

            // Update product data - only include fields if provided
            $updateData = [
                'approval_status' => 'pending', // Set back to pending for review
                'status' => 'active', // Set status as active
                'updated_at' => now()
            ];
            
            // Only add product data fields if they were provided (edit+resubmit flow)
            if ($request->has('nama_produk')) {
                $updateData['nama_produk'] = $request->input('nama_produk');
            }
            if ($request->has('deskripsi')) {
                $updateData['deskripsi'] = $request->input('deskripsi');
            }
            if ($request->has('harga')) {
                $updateData['harga'] = $request->input('harga');
            }
            if ($request->has('kategori')) {
                $updateData['kategori'] = $request->input('kategori');
            }

            // Handle image upload if provided
            if ($request->hasFile('gambar')) {
                $file = $request->file('gambar');
                $filename = 'product_' . $id . '_' . time() . '.' . $file->getClientOriginalExtension();
                
                if (!file_exists(public_path('uploads/products'))) {
                    mkdir(public_path('uploads/products'), 0777, true);
                }
                
                // Delete old image if exists
                if ($product->gambar && file_exists(public_path($product->gambar))) {
                    unlink(public_path($product->gambar));
                }
                
                $file->move(public_path('uploads/products'), $filename);
                $updateData['gambar'] = 'uploads/products/' . $filename;
            }

            DB::table('tproduk')->where('id', $id)->update($updateData);

            // Delete rejection comments since product is being resubmitted with fixes
            $kodeProduk = 'P' . $id;
            $deletedComments = DB::table('product_rejection_comments')
                ->where('kodeproduk', $kodeProduk)
                ->delete();

            \Log::info("Product resubmitted for review", [
                'product_id' => $id, 
                'user_id' => $userId,
                'deleted_comments' => $deletedComments
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil dikirim ulang untuk ditinjau admin'
            ]);

        } catch (\Exception $e) {
            \Log::error("Error resubmitting product: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to resubmit product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk approve UMKM stores
     */
    public function bulkApprove(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'store_ids' => 'required|array|min:1',
                'store_ids.*' => 'required|integer|exists:tumkm,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $storeIds = $request->store_ids;
            $approvedCount = 0;

            foreach ($storeIds as $storeId) {
                $umkm = Tumkm::find($storeId);
                if ($umkm && $umkm->status === 'pending') {
                    $umkm->update(['status' => 'active']);
                    $approvedCount++;
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "{$approvedCount} toko UMKM berhasil disetujui",
                'data' => [
                    'approved_count' => $approvedCount
                ]
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to bulk approve UMKM stores',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk reject UMKM stores with comment
     */
    public function bulkReject(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'store_ids' => 'required|array|min:1',
                'store_ids.*' => 'required|integer|exists:tumkm,id',
                'reason' => 'required|string|min:10',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $storeIds = $request->store_ids;
            $reason = $request->reason;
            $rejectedCount = 0;
            $adminId = $request->header('X-User-ID', 1);

            foreach ($storeIds as $storeId) {
                $umkm = Tumkm::find($storeId);
                if ($umkm && $umkm->status === 'pending') {
                    // Update status to rejected
                    $umkm->update(['status' => 'rejected']);

                    // Save rejection comment
                    DB::table('umkm_rejection_comments')->insert([
                        'kodepengguna' => $umkm->user_id,
                        'comment' => $reason,
                        'status' => 'rejected',
                        'admin_id' => $adminId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $rejectedCount++;
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "{$rejectedCount} toko UMKM berhasil ditolak",
                'data' => [
                    'rejected_count' => $rejectedCount
                ]
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to bulk reject UMKM stores',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Update UMKM store image (admin only)
    public function updateImage(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'foto_toko' => 'required|string|max:5000000'
            ]);

            $umkm = Tumkm::find($id);

            if (!$umkm) {
                return response()->json([
                    'success' => false,
                    'message' => 'UMKM store not found'
                ], 404);
            }

            $umkm->foto_toko = $validated['foto_toko'];
            $umkm->save();

            return response()->json([
                'success' => true,
                'message' => 'UMKM store image updated successfully',
                'data' => $umkm
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update UMKM store image',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Admin update UMKM store (admin only) - can update all fields
     */
    public function adminUpdate(Request $request, $id)
    {
        try {
            $umkm = Tumkm::find($id);

            if (!$umkm) {
                return response()->json([
                    'success' => false,
                    'message' => 'UMKM store not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'nama_toko' => 'nullable|string|max:255',
                'nama_pemilik' => 'nullable|string|max:255',
                'deskripsi' => 'nullable|string',
                'foto_toko' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048',
                'whatsapp' => 'nullable|string|max:20',
                'telepon' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'instagram' => 'nullable|string|max:100',
                'about_me' => 'nullable|string',
                'alamat' => 'nullable|string',
                'kota' => 'nullable|string|max:100',
                'kode_pos' => 'nullable|string|max:10',
                'status' => 'nullable|string|in:pending,active,rejected,inactive',
                'kategori_id' => 'nullable|integer|exists:categories,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Collect update data
            $updateData = $request->only([
                'nama_toko',
                'nama_pemilik',
                'deskripsi',
                'whatsapp',
                'telepon',
                'email',
                'instagram',
                'about_me',
                'alamat',
                'kota',
                'kode_pos',
                'status',
                'kategori_id'
            ]);

            // Filter out null values
            $updateData = array_filter($updateData, function($value) {
                return $value !== null && $value !== '';
            });

            // Handle file upload
            if ($request->hasFile('foto_toko')) {
                \Log::info('📸 Admin updating image: ' . $request->file('foto_toko')->getClientOriginalName());

                // Delete old image if exists
                if ($umkm->foto_toko && file_exists(public_path($umkm->foto_toko))) {
                    \Log::info('🗑️ Deleting old image: ' . $umkm->foto_toko);
                    unlink(public_path($umkm->foto_toko));
                }

                // Save new image
                $file = $request->file('foto_toko');
                $sanitizedName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $request->nama_toko ?? $umkm->nama_toko ?? 'toko');
                $filename = 'toko_' . $sanitizedName . '_' . time() . '.' . $file->getClientOriginalExtension();
                
                if (!file_exists(public_path('uploads/toko'))) {
                    mkdir(public_path('uploads/toko'), 0777, true);
                }
                
                $file->move(public_path('uploads/toko'), $filename);
                $updateData['foto_toko'] = 'uploads/toko/' . $filename;
                \Log::info('✅ Image saved: ' . $updateData['foto_toko']);
            }

            $umkm->update($updateData);

            // Reverse sync: UMKM → User profile
            if ($umkm->user_id) {
                $userUpdate = [];
                if (isset($updateData['whatsapp']) && $updateData['whatsapp']) {
                    $userUpdate['no_telepon'] = $updateData['whatsapp'];
                }
                if (isset($updateData['nama_pemilik']) && $updateData['nama_pemilik']) {
                    $userUpdate['nama_lengkap'] = $updateData['nama_pemilik'];
                }
                if (!empty($userUpdate)) {
                    User::where('id', $umkm->user_id)->update($userUpdate);
                }
            }

            \Log::info("Admin updated UMKM", ['umkm_id' => $id, 'admin_id' => $request->header('X-Admin-ID')]);

            return response()->json([
                'success' => true,
                'message' => 'UMKM store updated successfully',
                'data' => $umkm->fresh()
            ], 200);

        } catch (\Exception $e) {
            \Log::error("Error in adminUpdate: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update UMKM store',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete UMKM store and all its products (admin only)
     */
    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $umkm = Tumkm::find($id);

            if (!$umkm) {
                return response()->json([
                    'success' => false,
                    'message' => 'UMKM store not found'
                ], 404);
            }

            \Log::info("Deleting UMKM ID: {$id}, Name: {$umkm->nama_toko}");

            // Delete associated products first
            $deletedProducts = DB::table('tproduk')->where('umkm_id', $umkm->id)->delete();
            \Log::info("Deleted {$deletedProducts} products");

            // Delete UMKM rejection comments if table exists
            try {
                DB::table('umkm_rejection_comments')->where('kodepengguna', $umkm->user_id)->delete();
            } catch (\Exception $e) {
                \Log::warning("Could not delete umkm_rejection_comments: " . $e->getMessage());
            }

            // Delete product rejection comments if table exists
            try {
                DB::table('product_rejection_comments')->where('kodepengguna', 'U' . $umkm->user_id)->delete();
            } catch (\Exception $e) {
                \Log::warning("Could not delete product_rejection_comments: " . $e->getMessage());
            }

            // Delete the UMKM store
            $umkm->delete();
            \Log::info("UMKM deleted successfully");

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'UMKM store and all products deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Error deleting UMKM: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete UMKM store',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

