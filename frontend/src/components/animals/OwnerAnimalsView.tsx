import React, { useState, useEffect } from 'react';
import { AnimalListing } from '../../types/animal.js';
import { ownerApi } from '../../services/api.js';
import { OwnerAddAnimalModal } from './OwnerAddAnimalModal.js';
import {
  Beef,
  PlusCircle,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Tag,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { CategoryPlaceholderImage } from '../common/CategoryPlaceholderImage.js';

export const OwnerAnimalsView: React.FC = () => {
  const [animals, setAnimals] = useState<AnimalListing[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    sold: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<AnimalListing | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [animalToDelete, setAnimalToDelete] = useState<AnimalListing | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'SOLD'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        ownerApi.getAnimals(),
        ownerApi.getAnimalStats().catch(() => ({ data: { success: false } })),
      ]);

      if (listRes.data?.success && Array.isArray(listRes.data.data)) {
        setAnimals(listRes.data.data);
      }

      if (statsRes.data?.success && statsRes.data.data) {
        setStats(statsRes.data.data);
      } else if (listRes.data?.data) {
        // Fallback local calculation
        const list: AnimalListing[] = listRes.data.data;
        setStats({
          total: list.length,
          approved: list.filter((a) => a.approval_status === 'APPROVED').length,
          pending: list.filter((a) => a.approval_status === 'PENDING').length,
          rejected: list.filter((a) => a.approval_status === 'REJECTED').length,
          sold: list.filter((a) => a.availability_status === 'SOLD' || a.quantity <= 0).length,
        });
      }
    } catch (err: any) {
      console.error('[OwnerAnimalsView] Error:', err);
      setError(err.response?.data?.message || err.message || 'Error loading listings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingAnimal(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (animal: AnimalListing) => {
    setEditingAnimal(animal);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!animalToDelete) return;
    setDeletingId(animalToDelete.id);
    setDeleteError(null);
    try {
      const res = await ownerApi.deleteAnimal(animalToDelete.id);
      if (res.data?.success) {
        setAnimalToDelete(null);
        await fetchData();
      } else {
        setDeleteError(res.data?.message || 'Could not delete listing');
      }
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || err.message || 'Error deleting listing');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredAnimals = animals.filter((a) => {
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'SOLD'
        ? a.availability_status === 'SOLD' || a.quantity <= 0
        : a.approval_status === statusFilter;

    const matchesSearch =
      searchTerm === '' ||
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.breed && a.breed.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const getApprovalBadge = (status: string, reason?: string | null) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
            <Clock className="h-3.5 w-3.5" />
            Pending Review
          </span>
        );
      case 'REJECTED':
        return (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800"
            title={reason || 'Declined by platform admin'}
          >
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </span>
        );
      case 'DISABLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-bold text-stone-700">
            Disabled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-2">
            <Beef className="h-6 w-6 text-amber-700" />
            <span>My Livestock Listings</span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-stone-500">
            Manage your livestock and poultry listings, update prices, stock, and monitor approval status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            id="btn-owner-add-animal"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-emerald-800 transition-colors cursor-pointer shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            <span>List Animal / Bird</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Total Listed</span>
          <span className="text-xl sm:text-2xl font-black text-stone-900">{stats.total}</span>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-800 block">Live & Approved</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-900">{stats.approved}</span>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <span className="text-xs font-semibold text-amber-800 block">Pending Review</span>
          <span className="text-xl sm:text-2xl font-black text-amber-900">{stats.pending}</span>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 shadow-xs">
          <span className="text-xs font-semibold text-stone-600 block">Sold Out</span>
          <span className="text-xl sm:text-2xl font-black text-stone-900">{stats.sold}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search my listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm font-medium text-stone-800 focus:border-emerald-600 focus:outline-hidden shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'SOLD'] as const).map((st) => (
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
              {st === 'ALL' ? 'All My Listings' : st}
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

      {/* Listings Table / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-stone-200" />
          ))}
        </div>
      ) : filteredAnimals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 mb-4">
            <Beef className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-1">No listings found</h3>
          <p className="max-w-md text-sm text-stone-500 mb-6">
            {animals.length === 0
              ? 'You have not listed any animals or birds for sale yet. Add your first listing to reach thousands of farmers.'
              : 'No listings match your search or filter.'}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add New Listing</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAnimals.map((animal) => {
            const isSold = animal.availability_status === 'SOLD' || animal.quantity <= 0;
            return (
              <div
                key={animal.id}
                id={`owner-animal-card-${animal.id}`}
                className="flex flex-col justify-between rounded-3xl border border-stone-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="relative aspect-16/10 w-full overflow-hidden bg-stone-100">
                    <CategoryPlaceholderImage
                      src={animal.image_url}
                      alt={animal.name}
                      category={animal.category}
                      listingType={animal.listing_type}
                      aspectClassName="aspect-16/10"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                      <span className="rounded-full bg-stone-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-xs">
                        {animal.category}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      {getApprovalBadge(animal.approval_status, animal.rejection_reason)}
                    </div>

                    <div className="absolute bottom-2.5 left-3 rounded-lg bg-black/60 backdrop-blur-xs px-2 py-0.5 text-xs font-medium text-stone-200">
                      Stock: <span className="font-bold text-white">{animal.quantity} units</span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-stone-900 line-clamp-1">{animal.name}</h3>
                      <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 shrink-0">
                        {animal.gender}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600">
                      Breed: {animal.breed || 'Desi'} • Age: {animal.age}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                      <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{animal.location}</span>
                    </div>

                    {animal.rejection_reason && animal.approval_status === 'REJECTED' && (
                      <div className="rounded-xl bg-red-50 p-2.5 text-xs text-red-800 border border-red-200">
                        <span className="font-bold block">Admin Feedback:</span>
                        <span>{animal.rejection_reason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="border-t border-stone-100 bg-stone-50/70 p-4 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs text-stone-500 block">Unit Price</span>
                    <span className="text-lg font-black text-stone-900">
                      ₹{animal.price.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id={`btn-edit-animal-${animal.id}`}
                      onClick={() => handleOpenEdit(animal)}
                      className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      id={`btn-delete-animal-${animal.id}`}
                      onClick={() => setAnimalToDelete(animal)}
                      className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50/80 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <OwnerAddAnimalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAnimal(null);
        }}
        onSaved={fetchData}
        animalToEdit={editingAnimal}
      />

      {/* Delete Confirmation Modal */}
      {animalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Delete Listing</h3>
                <p className="text-xs text-stone-500">{animalToDelete.name}</p>
              </div>
            </div>

            <p className="text-sm text-stone-600">
              Are you sure you want to remove this listing? If there are active buyer orders, the system will prevent deletion.
            </p>

            {deleteError && (
              <div className="rounded-xl bg-red-50 p-3 text-xs text-red-800 border border-red-200">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAnimalToDelete(null);
                  setDeleteError(null);
                }}
                disabled={deletingId !== null}
                className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-animal"
                onClick={handleConfirmDelete}
                disabled={deletingId !== null}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {deletingId ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
