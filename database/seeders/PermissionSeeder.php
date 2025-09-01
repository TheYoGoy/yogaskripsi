<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('🔐 Setting up Custom Roles and Permissions...');

        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. CREATE ALL PERMISSIONS
        $permissions = [
            // Dashboard
            'view-dashboard',
            
            // Product Management
            'view-products',
            'create-products',
            'edit-products',
            'delete-products',
            
            // Purchase Transaction Management
            'view-purchases',
            'create-purchases',
            'edit-purchases',
            'delete-purchases',
            'approve-purchases',
            
            // Stock Management (General)
            'view-stock',
            'stock-in',
            'stock-out',
            
            // Stock In Management
            'view-stock-in',
            'create-stock-in',
            'edit-stock-in',
            'delete-stock-in',
            
            // Stock Out Management
            'view-stock-out',
            'create-stock-out',
            'edit-stock-out',
            'delete-stock-out',
            
            // User Management (ADMIN ONLY)
            'view-users',
            'create-users',
            'edit-users',
            'delete-users',
            
            // Supplier Management (MANAGER & ADMIN)
            'view-suppliers',
            'create-suppliers',
            'edit-suppliers',
            'delete-suppliers',
            
            // Category & Unit Management (MANAGER & ADMIN)
            'view-categories',
            'create-categories',
            'edit-categories',
            'delete-categories',
            'view-units',
            'create-units',
            'edit-units',
            'delete-units',
            
            // Reports (MANAGER & ADMIN)
            'view-reports',
            'export-reports',
            'view-advanced-reports',
            
            // System Settings (ADMIN ONLY)
            'view-settings',
            'edit-settings',
            'manage-settings',
        ];

        // Create permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // 2. CREATE ROLES
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $staffRole = Role::firstOrCreate(['name' => 'staff']);

        // 3. ASSIGN PERMISSIONS TO ROLES

        // ==================== STAFF PERMISSIONS ====================
        // Staff hanya bisa akses: Products, Purchase Transactions, Stock In, Stock Out
        $staffPermissions = [
            'view-dashboard',
            
            // Products - Full access
            'view-products',
            'create-products',
            'edit-products',
            'delete-products',
            
            // Purchase Transactions - Full access
            'view-purchases',
            'create-purchases',
            'edit-purchases',
            'delete-purchases',
            
            // Stock Management - Full access
            'view-stock',
            'stock-in',
            'stock-out',
            'view-stock-in',
            'create-stock-in',
            'edit-stock-in',
            'delete-stock-in',
            'view-stock-out',
            'create-stock-out',
            'edit-stock-out',
            'delete-stock-out',
        ];
        $staffRole->syncPermissions($staffPermissions);

        // ==================== MANAGER PERMISSIONS ====================
        // Manager bisa akses semuanya KECUALI User Management
        $managerPermissions = [
            // All staff permissions
            ...$staffPermissions,
            
            // Additional manager permissions
            'approve-purchases', // KEY: Only managers+ can approve
            
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
            
            'view-reports',
            'export-reports',
            'view-advanced-reports',
        ];
        $managerRole->syncPermissions($managerPermissions);

        // ==================== ADMIN PERMISSIONS ====================
        // Admin bisa akses SEMUANYA
        $adminPermissions = [
            // All manager permissions
            ...$managerPermissions,
            
            // User Management (ADMIN ONLY)
            'view-users',
            'create-users',
            'edit-users',
            'delete-users',
            
            // System Settings (ADMIN ONLY)
            'view-settings',
            'edit-settings',
            'manage-settings',
        ];
        $adminRole->syncPermissions($adminPermissions);

        // 4. DISPLAY RESULTS
        $this->command->info('');
        $this->command->info('✅ Custom Roles and Permissions created successfully!');
        $this->command->info('');
        $this->command->info('📊 Permission Summary:');
        $this->command->info("   🟢 STAFF: {$staffRole->permissions->count()} permissions");
        $this->command->info("   🟡 MANAGER: {$managerRole->permissions->count()} permissions");
        $this->command->info("   🔴 ADMIN: {$adminRole->permissions->count()} permissions");
        $this->command->info('');
        $this->command->info('🔑 Access Control:');
        $this->command->info('   • STAFF: Products, Purchase Transactions, Stock In/Out');
        $this->command->info('   • MANAGER: All STAFF access + Suppliers, Categories, Units, Reports');
        $this->command->info('   • ADMIN: All MANAGER access + User Management, Settings');
        $this->command->info('');
        $this->command->info('🚫 Staff CANNOT access:');
        $this->command->info('   - User Management');
        $this->command->info('   - Suppliers');
        $this->command->info('   - Categories & Units');
        $this->command->info('   - Reports');
        $this->command->info('');
        $this->command->info('🚫 Manager CANNOT access:');
        $this->command->info('   - User Management');
        $this->command->info('   - System Settings');
    }
}