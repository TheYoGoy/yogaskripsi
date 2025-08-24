<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CheckRole
{
    /**
     * Handle an incoming request.
     * BREEZE COMPATIBLE VERSION
     */
    public function handle(Request $request, Closure $next, string $roles)
    {
        try {
            // BREEZE COMPATIBLE: Gunakan request->user() yang sudah handled oleh Breeze auth
            $user = $request->user();

            if (!$user) {
                Log::warning('MIDDLEWARE: No authenticated user - redirecting to login');
                return redirect()->route('login')
                    ->with('error', 'Silakan login terlebih dahulu.');
            }

            // Parse allowed roles
            $allowedRoles = array_map(function ($role) {
                return strtolower(trim($role));
            }, explode('|', $roles));

            // Get user role dengan Breeze compatibility
            $userRole = $this->getBreezeCompatibleRole($user);

            Log::info('MIDDLEWARE: Breeze CheckRole', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'user_role' => $userRole,
                'allowed_roles' => $allowedRoles,
                'access_granted' => in_array($userRole, $allowedRoles),
                'route' => $request->route()?->getName() ?? $request->path()
            ]);

            // Check role access
            if (!in_array($userRole, $allowedRoles)) {
                Log::warning('MIDDLEWARE: Access denied', [
                    'user_id' => $user->id,
                    'user_role' => $userRole,
                    'required_roles' => $allowedRoles,
                    'url' => $request->url()
                ]);

                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'message' => 'Akses ditolak. Anda tidak memiliki izin untuk mengakses resource ini.',
                        'required_roles' => $allowedRoles,
                        'your_role' => $userRole
                    ], 403);
                }

                return redirect()->route('dashboard')
                    ->with('error', 'Akses ditolak. Anda tidak memiliki izin untuk mengakses halaman tersebut.');
            }

            return $next($request);
        } catch (\Exception $e) {
            Log::error('MIDDLEWARE: CheckRole Exception', [
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
     * Get user role dengan Breeze compatibility
     */
    private function getBreezeCompatibleRole($user): string
    {
        try {
            // Method 1: Spatie Permission (preferred)
            if (method_exists($user, 'getRoleName')) {
                $role = $user->getRoleName();
                if (!empty($role)) return $role;
            }

            // Method 2: Spatie hasRole check
            if (method_exists($user, 'hasRole')) {
                if ($user->hasRole('admin')) return 'admin';
                if ($user->hasRole('manager')) return 'manager';
                if ($user->hasRole('staff')) return 'staff';
            }

            // Method 3: Check roles relationship
            if (isset($user->roles) && $user->roles && $user->roles->count() > 0) {
                return $user->roles->first()->name;
            }

            // Method 4: Legacy role column
            if (isset($user->role) && !empty($user->role)) {
                return strtolower(trim($user->role));
            }

            // Method 5: Default for Breeze users
            Log::info('MIDDLEWARE: Using default staff role for Breeze user', [
                'user_id' => $user->id,
                'user_email' => $user->email
            ]);

            return 'staff';
        } catch (\Exception $e) {
            Log::error('MIDDLEWARE: Error getting role', [
                'error' => $e->getMessage(),
                'user_id' => $user->id ?? 'unknown'
            ]);
            return 'staff';
        }
    }
}
