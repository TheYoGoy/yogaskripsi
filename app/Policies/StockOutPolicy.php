<?php

// app/Policies/StockOutPolicy.php
namespace App\Policies;

use App\Models\User;
use App\Models\StockOut;
use Illuminate\Auth\Access\Response;

class StockOutPolicy
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
     * Staff dan Manager bisa melihat daftar stock out.
     */
    public function viewAny(User $user): bool
    {
        return $user->isStaff() || $user->isManager();
    }

    /**
     * Determine whether the user can view the model.
     * Staff dan Manager bisa melihat detail stock out.
     */
    public function view(User $user, StockOut $stockOut): bool
    {
        return $user->isStaff() || $user->isManager();
    }

    /**
     * Determine whether the user can create models.
     * Hanya Staff yang bisa membuat stock out.
     */
    public function create(User $user): bool
    {
        return $user->isStaff();
    }

    /**
     * Determine whether the user can delete the model.
     * Hanya Admin yang bisa menghapus stock out.
     */
    public function delete(User $user, StockOut $stockOut): bool
    {
        return false; // Staff/Manager tidak bisa menghapus
    }
}
