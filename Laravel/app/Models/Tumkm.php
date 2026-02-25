<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tumkm extends Model
{
    use HasFactory;

    protected $table = 'tumkm';
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $fillable = [
        'user_id',
        'nama_toko',
        'nama_pemilik',
        'deskripsi',
        'foto_toko',
        'kategori_id',
        'whatsapp',
        'telepon',
        'email',
        'instagram',
        'about_me',
        'alamat',
        'kota',
        'kode_pos',
        'status',
        // Additional fields
        'paroki',
        'umat',
        'nama_bank',
        'no_rekening',
        'atas_nama_rekening',
        'dokumen_perjanjian',
        'menyediakan_jasa_kirim',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'kategori_id', 'id');
    }

    public function products()
    {
        return $this->hasMany(Tproduk::class, 'umkm_id', 'id');
    }

    // Get only active/pending products (exclude rejected/inactive)
    public function activeProducts()
    {
        return $this->hasMany(Tproduk::class, 'umkm_id', 'id')
            ->whereIn('status', ['active', 'pending']);
    }
}
