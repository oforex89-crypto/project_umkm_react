<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-ID');
        
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'User ID is required'
            ], 401);
        }

        $limit = $request->get('limit', 20);
        $unreadOnly = $request->get('unread_only', false);
        $category = $request->get('category'); // 'personal', 'store', or null for all

        $query = Notification::where('user_id', $userId)
            ->orderBy('created_at', 'desc');

        if ($unreadOnly) {
            $query->unread();
        }

        // Filter by category if specified
        if ($category && in_array($category, ['personal', 'store'])) {
            $query->where('category', $category);
        }

        $notifications = $query->take($limit)->get()->map(function ($notif) {
            return [
                'id' => $notif->id,
                'type' => $notif->type,
                'category' => $notif->category ?? 'personal',
                'icon' => $notif->icon,
                'title' => $notif->title,
                'message' => $notif->message,
                'action_url' => $notif->action_url,
                'is_read' => $notif->is_read,
                'created_at' => $notif->created_at->toISOString(),
                'time_ago' => $notif->created_at->diffForHumans(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    /**
     * Get unread notification count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-ID');
        
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'User ID is required'
            ], 401);
        }

        $category = $request->get('category'); // 'personal', 'store', or null for all

        $query = Notification::where('user_id', $userId)->unread();

        // Filter by category if specified
        if ($category && in_array($category, ['personal', 'store'])) {
            $query->where('category', $category);
        }

        $count = $query->count();

        // Also get counts by category for UI
        $personalCount = Notification::where('user_id', $userId)
            ->unread()
            ->where('category', 'personal')
            ->count();
        
        $storeCount = Notification::where('user_id', $userId)
            ->unread()
            ->where('category', 'store')
            ->count();

        return response()->json([
            'success' => true,
            'count' => $count,
            'personal_count' => $personalCount,
            'store_count' => $storeCount,
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, $id): JsonResponse
    {
        $userId = $request->header('X-User-ID');
        
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'User ID is required'
            ], 401);
        }

        $notification = Notification::where('id', $id)
            ->where('user_id', $userId)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found'
            ], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read'
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-ID');
        
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'User ID is required'
            ], 401);
        }

        $category = $request->get('category'); // Optional: only mark specific category

        $query = Notification::where('user_id', $userId)->unread();

        if ($category && in_array($category, ['personal', 'store'])) {
            $query->where('category', $category);
        }

        $query->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read'
        ]);
    }

    /**
     * Delete a notification
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $userId = $request->header('X-User-ID');
        
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'User ID is required'
            ], 401);
        }

        $notification = Notification::where('id', $id)
            ->where('user_id', $userId)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found'
            ], 404);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted'
        ]);
    }
}
