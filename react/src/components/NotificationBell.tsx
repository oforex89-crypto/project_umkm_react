import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { getUnreadCount } from '../services/notificationService';

interface NotificationBellProps {
    className?: string;
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
    const [totalUnread, setTotalUnread] = useState(0);
    const { user } = useAuth();

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        if (!user?.id) return;
        const data = await getUnreadCount(user.id);
        setTotalUnread(data.count);
    }, [user?.id]);

    // Initial fetch and polling
    useEffect(() => {
        if (user?.id) {
            fetchUnreadCount();

            // Poll for new notifications every 30 seconds
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user?.id, fetchUnreadCount]);

    if (!user) return null;

    return (
        <Link
            to="/notifications"
            className={`relative p-2 hover:bg-orange-50 dark:hover:bg-gray-800 rounded-lg transition-colors ${className}`}
            aria-label="Notifications"
        >
            <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-lg animate-pulse">
                    {totalUnread > 99 ? '99+' : totalUnread}
                </span>
            )}
        </Link>
    );
}
