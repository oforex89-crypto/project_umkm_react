<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\Tproduk;
use App\Models\User;
use App\Services\WhatsAppOtpService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    protected $whatsappService;

    public function __construct(WhatsAppOtpService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    /**
     * Create order dengan items dari request
     * Cart disimpan di localStorage frontend, jadi kita terima items langsung
     */
    public function create(Request $request)
    {
        try {
            $userId = $request->header('X-User-ID');

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided'
                ], 400);
            }

            $validated = $request->validate([
                'business_id' => 'required|string',
                'no_whatsapp_pembeli' => 'nullable|string|max:20',
                'catatan' => 'nullable|string',
                'payment_method' => 'nullable|string|max:100',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|string',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.price' => 'required|numeric|min:0',
                'items.*.name' => 'required|string',
                'total' => 'required|numeric|min:0',
            ]);

            // Validate stock availability before creating order
            foreach ($validated['items'] as $item) {
                $product = DB::table('tproduk')->where('id', $item['product_id'])->first();
                if ($product && $product->stok !== null) {
                    if ($item['quantity'] > $product->stok) {
                        return response()->json([
                            'success' => false,
                            'message' => "Stok {$product->nama_produk} tidak mencukupi. Stok tersedia: {$product->stok}, diminta: {$item['quantity']}"
                        ], 400);
                    }
                }
            }

            // Log request data for debugging
            \Log::info('Order creation request data:', [
                'user_id' => $userId,
                'business_id' => $validated['business_id'],
                'items_count' => count($validated['items']),
                'total' => $validated['total'],
                'validated_data' => $validated
            ]);

            // Create order
            $orderId = 'ORD-' . now()->format('Ymd') . '-' . Str::random(6);

            // Get buyer phone - fallback to user's registered phone if not provided
            $buyerPhone = $validated['no_whatsapp_pembeli'] ?? '';
            if (empty($buyerPhone) && $userId) {
                $user = User::find($userId);
                if ($user && $user->no_telepon) {
                    $buyerPhone = $user->no_telepon;
                }
            }

            $order = Order::create([
                'id' => $orderId,
                'user_id' => $userId,
                'business_id' => $validated['business_id'],
                'no_whatsapp_pembeli' => $buyerPhone,
                'catatan' => $validated['catatan'] ?? null,
                'payment_method' => $validated['payment_method'] ?? null,
                'total_harga' => $validated['total'],
                'status' => 'pending',
                'status_umkm' => 'pending_confirmation',
            ]);

            // Create order items and reduce stock
            foreach ($validated['items'] as $item) {
                OrderItem::create([
                    'id' => 'OI-' . Str::random(10),
                    'order_id' => $orderId,
                    'product_id' => $item['product_id'],
                    'jumlah' => $item['quantity'],
                    'harga_satuan' => $item['price'],
                    'subtotal' => $item['price'] * $item['quantity'],
                ]);

                // Reduce stock in tproduk table
                DB::table('tproduk')
                    ->where('id', $item['product_id'])
                    ->decrement('stok', $item['quantity']);
            }

            $order->load('items.product', 'user', 'business');

            // Send notification to UMKM
            try {
                if ($order->business && $order->business->user_id) {
                    $customerName = $order->user->nama_lengkap ?? $order->user->no_telepon ?? 'Customer';
                    NotificationService::notifyNewOrder(
                        $order->business->user_id,
                        $orderId,
                        $customerName,
                        $validated['total']
                    );
                }
            } catch (\Exception $notifError) {
                // Don't fail the order if notification fails
                \Log::warning('Failed to send order notification: ' . $notifError->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully',
                'data' => $order
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Order creation failed: ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage(),
                'debug' => [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => substr($e->getTraceAsString(), 0, 500)
                ]
            ], 500);
        }
    }

    /**
     * Get detail order + generate WhatsApp message
     */
    public function getDetail(Request $request, $orderId)
    {
        try {
            $order = Order::with('items.product', 'user', 'business')
                ->find($orderId);

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            // Generate WhatsApp message
            $message = $this->whatsappService->generateOrderMessage($order);
            $whatsappLink = $this->whatsappService->generateWhatsAppLink(
                $order->business->no_whatsapp,
                $message
            );

            return response()->json([
                'success' => true,
                'message' => 'Order details retrieved',
                'data' => [
                    'order' => $order,
                    'whatsapp_message' => $message,
                    'whatsapp_link' => $whatsappLink,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get orders untuk user
     */
    public function getUserOrders(Request $request)
    {
        try {
            $userId = $request->header('X-User-ID');

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided'
                ], 400);
            }

            $orders = Order::where('user_id', $userId)
                ->with('items.product', 'business')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Orders retrieved',
                'data' => $orders
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * UMKM update status pesanan
     * UMKM dapat mengubah status: processing, shipped, completed, cancelled
     */
    public function updateStatus(Request $request, $orderId)
    {
        try {
            $userId = $request->header('X-User-ID');

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided'
                ], 400);
            }

            $validated = $request->validate([
                'status' => 'required|in:processing,shipped,completed,cancelled',
                'lokasi_pengambilan' => 'nullable|string|max:500',
            ]);

            $order = Order::find($orderId);

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            // Get UMKM untuk user ini
            $umkm = \App\Models\Tumkm::where('user_id', $userId)->first();

            if (!$umkm) {
                return response()->json([
                    'success' => false,
                    'message' => 'UMKM not found'
                ], 404);
            }

            // Check if this order belongs to this UMKM
            if ($order->business_id != $umkm->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Order does not belong to your UMKM'
                ], 403);
            }

            // Prepare update data
            $updateData = ['status' => $validated['status']];
            
            // Add lokasi_pengambilan if provided (especially for processing status)
            if (isset($validated['lokasi_pengambilan']) && $validated['status'] === 'processing') {
                $updateData['lokasi_pengambilan'] = $validated['lokasi_pengambilan'];
            }

            // Set completed_at timestamp when order is completed
            if ($validated['status'] === 'completed') {
                $updateData['completed_at'] = now();
            }

            // Update status
            $order->update($updateData);

            $order->load('items.product', 'user', 'business');

            // Send notification to customer based on new status
            try {
                $customerId = $order->user_id;
                $storeName = $order->business->nama_toko ?? 'Toko';
                
                switch ($validated['status']) {
                    case 'processing':
                        NotificationService::notifyOrderConfirmed($customerId, $order->id, $storeName);
                        break;
                    case 'shipped':
                        NotificationService::notifyOrderReady($customerId, $order->id, $storeName);
                        break;
                    case 'completed':
                        NotificationService::notifyOrderCompleted($customerId, $order->id);
                        break;
                }
            } catch (\Exception $notifError) {
                \Log::warning('Failed to send status notification: ' . $notifError->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Order status updated',
                'data' => $order
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('UMKM updateStatus error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get orders untuk UMKM
     */
    public function getBusinessOrders(Request $request)
    {
        try {
            $userId = $request->header('X-User-ID');

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided'
                ], 400);
            }

            // Get UMKM untuk user ini (dari tabel tumkm)
            $umkm = \App\Models\Tumkm::where('user_id', $userId)->first();

            if (!$umkm) {
                return response()->json([
                    'success' => false,
                    'message' => 'UMKM not found for this user'
                ], 404);
            }

            // Get orders untuk UMKM ini berdasarkan business_id = tumkm.id
            $orders = Order::where('business_id', $umkm->id)
                ->with(['items.product', 'user'])
                ->orderBy('created_at', 'desc')
                ->get();

            // Ensure buyer phone is populated
            $orders = $orders->map(function($order) {
                // If no_whatsapp_pembeli is empty, try to get from user
                if (empty($order->no_whatsapp_pembeli) && $order->user) {
                    $order->no_whatsapp_pembeli = $order->user->no_telepon ?? '';
                }
                return $order;
            });

            return response()->json([
                'success' => true,
                'message' => 'Business orders retrieved',
                'data' => $orders
            ], 200);

        } catch (\Exception $e) {
            \Log::error('getBusinessOrders error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Customer update status pesanan secara manual
     * Status flow: pending -> paid -> processing -> shipped -> completed
     */
    public function updateStatusByCustomer(Request $request, $orderId)
    {
        try {
            $userId = $request->header('X-User-ID');

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided'
                ], 400);
            }

            $validated = $request->validate([
                'status' => 'required|in:paid,completed,cancelled',
                'catatan_pembayaran' => 'nullable|string|max:500',
                'bukti_pembayaran' => 'nullable|image|mimes:jpeg,png,jpg|max:2048', // Max 2MB
                'payment_method' => 'nullable|string|max:100', // Transfer Bank, QRIS, COD, etc.
            ]);

            $order = Order::find($orderId);

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            // Check if user is the order owner
            if ($order->user_id !== $userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - You can only update your own orders'
                ], 403);
            }

            // Validate status transition
            $currentStatus = $order->status;
            $newStatus = $validated['status'];

            $validTransitions = [
                'pending' => ['paid', 'cancelled'],
                'paid' => ['cancelled'],
                'processing' => ['completed'],
                'shipped' => ['completed'],
            ];

            if (!isset($validTransitions[$currentStatus]) || !in_array($newStatus, $validTransitions[$currentStatus])) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot change status from '{$currentStatus}' to '{$newStatus}'"
                ], 400);
            }

            $updateData = ['status' => $newStatus];
            
            // Add payment note if provided
            if (isset($validated['catatan_pembayaran'])) {
                $updateData['catatan_pembayaran'] = $validated['catatan_pembayaran'];
            }

            // Add payment method if provided (for paid status)
            if (isset($validated['payment_method']) && $newStatus === 'paid') {
                $updateData['payment_method'] = $validated['payment_method'];
            }

            // Set paid_at timestamp when customer confirms payment
            if ($newStatus === 'paid') {
                $updateData['paid_at'] = now();
            }

            // Set completed_at timestamp when order is completed
            if ($newStatus === 'completed') {
                $updateData['completed_at'] = now();
            }

            // Handle payment proof upload
            if ($request->hasFile('bukti_pembayaran')) {
                $file = $request->file('bukti_pembayaran');
                $filename = 'bukti_' . $orderId . '_' . time() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('bukti_pembayaran', $filename, 'public');
                $updateData['bukti_pembayaran'] = 'storage/' . $path;
            }

            $order->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Order status updated successfully',
                'data' => $order->fresh(['items.product', 'business'])
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get WhatsApp link for an order (to resend message)
     */
    public function getWhatsAppLink(Request $request, $orderId)
    {
        try {
            $order = Order::with('items.product', 'business')->find($orderId);

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            $message = $this->whatsappService->generateOrderMessage($order);
            $whatsappLink = $this->whatsappService->generateWhatsAppLink(
                $order->business->no_whatsapp,
                $message
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'whatsapp_link' => $whatsappLink,
                    'message' => $message
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
