<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->renameColumn('date_format', 'preferred_date_format');
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->renameColumn('preferred_date_format', 'date_format');
        });
    }
};
