import React, { useState, useEffect } from 'react';
import { adminDeliveriesApi, servicesApi } from '../../services/api.js';
import { DeliveryTrackingMap } from './DeliveryTrackingMap.js';
import { DeliveryStatusTimeline } from './DeliveryStatusTimeline.js';
import {
  Truck,
  MapPin,
  User,
  CheckCircle,
  Clock,
  Navigation,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';

export const AdminDeliveriesView: React.FC = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal for assigning driver
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetDeliveryId, setTargetDeliveryId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Status update modal / action
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = statusFilter !== 'ALL' ? { status: statusFilter } : {};
      const res = await adminDeliveriesApi.getAll(params);
      if (res.data?.success) {
        setDeliveries(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch animal deliveries.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await servicesApi.getAll({ service_type: 'DRIVER' });
      if (res.data?.success) {
        setDrivers(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch drivers list:', err);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    fetchDrivers();
  }, [statusFilter]);

  const handleOpenAssign = (delId: string) => {
    setTargetDeliveryId(delId);
    setSelectedDriverId('');
    setAssignModalOpen(true);
  };

  const handleAssignDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDeliveryId || !selectedDriverId) return;

    try {
      setAssigning(true);
      setError(null);
      await adminDeliveriesApi.assignDriver(targetDeliveryId, selectedDriverId);
      setSuccessMsg('Driver assigned to delivery successfully.');
      setAssignModalOpen(false);
      fetchDeliveries();
      if (selectedDelivery && selectedDelivery.order_id === targetDeliveryId) {
        // Refresh selected detail
        const updated = await adminDeliveriesApi.getAll();
        const found = updated.data?.data?.find((d: any) => d.order_id === targetDeliveryId);
        if (found) setSelectedDelivery(found);
      }
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign driver.');
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(true);
      setError(null);
      await adminDeliveriesApi.updateStatus(orderId, {
        status: newStatus,
        note: `Status updated by AgroRent Admin to ${newStatus}`,
      });
      setSuccessMsg(`Status updated to ${newStatus.replace(/_/g, ' ')}.`);
      fetchDeliveries();
      if (selectedDelivery && selectedDelivery.order_id === orderId) {
        setSelectedDelivery((prev: any) => ({ ...prev, delivery_status: newStatus }));
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update delivery status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-600" />
            Animal Delivery Logistics & Dispatch Control
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Assign certified drivers, inspect transit coordinates, and oversee delivery fulfillment across Karnataka.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl border border-gray-300 py-2 px-3 bg-white font-medium text-gray-700 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
          </select>

          <button
            onClick={fetchDeliveries}
            className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Selected Delivery Modal/Drawer */}
      {selectedDelivery && (
        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Inspecting Delivery
              </span>
              <h3 className="text-lg font-bold text-gray-900">
                #{selectedDelivery.order_id.slice(0, 8)} • {selectedDelivery.listing_name}
              </h3>
            </div>
            <button
              onClick={() => setSelectedDelivery(null)}
              className="text-xs font-bold text-gray-500 hover:text-gray-800 px-3 py-1 bg-gray-100 rounded-lg"
            >
              Close Details
            </button>
          </div>

          <DeliveryStatusTimeline
            currentStatus={selectedDelivery.delivery_status}
            orderStatus={selectedDelivery.order_status}
          />

          {selectedDelivery.delivery_latitude && selectedDelivery.delivery_longitude && (
            <DeliveryTrackingMap
              driverLocation={
                selectedDelivery.assigned_driver_lat && selectedDelivery.assigned_driver_lon
                  ? {
                      latitude: selectedDelivery.assigned_driver_lat,
                      longitude: selectedDelivery.assigned_driver_lon,
                      name: selectedDelivery.assigned_driver_name,
                    }
                  : null
              }
              destinationLocation={{
                latitude: selectedDelivery.delivery_latitude,
                longitude: selectedDelivery.delivery_longitude,
                address: `${selectedDelivery.delivery_address}, ${selectedDelivery.delivery_city}`,
              }}
              deliveryStatus={selectedDelivery.delivery_status}
              distanceKm={selectedDelivery.distance_km}
              etaText={selectedDelivery.eta_text}
            />
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700">Change Status:</span>
              {(['PENDING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const).map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedDelivery.order_id, st)}
                    disabled={updatingStatus || selectedDelivery.delivery_status === st}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition ${
                      selectedDelivery.delivery_status === st
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => handleOpenAssign(selectedDelivery.order_id)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Reassign Driver
            </button>
          </div>
        </div>
      )}

      {/* Deliveries Table / List */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          Loading deliveries...
        </div>
      ) : deliveries.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 text-base">No Deliveries Found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
            There are currently no animal orders matching the selected status filter.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order ID & Animal</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4">Distance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deliveries.map((del) => (
                  <tr key={del.order_id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      <div>#{del.order_id.slice(0, 8)}</div>
                      <div className="text-xs text-gray-500 font-normal">{del.listing_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-gray-800">{del.buyer_name}</div>
                      <div className="text-xs text-gray-400">{del.delivery_phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-gray-700 font-medium">
                        {del.delivery_city}, {del.delivery_state}
                      </div>
                      <div className="text-[11px] text-gray-400 truncate max-w-[180px]">
                        {del.delivery_address}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {del.assigned_driver_name ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          <Truck className="w-3.5 h-3.5" />
                          {del.assigned_driver_name}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAssign(del.order_id)}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          + Assign Driver
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-gray-600">
                      {del.distance_km != null ? `📍 ${del.distance_km} km` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {del.delivery_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedDelivery(del)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
                      >
                        Map & Status
                      </button>
                      {!del.assigned_driver_name && (
                        <button
                          onClick={() => handleOpenAssign(del.order_id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-2xs"
                        >
                          Assign
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Driver Assignment Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Assign Certified Delivery Driver
              </h3>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignDriver} className="space-y-4">
              <p className="text-xs text-gray-500">
                Select an approved AgroRent driver for this delivery. The driver will receive dispatch notifications and route details.
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select Driver
                </label>
                <select
                  required
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose an available driver...</option>
                  {drivers.map((dr) => (
                    <option key={dr.id} value={dr.id}>
                      {dr.name} ({dr.phone}) • {dr.location} (Radius: {dr.service_radius_km || 25} km)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || !selectedDriverId}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
