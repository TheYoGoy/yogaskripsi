<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Product;
use Illuminate\Auth\Access\Response;

class ProductPolicy
{
    /**
     * Perform pre-authorization checks.
     */
    public function before(User $user, string $ability): bool|null
    {
        if ($user->isAdmin()) {
            return true; // Admin bisa melakukan segalanya
        }
        return null; // Lanjutkan ke metode policy yang spesifik
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Semua peran bisa melihat daftar produk
        return $user->isStaff() || $user->isManager();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Product $product): bool
    {
        // Semua peran bisa melihat detail produk
        return $user->isStaff() || $user->isManager();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Hanya admin dan manager yang bisa membuat produk
        return $user->isManager();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Product $product): bool
    {
        // Hanya admin dan manager yang bisa mengupdate produk
        return $user->isManager();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Product $product): bool
    {
        // Hanya admin yang bisa menghapus produk
        return false; // Manager tidak bisa menghapus
    }

    // Tambahkan policy untuk restore dan forceDelete jika diperlukan
}
