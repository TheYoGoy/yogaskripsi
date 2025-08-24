<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CheckPermission
{
    /**
     * Handle an incoming request.
     * BREEZE COMPATIBLE VERSION
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @param  string  $permissions
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next, string $permissions)
    {
        try {
            // BREEZE COMPATIBLE: Gunakan request->user() yang sudah handled oleh Breeze
            $user = $request->user();

            if (!$user) {
                Log::warning('MIDDLEWARE: No authenticated user for permission check');
                return redirect()->route('login')
                    ->with('error', 'Silakan login terlebih dahulu.');
            }

            // Parse required permissions (bisa multiple permissions dipisah dengan |)
            $requiredPermissions = array_map(function ($permission) {
                return trim($permission);
            }, explode('|', $permissions));

            // Check if user has any of the required permissions
            $hasPermission = $this->checkUserPermissions($user, $requiredPermissions);

            Log::info('MIDDLEWARE: Permission check', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'required_permissions' => $requiredPermissions,
                'access_granted' => $hasPermission,
                'route' => $request->route()?->getName() ?? $request->path()
            ]);

            if (!$hasPermission) {
                Log::warning('MIDDLEWARE: Permission denied', [
                    'user_id' => $user->id,
                    'required_permissions' => $requiredPermissions,
                    'requested_route' => $request->route()?->getName() ?? $request->path(),
                    'url' => $request->url()
                ]);

                // Check if it's an API request
                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'message' => 'Akses ditolak. Anda tidak memiliki permission yang diperlukan.',
                        'required_permissions' => $requiredPermissions,
                    ], 403);
                }

                // Redirect ke dashboard dengan pesan error untuk web requests
                return redirect()->route('dashboard')
                    ->with('error', 'Akses ditolak. Anda tidak memiliki permission untuk mengakses halaman tersebut.');
            }

            return $next($request);
        } catch (\Exception $e) {
            Log::error('MIDDLEWARE: CheckPermission Exception', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'url' => $request->url()
            ]);

            return redirect()->route('login')
                ->with('error', 'Terjadi kesalahan sistem. Silakan login kembali.');
        }
    }

    /**
     * Check if user has any of the required permissions
     */
    private function checkUserPermissions($user, array $requiredPermissions): bool
    {
        try {
            // Method 1: Check Spatie hasPermissionTo method
            if (method_exists($user, 'hasPermissionTo')) {
                foreach ($requiredPermissions as $permission) {
                    if ($user->hasPermissionTo($permission)) {
                        return true;
                    }
                }
                return false;
            }

            // Method 2: Check via roles (fallback)
            if (method_exists($user, 'hasRole')) {
                // Admin has all permissions
                if ($user->hasRole('admin')) {
                    return true;
                }

                // Check specific permissions based on roles
                $rolePermissions = $this->getRolePermissions($user);
                foreach ($requiredPermissions as $permission) {
                    if (in_array($permission, $rolePermissions)) {
                        return true;
                    }
                }
            }

            // Method 3: Default permission check (fallback)
            Log::warning('MIDDLEWARE: Using fallback permission check', [
                'user_id' => $user->id,
                'required_permissions' => $requiredPermissions
            ]);

            // Basic permission mapping untuk fallback
            return $this->basicPermissionCheck($user, $requiredPermissions);
        } catch (\Exception $e) {
            Log::error('MIDDLEWARE: Error checking permissions', [
                'error' => $e->getMessage(),
                'user_id' => $user->id ?? 'unknown'
            ]);
            return false;
        }
    }

    /**
     * Get role-based permissions (fallback method)
     */
    private function getRolePermissions($user): array
    {
        try {
            $userRole = 'staff'; // default

            if (method_exists($user, 'getRoleName')) {
                $userRole = $user->getRoleName();
            } elseif (method_exists($user, 'hasRole')) {
                if ($user->hasRole('admin')) $userRole = 'admin';
                elseif ($user->hasRole('manager')) $userRole = 'manager';
                elseif ($user->hasRole('staff')) $userRole = 'staff';
            }

            // Role-based permission mapping
            $rolePermissions = [
                'admin' => [
                    'view-dashboard',
                    'view-admin-dashboard',
                    'view-products',
                    'create-products',
                    'edit-products',
                    'delete-products',
                    'view-stock',
                    'stock-in',
                    'stock-out',
                    'adjust-stock',
                    'view-purchases',
                    'create-purchases',
                    'edit-purchases',
                    'approve-purchases',
                    'view-reports',
                    'export-reports',
                    'view-advanced-reports',
                    'view-users',
                    'create-users',
                    'edit-users',
                    'delete-users',
                    'view-settings',
                    'edit-settings',
                    'system-configuration',
                    'view-suppliers',
                    'create-suppliers',
                    'edit-suppliers',
                    'delete-suppliers',
                    'view-categories',
                    'create-categories',
                    'edit-categories',
                    'delete-categories',
                    'view-units',
                    'create-units',
                    'edit-units',
                    'delete-units',
                ],
                'manager' => [
                    'view-dashboard',
                    'view-manager-dashboard',
                    'view-products',
                    'create-products',
                    'edit-products',
                    'view-stock',
                    'stock-in',
                    'stock-out',
                    'view-purchases',
                    'create-purchases',
                    'edit-purchases',
                    'approve-purchases',
                    'view-reports',
                    'export-reports',
                    'view-advanced-reports',
                    'view-suppliers',
                    'create-suppliers',
                    'edit-suppliers',
                    'view-categories',
                    'create-categories',
                    'edit-categories',
                    'view-units',
                    'create-units',
                    'edit-units',
                ],
                'staff' => [
                    'view-dashboard',
                    'view-staff-dashboard',
                    'view-products',
                    'view-stock',
                    'stock-in',
                    'stock-out',
                    'view-purchases',
                    'create-purchases',
                    'view-suppliers',
                    'view-categories',
                    'view-units',
                ]
            ];

            return $rolePermissions[$userRole] ?? $rolePermissions['staff'];
        } catch (\Exception $e) {
            Log::error('MIDDLEWARE: Error getting role permissions', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Basic permission check (ultimate fallback)
     */
    private function basicPermissionCheck($user, array $requiredPermissions): bool
    {
        // Allow dashboard access untuk semua authenticated users
        if (in_array('view-dashboard', $requiredPermissions)) {
            return true;
        }

        // Basic permissions that all users should have
        $basicPermissions = ['view-products', 'view-stock', 'view-purchases'];
        foreach ($requiredPermissions as $permission) {
            if (in_array($permission, $basicPermissions)) {
                return true;
            }
        }

        return false;
    }
}
