<?php

// app/Policies/SupplierPolicy.php
namespace App\Policies;

use App\Models\User;
use App\Models\Supplier;
use Illuminate\Auth\Access\Response;

class SupplierPolicy
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
     * Manager bisa melihat daftar supplier.
     */
    public function viewAny(User $user): bool
    {
        return $user->isManager();
    }

    /**
     * Determine whether the user can view the model.
     * Manager bisa melihat detail supplier.
     */
    public function view(User $user, Supplier $supplier): bool
    {
        return $user->isManager();
    }

    /**
     * Determine whether the user can create models.
     * Manager bisa membuat supplier.
     */
    public function create(User $user): bool
    {
        return $user->isManager();
    }

    /**
     * Determine whether the user can update the model.
     * Manager bisa mengupdate supplier.
     */
    public function update(User $user, Supplier $supplier): bool
    {
        return $user->isManager();
    }

    /**
     * Determine whether the user can delete the model.
     * Hanya Admin yang bisa menghapus supplier.
     */
    public function delete(User $user, Supplier $supplier): bool
    {
        return false; // Manager tidak bisa menghapus
    }
}
