<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('stock_outs', function (Blueprint $table) {
            $table->date('date')->nullable()->after('quantity');
        });

        Schema::table('stock_ins', function (Blueprint $table) {
            $table->date('date')->nullable()->after('quantity');
        });
    }

    public function down(): void
    {
        Schema::table('stock_outs', function (Blueprint $table) {
            $table->dropColumn('date');
        });

        Schema::table('stock_ins', function (Blueprint $table) {
            $table->dropColumn('date');
        });
    }
};
