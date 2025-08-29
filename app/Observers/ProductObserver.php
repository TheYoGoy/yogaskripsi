<?php

namespace App\Observers;

use App\Models\Product;

class ProductObserver
{
    public function updated(Product $product)
    {
        // Jika stok berubah, cek low stock
        if ($product->wasChanged('current_stock')) {
            $product->checkAndSendLowStockNotification();
        }
    }

    public function created(Product $product)
    {
        // Cek low stock untuk produk baru
        if ($product->current_stock) {
            $product->checkAndSendLowStockNotification();
        }
    }
}
