import React, { useState, useEffect } from 'react';
import { adminUsersApi, adminReportsApi } from '../../services/api.js';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'FARMER' | 'OWNER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  is_active: boolean;
  created_at: string;
  district?: string;
  state?: string;
}

export const AdminUsersView: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // Status Change Dialog
  const [statusModalOpen, setStatusModalOpen] = useState<boolean>(false);
  const [targetUser, setTargetUser] = useState<UserItem | null>(null);
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [statusReason, setStatusReason] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await adminUsersApi.getAll({
        page,
        limit,
        role: roleFilter,
        status: statusFilter,
        search: search.trim() || undefined,
      });

      if (res.data?.success) {
        setUsers(res.data.data.users || []);
        setTotalUsers(res.data.data.total || 0);
      }
    } catch (err: any) {
      console.error('[AdminUsersView] Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleViewUser = async (user: UserItem) => {
    setIsLoadingDetails(true);
    setSelectedUser(user);
    try {
      const res = await adminUsersApi.getById(user.id);
      if (res.data?.success) {
        setSelectedUser(res.data.data);
      }
    } catch (err: any) {
      console.error('[AdminUsersView] Error loading user details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const openStatusModal = (user: UserItem, target: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    setTargetUser(user);
    setNewStatus(target);
    setStatusReason('');
    setActionError(null);
    setActionSuccess(null);
    setStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!targetUser) return;
    setIsUpdatingStatus(true);
    setActionError(null);
    try {
      const res = await adminUsersApi.updateStatus(targetUser.id, {
        status: newStatus,
        reason: statusReason.trim() || undefined,
      });

      if (res.data?.success) {
        setActionSuccess(`User status changed to ${newStatus}`);
        setStatusModalOpen(false);
        fetchUsers();
        if (selectedUser?.id === targetUser.id) {
          setSelectedUser((prev: any) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const totalPages = Math.ceil(totalUsers / limit) || 1;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" /> Active
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3" /> Inactive
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" /> Suspended
          </span>
        );
      default:
        return <span className="text-xs text-stone-500">{status}</span>;
    }
  };

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
            <Shield className="w-3 h-3" /> ADMIN
          </span>
        );
      case 'OWNER':
        return (
          <span className="inline-flex items-center text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
            EQUIPMENT OWNER
          </span>
        );
      case 'FARMER':
        return (
          <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            FARMER
          </span>
        );
      default:
        return <span className="text-xs">{role}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-purple-600" />
            Platform User Management
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Supervise registered farmers, equipment fleet owners, and administrator accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={adminReportsApi.getCsvUrl('users', {
              role: roleFilter !== 'ALL' ? roleFilter : undefined,
              status: statusFilter !== 'ALL' ? statusFilter : undefined,
            })}
            download="agrorent-users.csv"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>
          <button
            type="button"
            onClick={fetchUsers}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-stone-500">
            <Filter className="w-3.5 h-3.5" /> Role:
          </div>
          <select
            value={roleFilter}
            onChange={e => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Roles</option>
            <option value="FARMER">Farmers</option>
            <option value="OWNER">Equipment Owners</option>
            <option value="ADMIN">Admins</option>
          </select>

          <div className="flex items-center gap-1 text-xs text-stone-500 ml-2">Status:</div>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-7 h-7 text-purple-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-stone-500">Loading user accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-xs text-stone-400">
            No users match the specified search and filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{u.name}</div>
                      <div className="text-[11px] text-stone-400">{u.id.substring(0, 8)}...</div>
                    </td>
                    <td className="py-3 px-4 space-y-0.5">
                      <div className="text-stone-700 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-stone-400" /> {u.email}
                      </div>
                      <div className="text-stone-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-400" /> {u.phone}
                      </div>
                    </td>
                    <td className="py-3 px-4">{renderRoleBadge(u.role)}</td>
                    <td className="py-3 px-4">{renderStatusBadge(u.status || (u.is_active ? 'ACTIVE' : 'INACTIVE'))}</td>
                    <td className="py-3 px-4 text-stone-600">
                      {u.district ? `${u.district}, ${u.state}` : 'Not Specified'}
                    </td>
                    <td className="py-3 px-4 text-stone-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleViewUser(u)}
                        className="p-1.5 hover:bg-purple-50 text-purple-600 rounded-lg transition cursor-pointer"
                        title="View Full Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {u.role !== 'ADMIN' && (
                        <>
                          {u.status === 'ACTIVE' ? (
                            <button
                              type="button"
                              onClick={() => openStatusModal(u, 'SUSPENDED')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold rounded-lg transition cursor-pointer"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openStatusModal(u, 'ACTIVE')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-lg transition cursor-pointer"
                            >
                              Activate
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <div>
            Showing <span className="font-semibold text-stone-800">{users.length}</span> of{' '}
            <span className="font-semibold text-stone-800">{totalUsers}</span> accounts
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1.5 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-stone-700">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User Details Drawer / Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-stone-900">User Profile Overview</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between bg-stone-50 p-3 rounded-xl">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">{selectedUser.name}</h4>
                  <p className="text-stone-500">{selectedUser.email}</p>
                </div>
                <div>{renderStatusBadge(selectedUser.status || (selectedUser.is_active ? 'ACTIVE' : 'INACTIVE'))}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-50 p-3 rounded-xl">
                  <span className="text-[11px] text-stone-400">Phone Number</span>
                  <div className="font-semibold text-stone-800 mt-0.5">{selectedUser.phone}</div>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl">
                  <span className="text-[11px] text-stone-400">Assigned Role</span>
                  <div className="font-semibold text-stone-800 mt-0.5">{selectedUser.role}</div>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl">
                  <span className="text-[11px] text-stone-400">District / State</span>
                  <div className="font-semibold text-stone-800 mt-0.5">
                    {selectedUser.district || 'N/A'}, {selectedUser.state || 'N/A'}
                  </div>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl">
                  <span className="text-[11px] text-stone-400">Member Since</span>
                  <div className="font-semibold text-stone-800 mt-0.5">
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Activity History Counts */}
              {selectedUser.stats && (
                <div className="border border-stone-200 rounded-xl p-3 space-y-2">
                  <span className="text-[11px] font-bold text-stone-500 uppercase">Platform Activity</span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-stone-50 p-2 rounded-lg">
                      <div className="font-bold text-stone-900">{selectedUser.stats.equipmentCount}</div>
                      <div className="text-[10px] text-stone-500">Equipment</div>
                    </div>
                    <div className="bg-stone-50 p-2 rounded-lg">
                      <div className="font-bold text-stone-900">{selectedUser.stats.bookingsCount}</div>
                      <div className="text-[10px] text-stone-500">Bookings</div>
                    </div>
                    <div className="bg-stone-50 p-2 rounded-lg">
                      <div className="font-bold text-stone-900">{selectedUser.stats.ordersCount}</div>
                      <div className="text-[10px] text-stone-500">Orders</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-stone-100 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Status Change Modal */}
      {statusModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-base">
              {newStatus === 'SUSPENDED' ? (
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              )}
              Confirm Status Change: {newStatus}
            </div>

            <p className="text-xs text-stone-600">
              Are you sure you want to change the status of <strong>{targetUser.name}</strong> to{' '}
              <span className="font-bold">{newStatus}</span>?
              {newStatus === 'SUSPENDED' && (
                <span className="block mt-1 text-rose-600 font-medium">
                  This user will be immediately blocked from logging in and accessing platform services.
                </span>
              )}
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Administrative Reason (Recorded in Immutable Audit Log)
              </label>
              <textarea
                rows={2}
                value={statusReason}
                onChange={e => setStatusReason(e.target.value)}
                placeholder="Reason for suspension or activation..."
                className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {actionError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px]">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                disabled={isUpdatingStatus}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={isUpdatingStatus}
                className={`px-4 py-2 text-white text-xs font-semibold rounded-xl cursor-pointer ${
                  newStatus === 'SUSPENDED'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isUpdatingStatus ? 'Updating...' : `Confirm ${newStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
