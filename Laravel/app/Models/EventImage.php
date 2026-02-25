<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventImage extends Model
{
    protected $table = 'event_images';

    protected $fillable = [
        'event_code',
        'image_path',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];
}
