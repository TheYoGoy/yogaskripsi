<?php

// app/Policies/EoqRopPolicy.php
namespace App\Policies;

use App\Models\User;
use App\Models\Product; // Menggunakan Product model sebagai referensi data

class EoqRopPolicy
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
     * Determine whether the user can view the EOQ & ROP page.
     * Manager bisa melihat halaman EOQ & ROP.
     */
    public function viewAny(User $user): bool
    {
        return $user->isManager();
    }

    /**
     * Determine whether the user can update EOQ & ROP parameters.
     * Manager bisa mengupdate parameter EOQ & ROP.
     */
    public function update(User $user, Product $product): bool
    {
        return $user->isManager();
    }
}
