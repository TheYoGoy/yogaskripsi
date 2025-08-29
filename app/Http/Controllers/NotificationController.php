<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // Debug: selalu gunakan DB query untuk konsistensi
        $notifications = collect();
        $rawNotifications = DB::table('notifications')
            ->where('notifiable_type', 'users')
            ->where('notifiable_id', $user->id)
            ->when($request->filter === 'unread', function ($query) {
                return $query->whereNull('read_at');
            })
            ->orderBy('created_at', 'desc')
            ->get();

        // Convert data field dari JSON string ke array
        $notifications = $rawNotifications->map(function ($item) {
            $item->data = json_decode($item->data, true);
            return $item;
        });

        // Manual pagination
        $perPage = 20;
        $currentPage = request('page', 1);
        $offset = ($currentPage - 1) * $perPage;

        $paginatedItems = $notifications->slice($offset, $perPage)->values();
        $total = $notifications->count();

        $paginator = new \Illuminate\Pagination\LengthAwarePaginator(
            $paginatedItems,
            $total,
            $perPage,
            $currentPage,
            ['path' => request()->url(), 'pageName' => 'page']
        );

        $unreadCount = DB::table('notifications')
            ->where('notifiable_type', 'users')
            ->where('notifiable_id', $user->id)
            ->whereNull('read_at')
            ->count();

        // Debug log
        Log::info('Notifications debug', [
            'total_notifications' => $total,
            'unread_count' => $unreadCount,
            'sample_data' => $paginatedItems->first()
        ]);

        return Inertia::render('Notifications/Index', [
            'notifications' => $paginator,
            'unreadCount' => $unreadCount,
            'filters' => $request->only(['filter', 'type'])
        ]);
    }

    public function markAsRead($id)
    {
        DB::table('notifications')
            ->where('id', $id)
            ->where('notifiable_type', 'users')
            ->where('notifiable_id', Auth::id())
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function markAllAsRead()
    {
        DB::table('notifications')
            ->where('notifiable_type', 'users')
            ->where('notifiable_id', Auth::id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function destroy($id)
    {
        DB::table('notifications')
            ->where('id', $id)
            ->where('notifiable_type', 'users')
            ->where('notifiable_id', Auth::id())
            ->delete();

        return back()->with('success', 'Notifikasi berhasil dihapus.');
    }

    public function getUnreadCount()
    {
        $count = DB::table('notifications')
            ->where('notifiable_type', 'users')
            ->where('notifiable_id', Auth::id())
            ->whereNull('read_at')
            ->count();

        return response()->json(['count' => $count]);
    }
}
