<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('👥 Creating 9 users (3 per role)...');

        // ==================== 3 ADMIN USERS ====================
        $admin1 = User::create([
            'name' => 'Admin Sistem',
            'email' => 'admin@brawijaya.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $admin1->assignRole('admin');

        $admin2 = User::create([
            'name' => 'Admin IT',
            'email' => 'admin2@brawijaya.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $admin2->assignRole('admin');

        $admin3 = User::create([
            'name' => 'Admin Utama',
            'email' => 'admin3@brawijaya.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $admin3->assignRole('admin');

        // ==================== 3 MANAGER USERS ====================
        $manager1 = User::create([
            'name' => 'Manager Gudang',
            'email' => 'manager@brawijaya.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $manager1->assignRole('manager');

        $manager2 = User::create([
            'name' => 'Manager Operasional',
            'email' => 'manager2@brawijaya.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $manager2->assignRole('manager');

        $manager3 = User::create([
            'name' => 'Manager Purchasing',
            'email' => 'manager3@brawijaya.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $manager3->assignRole('manager');

        // ==================== 3 STAFF USERS ====================
        $staff1 = User::create([
            'name' => 'Staff Gudang',
            'email' => 'staff@brawijaya.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $staff1->assignRole('staff');

        $staff2 = User::create([
            'name' => 'Staff Inventory',
            'email' => 'staff2@brawijaya.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $staff2->assignRole('staff');

        $staff3 = User::create([
            'name' => 'Staff Operasional',
            'email' => 'staff3@brawijaya.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $staff3->assignRole('staff');

        // Display results
        $this->command->info('✅ 9 Users created successfully!');
        $this->command->info('');
        $this->command->info('📧 Login Credentials:');
        $this->command->info('');
        $this->command->info('🔴 ADMIN USERS (Full Access):');
        $this->command->info('   1. admin@brawijaya.com / password (Admin Sistem)');
        $this->command->info('   2. admin2@brawijaya.com / password (Admin IT)');
        $this->command->info('   3. admin3@brawijaya.com / password (Admin Utama)');
        $this->command->info('');
        $this->command->info('🟡 MANAGER USERS (All except User Management):');
        $this->command->info('   1. manager@brawijaya.com / password (Manager Gudang)');
        $this->command->info('   2. manager2@brawijaya.com / password (Manager Operasional)');
        $this->command->info('   3. manager3@brawijaya.com / password (Manager Purchasing)');
        $this->command->info('');
        $this->command->info('🟢 STAFF USERS (Products, Transactions, Stock only):');
        $this->command->info('   1. staff@brawijaya.com / password (Staff Gudang)');
        $this->command->info('   2. staff2@brawijaya.com / password (Staff Inventory)');
        $this->command->info('   3. staff3@brawijaya.com / password (Staff Operasional)');
        $this->command->info('');
        $this->command->info('🔑 Role Access Summary:');
        $this->command->info('   ADMIN: Everything (including User Management)');
        $this->command->info('   MANAGER: Everything EXCEPT User Management');
        $this->command->info('   STAFF: Only Products, Purchase Transactions, Stock In/Out');
    }
}