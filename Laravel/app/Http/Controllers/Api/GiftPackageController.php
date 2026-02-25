<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GiftPackageController extends Controller
{
    /**
     * Get all active packages (public)
     * Only shows approved packages that are not expired
     */
    public function index()
    {
        try {
            $today = now()->toDateString();
            
            $packages = DB::table('tproduk')
                ->whereRaw('LOWER(kategori) = ?', ['paket'])
                ->where('status', 'active')
                ->where(function($q) {
                    $q->where('approval_status', 'approved')
                      ->orWhereNull('approval_status');
                })
                ->where(function($query) use ($today) {
                    // No end date OR end date >= today
                    $query->whereNull('tanggal_akhir')
                          ->orWhere('tanggal_akhir', '>=', $today);
                })
                ->orderBy('id', 'desc')
                ->get();

            $formattedPackages = $packages->map(function ($package) {
                return $this->formatPackage($package);
            });

            return response()->json([
                'success' => true,
                'data' => $formattedPackages,
            ]);
        } catch (\Exception $e) {
            \Log::error('Gift Package Index Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data paket hadiah: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all packages for admin (including pending, rejected, expired)
     */
    public function indexAll()
    {
        try {
            $packages = DB::table('tproduk')
                ->whereRaw('LOWER(kategori) = ?', ['paket'])
                ->orderBy('id', 'desc')
                ->get();

            $today = now()->toDateString();
            
            $formattedPackages = $packages->map(function ($package) use ($today) {
                $formatted = $this->formatPackage($package);
                $formatted['status'] = $package->status;
                $formatted['tanggal_mulai'] = $package->tanggal_mulai ?? null;
                $formatted['tanggal_akhir'] = $package->tanggal_akhir ?? null;
                $formatted['alasan_penolakan'] = $package->alasan_penolakan ?? null;
                
                // Check if package is expired based on end date (expired = AFTER end date, not ON end date)
                $formatted['is_expired'] = $package->tanggal_akhir && $package->tanggal_akhir < $today;
                
                return $formatted;
            });

            return response()->json([
                'success' => true,
                'data' => $formattedPackages,
            ]);
        } catch (\Exception $e) {
            \Log::error('Gift Package Index All Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data paket hadiah: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get pending packages for admin review
     */
    public function getPending()
    {
        try {
            $packages = DB::table('tproduk')
                ->whereRaw('LOWER(kategori) = ?', ['paket'])
                ->where('status', 'pending')
                ->orderBy('created_at', 'desc')
                ->get();

            $formattedPackages = $packages->map(function ($package) {
                $formatted = $this->formatPackage($package);
                $formatted['status'] = $package->status;
                $formatted['tanggal_mulai'] = $package->tanggal_mulai ?? null;
                $formatted['tanggal_akhir'] = $package->tanggal_akhir ?? null;
                return $formatted;
            });

            return response()->json([
                'success' => true,
                'data' => $formattedPackages,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get packages owned by specific UMKM
     */
    public function getMyPackages(Request $request)
    {
        try {
            $userId = $request->query('user_id');
            
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID diperlukan',
                ], 400);
            }

            // Get UMKM IDs owned by this user
            $umkmIds = DB::table('tumkm')
                ->where('user_id', $userId)
                ->pluck('id');

            if ($umkmIds->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                ]);
            }

            $packages = DB::table('tproduk')
                ->whereRaw('LOWER(kategori) = ?', ['paket'])
                ->whereIn('umkm_id', $umkmIds)
                ->orderBy('created_at', 'desc')
                ->get();

            $today = now()->toDateString();
            
            $formattedPackages = $packages->map(function ($package) use ($today) {
                $formatted = $this->formatPackage($package);
                $formatted['status'] = $package->status;
                $formatted['tanggal_mulai'] = $package->tanggal_mulai ?? null;
                $formatted['tanggal_akhir'] = $package->tanggal_akhir ?? null;
                $formatted['alasan_penolakan'] = $package->alasan_penolakan ?? null;
                
                // Check if package is expired based on end date (expired = AFTER end date, not ON end date)
                $formatted['is_expired'] = $package->tanggal_akhir && $package->tanggal_akhir < $today;
                
                return $formatted;
            });

            return response()->json([
                'success' => true,
                'data' => $formattedPackages,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * UMKM submit new package (status: pending)
     */
    public function submit(Request $request)
    {
        try {
            $validated = $request->validate([
                'umkm_id' => 'required|integer|exists:tumkm,id',
                'name' => 'required|string|max:255',
                'description' => 'required|string',
                'price' => 'required|numeric|min:0',
                'stok' => 'required|integer|min:0',
                'items' => 'nullable|array',
                'tanggal_mulai' => 'nullable|date',
                'tanggal_akhir' => 'nullable|date|after_or_equal:tanggal_mulai',
            ]);

            // Verify UMKM is active
            $umkm = DB::table('tumkm')
                ->where('id', $validated['umkm_id'])
                ->where('status', 'active')
                ->first();

            if (!$umkm) {
                return response()->json([
                    'success' => false,
                    'message' => 'UMKM tidak ditemukan atau belum aktif',
                ], 400);
            }

            // Handle image upload
            $imagePath = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400';
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $filename = time() . '_' . $file->getClientOriginalName();
                $file->move(public_path('uploads/gift-packages'), $filename);
                $imagePath = 'uploads/gift-packages/' . $filename;
            }

            // Prepare items as JSON
            $itemsJson = null;
            if (isset($validated['items']) && is_array($validated['items'])) {
                $itemsJson = json_encode(array_map(fn($item) => ['nama' => $item], $validated['items']));
            }

            $insertId = DB::table('tproduk')->insertGetId([
                'umkm_id' => $validated['umkm_id'],
                'nama_produk' => $validated['name'],
                'deskripsi' => $validated['description'],
                'harga' => $validated['price'],
                'stok' => $validated['stok'],
                'gambar' => $imagePath,
                'status' => 'pending',
                'approval_status' => 'pending',
                'kategori' => 'Paket',
                'items' => $itemsJson,
                'tanggal_mulai' => $validated['tanggal_mulai'] ?? null,
                'tanggal_akhir' => $validated['tanggal_akhir'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Paket berhasil diajukan, menunggu persetujuan admin',
                'data' => ['id' => $insertId]
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Gift Package Submit Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengajukan paket: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Admin create package (status: active directly)
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'umkm_id' => 'nullable|integer', // NULL = Official/Gereja
                'name' => 'required|string|max:255',
                'description' => 'required|string',
                'price' => 'required|numeric|min:0',
                'stok' => 'required|integer|min:0',
                'items' => 'nullable|array',
                'tanggal_mulai' => 'nullable|date',
                'tanggal_akhir' => 'nullable|date|after_or_equal:tanggal_mulai',
            ]);

            // Handle image upload
            $imagePath = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400';
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $filename = time() . '_' . $file->getClientOriginalName();
                $file->move(public_path('uploads/gift-packages'), $filename);
                $imagePath = 'uploads/gift-packages/' . $filename;
            } elseif ($request->has('image') && is_string($request->image)) {
                $imagePath = $request->image;
            }

            // If umkm_id is provided, verify it exists and is active
            $umkmId = null;
            if (!empty($validated['umkm_id'])) {
                $umkm = DB::table('tumkm')
                    ->where('id', $validated['umkm_id'])
                    ->where('status', 'active')
                    ->first();
                
                if (!$umkm) {
                    return response()->json([
                        'success' => false,
                        'message' => 'UMKM tidak ditemukan atau belum aktif',
                    ], 400);
                }
                $umkmId = $umkm->id;
            }

            // Prepare items as JSON
            $itemsJson = null;
            if (isset($validated['items']) && is_array($validated['items'])) {
                $itemsJson = json_encode(array_map(fn($item) => ['nama' => $item], $validated['items']));
            }

            // Also prepare items description for backward compatibility
            $itemsDescription = $validated['description'];
            if (isset($validated['items']) && is_array($validated['items']) && count($validated['items']) > 0) {
                $itemsDescription = "Paket berisi:\n- " . implode("\n- ", $validated['items']);
            }

            $insertId = DB::table('tproduk')->insertGetId([
                'umkm_id' => $umkmId, // NULL = Official/Gereja
                'nama_produk' => $validated['name'],
                'deskripsi' => $itemsDescription,
                'harga' => $validated['price'],
                'stok' => $validated['stok'],
                'gambar' => $imagePath,
                'status' => 'active', // Admin creates active directly
                'approval_status' => 'approved', // Admin-created packages auto-approved
                'kategori' => 'Paket',
                'items' => $itemsJson,
                'tanggal_mulai' => $validated['tanggal_mulai'] ?? null,
                'tanggal_akhir' => $validated['tanggal_akhir'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Paket hadiah berhasil dibuat',
                'data' => ['id' => $insertId]
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Gift Package Store Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat paket hadiah: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Admin approve package
     */
    public function approve($id)
    {
        try {
            $package = DB::table('tproduk')
                ->where('id', $id)
                ->whereRaw('LOWER(kategori) = ?', ['paket'])
                ->first();

            if (!$package) {
                return response()->json([
                    'success' => false,
                    'message' => 'Paket tidak ditemukan',
                ], 404);
            }

            DB::table('tproduk')
                ->where('id', $id)
                ->update([
                    'status' => 'active',
                    'approval_status' => 'approved',
                    'alasan_penolakan' => null,
                    'updated_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Paket berhasil disetujui',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyetujui paket: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Admin reject package
     */
    public function reject(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'alasan' => 'required|string|max:500',
            ]);

            $package = DB::table('tproduk')
                ->where('id', $id)
                ->whereRaw('LOWER(kategori) = ?', ['paket'])
                ->first();

            if (!$package) {
                return response()->json([
                    'success' => false,
                    'message' => 'Paket tidak ditemukan',
                ], 404);
            }

            DB::table('tproduk')
                ->where('id', $id)
                ->update([
                    'status' => 'rejected',
                    'alasan_penolakan' => $validated['alasan'],
                    'updated_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Paket ditolak',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Alasan penolakan diperlukan',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menolak paket: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get list of active UMKM for admin dropdown
     */
    public function getActiveUmkm()
    {
        try {
            $umkms = DB::table('tumkm')
                ->where('status', 'active')
                ->select('id', 'nama_toko', 'nama_pemilik')
                ->orderBy('nama_toko')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $umkms,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data UMKM: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'umkm_id' => 'nullable|integer',
                'name' => 'required|string|max:255',
                'description' => 'required|string',
                'price' => 'required|numeric|min:0',
                'stok' => 'required|integer|min:0',
                'items' => 'nullable|array',
                'tanggal_mulai' => 'nullable|date',
                'tanggal_akhir' => 'nullable|date|after_or_equal:tanggal_mulai',
            ]);

            // Handle image
            $imagePath = null;
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $filename = time() . '_' . $file->getClientOriginalName();
                $file->move(public_path('uploads/gift-packages'), $filename);
                $imagePath = 'uploads/gift-packages/' . $filename;
            } elseif ($request->has('image') && is_string($request->image)) {
                $imagePath = $request->image;
            }

            // Prepare items as JSON
            $itemsJson = null;
            if (isset($validated['items']) && is_array($validated['items'])) {
                $itemsJson = json_encode(array_map(fn($item) => ['nama' => $item], $validated['items']));
            }

            // Prepare items description
            $itemsDescription = $validated['description'];
            if (isset($validated['items']) && is_array($validated['items']) && count($validated['items']) > 0) {
                $itemsDescription = "Paket berisi:\n- " . implode("\n- ", $validated['items']);
            }

            $updateData = [
                'nama_produk' => $validated['name'],
                'deskripsi' => $itemsDescription,
                'harga' => $validated['price'],
                'stok' => $validated['stok'],
                'kategori' => 'Paket',
                'items' => $itemsJson,
                'tanggal_mulai' => $validated['tanggal_mulai'] ?? null,
                'tanggal_akhir' => $validated['tanggal_akhir'] ?? null,
                'updated_at' => now(),
            ];

            // Update umkm_id if provided (allow NULL for official packages)
            if ($request->has('umkm_id')) {
                $updateData['umkm_id'] = $validated['umkm_id'] ?: null;
            }

            if ($imagePath) {
                $updateData['gambar'] = $imagePath;
            }

            $updated = DB::table('tproduk')
                ->where('id', $id)
                ->whereRaw('LOWER(kategori) = ?', ['paket'])
                ->update($updateData);

            if (!$updated) {
                return response()->json(['success' => false, 'message' => 'Paket hadiah tidak ditemukan'], 404);
            }

            return response()->json(['success' => true, 'message' => 'Paket hadiah berhasil diupdate']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Gift Package Update Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal mengupdate paket hadiah: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $deleted = DB::table('tproduk')
                ->where('id', $id)
                ->whereRaw('LOWER(kategori) = ?', ['paket'])
                ->delete();

            if (!$deleted) {
                return response()->json(['success' => false, 'message' => 'Paket hadiah tidak ditemukan'], 404);
            }

            return response()->json(['success' => true, 'message' => 'Paket hadiah berhasil dihapus']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menghapus paket hadiah: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Helper: Format package for response
     */
    private function formatPackage($package)
    {
        // Read items from database column (JSON)
        $items = [];
        if (!empty($package->items)) {
            $decoded = json_decode($package->items, true);
            if (is_array($decoded)) {
                $items = $decoded;
            }
        }
        
        // Fallback: parse from description if items column is empty
        if (empty($items) && $package->deskripsi) {
            if (strpos($package->deskripsi, 'Paket berisi:') !== false) {
                $parts = explode('Paket berisi:', $package->deskripsi);
                if (count($parts) > 1) {
                    $itemsText = trim($parts[1]);
                    $lines = preg_split('/\r\n|\r|\n/', $itemsText);
                    foreach ($lines as $line) {
                        $trimmed = trim($line);
                        if (strpos($trimmed, '-') === 0) {
                            $item = trim(substr($trimmed, 1));
                            if (!empty($item)) {
                                $items[] = ['nama' => $item];
                            }
                        }
                    }
                }
            }
        }
        
        // Get UMKM owner info
        $umkmInfo = null;
        if (!empty($package->umkm_id)) {
            $umkm = DB::table('tumkm')
                ->where('id', $package->umkm_id)
                ->select('id', 'nama_toko', 'nama_pemilik')
                ->first();
            if ($umkm) {
                $umkmInfo = [
                    'id' => $umkm->id,
                    'nama_toko' => $umkm->nama_toko,
                    'nama_pemilik' => $umkm->nama_pemilik,
                ];
            }
        }
        
        // Get extra images from product_images table
        $extraImages = DB::table('product_images')
            ->where('product_id', $package->id)
            ->orderBy('sort_order')
            ->pluck('image_path')
            ->toArray();
        
        $allImages = [];
        $mainImage = $package->gambar ?? 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400';
        $allImages[] = $mainImage;
        $allImages = array_merge($allImages, $extraImages);

        return [
            'id' => $package->id,
            'umkm_id' => $package->umkm_id,
            'name' => $package->nama_produk,
            'description' => $package->deskripsi ?? '',
            'price' => (float) $package->harga,
            'stok' => (int) ($package->stok ?? 0),
            'category' => 'Paket',
            'image' => $mainImage,
            'images' => $allImages,
            'items' => $items,
            'umkm' => $umkmInfo,
            'status' => $package->status ?? 'active',
            'tanggal_mulai' => $package->tanggal_mulai ?? null,
            'tanggal_akhir' => $package->tanggal_akhir ?? null,
            'createdAt' => $package->created_at ?? now()->toISOString(),
        ];
    }
}
