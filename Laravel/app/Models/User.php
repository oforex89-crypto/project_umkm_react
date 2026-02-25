<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'email',
        'password',
        'nama_lengkap',
        'no_telepon',
        'role',
        'status',
        'wa_verified',
        'wa_verification_code',
        'wa_verified_at',
        'alamat',
        'kota',
        'kode_pos',
        'foto_profil',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'wa_verification_code',
    ];

    protected $casts = [
        'wa_verified' => 'boolean',
        'wa_verified_at' => 'datetime',
        'email_verified_at' => 'datetime',
    ];

    // Relationship dengan UMKM
    public function umkm()
    {
        return $this->hasOne(UMKM::class, 'user_id');
    }

    // Check if user is UMKM
    public function isUmkm()
    {
        return $this->role === 'umkm';
    }

    // Check if user is customer
    public function isCustomer()
    {
        return $this->role === 'customer';
    }
}
