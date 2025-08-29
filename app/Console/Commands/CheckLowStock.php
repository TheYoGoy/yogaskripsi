<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Product;

class CheckLowStock extends Command
{
    protected $signature = 'stock:check-low';
    protected $description = 'Check dan kirim notifikasi untuk produk dengan stok rendah';

    public function handle()
    {
        $this->info('Mengecek stok rendah...');

        $products = Product::whereNotNull('current_stock')
            ->whereNotNull('daily_usage_rate')
            ->whereNotNull('lead_time')
            ->get();

        $lowStockCount = 0;

        foreach ($products as $product) {
            if ($product->checkAndSendLowStockNotification()) {
                $lowStockCount++;
                $this->line("Notifikasi dikirim untuk: {$product->name}");
            }
        }

        $this->info("Selesai. {$lowStockCount} produk dengan stok rendah ditemukan.");
    }
}
