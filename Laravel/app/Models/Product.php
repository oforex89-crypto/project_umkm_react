<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $table = 'tproduk';
    protected $primaryKey = 'id';
    public $incrementing = true;

    protected $fillable = [
        'umkm_id',
        'nama_produk',
        'harga',
        'stok',
        'deskripsi',
        'gambar',
        'kategori',
        'status',
        'approval_status'
    ];

    protected $casts = [
        'harga' => 'decimal:2',
        'stok' => 'integer'
    ];

    public function umkm()
    {
        return $this->belongsTo(Tumkm::class, 'umkm_id', 'id');
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class, 'product_id', 'id')->orderBy('sort_order');
    }

    public function cartItems()
    {
        return $this->hasMany(CartItem::class, 'product_id', 'id');
    }

    public function variantTypes()
    {
        return $this->hasMany(ProductVariantType::class, 'product_id', 'id')
                    ->orderBy('display_order');
    }
}
