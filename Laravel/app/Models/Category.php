<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $keyType = 'int';
    public $incrementing = true;
    protected $primaryKey = 'id';
    protected $table = 'categories';

    protected $fillable = [
        'id',
        'nama_kategori',
        'icon',
        'status'
    ];

    public function businesses()
    {
        return $this->hasMany(Tumkm::class, 'kategori_id', 'id');
    }
}
