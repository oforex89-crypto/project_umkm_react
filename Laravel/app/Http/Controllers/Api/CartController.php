<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    // Get cart items dengan info UMKM
    public function index($userId)
    {
        $cartItems = CartItem::with(['product.umkm'])
            ->where('user_id', $userId)
            ->get();

        // Transform to include business info
        $formattedItems = $cartItems->map(function ($item) {
            if (!$item->product) {
                return null;
            }
            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'product_name' => $item->product->nama_produk,
                'product_price' => $item->product->harga,
                'quantity' => $item->jumlah,
                'subtotal' => $item->product->harga * $item->jumlah,
                'product' => [
                    'gambar' => $item->product->gambar,
                    'deskripsi' => $item->product->deskripsi,
                    'kategori' => $item->product->kategori,
                    'stok' => $item->product->stok,
                    'umkm' => $item->product->umkm ? [
                        'id' => $item->product->umkm->id,
                        'nama_toko' => $item->product->umkm->nama_toko,
                        'whatsapp' => $item->product->umkm->whatsapp,
                        'menyediakan_jasa_kirim' => $item->product->umkm->menyediakan_jasa_kirim,
                        'nama_bank' => $item->product->umkm->nama_bank,
                        'no_rekening' => $item->product->umkm->no_rekening,
                        'atas_nama_rekening' => $item->product->umkm->atas_nama_rekening,
                    ] : null,
                ],
                'business' => $item->product->umkm ? [
                    'id' => $item->product->umkm->id,
                    'name' => $item->product->umkm->nama_toko,
                    'phone' => $item->product->umkm->whatsapp,
                ] : null
            ];
        })->filter();

        return response()->json([
            'success' => true,
            'data' => $formattedItems->values()
        ], 200);
    }

    // Get cart items grouped by UMKM
    public function getGroupedByBusiness($userId)
    {
        $cartItems = CartItem::with(['product.umkm'])
            ->where('user_id', $userId)
            ->get();

        // Group by UMKM
        $grouped = $cartItems->groupBy(function ($item) {
            return $item->product->umkm_id ?? 0;
        });

        $result = $grouped->map(function ($items, $businessId) {
            $umkm = $items->first()->product->umkm;
            $itemsList = $items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product->nama_produk,
                    'product_price' => $item->product->harga,
                    'product_image' => $item->product->gambar,
                    'quantity' => $item->jumlah,
                    'subtotal' => $item->product->harga * $item->jumlah,
                ];
            });

            $total = $itemsList->sum('subtotal');

            return [
                'business_id' => $businessId,
                'business_name' => $umkm ? $umkm->nama_toko : 'Unknown',
                'business_phone' => $umkm ? $umkm->whatsapp : '',
                'menyediakan_jasa_kirim' => $umkm ? $umkm->menyediakan_jasa_kirim : false,
                'items' => $itemsList->values(),
                'item_count' => $items->count(),
                'total' => $total,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $result->values()
        ], 200);
    }

    public function add(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required',
            'product_id' => 'required',
            'quantity' => 'required|integer|min:1',
        ]);

        // Check stock from tproduk table
        $product = DB::table('tproduk')->where('id', $validated['product_id'])->first();
        
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        // Check if product has enough stock
        $existingCart = CartItem::where('user_id', $validated['user_id'])
            ->where('product_id', $validated['product_id'])
            ->first();
        
        $currentQuantityInCart = $existingCart ? $existingCart->jumlah : 0;
        $newTotalQuantity = $currentQuantityInCart + $validated['quantity'];
        
        if ($product->stok !== null && $newTotalQuantity > $product->stok) {
            return response()->json([
                'success' => false,
                'message' => "Stok tidak mencukupi. Stok tersedia: {$product->stok}, di keranjang: {$currentQuantityInCart}"
            ], 400);
        }

        $cartItem = CartItem::updateOrCreate(
            [
                'user_id' => $validated['user_id'],
                'product_id' => $validated['product_id']
            ],
            ['jumlah' => $newTotalQuantity]
        );

        return response()->json([
            'success' => true,
            'message' => 'Item added to cart',
            'data' => $cartItem->load('product')
        ], 200);
    }

    public function update(Request $request, $userId, $productId)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $cartItem = CartItem::where('user_id', $userId)
            ->where('product_id', $productId)
            ->first();

        if (!$cartItem) {
            return response()->json([
                'success' => false,
                'message' => 'Cart item not found'
            ], 404);
        }

        // Check stock from tproduk table
        $product = DB::table('tproduk')->where('id', $productId)->first();
        
        if ($product && $product->stok !== null && $validated['quantity'] > $product->stok) {
            return response()->json([
                'success' => false,
                'message' => "Stok tidak mencukupi. Stok tersedia: {$product->stok}"
            ], 400);
        }

        $cartItem->update(['jumlah' => $validated['quantity']]);

        return response()->json([
            'success' => true,
            'message' => 'Cart item updated',
            'data' => $cartItem
        ], 200);
    }

    public function remove($userId, $productId)
    {
        $cartItem = CartItem::where('user_id', $userId)
            ->where('product_id', $productId)
            ->first();

        if (!$cartItem) {
            return response()->json([
                'success' => false,
                'message' => 'Cart item not found'
            ], 404);
        }

        $cartItem->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item removed from cart'
        ], 200);
    }

    public function clear($userId)
    {
        CartItem::where('user_id', $userId)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Cart cleared'
        ], 200);
    }

    // Checkout items dari satu UMKM saja
    public function checkoutBusiness(Request $request, $userId, $businessId)
    {
        $validated = $request->validate([
            'catatan' => 'nullable|string',
            'alamat_pengiriman' => 'required|string',
        ]);

        // Get cart items for this specific business
        $cartItems = CartItem::with(['product.user'])
            ->where('user_id', $userId)
            ->whereHas('product', function ($query) use ($businessId) {
                $query->where('user_id', $businessId);
            })
            ->get();

        if ($cartItems->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No items found for this business'
            ], 404);
        }

        DB::beginTransaction();
        try {
            // Calculate total
            $total = $cartItems->sum(function ($item) {
                return $item->product->harga * $item->jumlah;
            });

            // Create order
            $orderId = 'ORD-' . now()->format('YmdHis') . '-' . substr($userId, -4);
            $order = Order::create([
                'id' => $orderId,
                'user_id' => $userId,
                'business_id' => $businessId,
                'total' => $total,
                'status' => 'pending',
                'catatan' => $validated['catatan'] ?? null,
                'alamat_pengiriman' => $validated['alamat_pengiriman'],
            ]);

            // Create order items
            foreach ($cartItems as $cartItem) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $cartItem->product_id,
                    'jumlah' => $cartItem->jumlah,
                    'harga' => $cartItem->product->harga,
                    'subtotal' => $cartItem->product->harga * $cartItem->jumlah,
                ]);
            }

            // Remove items from cart
            CartItem::where('user_id', $userId)
                ->whereHas('product', function ($query) use ($businessId) {
                    $query->where('user_id', $businessId);
                })
                ->delete();

            DB::commit();

            // Generate WhatsApp link
            $business = $cartItems->first()->product->user;
            $message = "Halo {$business->nama}, saya ingin konfirmasi pesanan:\n\n";
            $message .= "Order ID: {$order->id}\n";
            $message .= "Total: Rp " . number_format($total, 0, ',', '.') . "\n";
            $message .= "Alamat: {$validated['alamat_pengiriman']}\n";
            if (!empty($validated['catatan'])) {
                $message .= "Catatan: {$validated['catatan']}\n";
            }

            $waLink = 'https://wa.me/' . $business->telepon . '?text=' . urlencode($message);

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully',
                'data' => [
                    'order_id' => $order->id,
                    'total' => $total,
                    'whatsapp_link' => $waLink,
                    'business' => [
                        'name' => $business->nama,
                        'phone' => $business->telepon,
                    ]
                ]
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create order',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
