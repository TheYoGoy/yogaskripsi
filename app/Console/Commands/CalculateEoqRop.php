<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Product;

class CalculateEoqRop extends Command
{
    protected $signature = 'calculate:eoq-rop';
    protected $description = 'Hitung ulang EOQ dan ROP untuk semua produk';

    public function handle()
    {
        $this->info('Memulai perhitungan ulang EOQ & ROP...');

        $products = Product::all();
        $bar = $this->output->createProgressBar($products->count());
        $bar->start();

        foreach ($products as $product) {
            $product->rop = $product->calculateRop();
            $product->eoq = $product->calculateEoq();
            $product->save();

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Selesai! EOQ & ROP semua produk berhasil diperbarui.');
    }
}
