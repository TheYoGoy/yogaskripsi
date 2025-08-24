<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->integer('default_safety_stock')->default(5);
            $table->decimal('default_safety_stock_percentage', 5, 2)->default(10.00);
            $table->string('rop_formula')->default('lead_time_demand');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn([
                'default_safety_stock',
                'default_safety_stock_percentage',
                'rop_formula',
            ]);
        });
    }
};
