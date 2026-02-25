<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Intervention\Image\Facades\Image;

class ImageController extends Controller
{
    /**
     * Upload and optimize an image
     */
    public function upload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // 2MB max
            'type' => 'required|in:umkm,product',
            'optimize' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('image');
            $type = $request->input('type');
            $optimize = $request->input('optimize', true);

            // Generate unique filename
            $timestamp = time();
            $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $extension = $file->getClientOriginalExtension();
            $filename = "{$type}_{$timestamp}_{$originalName}.{$extension}";

            // Determine storage path
            $storagePath = "images/{$type}";

            if ($optimize) {
                // Optimize image using Intervention Image
                $image = Image::make($file);

                // Resize if too large (max 1200px width/height)
                if ($image->width() > 1200 || $image->height() > 1200) {
                    $image->resize(1200, 1200, function ($constraint) {
                        $constraint->aspectRatio();
                        $constraint->upsize();
                    });
                }

                // Compress image
                $image->encode($extension, 85); // 85% quality

                // Save optimized image
                $path = $storagePath . '/' . $filename;
                Storage::disk('public')->put($path, (string) $image);
            } else {
                // Save without optimization
                $path = $file->store($storagePath, 'public');
                $filename = basename($path);
            }

            // Get file info
            $fileSize = Storage::disk('public')->size($path);
            $url = Storage::disk('public')->url($path);

            return response()->json([
                'success' => true,
                'message' => 'Gambar berhasil diupload',
                'data' => [
                    'filename' => $filename,
                    'path' => $path,
                    'url' => $url,
                    'size' => $fileSize,
                    'size_formatted' => $this->formatBytes($fileSize)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupload gambar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an image
     */
    public function delete(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'path' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Path gambar tidak valid',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $path = $request->input('path');

            // Check if file exists
            if (!Storage::disk('public')->exists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gambar tidak ditemukan'
                ], 404);
            }

            // Delete file
            Storage::disk('public')->delete($path);

            return response()->json([
                'success' => true,
                'message' => 'Gambar berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus gambar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update image (upload new, delete old)
     */
    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // 2MB max
            'old_path' => 'nullable|string',
            'type' => 'required|in:umkm,product'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Upload new image
            $uploadResult = $this->upload($request);
            $uploadData = json_decode($uploadResult->getContent(), true);

            if (!$uploadData['success']) {
                return $uploadResult;
            }

            // Delete old image if provided
            $oldPath = $request->input('old_path');
            if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }

            return response()->json([
                'success' => true,
                'message' => 'Gambar berhasil diperbarui',
                'data' => $uploadData['data']
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui gambar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get image info
     */
    public function info(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'path' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Path gambar tidak valid',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $path = $request->input('path');

            if (!Storage::disk('public')->exists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gambar tidak ditemukan'
                ], 404);
            }

            $size = Storage::disk('public')->size($path);
            $url = Storage::disk('public')->url($path);
            $mimeType = Storage::disk('public')->mimeType($path);
            $lastModified = Storage::disk('public')->lastModified($path);

            return response()->json([
                'success' => true,
                'data' => [
                    'path' => $path,
                    'url' => $url,
                    'size' => $size,
                    'size_formatted' => $this->formatBytes($size),
                    'mime_type' => $mimeType,
                    'last_modified' => date('Y-m-d H:i:s', $lastModified)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mendapatkan info gambar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Format bytes to human readable
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
