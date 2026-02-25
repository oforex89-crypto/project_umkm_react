<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RoleRequest;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Controller for managing Role Upgrade Requests
 * This handles requests from customers who want to become UMKM owners
 * Separate from BusinessSubmissionController which handles business/store registrations
 */
class RoleRequestController extends Controller
{
    /**
     * Get all pending role upgrade requests for admin
     */
    public function getPending()
    {
        $requests = RoleRequest::with('user')
            ->where('status_pengajuan', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        // Transform to match frontend expectations
        $transformed = $requests->map(function($request) {
            return [
                'id' => $request->id,
                'userId' => $request->user_id,
                'userEmail' => $request->user->email ?? 'N/A',
                'userName' => $request->user->nama_lengkap ?? $request->user->no_telepon,
                'requestedRole' => 'umkm',
                'currentRole' => $request->user->role ?? 'customer',
                'reason' => $request->alasan_pengajuan ?? 'No reason provided',
                'status' => $request->status_pengajuan,
                'submittedAt' => $request->created_at->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $transformed
        ], 200);
    }

    /**
     * Check if user has existing role upgrade request
     */
    public function checkUserRequest($userId)
    {
        $request = RoleRequest::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$request) {
            return response()->json([
                'success' => false,
                'message' => 'No request found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $request->id,
                'user_id' => $request->user_id,
                'alasan_pengajuan' => $request->alasan_pengajuan,
                'status' => $request->status_pengajuan,
                'created_at' => $request->created_at,
            ]
        ], 200);
    }

    /**
     * Submit a new role upgrade request
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'reason' => 'nullable|string|max:500',
        ]);

        // Check if user already has ANY request (not just pending)
        $existingRequest = RoleRequest::where('user_id', $validated['user_id'])
            ->first();

        if ($existingRequest) {
            if ($existingRequest->status_pengajuan === 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah memiliki permintaan yang sedang diproses'
                ], 422);
            }

            if ($existingRequest->status_pengajuan === 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Permintaan Anda sudah disetujui'
                ], 422);
            }

            // For rejected or other status, update the existing request
            $existingRequest->update([
                'alasan_pengajuan' => $validated['reason'] ?? 'Ingin menjadi UMKM Owner',
                'status_pengajuan' => 'pending',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Permintaan upgrade role berhasil diperbarui',
                'data' => $existingRequest
            ], 200);
        }

        // Get user data for required fields
        $user = User::find($validated['user_id']);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }

        if ($user->role === 'umkm') {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah menjadi UMKM'
            ], 422);
        }

        // Get first available category or use ID 1 as default
        $defaultCategory = \DB::table('categories')->first();
        $categoryId = $defaultCategory ? $defaultCategory->id : 1;

        // If no category exists, create one
        if (!$defaultCategory) {
            try {
                \DB::table('categories')->insert([
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $categoryId = \DB::getPdo()->lastInsertId();
            } catch (\Exception $e) {
                // If insert fails, just use 1 as fallback
                $categoryId = 1;
            }
        }

        // Create new request with required fields
        $roleRequest = RoleRequest::create([
            'user_id' => $validated['user_id'],
            'nama_pemilik' => $user->nama_lengkap ?? $user->no_telepon,
            'nama_toko' => 'Pending',  // Will be filled later
            'alamat_toko' => $user->alamat ?? 'Akan diisi kemudian',
            'kategori_id' => $categoryId,
            'alasan_pengajuan' => $validated['reason'] ?? 'Ingin menjadi UMKM Owner',
            'status_pengajuan' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permintaan upgrade role berhasil diajukan',
            'data' => $roleRequest
        ], 201);
    }

    /**
     * Approve role upgrade request
     */
    public function approve($requestId, Request $request)
    {
        $roleRequest = RoleRequest::find($requestId);

        if (!$roleRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Request not found'
            ], 404);
        }

        if ($roleRequest->status_pengajuan !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Request sudah diproses sebelumnya'
            ], 422);
        }

        // Update request status
        $roleRequest->update([
            'status_pengajuan' => 'approved',
        ]);

        // Update user role
        $user = User::find($roleRequest->user_id);
        if ($user) {
            $user->update(['role' => 'umkm']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Role upgrade request berhasil disetujui'
        ], 200);
    }

    /**
     * Reject role upgrade request
     */
    public function reject($requestId, Request $request)
    {
        $roleRequest = RoleRequest::find($requestId);

        if (!$roleRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Request not found'
            ], 404);
        }

        if ($roleRequest->status_pengajuan !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Request sudah diproses sebelumnya'
            ], 422);
        }

        // Update request status
        $roleRequest->update([
            'status_pengajuan' => 'rejected',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Role upgrade request ditolak'
        ], 200);
    }
}
