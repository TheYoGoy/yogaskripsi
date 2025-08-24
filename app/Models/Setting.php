<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'company_name',
        'company_logo',
        'stock_prefix_in',
        'stock_prefix_out',
        'stock_min_threshold',
        'default_lead_time',
        'default_ordering_cost',
        'default_holding_cost',
        'default_unit_id',
        'preferred_date_format',
        'timezone',
        'dark_mode',
    ];

    protected $casts = [
        'dark_mode' => 'boolean',
        'default_ordering_cost' => 'float',
        'default_holding_cost' => 'float',
        'default_lead_time' => 'integer',
        'stock_min_threshold' => 'integer',
        'default_unit_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        // tanggal lainnya juga harus di-cast

    ];

    public function unit()
    {
        return $this->belongsTo(Unit::class, 'default_unit_id');
    }

    public function getOrderingCost()
    {
        return $this->default_ordering_cost ?? 25000;
    }

    public function getHoldingCost()
    {
        $holdingCostPercent = $this->default_holding_cost ?? 10; // 10%
        $averageProductPrice = Product::avg('price') ?? 10000;
        return ($holdingCostPercent / 100) * $averageProductPrice;
    }

    public function getLeadTime()
    {
        return $this->default_lead_time ?? 2;
    }

    public function getSafetyStock()
    {
        if ($this->default_safety_stock_percentage) {
            $averageDailyUsage = Product::avg('daily_usage_rate') ?? 1;
            $leadTime = $this->getLeadTime();
            return ceil($averageDailyUsage * $leadTime * ($this->default_safety_stock_percentage / 100));
        }

        return $this->stock_min_threshold ?? 0;
    }

    public function getDateFormat()
    {
        return $this->preferred_date_format ?? 'd-m-Y';
    }

    public function getTimezone()
    {
        return $this->timezone ?? config('app.timezone');
    }
}
