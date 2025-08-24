<?php

// app/Policies/UnitPolicy.php
namespace App\Policies;

use App\Models\User;
use App\Models\Unit;
use Illuminate\Auth\Access\Response;

class UnitPolicy
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
     * Manager bisa melihat daftar satuan.
     */
    public function viewAny(User $user): bool
    {
        return $user->isManager();
    }

    /**
     * Determine whether the user can view the model.
     * Manager bisa melihat detail satuan.
     */
    public function view(User $user, Unit $unit): bool
    {
        return $user->isManager();
    }

    /**
     * Determine whether the user can create models.
     * Manager bisa membuat satuan.
     */
    public function create(User $user): bool
    {
        return $user->isManager();
    }

    /**
     * Determine whether the user can update the model.
     * Manager bisa mengupdate satuan.
     */
    public function update(User $user, Unit $unit): bool
    {
        return $user->isManager();
    }

    /**
     * Determine whether the user can delete the model.
     * Hanya Admin yang bisa menghapus satuan.
     */
    public function delete(User $user, Unit $unit): bool
    {
        return false; // Manager tidak bisa menghapus
    }
}
