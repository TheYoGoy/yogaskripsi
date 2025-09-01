<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('🌱 Starting Database Seeding...');
        $this->command->info('');

        // 1. Setup Roles & Permissions FIRST
        $this->call(PermissionSeeder::class);
        
        // 2. Create Users (needs roles to exist first)
        $this->call(UserSeeder::class);
        
        // 3. Create Master Data
        $this->call(BrawijayaDigitalPrintSeeder::class);

        $this->command->info('');
        $this->command->info('🎉 Database seeding completed successfully!');
        $this->command->info('');
        $this->command->info('🚀 Ready to test your role-based access control:');
        $this->command->info('   • Login as STAFF → Limited access');
        $this->command->info('   • Login as MANAGER → Everything except users');
        $this->command->info('   • Login as ADMIN → Full system access');
    }
}