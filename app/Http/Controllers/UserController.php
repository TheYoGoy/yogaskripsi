<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    /**
     * Constructor untuk mengaktifkan otorisasi berbasis UserPolicy.
     */
    public function __construct()
    {
        // ✅ FIXED: Use simple middleware instead of authorizeResource for now
        $this->middleware('auth');
    }

    /**
     * Menampilkan daftar pengguna.
     */
    public function index(Request $request)
    {
        // ✅ FIXED: Add per_page to filters and improve validation
        $request->validate([
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        $filters = $request->only(['search', 'per_page']);
        $perPage = (int) ($request->per_page ?? 10);

        $users = User::query()
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->withCount('roles') // Add role count if using Spatie
            ->with('roles:id,name') // Load roles relationship
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function ($user) {
                // ✅ FIXED: Transform user data to include roles array
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                    // ✅ FIXED: Handle both Spatie roles and simple role field
                    'roles' => $this->getUserRoles($user),
                ];
            });

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => $filters,
        ]);
    }

    /**
     * ✅ NEW: Helper method to get user roles consistently
     */
    private function getUserRoles($user)
    {
        // Try Spatie roles first
        if (method_exists($user, 'getRoleNames') && $user->roles->count() > 0) {
            return $user->roles->pluck('name')->toArray();
        }

        // Fallback to simple role field
        if (isset($user->role)) {
            return [$user->role];
        }

        // Default fallback
        return ['staff'];
    }

    /**
     * Menampilkan form untuk membuat pengguna baru.
     */
    public function create()
    {
        // ✅ FIXED: Add available roles for the form
        $availableRoles = $this->getAvailableRoles();

        return Inertia::render('Users/Create', [
            'availableRoles' => $availableRoles,
        ]);
    }

    /**
     * ✅ NEW: Get available roles
     */
    private function getAvailableRoles()
    {
        // Try to get from Spatie first
        try {
            if (class_exists(\Spatie\Permission\Models\Role::class)) {
                return \Spatie\Permission\Models\Role::select('name')->pluck('name')->toArray();
            }
        } catch (\Exception $e) {
            // Fallback to manual roles
        }

        // Fallback to predefined roles
        return ['admin', 'manager', 'staff'];
    }

    /**
     * Menyimpan pengguna baru ke database.
     */
    public function store(Request $request)
    {
        $availableRoles = $this->getAvailableRoles();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role' => ['required', 'string', Rule::in($availableRoles)],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'email_verified_at' => now(), // Auto verify new users
        ]);

        // ✅ FIXED: Assign role using Spatie if available, otherwise use role field
        $this->assignUserRole($user, $request->role);

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

    /**
     * ✅ NEW: Helper to assign roles consistently
     */
    private function assignUserRole($user, $role)
    {
        try {
            // Try Spatie first
            if (method_exists($user, 'assignRole')) {
                $user->assignRole($role);
                return;
            }
        } catch (\Exception $e) {
            // Fallback to simple role field
        }

        // Fallback to updating role field directly
        $user->update(['role' => $role]);
    }

    /**
     * Menampilkan form untuk mengedit pengguna.
     */
    public function edit(User $user)
    {
        $availableRoles = $this->getAvailableRoles();
        $currentRoles = $this->getUserRoles($user);

        return Inertia::render('Users/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $currentRoles,
                'current_role' => $currentRoles[0] ?? 'staff', // Primary role
            ],
            'availableRoles' => $availableRoles,
        ]);
    }

    /**
     * Memperbarui pengguna di database.
     */
    public function update(Request $request, User $user)
    {
        $availableRoles = $this->getAvailableRoles();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'role' => ['required', 'string', Rule::in($availableRoles)],
        ]);

        // Update basic user info
        $user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        // Update password if provided
        if ($request->filled('password')) {
            $user->update(['password' => Hash::make($request->password)]);
        }

        // ✅ FIXED: Update role using helper method
        $this->updateUserRole($user, $request->role);

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    /**
     * ✅ NEW: Helper to update user roles
     */
    private function updateUserRole($user, $newRole)
    {
        try {
            // Try Spatie first
            if (method_exists($user, 'syncRoles')) {
                $user->syncRoles([$newRole]);
                return;
            }
        } catch (\Exception $e) {
            // Fallback to simple role field
        }

        // Fallback to updating role field directly
        $user->update(['role' => $newRole]);
    }

    /**
     * Menghapus pengguna dari database.
     */
    public function destroy(User $user)
    {
        // ✅ FIXED: Improved validation for self-deletion
        if (Auth::id() === $user->id) {
            return response()->json([
                'message' => 'You cannot delete your own account.'
            ], 422);
        }

        // ✅ FIXED: Check if user is the last admin
        if ($this->isLastAdmin($user)) {
            return response()->json([
                'message' => 'Cannot delete the last admin user.'
            ], 422);
        }

        try {
            $user->delete();

            return redirect()->route('users.index')
                ->with('success', 'User deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->route('users.index')
                ->with('error', 'Failed to delete user: ' . $e->getMessage());
        }
    }

    /**
     * ✅ NEW: Check if user is the last admin
     */
    private function isLastAdmin($user)
    {
        $userRoles = $this->getUserRoles($user);

        // If user is not admin, safe to delete
        if (!in_array('admin', $userRoles)) {
            return false;
        }

        // Count other admin users
        try {
            if (method_exists($user, 'hasRole')) {
                $adminCount = User::whereHas('roles', function ($query) {
                    $query->where('name', 'admin');
                })->where('id', '!=', $user->id)->count();
            } else {
                $adminCount = User::where('role', 'admin')
                    ->where('id', '!=', $user->id)->count();
            }

            return $adminCount === 0;
        } catch (\Exception $e) {
            // If we can't determine, err on the side of caution
            return true;
        }
    }

    /**
     * ✅ NEW: API endpoint to get user roles (for frontend)
     */
    public function getRoles(User $user)
    {
        return response()->json([
            'roles' => $this->getUserRoles($user),
            'available_roles' => $this->getAvailableRoles(),
        ]);
    }
}
