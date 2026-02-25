<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tproduk extends Model
{
    use HasFactory;

    protected $table = 'tproduk';

    protected $fillable = [
        'umkm_id',
        'nama_produk',
        'deskripsi',
        'harga',
        'kategori',
        'stok',
        'gambar',
        'status',
    ];

    protected $casts = [
        'harga' => 'decimal:2',
        'stok' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function umkm()
    {
        return $this->belongsTo(Tumkm::class, 'umkm_id');
    }

    public function variantTypes()
    {
        return $this->hasMany(ProductVariantType::class, 'product_id')
                    ->orderBy('display_order');
    }
}
