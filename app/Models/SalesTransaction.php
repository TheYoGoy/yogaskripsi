<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'product_id',
        'quantity',
        'price_per_unit',
        'total_price',
        'transaction_date',
        'user_id',
        'notes',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        // tanggal lainnya juga harus di-cast
    ];


    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
