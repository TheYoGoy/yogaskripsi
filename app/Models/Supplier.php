<?php

// app/Models/Supplier.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'code',
        'name',
        'contact_person',
        'phone',
        'email',
        'address',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        // tanggal lainnya juga harus di-cast
    ];

    /**
     * Get the purchase transactions for the supplier.
     */
    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function purchaseTransactions(): HasMany
    {
        return $this->hasMany(PurchaseTransaction::class);
    }
}
