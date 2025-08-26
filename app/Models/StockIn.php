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
        'supplier_id',
        'supplier_name',
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
        'quantity' => 'integer',
        'product_id' => 'integer',
        'supplier_id' => 'integer',
        'user_id' => 'integer',
        'purchase_transaction_id' => 'integer',
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

    /**
     * Get the supplier for this stock in transaction.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get the purchase transaction associated with this stock in.
     */
    public function purchaseTransaction(): BelongsTo
    {
        return $this->belongsTo(PurchaseTransaction::class);
    }

    /**
     * Accessor untuk mendapatkan nama supplier
     */
    public function getSupplierDisplayNameAttribute()
    {
        if ($this->supplier_name) {
            return $this->supplier_name;
        }
        
        return $this->supplier?->name ?? 'Unknown Supplier';
    }

    /**
     * Boot method untuk auto-generate code dan supplier name
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($stockIn) {
            if (empty($stockIn->code)) {
                $stockIn->code = static::generateCode();
            }
            
            // Auto set supplier_name dari relasi jika supplier_id ada
            if ($stockIn->supplier_id && empty($stockIn->supplier_name)) {
                $supplier = Supplier::find($stockIn->supplier_id);
                $stockIn->supplier_name = $supplier?->name;
            }
        });

        static::updating(function ($stockIn) {
            // Update supplier_name jika supplier_id berubah
            if ($stockIn->isDirty('supplier_id') && $stockIn->supplier_id) {
                $supplier = Supplier::find($stockIn->supplier_id);
                $stockIn->supplier_name = $supplier?->name;
            }
        });
    }

    /**
     * Generate unique code untuk stock in
     */
    protected static function generateCode(): string
    {
        try {
            $settings = \App\Models\Setting::first();
            $prefix = $settings->stock_prefix_in ?? 'SIN-';
        } catch (\Exception $e) {
            $prefix = 'SIN-';
        }
        
        // Cari ID terbesar dan tambah 1
        $latestId = static::max('id') ?? 0;
        $nextId = $latestId + 1;
        
        return $prefix . str_pad($nextId, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Scope untuk filter berdasarkan tanggal
     */
    public function scopeByDate($query, $date)
    {
        return $query->whereDate('transaction_date', $date);
    }

    /**
     * Scope untuk filter berdasarkan supplier
     */
    public function scopeBySupplier($query, $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    /**
     * Scope untuk filter berdasarkan product
     */
    public function scopeByProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    /**
     * Scope untuk pencarian
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('code', 'like', "%{$search}%")
              ->orWhereHas('product', function ($productQuery) use ($search) {
                  $productQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('sku', 'like', "%{$search}%")
                               ->orWhere('code', 'like', "%{$search}%");
              })
              ->orWhereHas('supplier', function ($supplierQuery) use ($search) {
                  $supplierQuery->where('name', 'like', "%{$search}%");
              })
              ->orWhere('supplier_name', 'like', "%{$search}%");
        });
    }
}