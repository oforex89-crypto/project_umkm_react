<?php

namespace App\Helpers;

class UploadHelper
{
    /**
     * Upload file to Cloudinary (production) or local storage (development)
     * Uses Cloudinary REST API directly - no SDK needed
     */
    public static function upload($file, $folder = 'uploads', $filename = null)
    {
        $cloudinaryUrl = config('cloudinary.cloud_url');
        
        if ($cloudinaryUrl) {
            try {
                // Parse CLOUDINARY_URL: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
                $parsed = parse_url($cloudinaryUrl);
                $cloudName = $parsed['host'] ?? null;
                $apiKey = $parsed['user'] ?? null;
                $apiSecret = $parsed['pass'] ?? null;
                
                if ($cloudName && $apiKey && $apiSecret) {
                    $publicId = $filename ? pathinfo($filename, PATHINFO_FILENAME) : time() . '_upload';
                    $uploadFolder = 'umkm/' . $folder;
                    
                    // Cloudinary upload API
                    $timestamp = time();
                    $params = [
                        'folder' => $uploadFolder,
                        'public_id' => $publicId,
                        'timestamp' => $timestamp,
                    ];
                    
                    // Generate signature
                    ksort($params);
                    $signatureString = '';
                    foreach ($params as $key => $value) {
                        $signatureString .= $key . '=' . $value . '&';
                    }
                    $signatureString = rtrim($signatureString, '&') . $apiSecret;
                    $signature = sha1($signatureString);
                    
                    // Upload via cURL
                    $ch = curl_init();
                    curl_setopt($ch, CURLOPT_URL, "https://api.cloudinary.com/v1_1/{$cloudName}/image/upload");
                    curl_setopt($ch, CURLOPT_POST, true);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, [
                        'file' => new \CURLFile($file->getRealPath(), $file->getMimeType(), $file->getClientOriginalName()),
                        'api_key' => $apiKey,
                        'timestamp' => $timestamp,
                        'signature' => $signature,
                        'folder' => $uploadFolder,
                        'public_id' => $publicId,
                    ]);
                    
                    $response = curl_exec($ch);
                    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    curl_close($ch);
                    
                    if ($httpCode === 200) {
                        $result = json_decode($response, true);
                        $url = $result['secure_url'] ?? null;
                        if ($url) {
                            \Log::info('✅ Cloudinary upload success', ['url' => $url, 'folder' => $folder]);
                            return $url;
                        }
                    }
                    
                    \Log::error('Cloudinary upload failed', ['http_code' => $httpCode, 'response' => $response]);
                }
            } catch (\Exception $e) {
                \Log::error('Cloudinary upload exception: ' . $e->getMessage());
            }
            
            // Fallback to local storage
            \Log::warning('Cloudinary failed, falling back to local storage');
        }
        
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
        
        $uploadPath = public_path('uploads/' . $folder);
        if (!file_exists($uploadPath)) {
            mkdir($uploadPath, 0777, true);
        }
        
        $file->move($uploadPath, $filename);
        
        return 'uploads/' . $folder . '/' . $filename;
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
