import React, { useState, useEffect } from 'react';
import { ServiceProfile, ServiceType } from '../../types/service.js';
import { serviceBookingsApi } from '../../services/api.js';
import { ServiceFormModal } from './ServiceFormModal.js';
import {
  Truck,
  Users,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
  Power,
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Award,
} from 'lucide-react';

export const OwnerServicesView: React.FC = () => {
  const [services, setServices] = useState<ServiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter tab
  const [activeTab, setActiveTab] = useState<'ALL' | 'DRIVER' | 'FARM_WORKER'>('ALL');

  // Add / Edit Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceProfile | null>(null);
  const [formDefaultType, setFormDefaultType] = useState<ServiceType>('DRIVER');

  // Delete Modal state
  const [deletingService, setDeletingService] = useState<ServiceProfile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await serviceBookingsApi.getOwnerServices();
      if (res.data?.success && Array.isArray(res.data.data)) {
        setServices(res.data.data);
      } else {
        setServices([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleToggleAvailability = async (service: ServiceProfile) => {
    const newStatus = service.availability_status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
    try {
      await serviceBookingsApi.toggleAvailability(service.id, newStatus);
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, availability_status: newStatus } : s))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update availability');
    }
  };

  const handleDelete = async () => {
    if (!deletingService) return;
    setDeleteLoading(true);
    try {
      const res = await serviceBookingsApi.deleteService(deletingService.id);
      if (res.data?.success) {
        setDeletingService(null);
        fetchServices();
      } else {
        alert(res.data?.message || 'Failed to delete service profile');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not delete service profile');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredServices = services.filter((s) => {
    if (activeTab !== 'ALL' && s.service_type !== activeTab) return false;
    return true;
  });

  const driverCount = services.filter((s) => s.service_type === 'DRIVER').length;
  const workerCount = services.filter((s) => s.service_type === 'FARM_WORKER').length;
  const availableCount = services.filter((s) => s.availability_status === 'AVAILABLE').length;

  const getApprovalBadge = (status: string, reason?: string | null) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </span>
        );
      case 'REJECTED':
        return (
          <span
            title={reason || 'Rejected by Admin'}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200"
          >
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case 'DISABLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
            Disabled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Driver Profiles</div>
            <div className="text-2xl font-bold text-stone-900 mt-1">{driverCount}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Farm Worker Teams</div>
            <div className="text-2xl font-bold text-stone-900 mt-1">{workerCount}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Available for Hire</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{availableCount}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Power className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl self-start sm:self-auto">
          <button
            id="owner-tab-all"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ALL'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All ({services.length})
          </button>
          <button
            id="owner-tab-drivers"
            onClick={() => setActiveTab('DRIVER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'DRIVER'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Drivers ({driverCount})
          </button>
          <button
            id="owner-tab-workers"
            onClick={() => setActiveTab('FARM_WORKER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'FARM_WORKER'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Farm Workers ({workerCount})
          </button>
        </div>

        {/* Add Profile Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-add-driver"
            onClick={() => {
              setEditingService(null);
              setFormDefaultType('DRIVER');
              setIsFormOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Driver
          </button>
          <button
            id="btn-add-worker"
            onClick={() => {
              setEditingService(null);
              setFormDefaultType('FARM_WORKER');
              setIsFormOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Farm Worker
          </button>
          <button
            id="btn-refresh-owner-services"
            onClick={fetchServices}
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
            title="Refresh services"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Services List / Table */}
      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-stone-600">Loading your listed service personnel...</p>
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
      ) : filteredServices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-500">
            <Truck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-stone-900">No Services Listed Yet</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            List professional agricultural machinery drivers or farm worker labor crews to start accepting booking requests from farmers.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setEditingService(null);
                setFormDefaultType('DRIVER');
                setIsFormOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
            >
              List a Driver
            </button>
            <button
              onClick={() => {
                setEditingService(null);
                setFormDefaultType('FARM_WORKER');
                setIsFormOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
            >
              List Farm Workers
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map((service) => {
            const isDriver = service.service_type === 'DRIVER';
            const isAvailable = service.availability_status === 'AVAILABLE';

            return (
              <div
                key={service.id}
                id={`owner-service-${service.id}`}
                className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {service.profile_image_url ? (
                      <img
                        src={service.profile_image_url}
                        alt={service.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-full object-cover border border-stone-200 shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                          isDriver ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isDriver ? <Truck className="w-7 h-7" /> : <Users className="w-7 h-7" />}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-semibold text-stone-900 text-base">{service.name}</h3>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            isDriver
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isDriver ? 'Driver' : 'Farm Worker'}
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        <span>{service.location}</span>
                        <span>•</span>
                        <span>{service.experience_years} Yrs Exp</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>{getApprovalBadge(service.approval_status, service.rejection_reason)}</div>
                </div>

                {/* Skills */}
                <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                  <span className="font-semibold text-stone-700">Skills: </span>
                  {service.skills}
                </div>

                {/* Pricing & Availability Toggle */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
                  <div>
                    <span className="text-stone-500 font-medium">Rate: </span>
                    <span className="font-bold text-stone-900">₹{service.price_per_hour}/hr</span>
                    <span className="text-stone-400"> • </span>
                    <span className="font-bold text-emerald-700">₹{service.price_per_day}/day</span>
                  </div>

                  {/* Availability Toggle */}
                  <button
                    id={`toggle-avail-${service.id}`}
                    onClick={() => handleToggleAvailability(service)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold transition-colors ${
                      isAvailable
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    {isAvailable ? 'Available' : 'Unavailable'}
                  </button>
                </div>

                {/* Actions (Edit & Delete) */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    id={`btn-edit-service-${service.id}`}
                    onClick={() => {
                      setEditingService(service);
                      setIsFormOpen(true);
                    }}
                    className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    id={`btn-delete-service-${service.id}`}
                    onClick={() => setDeletingService(service)}
                    className="p-2 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <ServiceFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchServices}
        initialService={editingService}
        defaultServiceType={formDefaultType}
      />

      {/* Delete Confirmation Modal */}
      {deletingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-stone-900">Delete Service Profile?</h3>
            <p className="text-xs sm:text-sm text-stone-600">
              Are you sure you want to remove <span className="font-semibold text-stone-900">{deletingService.name}</span>?
              Active or past bookings associated with this service will remain for historical accounting.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingService(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-service"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
