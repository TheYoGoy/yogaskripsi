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
use Illuminate\Support\Facades\DB;

class SendLowStockNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $product;
    protected $rop;

    public $timeout = 60;
    public $tries = 3;

    public function __construct(Product $product, float $rop)
    {
        $this->product = $product;
        $this->rop = $rop;
    }

    public function handle()
    {
        try {
            // Check for duplicate notifications in last 4 hours
            $recentNotification = DB::table('notifications')
                ->where('type', LowStockNotification::class)
                ->whereJsonContains('data->product_id', $this->product->id)
                ->where('created_at', '>=', now()->subHours(4))
                ->first();

            if ($recentNotification) {
                Log::info('Skipping duplicate low stock notification', [
                    'product_id' => $this->product->id,
                    'last_notification' => $recentNotification->created_at
                ]);
                return;
            }

            // Get users to notify
            $users = $this->getUsersToNotify();

            if ($users->isEmpty()) {
                Log::warning('No users found to notify for low stock', [
                    'product_id' => $this->product->id
                ]);
                return;
            }

            // Send notifications
            $notificationsSent = 0;
            foreach ($users as $user) {
                try {
                    $user->notify(new LowStockNotification($this->product, $this->rop));
                    $notificationsSent++;
                } catch (\Exception $e) {
                    Log::error('Failed to send notification to user', [
                        'user_id' => $user->id,
                        'product_id' => $this->product->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            Log::info('Low stock notifications sent successfully', [
                'product_id' => $this->product->id,
                'product_name' => $this->product->name,
                'current_stock' => $this->product->current_stock,
                'rop' => $this->rop,
                'notifications_sent' => $notificationsSent,
                'total_users' => $users->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Error sending low stock notification', [
                'product_id' => $this->product->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    private function getUsersToNotify()
    {
        // Get users with relevant roles/permissions
        return User::where(function ($query) {
            $query->whereHas('roles', function ($roleQuery) {
                $roleQuery->whereIn('name', [
                    'admin',
                    'inventory_manager',
                    'manager',
                    'purchaser',
                    'warehouse_manager'
                ]);
            })
                ->orWhereHas('permissions', function ($permQuery) {
                    $permQuery->whereIn('name', [
                        'view-products',
                        'manage-inventory',
                        'create-purchases'
                    ]);
                });
        })
            ->whereNotNull('email')
            ->where('is_active', true)
            ->get();
    }
}
