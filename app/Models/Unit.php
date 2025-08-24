<?php

// app/Models/Unit.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'symbol',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Scope for active units.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get products that use this unit.
     */
    public function products()
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Get the full unit display name.
     */
    public function getFullNameAttribute()
    {
        return $this->name . ' (' . $this->symbol . ')';
    }
    /**
     * Get the products for the unit.
     */
}
