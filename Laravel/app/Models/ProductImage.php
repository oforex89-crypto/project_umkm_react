<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductImage extends Model
{
    protected $table = 'product_images';

    protected $fillable = [
        'product_id',
        'image_path',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Tproduk::class, 'product_id');
    }
}
