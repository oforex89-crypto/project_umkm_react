<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Umkm extends Model
{
    protected $table = 'tumkm';
    protected $primaryKey = 'kode_umkm';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'kode_umkm',
        'user_id',
        'nama_pemilik',
        'nama_toko',
        'alamat_toko',
        'kode_kategori',
        'no_whatsapp',
        'status_verifikasi_wa',
        'status',
        'menyediakan_jasa_kirim'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'kode_kategori', 'id');
    }

    public function products()
    {
        return $this->hasMany(Product::class, 'kode_umkm', 'kode_umkm');
    }
}
