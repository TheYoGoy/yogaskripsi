<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$permissions): Response
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        $user = Auth::user();

        // If no permissions specified, allow access
        if (empty($permissions)) {
            return $next($request);
        }

        // Check if user has any of the required permissions
        $hasPermission = false;
        foreach ($permissions as $permission) {
            if ($user->hasPermissionTo($permission)) {
                $hasPermission = true;
                break;
            }
        }

        if (!$hasPermission) {
            // For API requests, return JSON error
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Access denied. You do not have the required permission.',
                    'required_permissions' => $permissions,
                    'user_permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                ], 403);
            }

            // For web requests, show 403 page
            abort(403, 'Access denied. You do not have permission to perform this action.');
        }

        return $next($request);
    }
}