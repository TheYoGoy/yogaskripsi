<?php

// app/Policies/ReportPolicy.php
namespace App\Policies;

use App\Models\User;
use App\Models\Product; // Menggunakan Product model sebagai referensi data

class ReportPolicy
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
     * Determine whether the user can view any reports.
     * Manager bisa melihat laporan.
     */
    public function viewAny(User $user): bool
    {
        return $user->isManager();
    }

    /**
     * Determine whether the user can view a specific report.
     * Ini bisa digunakan jika ada laporan yang sangat spesifik izinnya.
     */
    public function view(User $user, Product $product): bool // Product sebagai placeholder model
    {
        return $user->isManager();
    }
}
