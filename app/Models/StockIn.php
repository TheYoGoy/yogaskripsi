<?php

// app/Models/StockIn.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockIn extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'code',
        'product_id',
        'quantity',
        'supplier',
        'transaction_date',
        'source',
        'user_id',
        'purchase_transaction_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'transaction_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',

    ];

    /**
     * Get the product that received stock.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the user who recorded the stock in transaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function purchaseTransaction()
    {
        return $this->belongsTo(\App\Models\PurchaseTransaction::class);
    }
}
