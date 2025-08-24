<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserRoleSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Buat roles untuk Spatie Permission jika digunakan
        try {
            if (class_exists('Spatie\Permission\Models\Role')) {
                app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

                Role::firstOrCreate(['name' => 'admin']);
                Role::firstOrCreate(['name' => 'manager']);
                Role::firstOrCreate(['name' => 'staff']);

                $this->command->info('✅ Spatie roles created/updated');
            }
        } catch (\Exception $e) {
            $this->command->warn('⚠️ Spatie Permission not fully configured: ' . $e->getMessage());
        }

        // 2. Create users with both direct role column and Spatie role
        $users = [
            [
                'name' => 'System Administrator',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'spatie_role' => 'admin'
            ],
            [
                'name' => 'Stock Manager',
                'email' => 'manager@example.com',
                'password' => Hash::make('password'),
                'role' => 'manager',
                'spatie_role' => 'manager'
            ],
            [
                'name' => 'Stock Staff',
                'email' => 'staff@example.com',
                'password' => Hash::make('password'),
                'role' => 'staff',
                'spatie_role' => 'staff'
            ]
        ];

        foreach ($users as $userData) {
            $spatieRole = $userData['spatie_role'];
            unset($userData['spatie_role']);

            // Create or update user
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                array_merge($userData, ['email_verified_at' => now()])
            );

            // Assign Spatie role if available
            try {
                if (method_exists($user, 'assignRole')) {
                    $user->syncRoles([$spatieRole]); // Remove existing roles and assign new one
                    $this->command->info("✅ Assigned Spatie role '{$spatieRole}' to {$user->email}");
                }
            } catch (\Exception $e) {
                $this->command->warn("⚠️ Could not assign Spatie role to {$user->email}: " . $e->getMessage());
            }
        }

        $this->command->info('');
        $this->command->info('🎉 Users created successfully:');
        $this->command->info('👨‍💼 admin@example.com (password: password) - Role: admin');
        $this->command->info('👨‍💼 manager@example.com (password: password) - Role: manager');
        $this->command->info('👨‍💼 staff@example.com (password: password) - Role: staff');
        $this->command->info('');

        // 3. Test user methods
        $testUser = User::where('email', 'admin@example.com')->first();
        if ($testUser) {
            $this->command->info('🔍 Testing user methods on admin user:');
            $this->command->info("- getRoleName(): " . ($testUser->getRoleName() ?? 'method_failed'));
            $this->command->info("- getRoleNameEnglish(): " . ($testUser->getRoleNameEnglish() ?? 'method_failed'));
            $this->command->info("- isAdmin(): " . ($testUser->isAdmin() ? 'true' : 'false'));
            $this->command->info("- isManager(): " . ($testUser->isManager() ? 'true' : 'false'));
            $this->command->info("- isStaff(): " . ($testUser->isStaff() ? 'true' : 'false'));
        }
    }
}
