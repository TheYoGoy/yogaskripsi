<?php

// database/migrations/xxxx_xx_xx_create_stock_ins_table.php
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
        Schema::create('stock_ins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade'); // Foreign key ke tabel products
            $table->integer('quantity');
            $table->string('supplier')->nullable(); // Nama supplier (bisa diisi manual atau dari tabel suppliers)
            $table->timestamp('transaction_date')->useCurrent();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // User yang melakukan input
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_ins');
    }
};
