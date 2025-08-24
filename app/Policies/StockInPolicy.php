<?php

// app/Policies/StockInPolicy.php
namespace App\Policies;

use App\Models\User;
use App\Models\StockIn;
use Illuminate\Auth\Access\Response;

class StockInPolicy
{
    /**
     * Perform pre-authorization checks.
     * Admin bisa melakukan segalanya.
     */
    public function before(User $user, string $ability): bool|null
    {
        if ($user->isAdmin()) {
            return true;
        }
        return null;
    }

    /**
     * Determine whether the user can view any models.
     * Staff dan Manager bisa melihat daftar stock in.
     */
    public function viewAny(User $user): bool
    {
        return $user->isStaff() || $user->isManager();
    }

    /**
     * Determine whether the user can view the model.
     * Staff dan Manager bisa melihat detail stock in.
     */
    public function view(User $user, StockIn $stockIn): bool
    {
        return $user->isStaff() || $user->isManager();
    }

    /**
     * Determine whether the user can create models.
     * Hanya Staff yang bisa membuat stock in.
     */
    public function create(User $user): bool
    {
        return $user->isStaff();
    }

    /**
     * Determine whether the user can delete the model.
     * Hanya Admin yang bisa menghapus stock in.
     */
    public function delete(User $user, StockIn $stockIn): bool
    {
        return false; // Staff/Manager tidak bisa menghapus
    }
}
