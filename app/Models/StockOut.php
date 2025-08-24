<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockOut extends Model
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
        'customer',
        'transaction_date',
        'supplier_id',
        'user_id',
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
        'quantity' => 'integer',
        'product_id' => 'integer',
        'supplier_id' => 'integer',
        'user_id' => 'integer',
    ];

    /**
     * Get the product that had stock removed.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the supplier (optional).
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get the user who recorded the stock out transaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope untuk filter berdasarkan tanggal.
     */
    public function scopeByDate($query, $date)
    {
        return $query->whereDate('transaction_date', $date);
    }

    /**
     * Scope untuk filter berdasarkan customer.
     */
    public function scopeByCustomer($query, $customer)
    {
        return $query->where('customer', 'like', "%{$customer}%");
    }

    /**
     * Scope untuk filter berdasarkan product.
     */
    public function scopeByProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    /**
     * Get formatted transaction date.
     */
    public function getFormattedDateAttribute()
    {
        return $this->transaction_date ? $this->transaction_date->format('d/m/Y') : null;
    }

    /**
     * Get total value (if product has price).
     */
    public function getTotalValueAttribute()
    {
        if ($this->product && $this->product->price) {
            return $this->quantity * $this->product->price;
        }
        return 0;
    }
}
