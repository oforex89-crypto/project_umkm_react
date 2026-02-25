<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventParticipant;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EventController extends Controller
{
    public function index()
    {
        // Use legacy tacara table
        // Only show events that are:
        // 1. Status is active
        // 2. Event date (tanggal) is today or in the future
        $today = now()->format('Y-m-d');
        
        $events = DB::table('tacara')
            ->select(
                'kodeacara as id',
                'namaacara as name',
                'detail as description',
                'tanggal as date',
                'kuotapeserta as quota',
                'tanggaldaftar as registration_date',
                'lokasi as location',
                'gambar as image',
                'gambar_position_x',
                'gambar_position_y',
                'gambar_scale',
                'status'
            )
            ->where('status', 'active')
            ->where('tanggal', '>=', $today) // Only show events that haven't passed
            ->orderBy('tanggal', 'asc') // Order by date ascending (nearest first)
            ->get();

        // Add participants count and images
        $events = $events->map(function($event) {
            $participantsCount = \Illuminate\Support\Facades\DB::table('event_participants')
                ->where('event_id', $event->id)
                ->where('status', '!=', 'cancelled')
                ->count();
            
            $event->participants_count = $participantsCount;
            $event->available_slots = max(0, $event->quota - $participantsCount);
            
            // Get extra images
            $extraImages = DB::table('event_images')
                ->where('event_code', $event->id)
                ->orderBy('sort_order')
                ->pluck('image_path')
                ->toArray();
            
            $allImages = [];
            if ($event->image) {
                $allImages[] = $event->image;
            }
            $allImages = array_merge($allImages, $extraImages);
            $event->images = $allImages;
            
            return $event;
        });

        return response()->json([
            'success' => true,
            'data' => $events
        ], 200);
    }

    /**
     * Get all events for admin panel (including expired ones)
     */
    public function indexAll()
    {
        $today = now()->format('Y-m-d');
        
        $events = DB::table('tacara')
            ->select(
                'kodeacara as id',
                'namaacara as name',
                'detail as description',
                'tanggal as date',
                'kuotapeserta as quota',
                'tanggaldaftar as registration_date',
                'lokasi as location',
                'gambar as image',
                'gambar_position_x',
                'gambar_position_y',
                'gambar_scale',
                'status'
            )
            ->orderBy('tanggal', 'desc') // Order by date descending (newest first)
            ->get();

        // Add participants count and expired status
        $events = $events->map(function($event) use ($today) {
            $participantsCount = DB::table('event_participants')
                ->where('event_id', $event->id)
                ->where('status', '!=', 'cancelled')
                ->count();
            
            $event->participants_count = $participantsCount;
            $event->available_slots = max(0, $event->quota - $participantsCount);
            $event->is_expired = $event->date < $today;
            
            // Get extra images
            $extraImages = DB::table('event_images')
                ->where('event_code', $event->id)
                ->orderBy('sort_order')
                ->pluck('image_path')
                ->toArray();
            
            $allImages = [];
            if ($event->image) {
                $allImages[] = $event->image;
            }
            $allImages = array_merge($allImages, $extraImages);
            $event->images = $allImages;
            
            return $event;
        });

        return response()->json([
            'success' => true,
            'data' => $events
        ], 200);
    }

    public function show($id)
    {
        $event = DB::table('tacara')
            ->select(
                'kodeacara as id',
                'namaacara as name',
                'detail as description',
                'tanggal as date',
                'kuotapeserta as quota',
                'tanggaldaftar as registration_date',
                'lokasi as location',
                'gambar as image',
                'gambar_position_x',
                'gambar_position_y',
                'gambar_scale',
                'status'
            )
            ->where('kodeacara', $id)
            ->first();

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Event not found'
            ], 404);
        }

        // Add participants count from event_participants table
        $participantsCount = DB::table('event_participants')
            ->where('event_id', $id)
            ->where('status', '!=', 'cancelled')
            ->count();
        
        $event->participants_count = $participantsCount;
        $event->available_slots = max(0, $event->quota - $participantsCount);

        // Get extra images
        $extraImages = DB::table('event_images')
            ->where('event_code', $id)
            ->orderBy('sort_order')
            ->pluck('image_path')
            ->toArray();
        
        $allImages = [];
        if ($event->image) {
            $allImages[] = $event->image;
        }
        $allImages = array_merge($allImages, $extraImages);
        $event->images = $allImages;

        return response()->json([
            'success' => true,
            'data' => $event
        ], 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'required|string',
            'date' => 'required|date',
            'location' => 'nullable|string|max:200',
            'quota' => 'nullable|integer|min:1',
            'image' => 'nullable|file|image|max:2048',
            'gambar_position_x' => 'nullable|integer',
            'gambar_position_y' => 'nullable|integer',
        ]);

        // Handle file upload
        $imagePath = null;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/events'), $filename);
            $imagePath = 'uploads/events/' . $filename;
        } elseif ($request->filled('image') && filter_var($request->image, FILTER_VALIDATE_URL)) {
            // If image is a URL
            $imagePath = $request->image;
        }

        // Generate event code
        $lastEvent = DB::table('tacara')
            ->orderBy('kodeacara', 'desc')
            ->first();
        
        if ($lastEvent) {
            $lastNumber = (int) substr($lastEvent->kodeacara, 3);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        $eventCode = 'EVT' . str_pad($newNumber, 3, '0', STR_PAD_LEFT);

        DB::table('tacara')->insert([
            'kodeacara' => $eventCode,
            'namaacara' => $validated['name'],
            'detail' => $validated['description'],
            'tanggal' => $validated['date'],
            'kuotapeserta' => $validated['quota'] ?? 100,
            'tanggaldaftar' => now(),
            'lokasi' => $validated['location'] ?? null,
            'gambar' => $imagePath,
            'gambar_position_x' => $request->gambar_position_x ?? 0,
            'gambar_position_y' => $request->gambar_position_y ?? 0,
            'gambar_scale' => $request->gambar_scale ?? 1.0,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Event created successfully',
            'data' => [
                'id' => $eventCode,
                'name' => $validated['name'],
                'description' => $validated['description'],
                'date' => $validated['date'],
                'quota' => $validated['quota'] ?? 100,
                'image' => $imagePath,
            ]
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $event = DB::table('tacara')
            ->where('kodeacara', $id)
            ->first();

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Event not found'
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'required|string',
            'date' => 'required|date',
            'location' => 'nullable|string|max:200',
            'quota' => 'nullable|integer|min:1',
            'image' => 'nullable|file|image|max:2048',
            'gambar_position_x' => 'nullable|integer',
            'gambar_position_y' => 'nullable|integer',
            'gambar_scale' => 'nullable|numeric|min:0.5|max:3',
        ]);

        // Prepare update data
        $updateData = [
            'namaacara' => $validated['name'],
            'detail' => $validated['description'],
            'tanggal' => $validated['date'],
            'kuotapeserta' => $validated['quota'] ?? $event->kuotapeserta,
            'lokasi' => $validated['location'] ?? null,
            'updated_at' => now(),
        ];

        // Always update position if provided
        if ($request->filled('gambar_position_x')) {
            $updateData['gambar_position_x'] = $request->gambar_position_x;
        }
        if ($request->filled('gambar_position_y')) {
            $updateData['gambar_position_y'] = $request->gambar_position_y;
        }
        if ($request->filled('gambar_scale')) {
            $updateData['gambar_scale'] = $request->gambar_scale;
        }

        // Handle file upload
        if ($request->hasFile('image')) {
            // Delete old image if exists and it's a local file
            if ($event->gambar && 
                !filter_var($event->gambar, FILTER_VALIDATE_URL) && 
                file_exists(public_path($event->gambar))) {
                unlink(public_path($event->gambar));
            }
            
            $file = $request->file('image');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/events'), $filename);
            $updateData['gambar'] = 'uploads/events/' . $filename;
        } elseif ($request->filled('image') && filter_var($request->image, FILTER_VALIDATE_URL)) {
            // If image is a URL
            $updateData['gambar'] = $request->image;
        }

        DB::table('tacara')
            ->where('kodeacara', $id)
            ->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Event updated successfully',
        ], 200);
    }

    public function destroy($id)
    {
        $event = DB::table('tacara')
            ->where('kodeacara', $id)
            ->first();

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Event not found'
            ], 404);
        }

        try {
            // Delete event image if exists and is local
            if ($event->gambar && 
                !filter_var($event->gambar, FILTER_VALIDATE_URL) && 
                file_exists(public_path($event->gambar))) {
                unlink(public_path($event->gambar));
            }

            // Delete event
            DB::table('tacara')
                ->where('kodeacara', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Event deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Event deletion error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete event: ' . $e->getMessage()
            ], 500);
        }
    }

    public function register(Request $request)
    {
        try {
            $validated = $request->validate([
                'event_id' => 'required|string',
                'user_id' => 'nullable|string',
                'name' => 'required|string|max:100',
                'email' => 'required|email|max:100',
                'phone' => 'required|string|max:20',
                'organization' => 'nullable|string|max:100',
                'notes' => 'nullable|string|max:500',
            ]);

            // Check if event exists
            $event = DB::table('tacara')
                ->where('kodeacara', $validated['event_id'])
                ->first();

            if (!$event) {
                return response()->json([
                    'success' => false,
                    'message' => 'Event tidak ditemukan'
                ], 404);
            }

            // Check quota using event_participants table
            $participantCount = DB::table('event_participants')
                ->where('event_id', $validated['event_id'])
                ->where('status', '!=', 'cancelled')
                ->count();

            if ($participantCount >= $event->kuotapeserta) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kuota event sudah penuh'
                ], 400);
            }

            // Check if email already registered for this event
            $exists = DB::table('event_participants')
                ->where('event_id', $validated['event_id'])
                ->where('email', $validated['email'])
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email ini sudah terdaftar di event ini'
                ], 400);
            }

            // Register to event_participants
            DB::table('event_participants')->insert([
                'event_id' => $validated['event_id'],
                'user_id' => $validated['user_id'] ?? null,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'organization' => $validated['organization'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'confirmed',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pendaftaran berhasil! Kami akan menghubungi Anda segera.'
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Event registration error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mendaftar: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getParticipants($id)
    {
        try {
            $participants = DB::table('event_participants')
                ->where('event_id', $id)
                ->where('status', '!=', 'cancelled')
                ->select(
                    'id',
                    'name',
                    'email',
                    'phone',
                    'organization',
                    'status',
                    'created_at'
                )
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $participants,
                'count' => $participants->count()
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Get participants error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch participants'
            ], 500);
        }
    }

    public function unregister($eventId, $userId)
    {
        $participant = EventParticipant::where('event_id', $eventId)
            ->where('user_id', $userId)
            ->first();

        if (!$participant) {
            return response()->json([
                'success' => false,
                'message' => 'Registration not found'
            ], 404);
        }

        $participant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Unregistered from event'
        ], 200);
    }

    public function getUserEvents($userId)
    {
        $events = Event::whereHas('participants', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })->with('participants')->get();

        return response()->json([
            'success' => true,
            'data' => $events
        ], 200);
    }

    /**
     * Register UMKM vendor to sell at an event
     */
    public function registerVendor(Request $request)
    {
        try {
            $validated = $request->validate([
                'event_id' => 'required|string',
                'umkm_id' => 'required|integer',
                'user_id' => 'nullable|integer',
                'products' => 'nullable|string', // JSON string of product IDs
                'notes' => 'nullable|string|max:500',
                'event_products' => 'nullable|string', // JSON string of event-exclusive products
                'agreement_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120', // Max 5MB
            ]);

            // Check if event exists
            $event = DB::table('tacara')
                ->where('kodeacara', $validated['event_id'])
                ->first();

            if (!$event) {
                return response()->json([
                    'success' => false,
                    'message' => 'Event tidak ditemukan'
                ], 404);
            }

            // Check if UMKM exists and is active
            $umkm = DB::table('tumkm')
                ->where('id', $validated['umkm_id'])
                ->where('status', 'active')
                ->first();

            if (!$umkm) {
                return response()->json([
                    'success' => false,
                    'message' => 'Toko UMKM tidak ditemukan atau belum disetujui'
                ], 404);
            }

            // Check if already registered
            $existingRegistration = DB::table('event_vendor_registrations')
                ->where('event_id', $validated['event_id'])
                ->where('umkm_id', $validated['umkm_id'])
                ->first();

            if ($existingRegistration) {
                // If previously rejected, allow resubmission by deleting old record
                if ($existingRegistration->status === 'rejected') {
                    // Delete old rejected registration and its event products
                    DB::table('event_products')
                        ->where('vendor_registration_id', $existingRegistration->id)
                        ->delete();
                    DB::table('event_vendor_registrations')
                        ->where('id', $existingRegistration->id)
                        ->delete();
                } elseif ($existingRegistration->status === 'pending') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Pendaftaran Anda masih menunggu persetujuan admin'
                    ], 400);
                } else {
                    // Status is approved
                    return response()->json([
                        'success' => false,
                        'message' => 'Toko UMKM ini sudah terdaftar di event ini'
                    ], 400);
                }
            }

            // Handle agreement file upload
            $agreementFilePath = null;
            if ($request->hasFile('agreement_file')) {
                $file = $request->file('agreement_file');
                $filename = time() . '_agreement_' . $validated['umkm_id'] . '_' . $validated['event_id'] . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('uploads/event_agreements'), $filename);
                $agreementFilePath = 'uploads/event_agreements/' . $filename;
            }

            // Register vendor
            $vendorRegistrationId = DB::table('event_vendor_registrations')->insertGetId([
                'event_id' => $validated['event_id'],
                'umkm_id' => $validated['umkm_id'],
                'user_id' => $validated['user_id'] ?? null,
                'products' => $validated['products'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'agreement_file' => $agreementFilePath,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Save event-exclusive products if provided
            if (!empty($validated['event_products'])) {
                $eventProducts = json_decode($validated['event_products'], true);
                if (is_array($eventProducts)) {
                    foreach ($eventProducts as $product) {
                        DB::table('event_products')->insert([
                            'event_id' => $validated['event_id'],
                            'vendor_registration_id' => $vendorRegistrationId,
                            'umkm_id' => $validated['umkm_id'],
                            'nama_produk' => $product['name'] ?? '',
                            'harga' => $product['price'] ?? 0,
                            'deskripsi' => $product['description'] ?? null,
                            'gambar' => null,
                            'stok' => 0,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Pendaftaran berhasil! Menunggu persetujuan admin.'
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Vendor registration error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mendaftar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get list of vendor registrations for an event (for admin)
     */
    public function getVendors($eventId)
    {
        try {
            $vendors = DB::table('event_vendor_registrations')
                ->leftJoin('tumkm', 'event_vendor_registrations.umkm_id', '=', 'tumkm.id')
                ->leftJoin('users', 'event_vendor_registrations.user_id', '=', 'users.id')
                ->where('event_vendor_registrations.event_id', $eventId)
                ->select(
                    'event_vendor_registrations.id',
                    'event_vendor_registrations.event_id',
                    'event_vendor_registrations.umkm_id',
                    'event_vendor_registrations.user_id',
                    'event_vendor_registrations.products',
                    'event_vendor_registrations.notes',
                    'event_vendor_registrations.admin_notes',
                    'event_vendor_registrations.agreement_file',
                    'event_vendor_registrations.status',
                    'event_vendor_registrations.created_at',
                    'tumkm.nama_toko as umkmName',
                    'tumkm.nama_pemilik as ownerName',
                    'tumkm.foto_toko as umkmImage',
                    'tumkm.whatsapp as umkmWhatsapp',
                    'users.nama_lengkap as userName',
                    'users.email as userEmail'
                )
                ->orderBy('event_vendor_registrations.created_at', 'desc')
                ->get();

            // Get products for each vendor
            $vendors = $vendors->map(function($vendor) {
                $productIds = json_decode($vendor->products ?? '[]', true);
                
                if (!empty($productIds)) {
                    $products = DB::table('tproduk')
                        ->whereIn('id', $productIds)
                        ->select('id', 'nama_produk as name', 'harga as price', 'gambar as image', 'deskripsi as description')
                        ->get();
                    $vendor->productDetails = $products;
                } else {
                    // Get all products from UMKM if not specified
                    $products = DB::table('tproduk')
                        ->where('umkm_id', $vendor->umkm_id)
                        ->where('status', 'active')
                        ->select('id', 'nama_produk as name', 'harga as price', 'gambar as image', 'deskripsi as description')
                        ->get();
                    $vendor->productDetails = $products;
                }
                
                // Also fetch event-exclusive products
                $eventProducts = DB::table('event_products')
                    ->where('vendor_registration_id', $vendor->id)
                    ->select('id', 'nama_produk as name', 'harga as price', 'gambar as image', 'deskripsi as description')
                    ->get();
                $vendor->eventProducts = $eventProducts;
                
                return $vendor;
            });

            return response()->json([
                'success' => true,
                'data' => $vendors,
                'count' => $vendors->count()
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Get vendors error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch vendors'
            ], 500);
        }
    }

    /**
     * Update vendor registration status (approve/reject)
     */
    public function updateVendorStatus(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:approved,rejected',
                'admin_notes' => 'nullable|string|max:500',
            ]);

            $vendor = DB::table('event_vendor_registrations')
                ->where('id', $id)
                ->first();

            if (!$vendor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vendor registration not found'
                ], 404);
            }

            DB::table('event_vendor_registrations')
                ->where('id', $id)
                ->update([
                    'status' => $validated['status'],
                    'admin_notes' => $validated['admin_notes'] ?? null,
                    'updated_at' => now(),
                ]);

            // Send notification to the vendor owner
            try {
                // Get event name
                $event = DB::table('tacara')
                    ->where('kodeacara', $vendor->event_id)
                    ->first();
                $eventName = $event ? $event->namaacara : 'Event';

                // Get the UMKM owner's user ID
                $umkm = DB::table('tumkm')
                    ->where('id', $vendor->umkm_id)
                    ->first();
                
                if ($umkm && $umkm->user_id) {
                    if ($validated['status'] === 'approved') {
                        NotificationService::notifyEventVendorApproved(
                            $umkm->user_id,
                            $eventName
                        );
                    } else {
                        NotificationService::notifyEventVendorRejected(
                            $umkm->user_id,
                            $eventName,
                            $validated['admin_notes'] ?? null
                        );
                    }
                }
            } catch (\Exception $notifError) {
                \Log::warning('Failed to send event vendor notification: ' . $notifError->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => $validated['status'] === 'approved' 
                    ? 'Pendaftaran vendor disetujui' 
                    : 'Pendaftaran vendor ditolak'
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Update vendor status error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update status'
            ], 500);
        }
    }

    /**
     * Store event-exclusive product
     */
    public function storeEventProduct(Request $request)
    {
        try {
            $validated = $request->validate([
                'event_id' => 'required|string',
                'vendor_registration_id' => 'required|integer',
                'umkm_id' => 'required|integer',
                'nama_produk' => 'required|string|max:100',
                'harga' => 'required|numeric|min:0',
                'deskripsi' => 'nullable|string',
                'gambar' => 'nullable|string',
                'stok' => 'nullable|integer|min:0',
            ]);

            $productId = DB::table('event_products')->insertGetId([
                'event_id' => $validated['event_id'],
                'vendor_registration_id' => $validated['vendor_registration_id'],
                'umkm_id' => $validated['umkm_id'],
                'nama_produk' => $validated['nama_produk'],
                'harga' => $validated['harga'],
                'deskripsi' => $validated['deskripsi'] ?? null,
                'gambar' => $validated['gambar'] ?? null,
                'stok' => $validated['stok'] ?? 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Produk khusus event berhasil ditambahkan',
                'data' => ['id' => $productId]
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Store event product error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan produk: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get event products for a vendor registration
     */
    public function getEventProducts($vendorRegistrationId)
    {
        try {
            $products = DB::table('event_products')
                ->where('vendor_registration_id', $vendorRegistrationId)
                ->select('id', 'nama_produk as name', 'harga as price', 'gambar as image', 'deskripsi as description', 'stok as stock')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $products
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Get event products error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch event products'
            ], 500);
        }
    }
}
