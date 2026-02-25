<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Order extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'order_number',
        'user_id',
        'business_id',
        'no_whatsapp_pembeli',
        'catatan',
        'catatan_pembayaran',
        'bukti_pembayaran',
        'lokasi_pengambilan',
        'total_harga',
        'status',
        'status_umkm',
        'paid_at',
        'completed_at',
        'payment_method',
    ];

    protected $casts = [
        'total_harga' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'paid_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            try {
                if (empty($order->order_number)) {
                    $order->order_number = self::generateOrderNumber();
                }
            } catch (\Exception $e) {
                // If order_number column doesn't exist or query fails, just skip it
                \Log::warning('Failed to set order_number: ' . $e->getMessage());
            }
        });
    }

    /**
     * Generate unique order number with format: ORD-YYYYMMDD-XXX
     */
    public static function generateOrderNumber(): string
    {
        try {
            $date = now()->format('Ymd');
            $prefix = "ORD-{$date}-";
            
            // Get the last order number for today
            $lastOrder = self::where('order_number', 'like', $prefix . '%')
                ->orderBy('order_number', 'desc')
                ->first();
            
            if ($lastOrder) {
                // Extract the sequence number and increment
                $lastNumber = (int) substr($lastOrder->order_number, -3);
                $newNumber = $lastNumber + 1;
            } else {
                $newNumber = 1;
            }
            
            return $prefix . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
        } catch (\Exception $e) {
            // If query fails, generate random number as fallback
            \Log::warning('generateOrderNumber query failed: ' . $e->getMessage());
            $date = now()->format('Ymd');
            $random = str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
            return "ORD-{$date}-{$random}";
        }
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function business()
    {
        return $this->belongsTo(Tumkm::class, 'business_id', 'id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id', 'id');
    }
}
