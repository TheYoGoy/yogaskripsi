<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
        |--------------------------------------------------------------------------
        | API Routes
        |--------------------------------------------------------------------------
        |
        | Here is where you can register API routes for your application. These
        | routes are loaded by the RouteServiceProvider and all of them will
        | be assigned to the "api" middleware group. Make something great!
        |
        */

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Grup rute API untuk notifikasi yang memerlukan otentikasi Sanctum
Route::middleware('auth:sanctum')->prefix('notifications')->name('api.notifications.')->group(function () {
    // Mendapatkan notifikasi yang belum dibaca
    Route::get('/unread', function (Request $request) {
        // Menggunakan eager loading untuk relasi product pada data notifikasi
        $unreadNotifications = $request->user()->unreadNotifications()
            ->where('type', 'App\Notifications\LowStockNotification') // Filter hanya notifikasi stok rendah
            ->get()
            ->map(function ($notification) {
                // Jika data notifikasi memiliki product_id, coba load produknya
                if (isset($notification->data['product_id'])) {
                    $product = \App\Models\Product::find($notification->data['product_id']);
                    if ($product) {
                        $notification->data['product'] = $product->only(['id', 'name', 'sku']);
                    }
                }
                return $notification;
            });

        return response()->json([
            'notifications' => $unreadNotifications,
            'unread_count' => $unreadNotifications->count(),
        ]);
    })->name('unread');

    // Menandai notifikasi sebagai sudah dibaca
    Route::patch('/{notification}/mark-as-read', function (Request $request, $notificationId) {
        $notification = $request->user()->notifications()->findOrFail($notificationId);
        $notification->markAsRead();
        return response()->json(['message' => 'Notification marked as read.']);
    })->name('mark-as-read');

    // Menandai semua notifikasi sebagai sudah dibaca
    Route::post('/mark-all-as-read', function (Request $request) {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['message' => 'All notifications marked as read.']);
    })->name('mark-all-as-read');
});
