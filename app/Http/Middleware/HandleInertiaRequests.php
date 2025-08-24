<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;
use App\Models\Setting;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared to all views.
     */
    public function share(Request $request): array
    {
        // Laravel 12 - Enhanced debugging
        Log::info('=== LARAVEL 12 HandleInertiaRequests ===');
        Log::info('Request URL: ' . $request->url());
        Log::info('Request Method: ' . $request->method());
        Log::info('Auth Guard: ' . config('auth.defaults.guard'));
        Log::info('Auth::check(): ' . (Auth::check() ? 'TRUE' : 'FALSE'));

        // Multiple ways to get user in Laravel 12
        $user = null;

        // Method 1: Auth facade
        if (Auth::check()) {
            $user = Auth::user();
            Log::info('User found via Auth::user()');
        }

        // Method 2: Request user
        if (!$user && $request->user()) {
            $user = $request->user();
            Log::info('User found via $request->user()');
        }

        // Method 3: Session check (for Laravel 12)
        if (!$user && session()->has('login_web_' . sha1(config('app.name')))) {
            Log::info('Session exists but no user found - potential session issue');
        }

        if ($user) {
            Log::info('Final User - ID: ' . $user->id . ', Name: ' . $user->name);
        } else {
            Log::warning('No user found in any method');
        }

        $userData = null;
        if ($user) {
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $this->getUserRoles($user),
                'role_name' => $this->getPrimaryRole($user),
                'permissions' => $this->getUserPermissions($user),
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ];
        }

        $sharedData = [
            // Remove settings untuk sementara
            'auth' => [
                'user' => $userData,
            ],
            'ziggy' => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];

        Log::info('Shared data prepared - User exists: ' . ($userData ? 'TRUE' : 'FALSE'));
        Log::info('=== END HandleInertiaRequests ===');

        return array_merge(parent::share($request), $sharedData);
    }

    /**
     * Get user roles safely
     */
    private function getUserRoles($user): array
    {
        try {
            if (method_exists($user, 'getRoleNames')) {
                return $user->getRoleNames()->toArray();
            }

            if (method_exists($user, 'roles')) {
                return $user->roles->pluck('name')->toArray();
            }

            return ['staff'];
        } catch (\Exception $e) {
            Log::error('Error getting user roles: ' . $e->getMessage());
            return ['staff'];
        }
    }

    /**
     * Get user permissions safely
     */
    private function getUserPermissions($user): array
    {
        try {
            if (method_exists($user, 'getAllPermissions')) {
                return $user->getAllPermissions()->pluck('name')->toArray();
            }
            return [];
        } catch (\Exception $e) {
            Log::error('Error getting user permissions: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get primary role
     */
    private function getPrimaryRole($user): string
    {
        $roles = $this->getUserRoles($user);

        if (in_array('admin', $roles)) return 'admin';
        if (in_array('manager', $roles)) return 'manager';
        if (in_array('staff', $roles)) return 'staff';

        return !empty($roles) ? $roles[0] : 'staff';
    }

    // Remove getSettings method - tidak diperlukan lagi
}
