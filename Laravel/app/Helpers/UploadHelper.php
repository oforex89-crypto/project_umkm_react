<?php

namespace App\Helpers;

use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class UploadHelper
{
    /**
     * Upload file to Cloudinary (production) or local storage (development)
     * 
     * @param \Illuminate\Http\UploadedFile $file
     * @param string $folder - subfolder name (e.g., 'toko', 'produk', 'events')
     * @param string|null $filename - optional custom filename
     * @return string - URL/path of uploaded file
     */
    public static function upload($file, $folder = 'uploads', $filename = null)
    {
        // Use Cloudinary if credentials are configured
        if (config('cloudinary.cloud_url') || env('CLOUDINARY_URL')) {
            try {
                $result = Cloudinary::upload($file->getRealPath(), [
                    'folder' => 'umkm/' . $folder,
                    'public_id' => $filename ? pathinfo($filename, PATHINFO_FILENAME) : null,
                    'resource_type' => 'auto',
                ]);
                
                return $result->getSecurePath();
            } catch (\Exception $e) {
                \Log::error('Cloudinary upload failed: ' . $e->getMessage());
                // Fallback to local storage
                return self::uploadLocal($file, $folder, $filename);
            }
        }
        
        // Fallback: local storage
        return self::uploadLocal($file, $folder, $filename);
    }

    /**
     * Upload to local storage (development)
     */
    private static function uploadLocal($file, $folder, $filename = null)
    {
        if (!$filename) {
            $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $file->getClientOriginalName());
        }
        
        $file->move(public_path('uploads/' . $folder), $filename);
        
        return '/uploads/' . $folder . '/' . $filename;
    }

    /**
     * Check if a URL is a Cloudinary URL
     */
    public static function isCloudinaryUrl($url)
    {
        return $url && str_contains($url, 'cloudinary.com');
    }

    /**
     * Get the full image URL (handles both Cloudinary and local paths)
     */
    public static function getImageUrl($path)
    {
        if (!$path) return null;
        
        // Already a full URL (Cloudinary or external)
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }
        
        // Local path - prepend base URL
        return url($path);
    }
}
