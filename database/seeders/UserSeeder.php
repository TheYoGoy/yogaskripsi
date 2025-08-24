<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. ADMIN USER
        $admin = User::create([
            'name' => 'Administrator',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $admin->assignRole('admin');

        // 2. STAFF USERS
        $staff1 = User::create([
            'name' => 'Staff Gudang',
            'email' => 'staff@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $staff1->assignRole('staff');

        $staff2 = User::create([
            'name' => 'Staff Inventory',
            'email' => 'staff2@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $staff2->assignRole('staff');

        $staff3 = User::create([
            'name' => 'Staff Operasional',
            'email' => 'staff3@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $staff3->assignRole('staff');

        // 3. MANAGER USERS
        $manager1 = User::create([
            'name' => 'Manager Warehouse',
            'email' => 'manager@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $manager1->assignRole('manager');

        $manager2 = User::create([
            'name' => 'Manager Purchasing',
            'email' => 'manager2@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $manager2->assignRole('manager');

        // 4. TEST USER (untuk development)
        $testUser = User::create([
            'name' => 'Test User',
            'email' => 'test@test.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $testUser->assignRole('staff'); // Default sebagai staff

        $this->command->info('✅ Users seeded successfully with 3 roles!');
        $this->command->info('');
        $this->command->info('📧 Login credentials:');
        $this->command->info('   🔴 ADMIN: admin@example.com / password');
        $this->command->info('   🟡 MANAGER: manager@example.com / password');
        $this->command->info('   🟡 MANAGER 2: manager2@example.com / password');
        $this->command->info('   🟢 STAFF: staff@example.com / password');
        $this->command->info('   🟢 STAFF 2: staff2@example.com / password');
        $this->command->info('   🟢 STAFF 3: staff3@example.com / password');
        $this->command->info('   🔵 TEST: test@test.com / password');
        $this->command->info('');
        $this->command->info('🔑 Role Hierarchy:');
        $this->command->info('   ADMIN > MANAGER > STAFF');
    }
}
