<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('stock_ins', function (Blueprint $table) {
            if (!Schema::hasColumn('stock_ins', 'purchase_transaction_id')) {
                $table->foreignId('purchase_transaction_id')
                    ->nullable()
                    ->constrained()
                    ->cascadeOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('stock_ins', function (Blueprint $table) {
            if (Schema::hasColumn('stock_ins', 'purchase_transaction_id')) {
                $table->dropConstrainedForeignId('purchase_transaction_id');
            }
        });
    }
};
