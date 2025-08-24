<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $roles
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        // Cek apakah user sudah login
        if (!Auth::check()) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
            return redirect()->route('login');
        }

        $user = Auth::user();
        $allowedRoles = array_map('trim', explode('|', $roles));

        try {
            // Cek apakah user memiliki akses berdasarkan role
            if ($this->userHasRequiredRole($user, $allowedRoles)) {
                return $next($request);
            }

            // Log unauthorized access attempt
            Log::warning('Unauthorized access attempt', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'required_roles' => $allowedRoles,
                'user_roles' => $this->getUserRoles($user),
                'route' => $request->route()->getName(),
                'url' => $request->url()
            ]);

            // Response untuk unauthorized access
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Access denied. You do not have the required role.',
                    'required_roles' => $allowedRoles
                ], 403);
            }

            return abort(403, 'Access denied. You do not have the required role.');
        } catch (\Exception $e) {
            Log::error('RoleMiddleware Error: ' . $e->getMessage(), [
                'user_id' => $user->id ?? null,
                'roles' => $allowedRoles,
                'trace' => $e->getTraceAsString()
            ]);

            if ($request->expectsJson()) {
                return response()->json(['message' => 'Authorization check failed.'], 500);
            }

            return abort(500, 'Authorization check failed.');
        }
    }

    /**
     * Check if user has any of the required roles
     *
     * @param  mixed  $user
     * @param  array  $allowedRoles
     * @return bool
     */
    private function userHasRequiredRole($user, array $allowedRoles): bool
    {
        // Normalize and expand allowed roles to include Indonesian variants
        $expandedRoles = $this->expandRoles($allowedRoles);

        // Method 1: Use User model's hasAnyRole method if available
        if (method_exists($user, 'hasAnyRole')) {
            return $user->hasAnyRole($expandedRoles);
        }

        // Method 2: Spatie Laravel Permission (hasRole method)
        if (method_exists($user, 'hasRole')) {
            foreach ($expandedRoles as $role) {
                if ($user->hasRole($role)) {
                    return true;
                }
            }
        }

        // Method 3: Check roles relationship (manual role system)
        if ($user->relationLoaded('roles') || method_exists($user, 'roles')) {
            try {
                $userRoles = $user->roles()->pluck('name')->toArray();
                foreach ($expandedRoles as $role) {
                    if (in_array(strtolower($role), array_map('strtolower', $userRoles))) {
                        return true;
                    }
                }
            } catch (\Exception $e) {
                Log::error('Error checking roles relationship: ' . $e->getMessage());
            }
        }

        // Method 4: Direct role column check
        if (isset($user->role) && !empty($user->role)) {
            $userRole = strtolower($user->role);
            foreach ($expandedRoles as $role) {
                if ($userRole === strtolower($role)) {
                    return true;
                }
            }
        }

        // Method 5: Check using User model methods
        if (method_exists($user, 'getRoleName')) {
            $userRole = strtolower($user->getRoleName());
            foreach ($expandedRoles as $role) {
                if ($userRole === strtolower($role)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Expand roles to include both English and Indonesian variants
     *
     * @param  array  $roles
     * @return array
     */
    private function expandRoles(array $roles): array
    {
        $expandedRoles = [];
        $roleVariants = [
            'manager' => ['manager', 'manajer'],
            'manajer' => ['manager', 'manajer'],
            'staff' => ['staff', 'staf'],
            'staf' => ['staff', 'staf'],
            'admin' => ['admin'], // admin doesn't have Indonesian variant
        ];

        foreach ($roles as $role) {
            $roleLower = strtolower(trim($role));
            if (isset($roleVariants[$roleLower])) {
                $expandedRoles = array_merge($expandedRoles, $roleVariants[$roleLower]);
            } else {
                $expandedRoles[] = $role;
            }
        }

        return array_unique($expandedRoles);
    }

    /**
     * Get user's roles for logging purposes
     *
     * @param  mixed  $user
     * @return array
     */
    private function getUserRoles($user): array
    {
        $roles = [];

        try {
            // Spatie Permission
            if (method_exists($user, 'getRoleNames')) {
                $roles = $user->getRoleNames()->toArray();
            } elseif (method_exists($user, 'roles')) {
                $roles = $user->roles()->pluck('name')->toArray();
            }

            // Fallback to direct role column
            if (empty($roles) && isset($user->role)) {
                $roles = [$user->role];
            }

            // Fallback to model method
            if (empty($roles) && method_exists($user, 'getRoleName')) {
                $roles = [$user->getRoleName()];
            }
        } catch (\Exception $e) {
            Log::error('Error getting user roles: ' . $e->getMessage());
            $roles = ['unknown'];
        }

        return $roles;
    }
}
