import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, RefreshCw } from 'lucide-react';
import { notificationsApi } from '../../services/api.js';

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getAll({
        limit: 30,
        unreadOnly: unreadOnly || undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
      });

      if (res.data) {
        setNotifications(res.data.data || []);
        if (typeof res.data.unreadCount === 'number') {
          setUnreadCount(res.data.unreadCount);
        }
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [typeFilter, unreadOnly]);

  const handleMarkAsRead = async (id: string) => {
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

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'BOOKING':
        return <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">Equipment Rental</span>;
      case 'ORDER':
        return <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100">Livestock Trade</span>;
      case 'SERVICE':
        return <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">Driver / Worker</span>;
      case 'PAYMENT':
        return <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-100">Payment Alert</span>;
      case 'SCHEME':
        return <span className="text-xs font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md border border-teal-100">Govt Scheme</span>;
      default:
        return <span className="text-xs font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md border border-stone-200">System Alert</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-stone-900">Notifications & Alerts</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time updates regarding bookings, order fulfillment, payments, and schemes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer"
            >
              <CheckCheck className="h-4 w-4 text-emerald-600" />
              <span>Mark all read</span>
            </button>
          )}
          <button
            type="button"
            onClick={fetchNotifications}
            className="p-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 cursor-pointer shadow-xs"
            title="Refresh alerts"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xs">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'BOOKING', 'ORDER', 'SERVICE', 'PAYMENT', 'SCHEME', 'ADMIN'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                typeFilter === type
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              {type === 'ALL' && 'All'}
              {type === 'BOOKING' && 'Equipment'}
              {type === 'ORDER' && 'Animals'}
              {type === 'SERVICE' && 'Workers'}
              {type === 'PAYMENT' && 'Payments'}
              {type === 'SCHEME' && 'Schemes'}
              {type === 'ADMIN' && 'System'}
            </button>
          ))}
        </div>

        {/* Unread Only Toggle */}
        <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
          />
          <span>Unread only</span>
        </label>
      </div>

      {/* List */}
      {loading && notifications.length === 0 ? (
        <div className="py-16 text-center text-sm text-stone-500">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-xs">
          <Bell className="h-12 w-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-900">No notifications</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {unreadOnly
              ? 'No unread notifications at the moment.'
              : 'You will receive notifications here for booking status changes, order updates, and payments.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !n.is_read
                  ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  {getTypeBadge(n.notification_type)}
                  <span className="text-xs text-stone-400">
                    {new Date(n.created_at).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                  {!n.is_read && (
                    <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
                  )}
                </div>
                <h4 className={`text-sm ${!n.is_read ? 'font-bold text-stone-900' : 'font-semibold text-stone-800'}`}>
                  {n.title}
                </h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">{n.message}</p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {!n.is_read && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(n.id)}
                    className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 shadow-xs cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Mark read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(n.id)}
                  title="Delete notification"
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
