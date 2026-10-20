import React, { useState, useEffect } from 'react';
import { driverDeliveriesApi } from '../../services/api.js';
import { requestCurrentLocation } from '../../utils/geolocation.js';
import { DeliveryTrackingMap } from './DeliveryTrackingMap.js';
import {
  Truck,
  MapPin,
  Navigation,
  CheckCircle,
  Clock,
  Phone,
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Send,
} from 'lucide-react';

export const DriverDashboardView: React.FC = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingGps, setUpdatingGps] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchDriverDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await driverDeliveriesApi.getDeliveries();
      if (res.data?.success) {
        setDeliveries(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch assigned deliveries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverDeliveries();
  }, []);

  // View details for a single delivery
  const handleSelectDelivery = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await driverDeliveriesApi.getDeliveryById(id);
      if (res.data?.success) {
        setSelectedDelivery(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load delivery details.');
    } finally {
      setLoading(false);
    }
  };

  // Update Driver Location via GPS
  const handleUpdateLocation = async (orderId: string) => {
    try {
      setUpdatingGps(true);
      setError(null);
      const loc = await requestCurrentLocation();

      const res = await driverDeliveriesApi.updateLocation(orderId, {
        latitude: loc.latitude,
        longitude: loc.longitude,
        note: 'Live GPS location refreshed by driver',
      });

      if (res.data?.success) {
        setSuccessMsg(`GPS updated! Remaining distance: ${res.data.data?.distanceKm ?? 'N/A'} km`);
        // Refresh delivery detail
        const updated = await driverDeliveriesApi.getDeliveryById(orderId);
        if (updated.data?.success) {
          setSelectedDelivery(updated.data.data);
        }
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get GPS location.');
    } finally {
      setUpdatingGps(false);
    }
  };

  // Update Delivery Status (e.g. Start Delivery -> Out for Delivery -> Mark Delivered)
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(true);
      setError(null);

      // Try capturing current coordinates along with status change
      let coords: { latitude?: number; longitude?: number } = {};
      try {
        const loc = await requestCurrentLocation();
        coords = { latitude: loc.latitude, longitude: loc.longitude };
      } catch (e) {
        // Location optional on status update if permission denied
      }

      const res = await driverDeliveriesApi.updateStatus(orderId, {
        status: newStatus,
        ...coords,
      });

      if (res.data?.success) {
        setSuccessMsg(`Status updated to ${newStatus.replace(/_/g, ' ')}!`);
        setSelectedDelivery(res.data.data);
        fetchDriverDeliveries();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {selectedDelivery && (
              <button
                onClick={() => setSelectedDelivery(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-6 h-6 text-blue-600" />
              Driver Delivery Dashboard
            </h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage your assigned agricultural livestock dispatches, navigation routes, and live transit status.
          </p>
        </div>

        <button
          onClick={fetchDriverDeliveries}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Deliveries
        </button>
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

      {loading ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
          Loading driver assignments...
        </div>
      ) : selectedDelivery ? (
        /* Single Delivery Detail View */
        <div className="space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Active Dispatch Order
                </span>
                <h3 className="text-lg font-bold text-gray-900">
                  Delivery #{selectedDelivery.order_id.slice(0, 8)} • {selectedDelivery.listing_name}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold uppercase">
                  {selectedDelivery.delivery_status.replace(/_/g, ' ')}
                </span>
                {selectedDelivery.distance_km != null && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                    📍 {selectedDelivery.distance_km} km to destination
                  </span>
                )}
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              {selectedDelivery.delivery_status === 'PENDING' && (
                <button
                  onClick={() => handleStatusChange(selectedDelivery.order_id, 'PACKED')}
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Mark Packed / Picked Up
                </button>
              )}

              {selectedDelivery.delivery_status === 'PACKED' && (
                <button
                  onClick={() => handleStatusChange(selectedDelivery.order_id, 'SHIPPED')}
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Mark Shipped
                </button>
              )}

              {selectedDelivery.delivery_status === 'SHIPPED' && (
                <button
                  onClick={() => handleStatusChange(selectedDelivery.order_id, 'OUT_FOR_DELIVERY')}
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  Start Delivery (Out for Delivery)
                </button>
              )}

              {selectedDelivery.delivery_status === 'OUT_FOR_DELIVERY' && (
                <>
                  <button
                    onClick={() => handleUpdateLocation(selectedDelivery.order_id)}
                    disabled={updatingGps}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                  >
                    {updatingGps ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5" />
                    )}
                    Update GPS Location
                  </button>

                  <button
                    onClick={() => handleStatusChange(selectedDelivery.order_id, 'DELIVERED')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Delivered
                  </button>
                </>
              )}

              {selectedDelivery.delivery_status === 'DELIVERED' && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Delivery Complete
                </span>
              )}
            </div>
          </div>

          {/* Map */}
          {selectedDelivery.delivery_latitude && selectedDelivery.delivery_longitude && (
            <DeliveryTrackingMap
              driverLocation={
                selectedDelivery.assigned_driver_lat && selectedDelivery.assigned_driver_lon
                  ? {
                      latitude: selectedDelivery.assigned_driver_lat,
                      longitude: selectedDelivery.assigned_driver_lon,
                      name: 'Your Vehicle',
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

          {/* Customer & Destination Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Customer / Farmer Details
              </span>
              <h4 className="font-bold text-gray-900 text-base">{selectedDelivery.buyer_name}</h4>
              <p className="text-xs text-gray-600 mt-1">Recipient: {selectedDelivery.delivery_name}</p>
              <p className="text-xs text-emerald-700 font-semibold mt-2 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                {selectedDelivery.delivery_phone}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Delivery Address
              </span>
              <p className="text-sm font-medium text-gray-800 leading-relaxed">
                {selectedDelivery.delivery_address}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedDelivery.delivery_city}, {selectedDelivery.delivery_state} -{' '}
                <span className="font-semibold">{selectedDelivery.delivery_pincode}</span>
              </p>
            </div>
          </div>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 text-base">No Assigned Deliveries Today</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
            When AgroRent dispatch or livestock sellers assign an animal delivery to your driver profile, it will appear here.
          </p>
        </div>
      ) : (
        /* Deliveries List Cards */
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
            Today's Assigned Deliveries ({deliveries.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deliveries.map((d) => (
              <div
                key={d.order_id}
                className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-blue-300 transition shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-400">
                      Delivery #{d.order_id.slice(0, 8)}
                    </span>
                    <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {d.delivery_status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h4 className="font-bold text-gray-900 text-base">{d.listing_name}</h4>
                  <p className="text-xs text-gray-600 mt-1">Customer: {d.buyer_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Destination: {d.delivery_city}, {d.delivery_state}
                  </p>

                  {d.distance_km != null && (
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                      <Navigation className="w-3.5 h-3.5" />
                      Distance: {d.distance_km} km
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleSelectDelivery(d.order_id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    View Details & Route
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
