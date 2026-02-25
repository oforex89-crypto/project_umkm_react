<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure CORS settings for your application. This
    | configuration is used by the CORS service provider.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        // Local development
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3004',
        'http://localhost:3005',
        'http://localhost:5173',
        'http://localhost:5174',
        // Production
        'https://operasional.gstransport.id',
        'http://operasional.gstransport.id',
        'https://project-umkm-react.vercel.app',
        'https://projecct-umkm-laravel-production.up.railway.app',
        'https://redemtor-mundi-umkmdigital-production.up.railway.app',
        'https://redemtor-mundi-umkmdigital-production-f609.up.railway.app',
    ],

    'allowed_origins_patterns' => [
        '#^https://.*\.vercel\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
