import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Trash2, ArrowLeft, Store, User, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    Notification,
} from '../services/notificationService';

type TabType = 'personal' | 'store';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('personal');
    const [unreadCounts, setUnreadCounts] = useState({ personal: 0, store: 0 });
    const { user } = useAuth();
    const navigate = useNavigate();

    // Check if user is UMKM owner
    const isUmkm = user?.role === 'umkm' || user?.tumkm;

    // Fetch unread counts
    const fetchUnreadCounts = useCallback(async () => {
        if (!user?.id) return;
        const data = await getUnreadCount(user.id);
        setUnreadCounts({
            personal: data.personal_count,
            store: data.store_count,
        });
    }, [user?.id]);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        const notifs = await getNotifications(user.id, 50, false, activeTab);
        setNotifications(notifs);
        setLoading(false);
    }, [user?.id, activeTab]);

    useEffect(() => {
        if (user?.id) {
            fetchUnreadCounts();
            fetchNotifications();
        }
    }, [user?.id, activeTab, fetchUnreadCounts, fetchNotifications]);

    // Handle notification click
    const handleNotificationClick = async (notif: Notification) => {
        if (!user?.id) return;

        // Mark as read
        if (!notif.is_read) {
            await markAsRead(user.id, notif.id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
            );
            fetchUnreadCounts();
        }

        // Navigate if there's an action URL
        if (notif.action_url) {
            navigate(notif.action_url);
        }
    };

    // Handle mark all as read
    const handleMarkAllAsRead = async () => {
        if (!user?.id) return;

        await markAllAsRead(user.id, activeTab);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        fetchUnreadCounts();
    };

    // Handle delete notification
    const handleDelete = async (e: React.MouseEvent, notifId: number) => {
        e.stopPropagation();
        if (!user?.id) return;

        await deleteNotification(user.id, notifId);
        setNotifications((prev) => prev.filter((n) => n.id !== notifId));
        fetchUnreadCounts();
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        Silakan login untuk melihat notifikasi
                    </p>
                    <Link
                        to="/login"
                        className="mt-4 inline-block text-orange-600 hover:underline"
                    >
                        Login
                    </Link>
                </div>
            </div>
        );
    }

    const unreadInCurrentTab =
        activeTab === 'personal' ? unreadCounts.personal : unreadCounts.store;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </button>
                            <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                Notifikasi
                            </h1>
                        </div>

                        {unreadInCurrentTab > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400 hover:underline"
                            >
                                <CheckCheck className="w-4 h-4" />
                                Tandai semua dibaca
                            </button>
                        )}
                    </div>

                    {/* Tabs - Only show for UMKM users */}
                    {isUmkm && (
                        <div className="flex border-b border-gray-200 dark:border-gray-700 -mb-px">
                            <button
                                onClick={() => setActiveTab('personal')}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'personal'
                                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                <User className="w-4 h-4" />
                                Notifikasi Saya
                                {unreadCounts.personal > 0 && (
                                    <span className="bg-orange-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                                        {unreadCounts.personal}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('store')}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'store'
                                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                <Store className="w-4 h-4" />
                                Notifikasi Toko
                                {unreadCounts.store > 0 && (
                                    <span className="bg-orange-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                                        {unreadCounts.store}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Notification List */}
            <div className="max-w-3xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
                        <Bell className="w-16 h-16 mb-4 opacity-30" />
                        <p className="text-lg">
                            {activeTab === 'personal'
                                ? 'Belum ada notifikasi'
                                : 'Belum ada notifikasi toko'}
                        </p>
                        <p className="text-sm mt-1 text-gray-400">
                            {activeTab === 'personal'
                                ? 'Notifikasi pesanan dan promo akan muncul di sini'
                                : 'Notifikasi pesanan masuk dan stok akan muncul di sini'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border cursor-pointer transition-all hover:shadow-md group ${notif.is_read
                                    ? 'border-gray-200 dark:border-gray-700'
                                    : 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20'
                                    }`}
                            >
                                <div className="p-4">
                                    <div className="flex gap-4">
                                        {/* Icon */}
                                        <div className="flex-shrink-0 text-3xl">{notif.icon}</div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p
                                                        className={`font-medium ${notif.is_read
                                                            ? 'text-gray-700 dark:text-gray-300'
                                                            : 'text-gray-900 dark:text-white'
                                                            }`}
                                                    >
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        {notif.message}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                                            {notif.time_ago}
                                                        </span>
                                                        {notif.action_url && (
                                                            <span className="text-xs text-orange-500 flex items-center gap-1">
                                                                <ExternalLink className="w-3 h-3" />
                                                                Lihat detail
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {!notif.is_read && (
                                                        <span className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></span>
                                                    )}
                                                    <button
                                                        onClick={(e) => handleDelete(e, notif.id)}
                                                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all text-red-500"
                                                        title="Hapus notifikasi"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
