<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseTransaction extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'invoice_number',
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
     */
    protected $casts = [
        'transaction_date' => 'datetime',
        'total_price' => 'decimal:2',
        'price_per_unit' => 'decimal:2',
        'quantity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = [
        'formatted_total_price',
        'formatted_price_per_unit',
        'total_stock_in_quantity',
        'remaining_quantity',
        'is_fully_received',
        'completion_percentage',
        'status_badge'
    ];

    /**
     * Relationship: Get the supplier that owns the purchase transaction.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Relationship: Get the product that was purchased.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Relationship: Get the user who recorded the purchase transaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relationship: Get all stock ins related to this purchase transaction.
     */
    public function stockIns(): HasMany
    {
        return $this->hasMany(StockIn::class, 'purchase_transaction_id');
    }

    /**
     * Accessor: Get formatted total price
     */
    public function getFormattedTotalPriceAttribute(): string
    {
        return 'Rp ' . number_format($this->total_price, 0, ',', '.');
    }

    /**
     * Accessor: Get formatted price per unit
     */
    public function getFormattedPricePerUnitAttribute(): string
    {
        return 'Rp ' . number_format($this->price_per_unit, 0, ',', '.');
    }

    /**
     * Accessor: Get total quantity from related stock ins
     */
    public function getTotalStockInQuantityAttribute(): int
    {
        if ($this->relationLoaded('stockIns')) {
            return $this->stockIns->sum('quantity');
        }
        
        return $this->stockIns()->sum('quantity');
    }

    /**
     * Accessor: Get remaining quantity to be received
     */
    public function getRemainingQuantityAttribute(): int
    {
        return max(0, $this->quantity - $this->total_stock_in_quantity);
    }

    /**
     * Accessor: Check if purchase is fully received
     */
    public function getIsFullyReceivedAttribute(): bool
    {
        return $this->total_stock_in_quantity >= $this->quantity;
    }

    /**
     * Accessor: Get completion percentage
     */
    public function getCompletionPercentageAttribute(): float
    {
        if ($this->quantity <= 0) {
            return 0;
        }
        
        return min(100, ($this->total_stock_in_quantity / $this->quantity) * 100);
    }

    /**
     * Accessor: Get status badge information
     */
    public function getStatusBadgeAttribute(): array
    {
        $status = $this->status ?? 'pending';
        
        $badges = [
            'pending' => [
                'label' => 'Pending',
                'class' => 'bg-yellow-100 text-yellow-800',
                'icon' => 'clock'
            ],
            'completed' => [
                'label' => 'Completed', 
                'class' => 'bg-green-100 text-green-800',
                'icon' => 'check-circle'
            ],
            'partial' => [
                'label' => 'Partial',
                'class' => 'bg-blue-100 text-blue-800', 
                'icon' => 'pie-chart'
            ],
            'cancelled' => [
                'label' => 'Cancelled',
                'class' => 'bg-red-100 text-red-800',
                'icon' => 'x-circle'
            ]
        ];

        return $badges[$status] ?? $badges['pending'];
    }

    /**
     * Boot method for model events
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($purchaseTransaction) {
            // Set default status
            if (empty($purchaseTransaction->status)) {
                $purchaseTransaction->status = 'pending';
            }
            
            // Set user_id if not set
            if (empty($purchaseTransaction->user_id)) {
                $purchaseTransaction->user_id = auth()->id();
            }
            
            // Calculate total_price if not set
            if (empty($purchaseTransaction->total_price)) {
                $purchaseTransaction->total_price = $purchaseTransaction->quantity * $purchaseTransaction->price_per_unit;
            }
            
            // Set transaction_date if not set
            if (empty($purchaseTransaction->transaction_date)) {
                $purchaseTransaction->transaction_date = now();
            }
        });

        static::updating(function ($purchaseTransaction) {
            // Recalculate total_price if quantity or price_per_unit changed
            if ($purchaseTransaction->isDirty(['quantity', 'price_per_unit'])) {
                $purchaseTransaction->total_price = $purchaseTransaction->quantity * $purchaseTransaction->price_per_unit;
            }
        });

        static::updated(function ($purchaseTransaction) {
            // Auto-update status based on stock ins
            $purchaseTransaction->updateStatusBasedOnStockIns();
        });
    }

    /**
     * Update status based on stock ins
     */
    public function updateStatusBasedOnStockIns(): void
    {
        $totalStockIn = $this->stockIns()->sum('quantity');
        
        if ($totalStockIn >= $this->quantity) {
            $newStatus = 'completed';
        } elseif ($totalStockIn > 0) {
            $newStatus = 'partial';
        } else {
            $newStatus = 'pending';
        }
        
        if ($this->status !== $newStatus) {
            $this->updateQuietly(['status' => $newStatus]);
        }
    }

    /**
     * Scope: Filter by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Filter pending purchases
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope: Filter completed purchases
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope: Filter by date range
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }

    /**
     * Scope: Filter by this month
     */
    public function scopeThisMonth($query)
    {
        return $query->whereMonth('transaction_date', now()->month)
                    ->whereYear('transaction_date', now()->year);
    }

    /**
     * Scope: Filter by supplier
     */
    public function scopeBySupplier($query, $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    /**
     * Scope: Filter by product
     */
    public function scopeByProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    /**
     * Scope: Search across multiple fields
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('invoice_number', 'like', "%{$search}%")
              ->orWhere('notes', 'like', "%{$search}%")
              ->orWhereHas('product', function ($productQuery) use ($search) {
                  $productQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('sku', 'like', "%{$search}%");
              })
              ->orWhereHas('supplier', function ($supplierQuery) use ($search) {
                  $supplierQuery->where('name', 'like', "%{$search}%");
              });
        });
    }

    /**
     * Scope: With stock ins summary
     */
    public function scopeWithStockInsSummary($query)
    {
        return $query->withCount('stockIns')
                    ->withSum('stockIns', 'quantity');
    }

    /**
     * Generate unique invoice number
     */
    public static function generateInvoiceNumber($date = null): string
    {
        $date = $date ?? now();
        $dateStr = $date->format('ym');
        
        $lastInvoice = static::where('invoice_number', 'like', "INV-{$dateStr}-%")
            ->latest('id')
            ->first();

        if ($lastInvoice && preg_match('/(\d{3})$/', $lastInvoice->invoice_number, $matches)) {
            $nextNumber = intval($matches[1]) + 1;
        } else {
            $nextNumber = 1;
        }

        $increment = str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
        $invoiceNumber = "INV-{$dateStr}-{$increment}";
        
        // Ensure uniqueness
        while (static::where('invoice_number', $invoiceNumber)->exists()) {
            $nextNumber++;
            $increment = str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
            $invoiceNumber = "INV-{$dateStr}-{$increment}";
        }
        
        return $invoiceNumber;
    }

    /**
     * Check if purchase can be deleted
     */
    public function canBeDeleted(): bool
    {
        return $this->stockIns()->count() === 0;
    }

    /**
     * Get delete prevention reason
     */
    public function getDeletePreventionReason(): string
    {
        $stockInsCount = $this->stockIns()->count();
        
        if ($stockInsCount > 0) {
            return "Transaksi memiliki {$stockInsCount} stock in terkait. Hapus stock in terlebih dahulu.";
        }
        
        return '';
    }

    /**
     * Get summary for this purchase
     */
    public function getSummary(): array
    {
        return [
            'invoice_number' => $this->invoice_number,
            'supplier_name' => $this->supplier->name ?? 'Unknown',
            'product_name' => $this->product->name ?? 'Unknown',
            'ordered_quantity' => $this->quantity,
            'received_quantity' => $this->total_stock_in_quantity,
            'remaining_quantity' => $this->remaining_quantity,
            'completion_percentage' => $this->completion_percentage,
            'status' => $this->status,
            'total_value' => $this->total_price,
            'transaction_date' => $this->transaction_date->format('Y-m-d'),
            'stock_ins_count' => $this->stockIns()->count(),
        ];
    }

    /**
     * Create stock in from this purchase
     */
    public function createStockIn($quantity, $options = []): StockIn
    {
        if ($quantity > $this->remaining_quantity) {
            throw new \Exception("Jumlah stock in ({$quantity}) melebihi sisa yang harus diterima ({$this->remaining_quantity})");
        }

        $stockInData = [
            'product_id' => $this->product_id,
            'quantity' => $quantity,
            'supplier' => $this->supplier->name ?? '',
            'transaction_date' => $options['transaction_date'] ?? now(),
            'date' => $options['date'] ?? now(),
            'source' => 'Purchase Transaction',
            'purchase_transaction_id' => $this->id,
            'user_id' => $options['user_id'] ?? auth()->id(),
        ];

        $stockIn = StockIn::create($stockInData);
        
        // Update purchase status
        $this->updateStatusBasedOnStockIns();
        
        return $stockIn;
    }

    /**
     * Export data for reports
     */
    public function toExportArray(): array
    {
        return [
            'Invoice' => $this->invoice_number,
            'Tanggal' => $this->transaction_date->format('d/m/Y'),
            'Supplier' => $this->supplier->name ?? '',
            'Produk' => $this->product->name ?? '',
            'Jumlah Pesan' => $this->quantity,
            'Jumlah Diterima' => $this->total_stock_in_quantity,
            'Sisa' => $this->remaining_quantity,
            'Harga/Unit' => $this->price_per_unit,
            'Total Harga' => $this->total_price,
            'Status' => ucfirst($this->status),
            'Persentase' => round($this->completion_percentage, 1) . '%',
            'Dicatat Oleh' => $this->user->name ?? '',
            'Catatan' => $this->notes ?? '',
        ];
    }
}