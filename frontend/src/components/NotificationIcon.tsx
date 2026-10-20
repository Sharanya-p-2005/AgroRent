import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { notificationsApi } from '../services/api.js';

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  reference_type?: string;
  reference_id?: string;
}

interface NotificationIconProps {
  count?: number;
}

export const NotificationIcon: React.FC<NotificationIconProps> = ({ count }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(count ?? 0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread count periodically
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationsApi.getUnreadCount();
      if (res.data && typeof res.data.count === 'number') {
        setUnreadCount(res.data.count);
      }
    } catch {
      // Ignore background fetch errors
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Load preview notifications when dropdown opens
  const fetchDropdownNotifications = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await notificationsApi.getAll({ limit: 5 });
      if (res.data && Array.isArray(res.data.data)) {
        setNotifications(res.data.data);
        if (typeof res.data.unreadCount === 'number') {
          setUnreadCount(res.data.unreadCount);
        }
      }
    } catch (err) {
      console.error('Failed to load notifications preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const nextState = !showDropdown;
    setShowDropdown(nextState);
    if (nextState) {
      fetchDropdownNotifications();
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleViewAll = () => {
    setShowDropdown(false);
    if (user?.role === 'FARMER') {
      navigate('/farmer/notifications');
    } else if (user?.role === 'OWNER') {
      navigate('/owner/notifications');
    } else if (user?.role === 'ADMIN') {
      navigate('/admin/notifications');
    } else {
      navigate('/notifications');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'BOOKING':
        return <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">Booking</span>;
      case 'ORDER':
        return <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">Order</span>;
      case 'SERVICE':
        return <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Worker</span>;
      case 'PAYMENT':
        return <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Payment</span>;
      case 'SCHEME':
        return <span className="text-[10px] font-semibold bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded">Scheme</span>;
      default:
        return <span className="text-[10px] font-semibold bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded">Alert</span>;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        type="button"
        id="notification-bell-btn"
        onClick={handleToggle}
        className="relative rounded-xl p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 transition-colors cursor-pointer"
        aria-label={`View notifications, ${unreadCount} unread`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            id="notification-badge"
            className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Preview */}
      {showDropdown && (
        <div
          id="notification-dropdown"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-stone-200 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 bg-stone-50/70">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-stone-900">Notifications</h4>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="text-xs text-stone-500 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={fetchDropdownNotifications}
                title="Refresh notifications"
                className="text-stone-400 hover:text-stone-600 p-1 rounded-md"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500">Loading alerts...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center px-4">
                <Bell className="h-8 w-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-stone-600">No notifications yet</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  You'll be notified of booking updates, payment status, and order tracking here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 transition-colors flex items-start justify-between gap-3 ${
                    !n.is_read ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {getTypeBadge(n.notification_type)}
                      <span className="text-[11px] text-stone-400">{formatTimeAgo(n.created_at)}</span>
                      {!n.is_read && (
                        <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
                      )}
                    </div>
                    <p className={`text-xs ${!n.is_read ? 'font-bold text-stone-900' : 'font-medium text-stone-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>

                  {!n.is_read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      title="Mark as read"
                      className="text-stone-400 hover:text-emerald-600 p-1 rounded-md transition-colors cursor-pointer shrink-0"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer view all link */}
          <div className="border-t border-stone-100 p-2.5 bg-stone-50/50 text-center">
            <button
              type="button"
              id="view-all-notifications-btn"
              onClick={handleViewAll}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <span>View all notifications</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
