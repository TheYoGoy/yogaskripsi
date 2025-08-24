<?php

// database/migrations/xxxx_xx_xx_create_purchase_transactions_table.php
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
        Schema::create('purchase_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('cascade'); // Foreign key ke tabel suppliers
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade'); // Foreign key ke tabel products
            $table->integer('quantity');
            $table->decimal('price_per_unit', 12, 2); // Harga beli per unit
            $table->decimal('total_price', 12, 2); // Total harga (quantity * price_per_unit)
            $table->timestamp('transaction_date')->useCurrent();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // User yang melakukan transaksi
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_transactions');
    }
};
