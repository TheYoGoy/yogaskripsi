<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Product extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'category_id',
        'unit_id',
        'supplier_id',
        'name',
        'code',
        'sku',
        'description',
        'current_stock',
        'price',
        'lead_time',
        'daily_usage_rate',
        'minimum_stock',
        'holding_cost_percentage',
        'ordering_cost',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'daily_usage_rate' => 'float',
        'current_stock' => 'integer',
        'price' => 'decimal:2',
        'lead_time' => 'integer',
        'minimum_stock' => 'integer',
        'holding_cost_percentage' => 'float',
        'ordering_cost' => 'decimal:2',
    ];

    /**
     * Relasi ke kategori.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Relasi ke unit.
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * Relasi ke supplier.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Relasi ke transaksi stok masuk.
     */
    public function stockIns(): HasMany
    {
        return $this->hasMany(StockIn::class);
    }

    /**
     * Relasi ke transaksi stok keluar.
     */
    public function stockOuts(): HasMany
    {
        return $this->hasMany(StockOut::class);
    }

    /**
     * Relasi ke transaksi pembelian.
     */
    public function purchaseTransactions(): HasMany
    {
        return $this->hasMany(PurchaseTransaction::class);
    }

    /**
     * Hitung ROP berdasarkan input form user
     * ROP = (Daily Usage × Lead Time) + Safety Stock
     */
    public function calculateRop(): int
    {
        $dailyUsage = $this->daily_usage_rate ?? 0.5;
        $leadTime = $this->lead_time ?? 7;
        $safetyStock = $this->minimum_stock ?? 10;

        $rop = (int) round($dailyUsage * $leadTime + $safetyStock);

        return max($rop, 1);
    }

    /**
     * Hitung EOQ berdasarkan input form user
     * EOQ = √((2 × Annual Demand × Ordering Cost) / (Price × Holding Cost %))
     */
    public function calculateEoq(): int
    {
        $dailyUsage = $this->daily_usage_rate ?? 0.5;
        $annualDemand = $dailyUsage * 365;

        $orderingCost = $this->ordering_cost ?? 25000;
        $holdingCostPercentage = $this->holding_cost_percentage ?? 0.2;
        $holdingCost = ($this->price ?? 0) * $holdingCostPercentage;

        if ($holdingCost <= 0 || $annualDemand <= 0) {
            return 0;
        }

        $numerator = 2 * $annualDemand * $orderingCost;
        $eoq = (int) round(sqrt($numerator / $holdingCost));

        return max($eoq, 1);
    }

    /**
     * Hitung rata-rata pemakaian harian dari transaksi stock out.
     */
    public function calculateDailyUsageRate(): float
    {
        $totalOut = $this->stockOuts()->sum('quantity');

        if ($totalOut == 0) {
            return 0.5; // Default minimal usage 0.5 unit per hari
        }

        // Hitung jumlah hari unik yang ada transaksi stock out
        $uniqueDays = $this->stockOuts()
            ->selectRaw('COUNT(DISTINCT DATE(date)) as days')
            ->value('days');

        $days = max($uniqueDays ?: 30, 1); // Minimal 1 hari untuk avoid division by zero

        return $totalOut / $days;
    }

    /**
     * Update daily usage rate dari transaksi stock out
     */
    public function updateDailyUsageRate(): void
    {
        $newRate = $this->calculateDailyUsageRate();
        $this->update(['daily_usage_rate' => $newRate]);
    }

    /**
     * Cek apakah produk perlu di-reorder (stock <= ROP)
     */
    public function needsReorder(): bool
    {
        return $this->current_stock <= $this->calculateRop();
    }

    /**
     * Get reorder status dengan warna
     */
    public function getReorderStatus(): array
    {
        $rop = $this->calculateRop();

        if ($this->current_stock <= 0) {
            return [
                'status' => 'out_of_stock',
                'message' => 'Stok habis',
                'color' => 'red',
                'urgent' => true
            ];
        } elseif ($this->current_stock <= $rop) {
            return [
                'status' => 'below_rop',
                'message' => 'Di bawah ROP',
                'color' => 'orange',
                'urgent' => true
            ];
        } else {
            return [
                'status' => 'normal',
                'message' => 'Normal',
                'color' => 'green',
                'urgent' => false
            ];
        }
    }

    public function isLowStock(): bool
    {
        if (!$this->hasRequiredStockData()) {
            return false;
        }

        $rop = $this->calculateRop();
        return $this->current_stock <= $rop;
    }

    public function getStockStatus(): array
    {
        if (!$this->hasRequiredStockData()) {
            return [
                'status' => 'unknown',
                'color' => 'gray',
                'message' => 'Data Tidak Lengkap',
                'level' => 0
            ];
        }

        if (!$this->isLowStock()) {
            return [
                'status' => 'normal',
                'color' => 'green',
                'message' => 'Stok Normal',
                'level' => 5
            ];
        }

        $rop = $this->calculateRop();
        $ratio = $this->current_stock / max($rop, 1);

        if ($ratio <= 0) {
            return [
                'status' => 'out_of_stock',
                'color' => 'gray',
                'message' => 'Habis',
                'level' => 0
            ];
        } elseif ($ratio <= 0.25) {
            return [
                'status' => 'critical',
                'color' => 'red',
                'message' => 'Kritis',
                'level' => 1
            ];
        } elseif ($ratio <= 0.5) {
            return [
                'status' => 'high',
                'color' => 'orange',
                'message' => 'Sangat Rendah',
                'level' => 2
            ];
        } elseif ($ratio <= 0.75) {
            return [
                'status' => 'medium',
                'color' => 'yellow',
                'message' => 'Rendah',
                'level' => 3
            ];
        } else {
            return [
                'status' => 'low',
                'color' => 'blue',
                'message' => 'Menipis',
                'level' => 4
            ];
        }
    }

    public function getStockPercentage(): float
    {
        if (!$this->hasRequiredStockData()) {
            return 0;
        }

        $rop = $this->calculateRop();
        return round(($this->current_stock / max($rop, 1)) * 100, 1);
    }

    public function getDaysUntilStockout(): int
    {
        if (!$this->hasRequiredStockData() || $this->daily_usage_rate <= 0) {
            return 0;
        }

        return (int) ceil($this->current_stock / $this->daily_usage_rate);
    }

    private function hasRequiredStockData(): bool
    {
        return !is_null($this->current_stock) &&
            !is_null($this->daily_usage_rate) &&
            !is_null($this->lead_time) &&
            $this->daily_usage_rate > 0;
    }

    public function checkAndSendLowStockNotification()
    {
        if (!$this->current_stock || !$this->daily_usage_rate || !$this->lead_time) {
            return false;
        }

        $rop = $this->calculateRop();

        if ($this->current_stock <= $rop) {
            // Cek apakah sudah ada notifikasi dalam 4 jam terakhir
            $recentNotification = DB::table('notifications')
                ->where('type', \App\Notifications\LowStockNotification::class)
                ->where('data->product_id', $this->id)
                ->where('created_at', '>=', now()->subHours(4))
                ->exists();

            if (!$recentNotification) {
                $this->sendLowStockNotification($rop);
                return true;
            }
        }

        return false;
    }

    private function sendLowStockNotification($rop)
    {
        // Kirim notifikasi ke user yang punya role admin, manager, atau inventory_manager
        $users = \App\Models\User::role(['admin', 'manager'])
            ->get();

        // Jika tidak ada user dengan role tersebut, ambil semua admin
        if ($users->isEmpty()) {
            $users = \App\Models\User::whereHas('roles', function ($query) {
                $query->where('name', 'admin');
            })->get();
        }

        foreach ($users as $user) {
            $user->notify(new \App\Notifications\LowStockNotification($this, $rop));
        }
    }
}
