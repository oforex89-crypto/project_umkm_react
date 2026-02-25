<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariantOption extends Model
{
    use HasFactory;

    protected $table = 'product_variant_options';

    protected $fillable = [
        'variant_type_id',
        'value',
        'image',
        'price_adjustment',
        'stock',
        'display_order',
    ];

    protected $casts = [
        'price_adjustment' => 'decimal:2',
        'stock' => 'integer',
        'display_order' => 'integer',
    ];

    // Relationships
    public function variantType()
    {
        return $this->belongsTo(ProductVariantType::class, 'variant_type_id');
    }
}
