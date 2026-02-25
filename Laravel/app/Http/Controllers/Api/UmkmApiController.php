<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Umkm;
use App\Models\Tumkm;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class UmkmApiController extends Controller
{
    /**
     * Get all active UMKM with their products
     */
    public function index()
    {
        try {
            $umkmList = DB::table('tumkm')
                ->leftJoin('users', 'tumkm.user_id', '=', 'users.id')
                ->leftJoin('categories', 'tumkm.kategori_id', '=', 'categories.id')
                ->where('tumkm.status', 'active')
                ->select(
                    'tumkm.id',
                    'tumkm.nama_toko',
                    'tumkm.nama_pemilik',
                    'tumkm.deskripsi',
                    'tumkm.foto_toko',
                    'tumkm.status',
                    'tumkm.alamat',
                    'tumkm.kota',
                    'tumkm.whatsapp',
                    'tumkm.telepon',
                    'tumkm.email',
                    'tumkm.instagram',
                    'tumkm.kategori_id',
                    'categories.nama_kategori as kategori',
                    'users.nama_lengkap'
                )
                ->get();

            // Batch fetch all products for active UMKM in ONE query (fixes N+1)
            $umkmIds = $umkmList->pluck('id')->toArray();
            $allProducts = DB::table('tproduk')
                ->whereIn('umkm_id', $umkmIds)
                ->where('status', 'active')
                ->where('approval_status', 'approved')
                ->select(
                    'id',
                    'umkm_id',
                    'nama_produk',
                    'harga',
                    'stok',
                    'deskripsi',
                    'gambar',
                    'kategori'
                )
                ->get()
                ->groupBy('umkm_id');

            // Assign products to each UMKM
            $umkmWithProducts = $umkmList->map(function ($item) use ($allProducts) {
                $item->products = $allProducts->get($item->id, collect())->values();
                $item->rating = 5;
                $item->category = [
                    'id' => $item->kategori_id,
                    'nama_kategori' => $item->kategori ?? 'Unknown'
                ];
                return $item;
            });

            return response()->json([
                'success' => true,
                'data' => $umkmWithProducts
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch UMKM data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single UMKM by ID
     */
    public function show($id)
    {
        try {
            $umkm = DB::table('tumkm')
                ->leftJoin('users', 'tumkm.user_id', '=', 'users.id')
                ->leftJoin('categories', 'tumkm.kategori_id', '=', 'categories.id')
                ->where('tumkm.id', $id)
                ->select(
                    'tumkm.id',
                    'tumkm.user_id',
                    'tumkm.nama_toko',
                    'tumkm.nama_pemilik',
                    'tumkm.deskripsi',
                    'tumkm.foto_toko',
                    'tumkm.kategori_id',
                    'tumkm.whatsapp',
                    'tumkm.telepon',
                    'tumkm.email',
                    'tumkm.instagram',
                    'tumkm.about_me',
                    'tumkm.alamat',
                    'tumkm.kota',
                    'tumkm.kode_pos',
                    'tumkm.status',
                    'tumkm.created_at',
                    'tumkm.updated_at',
                    'tumkm.menyediakan_jasa_kirim',
                    'tumkm.nama_bank',
                    'tumkm.no_rekening',
                    'tumkm.atas_nama_rekening',
                    'users.nama_lengkap',
                    'users.no_telepon',
                    'categories.nama_kategori'
                )
                ->first();

            if (!$umkm) {
                return response()->json([
                    'success' => false,
                    'message' => 'UMKM not found'
                ], 404);
            }

            // Get products from tproduk - only show approved products on public page
            $products = DB::table('tproduk')
                ->where('umkm_id', $id)
                ->where('approval_status', 'approved')
                ->select(
                    'id',
                    'nama_produk',
                    'harga',
                    'stok',
                    'deskripsi',
                    'gambar',
                    'kategori',
                    'status',
                    'approval_status'
                )
                ->get();

            $umkm->products = $products;
            $umkm->category = [
                'id' => $umkm->kategori_id,
                'nama_kategori' => $umkm->nama_kategori ?? 'Unknown'
            ];

            return response()->json([
                'success' => true,
                'data' => $umkm
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch UMKM data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get products by UMKM ID
     */
    public function products($umkmId)
    {
        try {
            $products = DB::table('products')
                ->where('umkm_id', $umkmId)
                ->where('status', 'active')
                ->where('approval_status', 'approved')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $products
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pending UMKM stores (for admin approval)
     */
    public function pending()
    {
        try {
            // Use Eloquent with proper relationships - load ALL products for pending stores
            $pendingUmkm = Tumkm::with(['user', 'category', 'products'])
                ->where('status', 'pending')
                ->orderBy('created_at', 'desc')
                ->get();

            // Map to expected format
            $pendingWithProducts = $pendingUmkm->map(function ($umkm) {
                // Get additional fields from raw DB query to ensure we get all columns
                $rawData = DB::table('tumkm')->where('id', $umkm->id)->first();
                
                return [
                    'id' => $umkm->id,
                    'user_id' => $umkm->user_id,
                    'nama_toko' => $umkm->nama_toko,
                    'nama_pemilik' => $umkm->nama_pemilik,
                    'alamat_toko' => $umkm->alamat ?? $umkm->deskripsi,
                    'deskripsi' => $umkm->deskripsi,
                    'foto_toko' => $umkm->foto_toko,
                    'kategori_id' => $umkm->kategori_id,
                    'status' => $umkm->status,
                    'whatsapp' => $umkm->whatsapp,
                    'telepon' => $umkm->telepon,
                    'email' => $umkm->email,
                    'instagram' => $umkm->instagram,
                    'about_me' => $rawData->about_me ?? null,
                    'paroki' => $rawData->paroki ?? null,
                    'umat' => $rawData->umat ?? null,
                    'nama_bank' => $rawData->nama_bank ?? null,
                    'no_rekening' => $rawData->no_rekening ?? null,
                    'atas_nama_rekening' => $rawData->atas_nama_rekening ?? null,
                    'dokumen_perjanjian' => $rawData->dokumen_perjanjian ?? null,
                    'menyediakan_jasa_kirim' => $rawData->menyediakan_jasa_kirim ?? false,
                    'created_at' => $umkm->created_at,
                    'user' => [
                        'name' => $umkm->user->nama_lengkap ?? $umkm->nama_pemilik,
                        'email' => $umkm->user->email ?? null,
                        'phone' => $umkm->user->no_telepon ?? $umkm->telepon ?? 'N/A'
                    ],
                    'category' => [
                        'id' => $umkm->category->id ?? null,
                        'nama_kategori' => $umkm->category->nama_kategori ?? 'Unknown'
                    ],
                    'products' => $umkm->products->filter(function($product) {
                    // Hide rejected products — they should only reappear when UMKM resubmits
                    return ($product->approval_status ?? 'pending') !== 'rejected';
                })->values()->map(function($product) {
                        return [
                            'id' => $product->id,
                            'nama_produk' => $product->nama_produk,
                            'harga' => $product->harga,
                            'stok' => $product->stok,
                            'deskripsi' => $product->deskripsi,
                            'gambar' => $product->gambar,
                            'kategori' => $product->kategori,
                            'status' => $product->status,
                            'approval_status' => $product->approval_status ?? 'pending',
                        ];
                    })
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $pendingWithProducts
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending UMKM',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get UMKM by user (for user's own dashboard - includes all statuses)
     */
    public function getUserUmkm(Request $request)
    {
        try {
            $userId = $request->header('X-User-ID');
            
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided'
                ], 400);
            }

            // Query from modern tumkm table using user_id
            $umkmList = DB::table('tumkm')
                ->leftJoin('users', 'tumkm.user_id', '=', 'users.id')
                ->leftJoin('categories', 'tumkm.kategori_id', '=', 'categories.id')
                ->where('tumkm.user_id', $userId)
                ->select(
                    'tumkm.id',
                    'tumkm.user_id',
                    'tumkm.nama_toko',
                    'tumkm.nama_pemilik',
                    'tumkm.deskripsi',
                    'tumkm.foto_toko',
                    'tumkm.kategori_id',
                    'tumkm.whatsapp',
                    'tumkm.instagram',
                    'tumkm.about_me',
                    'tumkm.status',
                    'tumkm.nama_bank',
                    'tumkm.no_rekening',
                    'tumkm.atas_nama_rekening',
                    'tumkm.menyediakan_jasa_kirim',
                    'categories.nama_kategori'
                )
                ->get();

            // Batch fetch all products in ONE query (fixes N+1)
            $umkmIds = $umkmList->pluck('id')->toArray();
            $allProducts = DB::table('tproduk')
                ->whereIn('umkm_id', $umkmIds)
                ->select(
                    'id',
                    'umkm_id',
                    'nama_produk',
                    'harga',
                    'stok',
                    'deskripsi',
                    'gambar',
                    'kategori',
                    'status',
                    'approval_status'
                )
                ->get()
                ->groupBy('umkm_id');

            $umkmWithProducts = $umkmList->map(function ($item) use ($userId, $allProducts) {
                return [
                    'id' => $item->id,
                    'user_id' => $userId,
                    'nama_toko' => $item->nama_toko,
                    'nama_pemilik' => $item->nama_pemilik,
                    'deskripsi' => $item->deskripsi,
                    'foto_toko' => $item->foto_toko,
                    'kategori_id' => $item->kategori_id,
                    'whatsapp' => $item->whatsapp,
                    'instagram' => $item->instagram,
                    'about_me' => $item->about_me,
                    'status' => $item->status,
                    'nama_bank' => $item->nama_bank,
                    'no_rekening' => $item->no_rekening,
                    'atas_nama_rekening' => $item->atas_nama_rekening,
                    'menyediakan_jasa_kirim' => $item->menyediakan_jasa_kirim ?? false,
                    'category' => [
                        'id' => $item->kategori_id,
                        'nama_kategori' => $item->nama_kategori ?? 'Unknown'
                    ],
                    'products' => $allProducts->get($item->id, collect())->values()
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $umkmWithProducts
            ]);

        } catch (\Exception $e) {
            \Log::error('getUserUmkm Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user UMKM',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
