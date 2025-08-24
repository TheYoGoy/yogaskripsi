<?php

// app/Policies/PurchaseTransactionPolicy.php
namespace App\Policies;

use App\Models\User;
use App\Models\PurchaseTransaction;
use Illuminate\Auth\Access\Response;

class PurchaseTransactionPolicy
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
     * Staff dan Manager bisa melihat daftar transaksi pembelian.
     */
    public function viewAny(User $user): bool
    {
        return $user->isStaff() || $user->isManager();
    }

    /**
     * Determine whether the user can view the model.
     * Staff dan Manager bisa melihat detail transaksi pembelian.
     */
    public function view(User $user, PurchaseTransaction $purchaseTransaction): bool
    {
        return $user->isStaff() || $user->isManager();
    }

    /**
     * Determine whether the user can create models.
     * Hanya Staff yang bisa membuat transaksi pembelian.
     */
    public function create(User $user): bool
    {
        return $user->isStaff();
    }

    /**
     * Determine whether the user can delete the model.
     * Hanya Admin yang bisa menghapus transaksi pembelian.
     */
    public function delete(User $user, PurchaseTransaction $purchaseTransaction): bool
    {
        return false; // Staff/Manager tidak bisa menghapus
    }

    public function update(User $user, PurchaseTransaction $purchaseTransaction): bool
    {
        return $user->isStaff() || $user->isManager();
    }
}
