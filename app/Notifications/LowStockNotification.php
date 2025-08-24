<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Product; // Pastikan mengimpor model Product

class LowStockNotification extends Notification
{
    use Queueable;

    protected $product;

    /**
     * Create a new notification instance.
     */
    public function __construct(Product $product)
    {
        $this->product = $product;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        // Kita akan menggunakan channel 'database' untuk notifikasi dalam aplikasi
        // Anda bisa menambahkan 'mail' jika ingin mengirim email juga
        return ['database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        // Ini adalah contoh jika Anda ingin mengirim notifikasi via email
        // Pastikan konfigurasi email di .env sudah benar
        return (new MailMessage)
            ->line('The product ' . $this->product->name . ' (SKU: ' . $this->product->sku . ') is running low on stock.')
            ->action('View Product', url('/products/' . $this->product->id . '/edit')) // Link ke halaman edit produk
            ->line('Current stock: ' . $this->product->current_stock . ', Reorder Point (ROP): ' . $this->product->rop);
    }

    /**
     * Get the array representation of the notification.
     * Digunakan untuk menyimpan notifikasi ke database.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'product_sku' => $this->product->sku,
            'current_stock' => $this->product->current_stock,
            'rop' => $this->product->rop,
            'message' => "Stok {$this->product->name} (SKU: {$this->product->sku}) sudah di bawah ROP. Stok saat ini: {$this->product->current_stock}, ROP: {$this->product->rop}. Segera lakukan pemesanan.",
            'type' => 'low_stock', // Tipe notifikasi untuk memudahkan filter di frontend
        ];
    }
}
