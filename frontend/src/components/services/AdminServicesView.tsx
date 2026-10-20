import React, { useState, useEffect } from 'react';
import { ServiceProfile } from '../../types/service.js';
import { serviceBookingsApi } from '../../services/api.js';
import {
  ShieldCheck,
  Truck,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Ban,
  Trash2,
  MapPin,
  Clock,
  Phone,
} from 'lucide-react';

export const AdminServicesView: React.FC = () => {
  const [services, setServices] = useState<ServiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [serviceType, setServiceType] = useState<string>('ALL');
  const [approvalStatus, setApprovalStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Reject Modal state
  const [rejectingService, setRejectingService] = useState<ServiceProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await serviceBookingsApi.getAllAdminServices({
        service_type: serviceType !== 'ALL' ? (serviceType as any) : undefined,
        approval_status: approvalStatus !== 'ALL' ? approvalStatus : undefined,
        search: search.trim() || undefined,
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        setServices(res.data.data);
      } else {
        setServices([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load services for admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServices();
    }, 250);
    return () => clearTimeout(timer);
  }, [serviceType, approvalStatus, search]);

  const handleApprove = async (id: string) => {
    try {
      const res = await serviceBookingsApi.approveService(id);
      if (res.data?.success) {
        fetchServices();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async () => {
    if (!rejectingService) return;
    setActionLoading(true);
    try {
      const res = await serviceBookingsApi.rejectService(
        rejectingService.id,
        rejectionReason.trim() || undefined
      );
      if (res.data?.success) {
        setRejectingService(null);
        setRejectionReason('');
        fetchServices();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable = async (id: string) => {
    try {
      const res = await serviceBookingsApi.disableService(id);
      if (res.data?.success) {
        fetchServices();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to disable service');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently remove this service profile?')) return;
    try {
      const res = await serviceBookingsApi.deleteAdminService(id);
      if (res.data?.success) {
        fetchServices();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete service profile');
    }
  };

  const pendingCount = services.filter((s) => s.approval_status === 'PENDING').length;
  const approvedCount = services.filter((s) => s.approval_status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
              Driver & Farm Worker Moderation
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Review, verify credentials, approve new machinery drivers, and moderate labor service profiles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-stone-500 font-medium">Pending Approvals</div>
            <div className="text-xl font-bold text-amber-600">{pendingCount}</div>
          </div>
          <div className="h-8 w-px bg-stone-200" />
          <div className="text-right">
            <div className="text-xs text-stone-500 font-medium">Active Profiles</div>
            <div className="text-xl font-bold text-emerald-700">{approvedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            id="admin-service-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by profile name, location, or skills..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            id="admin-service-type-filter"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800"
          >
            <option value="ALL">All Categories</option>
            <option value="DRIVER">Drivers Only</option>
            <option value="FARM_WORKER">Farm Workers Only</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            id="admin-service-status-filter"
            value={approvalStatus}
            onChange={(e) => setApprovalStatus(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800"
          >
            <option value="ALL">All Approval Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </div>

        <div className="sm:col-span-1 flex items-center justify-end">
          <button
            onClick={fetchServices}
            className="p-2 w-full rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 flex items-center justify-center"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Services Table */}
      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-stone-600">Loading service profiles for moderation...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-medium text-red-800">{error}</p>
          <button
            onClick={fetchServices}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500 text-xs sm:text-sm">
          No service profiles found matching the current filter.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-50 text-stone-600 uppercase text-[11px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Service Profile</th>
                  <th className="py-3.5 px-4 font-semibold">Provider Account</th>
                  <th className="py-3.5 px-4 font-semibold">Location & Rates</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {services.map((service) => {
                  const isDriver = service.service_type === 'DRIVER';
                  return (
                    <tr key={service.id} className="hover:bg-stone-50/60 transition-colors">
                      {/* Profile Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {service.profile_image_url ? (
                            <img
                              src={service.profile_image_url}
                              alt={service.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isDriver ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isDriver ? <Truck className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-stone-900 flex items-center gap-1.5">
                              {service.name}
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                  isDriver ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {isDriver ? 'Driver' : 'Farm Worker'}
                              </span>
                            </div>
                            <div className="text-[11px] text-stone-500 line-clamp-1 max-w-xs">
                              {service.skills}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Provider Column */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-stone-800">
                          {service.provider_name || 'AgroRent User'}
                        </div>
                        <div className="text-[11px] text-stone-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {service.phone || service.provider_phone}
                        </div>
                      </td>

                      {/* Location and Rates */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-stone-700">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          <span className="truncate max-w-[150px]">{service.location}</span>
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          ₹{service.price_per_hour}/hr • ₹{service.price_per_day}/day
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-4">
                        {service.approval_status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        )}
                        {service.approval_status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                            <Clock className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                        {service.approval_status === 'REJECTED' && (
                          <span
                            title={service.rejection_reason || undefined}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700"
                          >
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                        {service.approval_status === 'DISABLED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600">
                            Disabled
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {service.approval_status === 'PENDING' && (
                            <>
                              <button
                                id={`admin-approve-${service.id}`}
                                onClick={() => handleApprove(service.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                id={`admin-reject-${service.id}`}
                                onClick={() => {
                                  setRejectingService(service);
                                  setRejectionReason('');
                                }}
                                className="px-2.5 py-1 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {service.approval_status === 'APPROVED' && (
                            <button
                              id={`admin-disable-${service.id}`}
                              onClick={() => handleDisable(service.id)}
                              className="px-2.5 py-1 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-semibold transition-colors"
                            >
                              Disable
                            </button>
                          )}

                          <button
                            id={`admin-delete-${service.id}`}
                            onClick={() => handleDelete(service.id)}
                            className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-stone-900">Reject Service Profile</h3>
            <p className="text-xs text-stone-600">
              Provide an optional reason for rejecting{' '}
              <span className="font-semibold text-stone-900">{rejectingService.name}</span>.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete license documentation or contact number invalid."
              rows={3}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingService(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-admin-reject"
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
