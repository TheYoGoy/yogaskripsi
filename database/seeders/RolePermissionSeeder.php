<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Buat permissions
        $permissions = [
            // Dashboard permissions
            'view-dashboard',
            'view-admin-dashboard',
            'view-manager-dashboard',
            'view-staff-dashboard',

            // Product permissions
            'view-products',
            'create-products',
            'edit-products',
            'delete-products',
            'import-products',
            'export-products',

            // Stock permissions
            'view-stock',
            'stock-in',
            'stock-out',
            'adjust-stock',
            'view-stock-movements',

            // Purchase permissions
            'view-purchases',
            'create-purchases',
            'edit-purchases',
            'delete-purchases',
            'approve-purchases',
            'reject-purchases',

            // Report permissions
            'view-reports',
            'export-reports',
            'view-advanced-reports',

            // User management permissions
            'view-users',
            'create-users',
            'edit-users',
            'delete-users',
            'assign-roles',

            // Settings permissions
            'view-settings',
            'edit-settings',
            'system-configuration',

            // Supplier permissions
            'view-suppliers',
            'create-suppliers',
            'edit-suppliers',
            'delete-suppliers',

            // Category & Unit permissions
            'view-categories',
            'create-categories',
            'edit-categories',
            'delete-categories',
            'view-units',
            'create-units',
            'edit-units',
            'delete-units',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Buat 3 roles: admin, staff, manager
        $adminRole = Role::create(['name' => 'admin']);
        $staffRole = Role::create(['name' => 'staff']);
        $managerRole = Role::create(['name' => 'manager']);

        // ADMIN: Semua permissions
        $adminRole->givePermissionTo(Permission::all());

        // STAFF: Permissions terbatas (basic operations)
        $staffPermissions = [
            'view-dashboard',
            'view-staff-dashboard',
            'view-products',
            'view-stock',
            'stock-in',
            'stock-out',
            'view-stock-movements',
            'view-purchases',
            'create-purchases',
            'view-suppliers',
            'view-categories',
            'view-units',
        ];
        $staffRole->givePermissionTo($staffPermissions);

        // MANAGER: Hampir semua kecuali user management dan system settings
        $managerPermissions = [
            'view-dashboard',
            'view-manager-dashboard',
            'view-products',
            'create-products',
            'edit-products',
            'delete-products',
            'import-products',
            'export-products',
            'view-stock',
            'stock-in',
            'stock-out',
            'adjust-stock',
            'view-stock-movements',
            'view-purchases',
            'create-purchases',
            'edit-purchases',
            'approve-purchases',
            'reject-purchases',
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
            'view-settings',
        ];
        $managerRole->givePermissionTo($managerPermissions);

        // Assign roles ke existing users (jika ada)
        $this->assignRolesToExistingUsers();

        $this->command->info('✅ Roles and Permissions seeded successfully!');
        $this->command->info('📊 Created roles: admin, staff, manager');
        $this->command->info('🔑 Admin: ' . $adminRole->permissions->count() . ' permissions');
        $this->command->info('👨‍💼 Manager: ' . $managerRole->permissions->count() . ' permissions');
        $this->command->info('👤 Staff: ' . $staffRole->permissions->count() . ' permissions');
    }

    /**
     * Assign roles ke users yang sudah ada
     */
    private function assignRolesToExistingUsers()
    {
        $users = User::all();

        foreach ($users as $user) {
            // Skip jika user sudah punya role
            if ($user->roles->count() > 0) {
                continue;
            }

            $roleToAssign = 'staff'; // default

            // Assign berdasarkan email atau ID
            if (str_contains($user->email, 'admin')) {
                $roleToAssign = 'admin';
            } elseif (str_contains($user->email, 'manager')) {
                $roleToAssign = 'manager';
            } elseif ($user->id == 1) {
                // User pertama jadi admin
                $roleToAssign = 'admin';
            } elseif ($user->id == 2) {
                // User kedua jadi manager
                $roleToAssign = 'manager';
            }

            try {
                $user->assignRole($roleToAssign);
                $this->command->info("✅ Assigned '{$roleToAssign}' role to: {$user->name} ({$user->email})");
            } catch (\Exception $e) {
                $this->command->error("❌ Failed to assign role to user {$user->id}: " . $e->getMessage());
            }
        }
    }
}
