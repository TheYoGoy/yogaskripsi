<?php
// app/Models/StockIn.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockIn extends Model
{
    use HasFactory;

    protected $table = 'stock_ins';

    /**
     * Kolom yang bisa diisi sesuai struktur database
     */
    protected $fillable = [
        'code',
        'product_id',
        'quantity',
        'date',
        'supplier', // nama supplier sebagai string
        'transaction_date',
        'source',
        'user_id',
        'purchase_transaction_id',
    ];

    /**
     * Casting tipe data
     */
    protected $casts = [
        'date' => 'datetime',
        'transaction_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'quantity' => 'integer',
        'product_id' => 'integer',
        'user_id' => 'integer',
        'purchase_transaction_id' => 'integer',
    ];

    /**
     * Hidden attributes
     */
    protected $hidden = [];

    /**
     * Appends for serialization
     */
    protected $appends = [
        'supplier_name',
        'formatted_quantity', 
        'formatted_date',
        'is_from_purchase'
    ];

    /**
     * Relasi ke Product
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * Relasi ke User
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Relasi ke PurchaseTransaction
     */
    public function purchaseTransaction(): BelongsTo
    {
        return $this->belongsTo(PurchaseTransaction::class, 'purchase_transaction_id');
    }

    /**
     * Relasi ke Supplier berdasarkan nama (jika ada tabel suppliers)
     * Ini untuk keperluan lookup saja, tidak digunakan untuk constraint
     */
    public function supplierRelation(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier', 'name');
    }

    /**
     * Accessor untuk mendapatkan nama supplier
     */
    public function getSupplierNameAttribute(): string
    {
        // Priority: field supplier -> product.supplier -> unknown
        if (!empty($this->supplier)) {
            return $this->supplier;
        }
        
        if ($this->relationLoaded('product') && $this->product && $this->product->supplier) {
            return $this->product->supplier->name;
        }
        
        // Lazy load if not eager loaded
        if ($this->product_id && !$this->relationLoaded('product')) {
            $product = $this->product()->with('supplier')->first();
            if ($product && $product->supplier) {
                return $product->supplier->name;
            }
        }
        
        return 'Unknown Supplier';
    }

    /**
     * Get formatted quantity
     */
    public function getFormattedQuantityAttribute(): string
    {
        return number_format($this->quantity, 0, ',', '.');
    }

    /**
     * Get formatted date - prioritas transaction_date > date
     */
    public function getFormattedDateAttribute(): string
    {
        $date = $this->transaction_date ?: $this->date;
        return $date ? $date->format('d M Y') : '-';
    }

    /**
     * Check if from purchase
     */
    public function getIsFromPurchaseAttribute(): bool
    {
        return !empty($this->purchase_transaction_id);
    }

    /**
     * Boot method untuk auto-generate code dan sinkronisasi
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($stockIn) {
            // Auto-generate code jika kosong
            if (empty($stockIn->code)) {
                $stockIn->code = static::generateCode();
            }

            // Set supplier dari product jika kosong dan product_id ada
            if (empty($stockIn->supplier) && !empty($stockIn->product_id)) {
                try {
                    $product = Product::with('supplier')->find($stockIn->product_id);
                    if ($product && $product->supplier) {
                        $stockIn->supplier = $product->supplier->name;
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Failed to auto-set supplier: ' . $e->getMessage());
                }
            }

            // Sync date dan transaction_date jika salah satu kosong
            if (!empty($stockIn->transaction_date) && empty($stockIn->date)) {
                $stockIn->date = $stockIn->transaction_date;
            } elseif (!empty($stockIn->date) && empty($stockIn->transaction_date)) {
                $stockIn->transaction_date = $stockIn->date;
            }

            // Set default date if both empty
            if (empty($stockIn->date) && empty($stockIn->transaction_date)) {
                $stockIn->date = now();
                $stockIn->transaction_date = now();
            }

            // Set user_id if empty
            if (empty($stockIn->user_id)) {
                $stockIn->user_id = auth()->id();
            }
        });

        static::updating(function ($stockIn) {
            // Sync date fields on update too
            if ($stockIn->isDirty('transaction_date') && !$stockIn->isDirty('date')) {
                $stockIn->date = $stockIn->transaction_date;
            } elseif ($stockIn->isDirty('date') && !$stockIn->isDirty('transaction_date')) {
                $stockIn->transaction_date = $stockIn->date;
            }
        });
    }

    /**
     * Generate unique code
     */
    protected static function generateCode(): string
    {
        try {
            $settings = \App\Models\Setting::first();
            $prefix = $settings->stock_prefix_in ?? 'SIN-';
        } catch (\Exception $e) {
            $prefix = 'SIN-';
        }
        
        $latestId = static::max('id') ?? 0;
        $nextId = $latestId + 1;
        $code = $prefix . str_pad($nextId, 5, '0', STR_PAD_LEFT);
        
        // Pastikan unique
        $attempts = 0;
        while (static::where('code', $code)->exists() && $attempts < 100) {
            $nextId++;
            $code = $prefix . str_pad($nextId, 5, '0', STR_PAD_LEFT);
            $attempts++;
        }
        
        return $code;
    }

    /**
     * Scope untuk filter tanggal - cek kedua kolom
     */
    public function scopeByDate($query, $date)
    {
        return $query->where(function($q) use ($date) {
            $q->whereDate('date', $date)
              ->orWhereDate('transaction_date', $date);
        });
    }

    /**
     * Scope untuk range tanggal
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->where(function($q) use ($startDate, $endDate) {
            $q->whereBetween('date', [$startDate, $endDate])
              ->orWhereBetween('transaction_date', [$startDate, $endDate]);
        });
    }

    /**
     * Scope untuk filter supplier berdasarkan nama
     */
    public function scopeBySupplier($query, $supplierName)
    {
        return $query->where('supplier', 'like', "%{$supplierName}%");
    }

    /**
     * Scope untuk filter supplier berdasarkan ID (via relasi product)
     */
    public function scopeBySupplierID($query, $supplierId)
    {
        return $query->whereHas('product.supplier', function($q) use ($supplierId) {
            $q->where('id', $supplierId);
        });
    }

    /**
     * Scope untuk filter product
     */
    public function scopeByProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    /**
     * Scope untuk pencarian global
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('code', 'like', "%{$search}%")
              ->orWhere('supplier', 'like', "%{$search}%")
              ->orWhere('source', 'like', "%{$search}%")
              ->orWhereHas('product', function ($productQuery) use ($search) {
                  $productQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('sku', 'like', "%{$search}%")
                               ->orWhere('code', 'like', "%{$search}%");
              })
              ->orWhereHas('user', function ($userQuery) use ($search) {
                  $userQuery->where('name', 'like', "%{$search}%");
              });
        });
    }

    /**
     * Scope data hari ini
     */
    public function scopeToday($query)
    {
        return $query->where(function($q) {
            $q->whereDate('date', today())
              ->orWhereDate('transaction_date', today());
        });
    }

    /**
     * Scope data bulan ini
     */
    public function scopeThisMonth($query)
    {
        return $query->where(function($q) {
            $q->whereMonth('date', now()->month)->whereYear('date', now()->year)
              ->orWhere(function($subQ) {
                  $subQ->whereMonth('transaction_date', now()->month)
                       ->whereYear('transaction_date', now()->year);
              });
        });
    }

    /**
     * Scope untuk data tahun ini
     */
    public function scopeThisYear($query)
    {
        return $query->where(function($q) {
            $q->whereYear('date', now()->year)
              ->orWhereYear('transaction_date', now()->year);
        });
    }

    /**
     * Scope untuk filter berdasarkan source
     */
    public function scopeBySource($query, $source)
    {
        return $query->where('source', $source);
    }

    /**
     * Scope untuk data dengan purchase transaction
     */
    public function scopeWithPurchase($query)
    {
        return $query->whereNotNull('purchase_transaction_id');
    }

    /**
     * Scope untuk data tanpa purchase transaction
     */
    public function scopeWithoutPurchase($query)
    {
        return $query->whereNull('purchase_transaction_id');
    }

    /**
     * Get effective date (prioritas: transaction_date > date > created_at)
     */
    public function getEffectiveDateAttribute()
    {
        return $this->transaction_date ?: $this->date ?: $this->created_at;
    }

    /**
     * Scope untuk sorting yang aman
     */
    public function scopeOrderBySafe($query, $column, $direction = 'asc')
    {
        $allowedColumns = [
            'id', 'code', 'quantity', 'date', 'transaction_date', 
            'created_at', 'updated_at', 'supplier', 'source'
        ];

        if (in_array($column, $allowedColumns)) {
            return $query->orderBy($column, $direction);
        }

        return $query->orderBy('id', $direction);
    }

    /**
     * Method untuk validasi data sebelum save
     */
    public function validateData(): array
    {
        $errors = [];

        if (empty($this->product_id)) {
            $errors[] = 'Product ID is required';
        }

        if (empty($this->quantity) || $this->quantity <= 0) {
            $errors[] = 'Quantity must be greater than 0';
        }

        if (empty($this->transaction_date) && empty($this->date)) {
            $errors[] = 'Date is required';
        }

        return $errors;
    }

    /**
     * Method untuk mendapatkan ringkasan stock in
     */
    public static function getSummary($filters = [])
    {
        $query = static::query();

        // Apply filters
        if (!empty($filters['start_date'])) {
            $query->where('transaction_date', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->where('transaction_date', '<=', $filters['end_date']);
        }
        if (!empty($filters['product_id'])) {
            $query->where('product_id', $filters['product_id']);
        }

        return [
            'total_records' => $query->count(),
            'total_quantity' => $query->sum('quantity'),
            'total_products' => $query->distinct('product_id')->count('product_id'),
            'latest_entry' => $query->orderBy('transaction_date', 'desc')->first(),
        ];
    }

    /**
     * Method untuk export data
     */
    public function toExportArray(): array
    {
        return [
            'Kode' => $this->code,
            'Produk' => $this->product->name ?? '',
            'SKU' => $this->product->sku ?? '',
            'Jumlah' => $this->quantity,
            'Supplier' => $this->supplier_name,
            'Tanggal' => $this->formatted_date,
            'Sumber' => $this->source ?: 'Manual',
            'Dicatat Oleh' => $this->user->name ?? '',
            'Tanggal Dibuat' => $this->created_at->format('d/m/Y H:i'),
        ];
    }
}