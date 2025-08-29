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
        Schema::table('products', function (Blueprint $table) {
            $table->integer('minimum_stock')->default(10)->after('current_stock')->comment('Safety stock untuk ROP calculation');
            $table->decimal('holding_cost_percentage', 5, 4)->default(0.2)->after('price')->comment('Persentase biaya penyimpanan per tahun (0.2 = 20%)');
            $table->decimal('ordering_cost', 10, 2)->default(25000)->after('holding_cost_percentage')->comment('Biaya tetap per pemesanan dalam Rupiah');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['minimum_stock', 'holding_cost_percentage', 'ordering_cost']);
        });
    }
};
