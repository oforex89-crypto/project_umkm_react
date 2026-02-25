<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariantType extends Model
{
    use HasFactory;

    protected $table = 'product_variant_types';

    protected $fillable = [
        'product_id',
        'name',
        'display_order',
    ];

    protected $casts = [
        'display_order' => 'integer',
    ];

    // Relationships
    public function product()
    {
        return $this->belongsTo(Tproduk::class, 'product_id');
    }

    public function options()
    {
        return $this->hasMany(ProductVariantOption::class, 'variant_type_id')
                    ->orderBy('display_order');
    }
}
