<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Log;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    // Konstanta role (3 roles only)
    const ROLE_ADMIN = 'admin';
    const ROLE_STAFF = 'staff';
    const ROLE_MANAGER = 'manager';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role', // Backward compatibility column (optional)
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Boot method to handle model events
     */
    protected static function boot()
    {
        parent::boot();

        // Assign default role if none exists
        static::created(function ($user) {
            if (!$user->roles()->count()) {
                try {
                    $user->assignRole(self::ROLE_STAFF); // Default ke staff
                } catch (\Exception $e) {
                    Log::error('Failed to assign default role to user: ' . $e->getMessage());
                }
            }
        });
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->hasRole(self::ROLE_ADMIN);
    }

    /**
     * Check if user is staff
     */
    public function isStaff(): bool
    {
        return $this->hasRole(self::ROLE_STAFF);
    }

    /**
     * Check if user is manager
     */
    public function isManager(): bool
    {
        return $this->hasRole(self::ROLE_MANAGER);
    }

    /**
     * Get user's primary role name
     * Returns the first role name or 'staff' as fallback
     */
    public function getRoleName(): string
    {
        try {
            if ($this->roles->count() > 0) {
                return $this->roles->first()->name;
            }

            return self::ROLE_STAFF;
        } catch (\Exception $e) {
            Log::error('Error getting role name: ' . $e->getMessage());
            return self::ROLE_STAFF;
        }
    }

    /**
     * Get user's role name in English (always normalized)
     * This method ensures compatibility with existing code
     */
    public function getRoleNameEnglish(): string
    {
        return $this->getRoleName(); // Already in English with Spatie
    }

    /**
     * Check if user has any of the given roles
     */
    public function hasAnyRole($roles): bool
    {
        if (is_string($roles)) {
            $roles = [$roles];
        }

        try {
            return $this->hasRole($roles);
        } catch (\Exception $e) {
            Log::error('Error checking user roles: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get user's role display name (for UI)
     */
    public function getRoleDisplayName(): string
    {
        $role = $this->getRoleName();

        $displayNames = [
            'admin' => 'Administrator',
            'staff' => 'Staff',
            'manager' => 'Manager',
        ];

        return $displayNames[$role] ?? ucfirst($role);
    }

    /**
     * Get role badge color for UI
     */
    public function getRoleBadgeColor(): string
    {
        $role = $this->getRoleName();

        return match ($role) {
            'admin' => 'danger',    // Red
            'manager' => 'warning', // Yellow
            'staff' => 'primary',   // Blue
            default => 'secondary', // Gray
        };
    }

    /**
     * Check if user can access dashboard based on role
     */
    public function canAccessDashboard(): bool
    {
        return $this->hasPermissionTo('view-dashboard');
    }

    /**
     * Check if user can manage users
     */
    public function canManageUsers(): bool
    {
        return $this->hasPermissionTo('view-users');
    }

    /**
     * Check if user can approve purchases
     */
    public function canApprovePurchases(): bool
    {
        return $this->hasPermissionTo('approve-purchases');
    }

    /**
     * Get all available roles (3 roles only)
     */
    public static function getAvailableRoles(): array
    {
        return [
            self::ROLE_ADMIN => 'Administrator',
            self::ROLE_STAFF => 'Staff',
            self::ROLE_MANAGER => 'Manager',
        ];
    }

    /**
     * Get role hierarchy level (for sorting/comparison)
     */
    public function getRoleLevel(): int
    {
        $role = $this->getRoleName();

        return match ($role) {
            'admin' => 3,    // Highest
            'manager' => 2,  // Middle
            'staff' => 1,    // Lowest
            default => 0,    // Unknown
        };
    }

    /**
     * Check if current user has higher role than given user
     */
    public function hasHigherRoleThan(User $otherUser): bool
    {
        return $this->getRoleLevel() > $otherUser->getRoleLevel();
    }

    /**
     * Scope to get users by role
     */
    public function scopeWithRole($query, $role)
    {
        return $query->whereHas('roles', function ($q) use ($role) {
            $q->where('name', $role);
        });
    }

    /**
     * Scope to get admin users
     */
    public function scopeAdmins($query)
    {
        return $query->withRole('admin');
    }

    /**
     * Scope to get staff users
     */
    public function scopeStaffs($query)
    {
        return $query->withRole('staff');
    }

    /**
     * Scope to get manager users
     */
    public function scopeManagers($query)
    {
        return $query->withRole('manager');
    }

    /**
     * Get user's permissions collection
     */
    public function getUserPermissions()
    {
        try {
            return $this->getAllPermissions();
        } catch (\Exception $e) {
            Log::error('Error getting user permissions: ' . $e->getMessage());
            return collect();
        }
    }

    /**
     * Check if user can perform action on resource
     * Convenience method for permission checking
     */
    public function can($ability, $arguments = []): bool
    {
        try {
            // First check Laravel's built-in authorization
            if (parent::can($ability, $arguments)) {
                return true;
            }

            // Then check Spatie permissions
            return $this->hasPermissionTo($ability);
        } catch (\Exception $e) {
            Log::error('Error checking user ability: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Relationships
     */
    public function stockIns(): HasMany
    {
        return $this->hasMany(StockIn::class, 'created_by');
    }

    public function stockOuts(): HasMany
    {
        return $this->hasMany(StockOut::class, 'created_by');
    }

    public function purchaseTransactions(): HasMany
    {
        return $this->hasMany(PurchaseTransaction::class, 'created_by');
    }
}
