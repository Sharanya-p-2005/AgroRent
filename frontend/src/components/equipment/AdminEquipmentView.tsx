import React, { useState, useEffect } from 'react';
import { Equipment } from '../../types/equipment.js';
import { adminApi } from '../../services/api.js';
import {
  Tractor,
  Check,
  Ban,
  Trash2,
  RefreshCw,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  MapPin,
  User,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import { CategoryPlaceholderImage } from '../common/CategoryPlaceholderImage.js';

interface AdminEquipmentViewProps {
  initialApprovalsOnly?: boolean;
}

export const AdminEquipmentView: React.FC<AdminEquipmentViewProps> = ({
  initialApprovalsOnly = false,
}) => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'approvals' | 'all'>(
    initialApprovalsOnly ? 'approvals' : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchAdminEquipment = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminApi.getEquipment();
      if (res.data && res.data.success) {
        setEquipmentList(res.data.data || []);
      }
    } catch (err: any) {
      console.error('[AdminEquipmentView] error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to fetch equipment listings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminEquipment();
  }, []);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await adminApi.approveEquipment(id);
      if (res.data && res.data.success) {
        fetchAdminEquipment();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve equipment.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await adminApi.rejectEquipment(id);
      if (res.data && res.data.success) {
        fetchAdminEquipment();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject equipment.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleStatus = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await adminApi.toggleAvailability(id);
      if (res.data && res.data.success) {
        fetchAdminEquipment();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle availability status.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Permanently remove "${name}" from AgroRent system?`)) {
      return;
    }

    setProcessingId(id);
    try {
      const res = await adminApi.deleteEquipment(id);
      if (res.data && res.data.success) {
        fetchAdminEquipment();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete equipment.');
    } finally {
      setProcessingId(null);
    }
  };

  const isPending = (status: string) => status === 'PENDING' || status === 'PENDING_APPROVAL';

  const pendingApprovalsCount = equipmentList.filter(
    (e) => isPending(e.approval_status)
  ).length;

  const filteredList = equipmentList.filter((eq) => {
    if (activeSubTab === 'approvals') {
      if (!isPending(eq.approval_status)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        eq.name.toLowerCase().includes(q) ||
        eq.brand.toLowerCase().includes(q) ||
        eq.model.toLowerCase().includes(q) ||
        (eq.owner_name && eq.owner_name.toLowerCase().includes(q)) ||
        eq.location.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            Equipment Inventory & Approvals
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Verify owner credentials, machinery suitability, and enforce listing compliance
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAdminEquipment}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors self-start cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'all'
              ? 'bg-purple-800 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          All Equipment ({equipmentList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('approvals')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'approvals'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <span>Pending Approvals</span>
          {pendingApprovalsCount > 0 && (
            <span className="rounded-full bg-amber-200 text-amber-900 px-2 py-0.5 text-[10px] font-black">
              {pendingApprovalsCount}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by machinery name, owner name, brand, location..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-xs sm:text-sm text-stone-800 focus:outline-purple-700"
        />
      </div>

      {errorMessage && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3 text-xs text-rose-800">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={fetchAdminEquipment}
            className="ml-auto font-bold underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-stone-400">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-700 mb-2" />
          <p className="text-xs font-medium">Loading platform equipment registry...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 p-12 text-center bg-stone-50/50">
          <Tractor className="mx-auto h-12 w-12 text-stone-400 mb-3" />
          <h3 className="text-base font-bold text-stone-800">
            {activeSubTab === 'approvals'
              ? 'No pending approvals'
              : 'No equipment matches search'}
          </h3>
          <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
            {activeSubTab === 'approvals'
              ? 'All machinery listings have been inspected and approved!'
              : 'Try clearing your search query to see all platform machinery.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((eq) => (
            <div
              key={eq.id}
              className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs hover:border-purple-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-20 w-24 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
                    <CategoryPlaceholderImage
                      src={eq.image_url}
                      alt={eq.name}
                      category={eq.category}
                      aspectClassName="h-full w-full"
                      size="sm"
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="rounded-full bg-stone-900 text-white px-2 py-0.5 text-[11px] font-semibold">
                        {eq.category}
                      </span>
                      {eq.approval_status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[11px] font-bold">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Approved
                        </span>
                      ) : isPending(eq.approval_status) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px] font-bold">
                          <Clock className="h-3 w-3 text-amber-600" />
                          Pending Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-[11px] font-bold">
                          <XCircle className="h-3 w-3 text-rose-600" />
                          Rejected
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-semibold ${
                          eq.availability_status === 'AVAILABLE'
                            ? 'text-emerald-700'
                            : 'text-stone-500'
                        }`}
                      >
                        • {eq.availability_status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900">
                      {eq.name}
                    </h3>
                    <div className="text-xs text-stone-500 font-medium">
                      {eq.brand} • {eq.model}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-stone-600">
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-stone-400" />
                        <span className="font-semibold text-stone-800">{eq.owner_name}</span>
                        {eq.owner_phone && (
                          <span className="font-mono text-stone-500">({eq.owner_phone})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-stone-500">
                        <MapPin className="h-3.5 w-3.5 text-stone-400" />
                        <span>{eq.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 sm:self-start">
                  <div className="text-lg font-black text-purple-900">
                    ₹{eq.price_per_hour}
                  </div>
                  <div className="text-[11px] text-stone-400">hourly rate</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-stone-100">
                {isPending(eq.approval_status) && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReject(eq.id)}
                      disabled={processingId === eq.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span>Reject Listing</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(eq.id)}
                      disabled={processingId === eq.id}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve Machinery</span>
                    </button>
                  </>
                )}

                {eq.approval_status === 'REJECTED' && (
                  <button
                    type="button"
                    onClick={() => handleApprove(eq.id)}
                    disabled={processingId === eq.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Re-Approve</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleToggleStatus(eq.id)}
                  disabled={processingId === eq.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>Toggle Availability</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(eq.id, eq.name)}
                  disabled={processingId === eq.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
