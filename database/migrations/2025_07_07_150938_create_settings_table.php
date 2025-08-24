<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id(); // Or use $table->uuid('id')->primary(); for UUIDs
            $table->string('company_name')->nullable();
            $table->string('company_logo')->nullable(); // Path to the logo file
            $table->string('stock_prefix_in')->default('IN-');
            $table->string('stock_prefix_out')->default('OUT-');
            $table->integer('stock_min_threshold')->default(10);
            $table->integer('default_lead_time')->default(7);
            $table->decimal('default_ordering_cost', 10, 2)->default(50000.00);
            $table->decimal('default_holding_cost', 10, 2)->default(0.20);
            $table->foreignId('default_unit_id')->nullable()->constrained('units')->onDelete('set null'); // Assuming a 'units' table
            $table->string('date_format')->default('DD-MM-YYYY');
            $table->string('timezone')->default('Asia/Jakarta');
            $table->boolean('dark_mode')->default(false);
            $table->timestamps();
        });

        // Optional: Seed initial settings if the table is empty
        // You can also do this in a Seeder class
        DB::table('settings')->insert([
            'company_name' => 'Your Company Name',
            'company_logo' => null,
            'stock_prefix_in' => 'IN-',
            'stock_prefix_out' => 'OUT-',
            'stock_min_threshold' => 10,
            'default_lead_time' => 7,
            'default_ordering_cost' => 50000.00,
            'default_holding_cost' => 0.20,
            'default_unit_id' => null, // Set to an actual unit ID if available
            'date_format' => 'DD-MM-YYYY',
            'timezone' => 'Asia/Jakarta',
            'dark_mode' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
