<?php

namespace App\Jobs;

use App\Models\Product;
use App\Models\User;
use App\Notifications\LowStockNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckLowStockJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutes
    public $tries = 3;

    public function handle()
    {
        try {
            Log::info('Starting scheduled low stock check');

            $products = Product::with('supplier')
                ->whereNotNull('current_stock')
                ->whereNotNull('daily_usage_rate')
                ->whereNotNull('lead_time')
                ->where('current_stock', '>=', 0)
                ->get();

            $lowStockCount = 0;
            $processedCount = 0;

            foreach ($products as $product) {
                $processedCount++;

                $rop = $this->calculateROP($product);

                if ($product->current_stock <= $rop) {
                    $this->dispatchNotification($product, $rop);
                    $lowStockCount++;
                }
            }

            Log::info('Scheduled low stock check completed', [
                'total_products_checked' => $processedCount,
                'low_stock_products_found' => $lowStockCount
            ]);
        } catch (\Exception $e) {
            Log::error('Error in scheduled low stock check', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    private function calculateROP(Product $product): float
    {
        $leadTime = $product->lead_time ?? 7;
        $dailyUsage = $product->daily_usage_rate ?? 0.5;
        $safetyStock = $product->minimum_stock ?? 0;

        return ($leadTime * $dailyUsage) + $safetyStock;
    }

    private function dispatchNotification(Product $product, float $rop)
    {
        dispatch(new SendLowStockNotificationJob($product, $rop))
            ->onQueue('notifications')
            ->delay(now()->addSeconds(30));
    }
}
