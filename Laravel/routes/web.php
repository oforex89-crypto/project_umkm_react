<?php

use Illuminate\Support\Facades\Route;

// Halaman utama Laravel menunjukkan info API (bukan welcome page)
Route::get('/', function () {
    return response()->json([
        'status'   => 'running',
        'message'  => 'UMKM Digital API Server',
        'api_url'  => url('/api'),
        'version'  => '1.0.0',
        'hint'     => 'React app berjalan di http://localhost:3000',
    ]);
});
