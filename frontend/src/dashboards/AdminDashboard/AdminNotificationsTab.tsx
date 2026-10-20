import React, { useState, useEffect } from 'react';
import { Bell, Send, Trash2, Users, User, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminApi } from '../../services/api.js';

interface AdminNotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  recipient_name?: string;
  recipient_email?: string;
  recipient_role?: string;
}

export const AdminNotificationsTab: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Form state
  const [target, setTarget] = useState<'ALL_FARMERS' | 'ALL_OWNERS' | 'ALL_USERS' | 'SPECIFIC_USER'>('ALL_FARMERS');
  const [specificUserId, setSpecificUserId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [notificationType, setNotificationType] = useState<string>('ADMIN');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getNotifications({ limit: 50 });
      if (res.data && Array.isArray(res.data.data)) {
        setNotifications(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Please provide both title and message.');
      return;
    }
    if (target === 'SPECIFIC_USER' && !specificUserId.trim()) {
      setError('Please enter a valid User ID.');
      return;
    }

    setSending(true);
    setError('');
    setSuccessMsg('');

    try {
      await adminApi.sendNotification({
        target,
        userId: target === 'SPECIFIC_USER' ? specificUserId.trim() : undefined,
        title: title.trim(),
        message: message.trim(),
        notification_type: notificationType,
      });

      setSuccessMsg(`Notification successfully dispatched to ${target.replace('_', ' ').toLowerCase()}!`);
      setTitle('');
      setMessage('');
      setSpecificUserId('');
      fetchNotifications();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to dispatch notification.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this notification record?')) return;
    try {
      await adminApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete notification');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-stone-900">
          In-App Notification Dispatch & Log
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Broadcast critical platform announcements, policy updates, or send targeted alerts to specific farmers or equipment owners.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dispatch Form Card */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Send Notification</h3>
                <p className="text-[11px] text-stone-500">Instant in-app bell alert</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-4">
              {/* Target Audience */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Target Audience
                </label>
                <select
                  value={target}
                  onChange={(e: any) => setTarget(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-medium text-stone-900 focus:border-purple-600 focus:outline-none"
                >
                  <option value="ALL_FARMERS">All Farmers</option>
                  <option value="ALL_OWNERS">All Equipment Owners</option>
                  <option value="ALL_USERS">All Platform Users</option>
                  <option value="SPECIFIC_USER">Specific User ID</option>
                </select>
              </div>

              {target === 'SPECIFIC_USER' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    User UUID
                  </label>
                  <input
                    type="text"
                    value={specificUserId}
                    onChange={(e) => setSpecificUserId(e.target.value)}
                    placeholder="Enter user UUID..."
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-stone-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>
              )}

              {/* Notification Type */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Category
                </label>
                <select
                  value={notificationType}
                  onChange={(e) => setNotificationType(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-medium text-stone-900 focus:border-purple-600 focus:outline-none"
                >
                  <option value="ADMIN">System Announcement</option>
                  <option value="SCHEME">Government Scheme Update</option>
                  <option value="BOOKING">Booking Policy Alert</option>
                  <option value="PAYMENT">Payment Notice</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Headline / Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. New Subsidized Tractor Scheme Announced"
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-stone-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Message Content
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={400}
                  placeholder="Enter details of your message..."
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-stone-900 focus:border-purple-600 focus:outline-none"
                />
                <span className="text-[10px] text-stone-400 block text-right mt-1">
                  {message.length}/400 characters
                </span>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-purple-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>{sending ? 'Dispatching...' : 'Send Notification'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Notifications History Log */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-stone-600" />
                <h3 className="text-sm font-bold text-stone-900">Recent Notifications Log</h3>
              </div>
              <button
                type="button"
                onClick={fetchNotifications}
                className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
                title="Refresh log"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading && notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-500">Loading notifications log...</div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-500">No notifications dispatched yet.</div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl border border-stone-200 p-3.5 hover:border-stone-300 transition-colors flex items-start justify-between gap-3 bg-stone-50/40"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                          {n.notification_type}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-stone-900">{n.title}</h4>
                      <p className="text-xs text-stone-600 mt-0.5 line-clamp-2">{n.message}</p>
                      {n.recipient_name && (
                        <p className="text-[11px] text-stone-500 mt-1 font-medium">
                          Recipient: {n.recipient_name} ({n.recipient_role})
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(n.id)}
                      title="Delete record"
                      className="p-1 text-stone-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
