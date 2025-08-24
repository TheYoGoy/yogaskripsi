<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseTransaction extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'invoice_number',      // <-- tambahkan ini
        'supplier_id',
        'product_id',
        'quantity',
        'price_per_unit',
        'total_price',
        'transaction_date',
        'user_id',
        'notes',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'transaction_date' => 'datetime',
        'total_price' => 'decimal:2',
        'price_per_unit' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the supplier that owns the purchase transaction.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get the product that was purchased.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the user who recorded the purchase transaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function stockIns()
    {
        return $this->hasMany(\App\Models\StockIn::class);
    }
}
