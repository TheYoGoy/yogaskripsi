<?php

// app/Policies/CategoryPolicy.php
namespace App\Policies;

use App\Models\User;
use App\Models\Category;
use Illuminate\Auth\Access\Response;

class CategoryPolicy
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
        return null; // Lanjutkan ke metode policy yang spesifik
    }

    /**
     * Determine whether the user can view any models.
     * Manager bisa melihat daftar kategori.
     */
    public function viewAny(User $user): bool
    {
        return $user->isManager();
    }

    /**
     * Determine whether the user can view the model.
     * Manager bisa melihat detail kategori.
     */
    public function view(User $user, Category $category): bool
    {
        return $user->isManager();
    }

    /**
     * Determine whether the user can create models.
     * Manager bisa membuat kategori.
     */
    public function create(User $user): bool
    {
        return $user->isManager();
    }

    /**
     * Determine whether the user can update the model.
     * Manager bisa mengupdate kategori.
     */
    public function update(User $user, Category $category): bool
    {
        return $user->isManager();
    }

    /**
     * Determine whether the user can delete the model.
     * Hanya Admin yang bisa menghapus kategori.
     */
    public function delete(User $user, Category $category): bool
    {
        return false; // Manager tidak bisa menghapus
    }
}
