import React, { useState, useEffect } from 'react';
import { AnimalListing, AnimalApprovalStatus } from '../../types/animal.js';
import { adminApi } from '../../services/api.js';
import {
  Beef,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Trash2,
  RefreshCw,
  Search,
  Tag,
  ShieldCheck,
  Ban,
  Clock,
  MapPin,
  User,
  Phone,
} from 'lucide-react';
import { CategoryPlaceholderImage } from '../common/CategoryPlaceholderImage.js';

export const AdminAnimalsView: React.FC = () => {
  const [animals, setAnimals] = useState<AnimalListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | AnimalApprovalStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Reject modal state
  const [rejectingAnimal, setRejectingAnimal] = useState<AnimalListing | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Incomplete vaccination or health record');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAnimals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAnimals();
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAnimals(res.data.data);
      } else {
        setError('Failed to fetch livestock listings');
      }
    } catch (err: any) {
      console.error('[AdminAnimalsView] Error:', err);
      setError(err.response?.data?.message || err.message || 'Error fetching listings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
  }, []);

  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    try {
      await adminApi.approveAnimal(id);
      await fetchAnimals();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error approving listing');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingAnimal) return;
    setIsProcessing(true);
    try {
      await adminApi.rejectAnimal(rejectingAnimal.id, rejectionReason.trim());
      setRejectingAnimal(null);
      await fetchAnimals();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error rejecting listing');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisable = async (id: string) => {
    setIsProcessing(true);
    try {
      await adminApi.disableAnimal(id);
      await fetchAnimals();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error disabling listing');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this listing?')) return;
    setIsProcessing(true);
    try {
      await adminApi.deleteAnimal(id);
      await fetchAnimals();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error deleting listing');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredAnimals = animals.filter((a) => {
    const matchesStatus = statusFilter === 'ALL' || a.approval_status === statusFilter;
    const matchesSearch =
      searchTerm === '' ||
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.seller_name && a.seller_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.location && a.location.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const pendingCount = animals.filter((a) => a.approval_status === 'PENDING').length;
  const approvedCount = animals.filter((a) => a.approval_status === 'APPROVED').length;
  const rejectedCount = animals.filter((a) => a.approval_status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-2">
            <Beef className="h-6 w-6 text-amber-700" />
            <span>Livestock Listing Approvals & Oversight</span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-stone-500">
            Audit rural livestock and poultry listings, inspect health status, verify sellers, and approve for marketplace publishing.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAnimals}
          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer shadow-xs"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Total Listings</span>
          <span className="text-xl sm:text-2xl font-black text-stone-900">{animals.length}</span>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
          <span className="text-xs font-semibold text-amber-800 block">Pending Verification</span>
          <span className="text-xl sm:text-2xl font-black text-amber-900">{pendingCount}</span>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-800 block">Approved & Live</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-900">{approvedCount}</span>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 shadow-xs">
          <span className="text-xs font-semibold text-red-800 block">Rejected</span>
          <span className="text-xl sm:text-2xl font-black text-red-900">{rejectedCount}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by title, seller, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm font-medium text-stone-800 focus:border-emerald-600 focus:outline-hidden shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'DISABLED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {st === 'ALL' ? 'All' : st} {st === 'PENDING' && pendingCount > 0 ? `(${pendingCount})` : ''}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 text-xs sm:text-sm text-red-800 border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Table of Listings */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 rounded-2xl bg-stone-200" />
          ))}
        </div>
      ) : filteredAnimals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-xs">
          <Beef className="h-10 w-10 text-stone-400 mb-2" />
          <h3 className="text-base font-bold text-stone-800">No listings found</h3>
          <p className="text-xs text-stone-500">No animal or bird records match the selected status.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-stone-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-stone-600 font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-5 py-3.5">Listing & Type</th>
                  <th className="px-5 py-3.5">Seller & Location</th>
                  <th className="px-5 py-3.5">Health / Specs</th>
                  <th className="px-5 py-3.5">Price / Stock</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {filteredAnimals.map((animal) => (
                  <tr key={animal.id} id={`admin-animal-row-${animal.id}`} className="hover:bg-stone-50/80">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl overflow-hidden border border-stone-200 shrink-0">
                          <CategoryPlaceholderImage
                            src={animal.image_url}
                            alt={animal.name}
                            category={animal.category}
                            listingType={animal.listing_type}
                            aspectClassName="h-full w-full"
                            size="sm"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 line-clamp-1">{animal.name}</div>
                          <div className="text-xs text-stone-500">
                            {animal.category} • {animal.listing_type}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-stone-900">{animal.seller_name || 'Owner'}</div>
                      <div className="text-xs text-stone-500">{animal.location}</div>
                      {animal.seller_phone && (
                        <div className="text-xs text-stone-400">{animal.seller_phone}</div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-xs">
                        <span className="font-medium text-stone-700">Breed:</span> {animal.breed || 'Native'}
                      </div>
                      <div className="text-xs">
                        <span className="font-medium text-stone-700">Age:</span> {animal.age} ({animal.gender})
                      </div>
                      {animal.health_status && (
                        <div className="text-xs text-emerald-800 font-medium truncate max-w-[160px]" title={animal.health_status}>
                          {animal.health_status}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-stone-900">
                        ₹{animal.price.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-stone-500">Qty: {animal.quantity} units</div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          animal.approval_status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : animal.approval_status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : animal.approval_status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {animal.approval_status}
                      </span>
                      {animal.rejection_reason && animal.approval_status === 'REJECTED' && (
                        <p className="text-xs text-red-600 mt-1 line-clamp-1" title={animal.rejection_reason}>
                          {animal.rejection_reason}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {animal.approval_status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              id={`admin-btn-approve-${animal.id}`}
                              onClick={() => handleApprove(animal.id)}
                              disabled={isProcessing}
                              className="rounded-lg bg-emerald-700 p-1.5 text-white hover:bg-emerald-800 transition-colors cursor-pointer"
                              title="Approve Listing"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              id={`admin-btn-reject-${animal.id}`}
                              onClick={() => setRejectingAnimal(animal)}
                              disabled={isProcessing}
                              className="rounded-lg bg-red-50 p-1.5 text-red-700 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                              title="Reject Listing"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {animal.approval_status === 'APPROVED' && (
                          <button
                            type="button"
                            id={`admin-btn-disable-${animal.id}`}
                            onClick={() => handleDisable(animal.id)}
                            disabled={isProcessing}
                            className="rounded-lg bg-amber-50 p-1.5 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                            title="Disable Listing"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          id={`admin-btn-delete-${animal.id}`}
                          onClick={() => handleDelete(animal.id)}
                          disabled={isProcessing}
                          className="rounded-lg p-1.5 text-stone-400 hover:text-red-700 hover:bg-stone-100 transition-colors cursor-pointer"
                          title="Delete Listing"
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
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingAnimal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Reject Listing</h3>
                <p className="text-xs text-stone-500">{rejectingAnimal.name}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Reason for Rejection (Visible to Seller)
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify why this listing was not approved..."
                className="w-full rounded-xl border border-stone-200 p-3 text-xs sm:text-sm font-medium text-stone-900 focus:border-red-600 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingAnimal(null)}
                className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessing}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
