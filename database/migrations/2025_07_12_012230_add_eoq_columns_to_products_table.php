<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->double('daily_usage_rate')->default(1)->after('lead_time');
            $table->double('holding_cost_percentage')->default(0.1)->after('daily_usage_rate');
            $table->double('ordering_cost')->default(25000)->after('holding_cost_percentage');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['daily_usage_rate', 'holding_cost_percentage', 'ordering_cost']);
        });
    }
};
