<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Admin;
use App\Services\WhatsAppOtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    protected $whatsappService;

    public function __construct(WhatsAppOtpService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }
    /**
     * Check if email is already registered
     * Used for real-time validation during registration
     */
    public function checkEmail(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
            ]);

            $email = $validated['email'];

            // Check in users table
            $userExists = User::where('email', $email)->exists();

            // Check in tadmin table as well
            $adminExists = DB::table('tadmin')->where('email', $email)->exists();

            $exists = $userExists || $adminExists;

            return response()->json([
                'success' => true,
                'available' => !$exists,
                'message' => $exists 
                    ? 'Email sudah terdaftar. Silakan gunakan email lain atau login.'
                    : 'Email tersedia'
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'available' => false,
                'message' => 'Format email tidak valid',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'available' => false,
                'message' => 'Gagal memeriksa email: ' . $e->getMessage()
            ], 500);
        }
    }

    public function register(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'nullable|email|unique:users',
                'telepon' => 'required|string|unique:users|max:20',
                'password' => 'required|string|min:6|confirmed',
                'alamat' => 'nullable|string|max:255',
                'kota' => 'nullable|string|max:100',
                'kode_pos' => 'nullable|string|max:10',
            ]);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'] ?? null,
                'telepon' => $validated['telepon'],
                'password' => Hash::make($validated['password']),
                'alamat' => $validated['alamat'] ?? null,
                'kota' => $validated['kota'] ?? null,
                'kode_pos' => $validated['kode_pos'] ?? null,
                'role' => 'user',
                'status' => 'active'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'User registered successfully',
                'data' => $user
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_type' => get_class($e)
            ], 500);
        }
    }

    // Login untuk user biasa (email atau telepon) atau admin
    public function login(Request $request)
    {
        try {
            $validated = $request->validate([
                'credential' => 'required|string',
                'password' => 'required|string',
            ]);

            $credential = $validated['credential'];

            // Try modern users table first
            $user = null;
            if (strpos($credential, '@') !== false) {
                $user = User::where('email', $credential)->first();
            } else {
                $user = User::where('no_telepon', $credential)->first();
            }

            if ($user) {
                // Verify password
                if (!Hash::check($validated['password'], $user->password)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Password salah'
                    ], 401);
                }

                // Check status
                if ($user->status !== 'active') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Akun Anda tidak aktif. Hubungi admin.'
                    ], 403);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Login berhasil',
                    'data' => [
                        'id' => $user->id,
                        'email' => $user->email,
                        'nama_lengkap' => $user->nama_lengkap,
                        'name' => $user->nama_lengkap,
                        'no_telepon' => $user->no_telepon,
                        'role' => $user->role,
                        'status' => $user->status,
                        'wa_verified' => $user->wa_verified,
                    ]
                ], 200);
            }

            // Try admin table (tadmin)
            $admin = DB::table('tadmin')
                ->where(function($query) use ($credential) {
                    $query->where('email', $credential)
                          ->orWhere('username', $credential);
                })
                ->first();

            if ($admin) {
                if (!password_verify($validated['password'], $admin->password)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Password salah'
                    ], 401);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Login admin berhasil',
                    'data' => [
                        'id' => $admin->id,
                        'email' => $admin->email,
                        'nama_lengkap' => $admin->nama,
                        'name' => $admin->nama,
                        'no_telepon' => null,
                        'role' => 'admin',
                        'status' => 'active',
                        'wa_verified' => true,
                    ]
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Email/Telepon atau password salah'
            ], 401);

        } catch (\Exception $e) {
            \Log::error('Login error: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Login error: ' . $e->getMessage()
            ], 500);
        }
    }

    // Login khusus untuk admin
    public function loginAdmin(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $admin = Admin::where('email', $validated['email'])->first();

        if (!$admin || !Hash::check($validated['password'], $admin->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah'
            ], 401);
        }

        if (!$admin->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun admin tidak aktif'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Login admin berhasil',
            'data' => [
                'admin' => [
                    'id' => $admin->id,
                    'nama' => $admin->nama,
                    'email' => $admin->email,
                    'is_active' => $admin->is_active,
                ],
                'role' => 'admin',
            ]
        ], 200);
    }

    public function getProfile(Request $request)
    {
        try {
            $userId = $request->header('X-User-ID');
            \Log::info('getProfile called', ['user_id' => $userId]);

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided'
                ], 400);
            }

            // Try modern User table FIRST (most common case)
            $user = User::find($userId);
            if ($user) {
                \Log::info('User found in modern table', ['id' => $user->id]);
                return response()->json([
                    'success' => true,
                    'data' => [
                        'id' => $user->id,
                        'nama_lengkap' => $user->nama_lengkap,
                        'name' => $user->nama_lengkap,
                        'email' => $user->email,
                        'no_telepon' => $user->no_telepon,
                        'role' => $user->role,
                        'status' => $user->status,
                        'wa_verified' => $user->wa_verified,
                        'alamat' => $user->alamat,
                        'kota' => $user->kota,
                        'kode_pos' => $user->kode_pos,
                    ]
                ], 200);
            }

            // Try legacy tpengguna
            if (\Schema::hasTable('tpengguna')) {
                $legacyUser = DB::table('tpengguna')
                    ->where('kodepengguna', $userId)
                    ->first();

                if ($legacyUser) {
                    $umkm = DB::table('tumkm')
                        ->where('kodepengguna', $legacyUser->kodepengguna)
                        ->first();

                    return response()->json([
                        'success' => true,
                        'data' => [
                            'id' => $legacyUser->kodepengguna,
                            'nama_lengkap' => $legacyUser->namapengguna ?? '',
                            'name' => $legacyUser->namapengguna ?? '',
                            'email' => ($legacyUser->namapengguna ?? 'user') . '@umkm.local',
                            'no_telepon' => $legacyUser->teleponpengguna ?? null,
                            'role' => $umkm ? 'umkm' : 'customer',
                            'status' => $legacyUser->status ?? 'active',
                            'wa_verified' => true,
                        ]
                    ], 200);
                }
            }

            // Try legacy tadmin
            if (\Schema::hasTable('tadmin')) {
                $admin = DB::table('tadmin')
                    ->where('kodeadmin', $userId)
                    ->first();

                if ($admin) {
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'id' => $admin->kodeadmin,
                            'nama_lengkap' => $admin->namaadmin ?? '',
                            'name' => $admin->namaadmin ?? '',
                            'email' => ($admin->namaadmin ?? 'admin') . '@admin.umkm',
                            'no_telepon' => null,
                            'role' => 'admin',
                            'status' => $admin->status ?? 'active',
                            'wa_verified' => true,
                        ]
                    ], 200);
                }
            }

            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
            
        } catch (\Exception $e) {
            \Log::error('getProfile error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateProfile(Request $request)
    {
        try {
            $userId = $request->header('X-User-ID');

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID not provided'
                ], 400);
            }

            // Try modern User table first
            $user = User::find($userId);
            if ($user) {
                $validated = $request->validate([
                    'nama' => 'nullable|string|max:255',
                    'email' => 'nullable|email|unique:users,email,' . $userId . ',id',
                    'telepon' => 'nullable|string|max:20',
                    'alamat' => 'nullable|string|max:255',
                    'kota' => 'nullable|string|max:100',
                    'kode_pos' => 'nullable|string|max:10',
                ]);

                // Map 'nama' to 'nama_lengkap' if provided
                if (isset($validated['nama'])) {
                    $validated['nama_lengkap'] = $validated['nama'];
                    unset($validated['nama']);
                }
                // Map 'telepon' to 'no_telepon' if provided
                if (isset($validated['telepon'])) {
                    $validated['no_telepon'] = $validated['telepon'];
                    unset($validated['telepon']);
                }

                $user->update($validated);

                // Sync profile data to UMKM store if user has one
                $umkm = DB::table('tumkm')->where('user_id', $userId)->first();
                if ($umkm) {
                    $umkmUpdate = [];
                    if ($user->no_telepon) {
                        $umkmUpdate['whatsapp'] = $user->no_telepon;
                        $umkmUpdate['telepon'] = $user->no_telepon;
                    }
                    if ($user->nama_lengkap) {
                        $umkmUpdate['nama_pemilik'] = $user->nama_lengkap;
                    }
                    if ($user->alamat) {
                        $umkmUpdate['alamat'] = $user->alamat;
                    }
                    if ($user->kota) {
                        $umkmUpdate['kota'] = $user->kota;
                    }
                    if ($user->kode_pos) {
                        $umkmUpdate['kode_pos'] = $user->kode_pos;
                    }
                    if (!empty($umkmUpdate)) {
                        DB::table('tumkm')->where('user_id', $userId)->update($umkmUpdate);
                    }
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Profile updated successfully',
                    'data' => $user
                ], 200);
            }

            // Try admin table (tadmin)
            if (\Schema::hasTable('tadmin')) {
                $admin = DB::table('tadmin')->where('id', $userId)->first();
                if ($admin) {
                    $validated = $request->validate([
                        'nama' => 'nullable|string|max:255',
                        'email' => 'nullable|email',
                    ]);

                    $updateData = [];
                    if (isset($validated['nama'])) {
                        $updateData['nama'] = $validated['nama'];
                    }
                    if (isset($validated['email'])) {
                        $updateData['email'] = $validated['email'];
                    }

                    if (!empty($updateData)) {
                        DB::table('tadmin')->where('id', $userId)->update($updateData);
                    }

                    $updatedAdmin = DB::table('tadmin')->where('id', $userId)->first();

                    return response()->json([
                        'success' => true,
                        'message' => 'Admin profile updated successfully',
                        'data' => [
                            'id' => $updatedAdmin->id,
                            'nama_lengkap' => $updatedAdmin->nama,
                            'name' => $updatedAdmin->nama,
                            'email' => $updatedAdmin->email,
                            'role' => 'admin',
                        ]
                    ], 200);
                }
            }

            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_type' => get_class($e)
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Logout successful'
        ], 200);
    }

    /**
     * Send OTP ke nomor WhatsApp untuk register user
     * Mengembalikan OTP code + wa.me link (user klik sendiri)
     */
    public function sendOtpRegister(Request $request)
    {
        try {
            $validated = $request->validate([
                'no_whatsapp' => 'required|string|regex:/^62[0-9]{9,12}$/',
            ]);

            // CHECK DULU: Apakah nomor WA sudah terdaftar?
            $existingUser = User::where('no_telepon', $validated['no_whatsapp'])
                ->first();

            if ($existingUser) {
                \Log::warning("Phone number already registered", [
                    'phone' => $validated['no_whatsapp'],
                    'user_id' => $existingUser->id
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Nomor WhatsApp sudah terdaftar. Silakan login dengan akun Anda.',
                    'error_code' => 'PHONE_ALREADY_REGISTERED'
                ], 409); // 409 Conflict
            }

            // Nomor belum terdaftar, generate OTP
            $result = $this->whatsappService->generateOtp($validated['no_whatsapp'], 'user');

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 400);
            }

            // Generate message dan wa.me link
            $message = $this->whatsappService->generateRegistrationMessage($result['code']);
            $waLink = $this->whatsappService->generateWhatsAppLink($validated['no_whatsapp'], $message);

            return response()->json([
                'success' => true,
                'message' => 'OTP generated. Click button to send via WhatsApp.',
                'data' => [
                    'code' => $result['code'],
                    'phone_number' => $validated['no_whatsapp'],
                    'wa_link' => $waLink,
                    'message' => $message,
                    'expires_in_minutes' => 5,
                ]
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
     * Verify OTP user
     */
    public function verifyOtpRegister(Request $request)
    {
        try {
            $validated = $request->validate([
                'no_whatsapp' => 'required|string',
                'code' => 'required|string|size:6',
                'email' => 'required|email',
                'nama' => 'required|string|max:255',
                'password' => 'required|string|min:6',
                'type' => 'required|in:user,business', // user atau business/umkm
            ]);

            \Log::info("Starting verifyOtpRegister", [
                'email' => $validated['email'],
                'phone' => $validated['no_whatsapp'],
                'type' => $validated['type']
            ]);

            // Check if user already exists BEFORE OTP verification
            $existingUser = User::where('email', $validated['email'])
                ->orWhere('no_telepon', $validated['no_whatsapp'])
                ->first();

            if ($existingUser) {
                \Log::info("User already exists, returning existing user", ['email' => $validated['email']]);
                return response()->json([
                    'success' => true,
                    'message' => 'Akun sudah terdaftar, silakan login',
                    'data' => [
                        'id' => $existingUser->id,
                        'email' => $existingUser->email,
                        'nama_lengkap' => $existingUser->nama_lengkap,
                        'no_telepon' => $existingUser->no_telepon,
                    ]
                ], 200);
            }

            // Verify OTP
            $result = $this->whatsappService->verifyOtp($validated['no_whatsapp'], $validated['code'], $validated['type']);

            if (!$result['success']) {
                \Log::warning("OTP verification failed", ['phone' => $validated['no_whatsapp']]);
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 400);
            }

            \Log::info("OTP verified, creating user...");

            // Create user setelah OTP verified - Use DB transaction
            \DB::beginTransaction();

            try {
                $hashedPassword = Hash::make($validated['password']);
                \Log::info("Password hashed successfully");

                $user = User::create([
                    'nama_lengkap' => $validated['nama'],
                    'email' => $validated['email'],
                    'no_telepon' => $validated['no_whatsapp'],
                    'password' => $hashedPassword,
                    'role' => $validated['type'] === 'business' ? 'umkm' : 'customer',
                    'status' => 'active',
                    'wa_verified' => true
                ]);

                if (!$user) {
                    throw new \Exception('User::create returned null');
                }

                \DB::commit();
                \Log::info("✅ User created successfully", [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'nama_lengkap' => $user->nama_lengkap
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Akun berhasil dibuat dan OTP terverifikasi',
                    'data' => [
                        'id' => $user->id,
                        'email' => $user->email,
                        'nama_lengkap' => $user->nama_lengkap,
                        'no_telepon' => $user->no_telepon,
                        'role' => $user->role,
                    ]
                ], 201);

            } catch (\Exception $dbError) {
                \DB::rollBack();
                \Log::error("Database transaction failed", [
                    'error' => $dbError->getMessage(),
                    'trace' => $dbError->getTraceAsString()
                ]);
                throw $dbError;
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error("Validation error in verifyOtpRegister", ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error("Error in verifyOtpRegister", [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Forgot Password - Step 1: Find user by email and send OTP to their WhatsApp
     */
    public function forgotPassword(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
            ]);

            // Find user by email
            $user = User::where('email', $validated['email'])->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email tidak ditemukan. Pastikan email Anda benar.'
                ], 404);
            }

            // Check if user has a phone number
            if (!$user->no_telepon) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akun ini tidak memiliki nomor WhatsApp terdaftar. Hubungi admin untuk reset password.'
                ], 400);
            }

            // Generate OTP with 'password_reset' type
            $result = $this->whatsappService->generateOtp($user->no_telepon, 'password_reset');

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 400);
            }

            // Generate WA message and link
            $message = "Halo! 🔐\nAnda meminta reset password.\n\nKode OTP: {$result['code']}\n\nBerlaku 5 menit.\nJangan bagikan kode ini kepada siapapun.";
            $waLink = $this->whatsappService->generateWhatsAppLink($user->no_telepon, $message);

            // Mask phone number for privacy (e.g. 628123****890)
            $phone = $user->no_telepon;
            $maskedPhone = substr($phone, 0, 4) . str_repeat('*', max(0, strlen($phone) - 7)) . substr($phone, -3);

            return response()->json([
                'success' => true,
                'message' => 'OTP berhasil dikirim ke WhatsApp Anda',
                'data' => [
                    'code' => $result['code'],
                    'phone_number' => $user->no_telepon,
                    'masked_phone' => $maskedPhone,
                    'wa_link' => $waLink,
                    'message' => $message,
                    'expires_in_minutes' => 5,
                ]
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
     * Reset Password - Step 2: Verify OTP and set new password
     */
    public function resetPassword(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'phone_number' => 'required|string',
                'code' => 'required|string|size:6',
                'new_password' => 'required|string|min:6',
            ]);

            // Find user
            $user = User::where('email', $validated['email'])->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak ditemukan'
                ], 404);
            }

            // Verify OTP
            $result = $this->whatsappService->verifyOtp($validated['phone_number'], $validated['code'], 'password_reset');

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kode OTP salah atau sudah kadaluarsa'
                ], 400);
            }

            // Update password
            $user->password = Hash::make($validated['new_password']);
            $user->save();

            \Log::info("Password reset successful", ['user_id' => $user->id, 'email' => $user->email]);

            return response()->json([
                'success' => true,
                'message' => 'Password berhasil direset! Silakan login dengan password baru.'
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error("Password reset error", ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
