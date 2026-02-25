<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    /**
     * GET /api/admin/admins
     * List semua admin
     */
    public function index()
    {
        $admins = Admin::select('id', 'email', 'nama', 'is_active', 'created_at', 'updated_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $admins
        ], 200);
    }

    /**
     * POST /api/admin/admins
     * Buat admin baru
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:100',
            'email' => 'required|email|max:100|unique:admins,email',
            'password' => 'required|string|min:6',
            'is_active' => 'boolean'
        ]);

        $admin = Admin::create([
            'nama' => $validated['nama'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => $validated['is_active'] ?? true
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admin berhasil dibuat',
            'data' => [
                'id' => $admin->id,
                'nama' => $admin->nama,
                'email' => $admin->email,
                'is_active' => $admin->is_active,
            ]
        ], 201);
    }

    /**
     * GET /api/admin/admins/{id}
     * Detail admin
     */
    public function show($id)
    {
        $admin = Admin::select('id', 'email', 'nama', 'is_active', 'created_at', 'updated_at')
            ->find($id);

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Admin tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $admin
        ], 200);
    }

    /**
     * PUT /api/admin/admins/{id}
     * Update admin (nama, email, password optional)
     */
    public function update(Request $request, $id)
    {
        $admin = Admin::find($id);

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Admin tidak ditemukan'
            ], 404);
        }

        $validated = $request->validate([
            'nama' => 'sometimes|string|max:100',
            'email' => [
                'sometimes',
                'email',
                'max:100',
                Rule::unique('admins', 'email')->ignore($id)
            ],
            'password' => 'sometimes|string|min:6'
        ]);

        if (isset($validated['nama'])) {
            $admin->nama = $validated['nama'];
        }

        if (isset($validated['email'])) {
            $admin->email = $validated['email'];
        }

        if (isset($validated['password'])) {
            $admin->password = Hash::make($validated['password']);
        }

        $admin->save();

        return response()->json([
            'success' => true,
            'message' => 'Admin berhasil diupdate',
            'data' => [
                'id' => $admin->id,
                'nama' => $admin->nama,
                'email' => $admin->email,
                'is_active' => $admin->is_active,
            ]
        ], 200);
    }

    /**
     * PATCH /api/admin/admins/{id}/toggle-status
     * Aktifkan/nonaktifkan admin
     */
    public function toggleStatus($id)
    {
        $admin = Admin::find($id);

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Admin tidak ditemukan'
            ], 404);
        }

        // Cek jika admin terakhir yang aktif
        $activeAdminsCount = Admin::where('is_active', true)->count();
        if ($admin->is_active && $activeAdminsCount <= 1) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak bisa menonaktifkan admin terakhir'
            ], 400);
        }

        $admin->is_active = !$admin->is_active;
        $admin->save();

        return response()->json([
            'success' => true,
            'message' => $admin->is_active ? 'Admin diaktifkan' : 'Admin dinonaktifkan',
            'data' => [
                'id' => $admin->id,
                'nama' => $admin->nama,
                'email' => $admin->email,
                'is_active' => $admin->is_active,
            ]
        ], 200);
    }

    /**
     * DELETE /api/admin/admins/{id}
     * Hapus admin (soft delete dengan set is_active = false)
     */
    public function destroy($id)
    {
        $admin = Admin::find($id);

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Admin tidak ditemukan'
            ], 404);
        }

        // Cek jika admin terakhir yang aktif
        $activeAdminsCount = Admin::where('is_active', true)->count();
        if ($admin->is_active && $activeAdminsCount <= 1) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak bisa menghapus admin terakhir'
            ], 400);
        }

        // Soft delete dengan set is_active = false
        $admin->is_active = false;
        $admin->save();

        // Atau hard delete: $admin->delete();

        return response()->json([
            'success' => true,
            'message' => 'Admin berhasil dinonaktifkan'
        ], 200);
    }

    /**
     * GET /api/admin/users
     * List semua users dari database
     */
    public function getAllUsers()
    {
        $users = User::select('id', 'name', 'email', 'role', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ], 200);
    }

    /**
     * PUT /api/admin/users/{id}/role
     * Update role user
     */
    public function updateUserRole(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }

        $validated = $request->validate([
            'role' => 'required|in:customer,umkm,admin'
        ]);

        $user->role = $validated['role'];
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Role user berhasil diupdate',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ]
        ], 200);
    }

    /**
     * GET /api/admin/users
     * Get all users from database
     */
    public function users()
    {
        try {
            $users = User::select(
                'id',
                'nama_lengkap as name',
                'email',
                'no_telepon',
                'role',
                'status',
                'created_at'
            )
            ->orderBy('created_at', 'desc')
            ->get();

            return response()->json([
                'success' => true,
                'data' => $users
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/admin/statistics
     * Get marketplace statistics
     */
    public function statistics()
    {
        try {
            // Store statistics
            $totalStores = \DB::table('tumkm')->count();
            $activeStores = \DB::table('tumkm')->where('status', 'active')->count();
            $pendingStores = \DB::table('tumkm')->where('status', 'pending')->count();
            $rejectedStores = \DB::table('tumkm')->where('status', 'rejected')->count();

            // Product statistics
            $totalProducts = \DB::table('tproduk')->count();
            $activeProducts = \DB::table('tproduk')->where('status', 'active')->count();
            $pendingProducts = \DB::table('tproduk')->where('status', 'pending')->count();
            $rejectedProducts = \DB::table('tproduk')->where('status', 'rejected')->count();

            // User statistics
            $totalUsers = User::count();
            $umkmUsers = User::where('role', 'umkm')->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'totalStores' => $totalStores,
                    'activeStores' => $activeStores,
                    'pendingStores' => $pendingStores,
                    'rejectedStores' => $rejectedStores,
                    'totalProducts' => $totalProducts,
                    'activeProducts' => $activeProducts,
                    'pendingProducts' => $pendingProducts,
                    'rejectedProducts' => $rejectedProducts,
                    'totalUsers' => $totalUsers,
                    'umkmUsers' => $umkmUsers,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/admin/purchase-log
     * Get all orders with filters for admin purchase log
     */
    public function purchaseLog(Request $request)
    {
        try {
            $query = \App\Models\Order::with(['items', 'user', 'business'])
                ->orderBy('created_at', 'desc');

            // Date filters
            if ($request->has('date_from') && $request->date_from) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->has('date_to') && $request->date_to) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // Status filter
            if ($request->has('status') && $request->status && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Search filter
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('order_number', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($q2) use ($search) {
                          $q2->where('nama_lengkap', 'like', "%{$search}%")
                             ->orWhere('email', 'like', "%{$search}%");
                      })
                      ->orWhereHas('business', function ($q2) use ($search) {
                          $q2->where('nama_toko', 'like', "%{$search}%");
                      });
                });
            }

            $orders = $query->paginate($request->get('per_page', 20));

            // Transform data
            $transformedOrders = $orders->getCollection()->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'tanggal' => $order->created_at ? $order->created_at->format('Y-m-d H:i:s') : null,
                    'pembeli' => $order->user ? ($order->user->nama_lengkap ?? $order->user->name ?? 'N/A') : 'N/A',
                    'pembeli_email' => $order->user->email ?? 'N/A',
                    'pembeli_wa' => $order->no_whatsapp_pembeli ?? 'N/A',
                    'toko' => $order->business->nama_toko ?? 'N/A',
                    'items' => $order->items->map(function ($item) {
                        return [
                            'nama_produk' => $item->nama_produk ?? 'Produk',
                            'jumlah' => $item->jumlah ?? $item->quantity ?? 0,
                            'harga_satuan' => $item->harga_satuan ?? $item->price ?? 0,
                            'subtotal' => $item->subtotal ?? 0,
                        ];
                    }),
                    'total_harga' => $order->total_harga,
                    'status' => $order->status,
                    'payment_method' => $order->payment_method ?? 'N/A',
                    'catatan' => $order->catatan,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $transformedOrders,
                'pagination' => [
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                    'per_page' => $orders->perPage(),
                    'total' => $orders->total(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch purchase log',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/admin/purchase-log/export
     * Export purchase log as CSV
     */
    public function exportPurchaseLog(Request $request)
    {
        try {
            $query = \App\Models\Order::with(['items', 'user', 'business'])
                ->orderBy('created_at', 'desc');

            if ($request->has('date_from') && $request->date_from) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->has('date_to') && $request->date_to) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }
            if ($request->has('status') && $request->status && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            $orders = $query->get();

            $csvData = [];
            $csvData[] = ['No', 'Order Number', 'Tanggal', 'Pembeli', 'Email', 'WhatsApp', 'Toko UMKM', 'Produk', 'Jumlah', 'Harga Satuan', 'Total', 'Status', 'Metode Bayar'];

            $no = 1;
            foreach ($orders as $order) {
                $pembeli = $order->user ? ($order->user->nama_lengkap ?? $order->user->name ?? 'N/A') : 'N/A';
                $email = $order->user->email ?? 'N/A';
                $wa = $order->no_whatsapp_pembeli ?? 'N/A';
                $toko = $order->business->nama_toko ?? 'N/A';

                if ($order->items->count() > 0) {
                    foreach ($order->items as $item) {
                        $csvData[] = [
                            $no,
                            $order->order_number ?? $order->id,
                            $order->created_at ? $order->created_at->format('d/m/Y H:i') : '',
                            $pembeli,
                            $email,
                            $wa,
                            $toko,
                            $item->nama_produk ?? 'Produk',
                            $item->jumlah ?? $item->quantity ?? 0,
                            $item->harga_satuan ?? $item->price ?? 0,
                            $order->total_harga,
                            $order->status,
                            $order->payment_method ?? 'N/A',
                        ];
                    }
                } else {
                    $csvData[] = [
                        $no,
                        $order->order_number ?? $order->id,
                        $order->created_at ? $order->created_at->format('d/m/Y H:i') : '',
                        $pembeli,
                        $email,
                        $wa,
                        $toko,
                        '-',
                        0,
                        0,
                        $order->total_harga,
                        $order->status,
                        $order->payment_method ?? 'N/A',
                    ];
                }
                $no++;
            }

            $filename = 'log_pembelian_' . now()->format('Y-m-d_His') . '.csv';

            $callback = function () use ($csvData) {
                $file = fopen('php://output', 'w');
                // Add BOM for Excel compatibility
                fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
                foreach ($csvData as $row) {
                    fputcsv($file, $row, ';');
                }
                fclose($file);
            };

            return response()->stream($callback, 200, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export purchase log',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
