<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Product;
use App\Models\User;
use App\Notifications\LowStockNotification;

class SendLowStockNotification extends Command
{
    protected $signature = 'send:low-stock-notification';
    protected $description = 'Kirim notifikasi ke admin dan manager jika stok produk di bawah ROP';

    public function handle()
    {
        $products = Product::whereColumn('current_stock', '<=', 'rop')->get();
        $users = User::whereIn('role', ['admin', 'manager'])->get();

        if ($products->isEmpty()) {
            $this->info('✅ Tidak ada produk yang perlu di-notify.');
            return Command::SUCCESS;
        }

        foreach ($products as $product) {
            foreach ($users as $user) {
                $user->notify(new LowStockNotification($product));
            }
        }

        $this->info("🔔 Notifikasi berhasil dikirim untuk " . $products->count() . " produk.");
        return Command::SUCCESS;
    }
}
