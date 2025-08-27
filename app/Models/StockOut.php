<?php
// app/Models/StockOut.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockOut extends Model
{
    use HasFactory;

    protected $table = 'stock_outs';

    /**
     * Kolom yang bisa diisi sesuai struktur database
     */
    protected $fillable = [
        'code',
        'product_id',
        'quantity',
        'date',
        'customer',
        'transaction_date',
        'user_id',
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
    ];

    /**
     * Hidden attributes
     */
    protected $hidden = [];

    /**
     * Appends for serialization
     */
    protected $appends = [
        'customer_name',
        'formatted_quantity', 
        'formatted_date'
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
     * Accessor untuk mendapatkan nama customer
     */
    public function getCustomerNameAttribute(): string
    {
        return $this->customer ?: 'Unknown Customer';
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
     * Boot method untuk auto-generate code dan sinkronisasi
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($stockOut) {
            // Auto-generate code jika kosong
            if (empty($stockOut->code)) {
                $stockOut->code = static::generateCode();
            }

            // Sync date dan transaction_date jika salah satu kosong
            if (!empty($stockOut->transaction_date) && empty($stockOut->date)) {
                $stockOut->date = $stockOut->transaction_date;
            } elseif (!empty($stockOut->date) && empty($stockOut->transaction_date)) {
                $stockOut->transaction_date = $stockOut->date;
            }

            // Set default date if both empty
            if (empty($stockOut->date) && empty($stockOut->transaction_date)) {
                $stockOut->date = now();
                $stockOut->transaction_date = now();
            }

            // Set user_id if empty
            if (empty($stockOut->user_id)) {
                $stockOut->user_id = auth()->id();
            }
        });

        static::updating(function ($stockOut) {
            // Sync date fields on update too
            if ($stockOut->isDirty('transaction_date') && !$stockOut->isDirty('date')) {
                $stockOut->date = $stockOut->transaction_date;
            } elseif ($stockOut->isDirty('date') && !$stockOut->isDirty('transaction_date')) {
                $stockOut->transaction_date = $stockOut->date;
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
            $prefix = $settings->stock_prefix_out ?? 'SOUT-';
        } catch (\Exception $e) {
            $prefix = 'SOUT-';
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
     * Scope untuk filter customer berdasarkan nama
     */
    public function scopeByCustomer($query, $customerName)
    {
        return $query->where('customer', 'like', "%{$customerName}%");
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
              ->orWhere('customer', 'like', "%{$search}%")
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
            'created_at', 'updated_at', 'customer'
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
     * Method untuk mendapatkan ringkasan stock out
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
            'Customer' => $this->customer_name,
            'Tanggal' => $this->formatted_date,
            'Dicatat Oleh' => $this->user->name ?? '',
            'Tanggal Dibuat' => $this->created_at->format('d/m/Y H:i'),
        ];
    }
}