import { API_BASE_URL } from '../config/api';

export interface Notification {
    id: number;
    type: string;
    category: 'personal' | 'store';
    icon: string;
    title: string;
    message: string;
    action_url: string | null;
    is_read: boolean;
    created_at: string;
    time_ago: string;
}

export interface NotificationResponse {
    success: boolean;
    data: Notification[];
}

export interface UnreadCountResponse {
    success: boolean;
    count: number;
    personal_count: number;
    store_count: number;
}

/**
 * Get all notifications for the current user
 */
export async function getNotifications(
    userId: string,
    limit: number = 20,
    unreadOnly: boolean = false,
    category?: 'personal' | 'store'
): Promise<Notification[]> {
    try {
        const params = new URLSearchParams({
            limit: limit.toString(),
            ...(unreadOnly && { unread_only: 'true' }),
            ...(category && { category }),
        });

        const response = await fetch(`${API_BASE_URL}/notifications?${params}`, {
            headers: {
                'X-User-ID': userId,
                'Content-Type': 'application/json',
            },
        });

        const data: NotificationResponse = await response.json();
        return data.success ? data.data : [];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

/**
 * Get unread notification count (with category breakdown)
 */
export async function getUnreadCount(userId: string): Promise<UnreadCountResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
            headers: {
                'X-User-ID': userId,
                'Content-Type': 'application/json',
            },
        });

        const data: UnreadCountResponse = await response.json();
        return data.success ? data : { success: false, count: 0, personal_count: 0, store_count: 0 };
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return { success: false, count: 0, personal_count: 0, store_count: 0 };
    }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(userId: string, notificationId: number): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
            method: 'POST',
            headers: {
                'X-User-ID': userId,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
}

/**
 * Mark all notifications as read (optionally by category)
 */
export async function markAllAsRead(
    userId: string,
    category?: 'personal' | 'store'
): Promise<boolean> {
    try {
        const params = category ? `?category=${category}` : '';
        const response = await fetch(`${API_BASE_URL}/notifications/read-all${params}`, {
            method: 'POST',
            headers: {
                'X-User-ID': userId,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(userId: string, notificationId: number): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: {
                'X-User-ID': userId,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error deleting notification:', error);
        return false;
    }
}
