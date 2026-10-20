import React, { useState, useEffect } from 'react';
import { Equipment } from '../../types/equipment.js';
import { ownerApi } from '../../services/api.js';
import { OwnerAddEquipmentModal } from './OwnerAddEquipmentModal.js';
import {
  Tractor,
  PlusCircle,
  RefreshCw,
  AlertCircle,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  ShieldCheck,
  Tag,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { CategoryPlaceholderImage } from '../common/CategoryPlaceholderImage.js';

export const OwnerEquipmentView: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Actions
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchOwnerEquipment = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await ownerApi.getEquipment();
      if (res.data && res.data.success) {
        setEquipmentList(res.data.data || []);
      }
    } catch (err: any) {
      console.error('[OwnerEquipmentView] fetch error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to load your equipment.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerEquipment();
  }, []);

  const handleDeleteEquipment = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from your equipment listings?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await ownerApi.deleteEquipment(id);
      if (res.data && res.data.success) {
        fetchOwnerEquipment();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete equipment.');
    } finally {
      setDeletingId(null);
    }
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-bold">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'PENDING':
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-bold">
            <Clock className="h-3 w-3 text-amber-600" />
            Pending Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2.5 py-0.5 text-xs font-bold">
            <XCircle className="h-3 w-3 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return <span className="text-xs font-medium text-stone-500">{status}</span>;
    }
  };

  const getAvailabilityBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Available for Rent
          </span>
        );
      case 'RENTED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Currently Rented
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-stone-600">
            <span className="h-2 w-2 rounded-full bg-stone-400" />
            In Maintenance
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const approvedCount = equipmentList.filter((e) => e.approval_status === 'APPROVED').length;
  const pendingCount = equipmentList.filter((e) => e.approval_status === 'PENDING' || e.approval_status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            My Machinery Fleet
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Manage your registered farm equipment, rates, and rental availability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchOwnerEquipment}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingEquipment(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            <span>List New Equipment</span>
          </button>
        </div>
      </div>

      {/* Fleet Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-stone-200 p-4 shadow-xs">
          <span className="text-xs text-stone-500 font-medium block">Total Equipment Listed</span>
          <span className="text-2xl font-black text-stone-900">{equipmentList.length}</span>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200 p-4 shadow-xs">
          <span className="text-xs text-stone-500 font-medium block">Active & Verified</span>
          <span className="text-2xl font-black text-emerald-700">{approvedCount}</span>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200 p-4 shadow-xs">
          <span className="text-xs text-stone-500 font-medium block">Pending Admin Review</span>
          <span className="text-2xl font-black text-amber-700">{pendingCount}</span>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3 text-xs text-rose-800">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={fetchOwnerEquipment}
            className="ml-auto font-bold underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Equipment List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-stone-400">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mb-2" />
          <p className="text-xs font-medium">Loading your machinery listings...</p>
        </div>
      ) : equipmentList.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 p-12 text-center bg-stone-50/50">
          <Tractor className="mx-auto h-12 w-12 text-stone-400 mb-3" />
          <h3 className="text-base font-bold text-stone-800">No machinery listed yet</h3>
          <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
            Add your tractors, harvesters, tillers, or water pumps to start receiving booking requests from local farmers.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-bold hover:bg-amber-800 transition-colors cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>List First Equipment</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {equipmentList.map((eq) => (
            <div
              key={eq.id}
              className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo & Status */}
                <div className="relative aspect-16/9 w-full bg-stone-100 overflow-hidden">
                  <CategoryPlaceholderImage
                    src={eq.image_url}
                    alt={eq.name}
                    category={eq.category}
                    aspectClassName="aspect-16/9"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    <span className="rounded-full bg-stone-900/80 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-xs">
                      {eq.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 z-10">
                    {getApprovalBadge(eq.approval_status)}
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs text-stone-500 font-medium">
                        {eq.brand} • {eq.model}
                      </div>
                      <h3 className="text-base font-bold text-stone-900 line-clamp-1">
                        {eq.name}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-amber-800">
                        ₹{eq.price_per_hour}
                      </div>
                      <div className="text-[10px] text-stone-400">/ hour</div>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {eq.description}
                  </p>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-stone-500 truncate max-w-[200px]">
                      <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{eq.location}</span>
                    </div>
                    <div>{getAvailabilityBadge(eq.availability_status)}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 sm:p-5 pt-0">
                <div className="flex items-center justify-end gap-2 border-t border-stone-100 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEquipment(eq);
                      setIsAddModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-stone-500" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEquipment(eq.id, eq.name)}
                    disabled={deletingId === eq.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                    <span>{deletingId === eq.id ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <OwnerAddEquipmentModal
          initialEquipment={editingEquipment}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingEquipment(null);
          }}
          onSuccess={() => {
            setIsAddModalOpen(false);
            setEditingEquipment(null);
            fetchOwnerEquipment();
          }}
        />
      )}
    </div>
  );
};
