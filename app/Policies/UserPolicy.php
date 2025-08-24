<?php

// app/Policies/UserPolicy.php
namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    /**
     * Perform pre-authorization checks.
     * Hanya Admin yang bisa mengelola pengguna.
     */
    public function before(User $user, string $ability): bool|null
    {
        if ($user->isAdmin()) {
            return true;
        }
        return false; // Jika bukan admin, tidak bisa melakukan apapun terkait user management
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Sudah ditangani oleh before method
        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, User $model): bool
    {
        // Sudah ditangani oleh before method
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Sudah ditangani oleh before method
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, User $model): bool
    {
        // Sudah ditangani oleh before method
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, User $model): bool
    {
        // Sudah ditangani oleh before method
        return false;
    }
}
