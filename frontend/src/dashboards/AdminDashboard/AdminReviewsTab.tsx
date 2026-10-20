import React, { useState, useEffect } from 'react';
import { Star, ShieldAlert, CheckCircle2, EyeOff, Trash2, Filter, RefreshCw, MessageSquare } from 'lucide-react';
import { adminApi } from '../../services/api.js';
import { StarRating } from '../../components/StarRating.js';

interface AdminReviewItem {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_email: string;
  target_type: string;
  target_id: string;
  source_type: string;
  source_id: string;
  rating: number;
  comment: string;
  status: 'PUBLISHED' | 'HIDDEN' | 'REPORTED';
  created_at: string;
}

interface ReviewStats {
  totalReviews: number;
  publishedReviews: number;
  hiddenReviews: number;
  reportedReviews: number;
  averageRating: number;
}

export const AdminReviewsTab: React.FC = () => {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    publishedReviews: 0,
    hiddenReviews: 0,
    reportedReviews: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('ALL');

  const fetchStats = async () => {
    try {
      const res = await adminApi.getReviewStats();
      if (res.data && res.data.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load review stats', err);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReviews({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        target_type: targetTypeFilter !== 'ALL' ? targetTypeFilter : undefined,
      });
      if (res.data && Array.isArray(res.data.data)) {
        setReviews(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load reviews list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchReviews();
  }, [statusFilter, targetTypeFilter]);

  const handleUpdateStatus = async (id: string, status: 'PUBLISHED' | 'HIDDEN' | 'REPORTED') => {
    try {
      await adminApi.updateReviewStatus(id, status);
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update review status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently remove this review?')) return;
    try {
      await adminApi.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete review');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Published
          </span>
        );
      case 'HIDDEN':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600 border border-stone-200">
            <EyeOff className="h-3 w-3" />
            Hidden
          </span>
        );
      case 'REPORTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            <ShieldAlert className="h-3 w-3" />
            Reported
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900">
            Ratings & Reviews Moderation
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Supervise verified reviews across equipment, owners, tractor drivers, and farm workers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchStats();
            fetchReviews();
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase">Total Reviews</span>
          <div className="text-2xl font-bold text-stone-900 mt-1">{stats.totalReviews}</div>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase">Avg Rating</span>
          <div className="text-2xl font-bold text-amber-600 mt-1 flex items-center gap-1">
            <span>{Number(stats.averageRating).toFixed(1)}</span>
            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase">Published</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.publishedReviews}</div>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-600 uppercase">Hidden</span>
          <div className="text-2xl font-bold text-stone-700 mt-1">{stats.hiddenReviews}</div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-800 uppercase">Reported</span>
          <div className="text-2xl font-bold text-rose-700 mt-1">{stats.reportedReviews}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xs">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'PUBLISHED', 'REPORTED', 'HIDDEN'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Target Type Filter */}
        <select
          value={targetTypeFilter}
          onChange={(e) => setTargetTypeFilter(e.target.value)}
          className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 focus:border-emerald-600 focus:outline-none"
        >
          <option value="ALL">All Categories</option>
          <option value="EQUIPMENT">Equipment</option>
          <option value="OWNER">Equipment Owners</option>
          <option value="DRIVER">Drivers</option>
          <option value="FARM_WORKER">Farm Workers</option>
          <option value="ANIMAL_SELLER">Animal Sellers</option>
        </select>
      </div>

      {/* Reviews Table */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
        {loading && reviews.length === 0 ? (
          <div className="py-16 text-center text-xs text-stone-500">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-xs text-stone-500">No reviews matching the filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Reviewer</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Rating</th>
                  <th className="px-4 py-3.5">Comment</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-stone-900">
                      <div>{r.reviewer_name}</div>
                      <div className="text-[11px] text-stone-400">{r.reviewer_email}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-stone-700">
                      <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px]">
                        {r.target_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StarRating rating={r.rating} size="sm" showTotal={false} />
                    </td>
                    <td className="px-4 py-3.5 text-stone-600 max-w-xs truncate" title={r.comment}>
                      {r.comment || <span className="text-stone-300 italic">No comment</span>}
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(r.status)}</td>
                    <td className="px-4 py-3.5 text-stone-500 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {r.status !== 'PUBLISHED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(r.id, 'PUBLISHED')}
                            title="Publish review"
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        {r.status !== 'HIDDEN' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(r.id, 'HIDDEN')}
                            title="Hide review"
                            className="p-1 rounded text-stone-500 hover:bg-stone-100 cursor-pointer"
                          >
                            <EyeOff className="h-4 w-4" />
                          </button>
                        )}
                        {r.status !== 'REPORTED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(r.id, 'REPORTED')}
                            title="Flag as reported"
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                          >
                            <ShieldAlert className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          title="Delete review permanently"
                          className="p-1 rounded text-stone-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
