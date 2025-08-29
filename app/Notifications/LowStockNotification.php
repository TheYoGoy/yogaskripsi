<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Product;

class LowStockNotification extends Notification
{
    use Queueable;

    protected $product;
    protected $rop;

    public function __construct(Product $product, float $rop = null)
    {
        $this->product = $product;
        $this->rop = $rop ?? $this->calculateROP($product);
    }

    public function via(object $notifiable): array
    {
        return ['database']; // Hanya database notification untuk sekarang
    }

    public function toDatabase(object $notifiable): array
    {
        $urgency = $this->getUrgencyLevel();

        return [
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'product_sku' => $this->product->sku,
            'product_code' => $this->product->code,
            'current_stock' => $this->product->current_stock,
            'rop' => round($this->rop, 0),
            'urgency_level' => $urgency,
            'urgency_label' => $this->getUrgencyLabel($urgency),
            'supplier_name' => $this->product->supplier?->name,
            'title' => $this->getNotificationTitle($urgency),
            'message' => $this->getNotificationMessage(),
            'action_url' => '/products/' . $this->product->id,
            'type' => 'low_stock',
            'icon' => $this->getNotificationIcon($urgency),
            'color' => $this->getNotificationColor($urgency),
            'stock_percentage' => round(($this->product->current_stock / max($this->rop, 1)) * 100, 1),
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }

    private function calculateROP(Product $product): float
    {
        return $product->calculateRop();
    }

    private function getUrgencyLevel(): string
    {
        if ($this->product->current_stock <= 0) {
            return 'out_of_stock';
        }

        $stockRatio = $this->product->current_stock / max($this->rop, 1);

        if ($stockRatio <= 0.25) {
            return 'critical';
        } elseif ($stockRatio <= 0.5) {
            return 'high';
        } elseif ($stockRatio <= 0.75) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    private function getUrgencyLabel(string $urgency): string
    {
        return match ($urgency) {
            'out_of_stock' => 'HABIS',
            'critical' => 'KRITIS',
            'high' => 'Sangat Rendah',
            'medium' => 'Rendah',
            default => 'Menipis'
        };
    }

    private function getNotificationTitle(string $urgency): string
    {
        return match ($urgency) {
            'out_of_stock' => 'Stok Habis',
            'critical' => 'URGENT: Stok Hampir Habis',
            'high' => 'PENTING: Stok Sangat Rendah',
            'medium' => 'Peringatan: Stok Rendah',
            default => 'Info: Stok Menipis'
        };
    }

    private function getNotificationMessage(): string
    {
        $percentage = round(($this->product->current_stock / max($this->rop, 1)) * 100, 1);

        return "Produk {$this->product->name} (SKU: {$this->product->sku}) memerlukan perhatian. " .
            "Stok saat ini: " . number_format($this->product->current_stock) . " unit ({$percentage}% dari ROP). " .
            "ROP: " . number_format($this->rop, 0) . " unit. Segera lakukan pemesanan.";
    }

    private function getNotificationIcon(string $urgency): string
    {
        return match ($urgency) {
            'out_of_stock' => 'x-circle',
            'critical' => 'alert-triangle',
            'high' => 'alert-circle',
            'medium' => 'info',
            default => 'bell'
        };
    }

    private function getNotificationColor(string $urgency): string
    {
        return match ($urgency) {
            'out_of_stock' => 'gray',
            'critical' => 'red',
            'high' => 'orange',
            'medium' => 'yellow',
            default => 'blue'
        };
    }
}
