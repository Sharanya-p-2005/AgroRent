import React, { useState, useEffect } from 'react';
import { deliveriesApi } from '../../services/api.js';
import { DeliveryTrackingMap } from './DeliveryTrackingMap.js';
import { DeliveryStatusTimeline } from './DeliveryStatusTimeline.js';
import {
  Package,
  Truck,
  MapPin,
  Calendar,
  Phone,
  User,
  Clock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Navigation,
} from 'lucide-react';

interface FarmerOrderTrackingViewProps {
  orderId?: string;
  onBack?: () => void;
}

export const FarmerOrderTrackingView: React.FC<FarmerOrderTrackingViewProps> = ({
  orderId: propOrderId,
  onBack,
}) => {
  const [orderId, setOrderId] = useState(propOrderId || '');
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all orders for this farmer to allow picking an order if none selected
  const fetchDeliveries = async (targetId?: string) => {
    try {
      if (!targetId && !selectedDelivery) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const res = await deliveriesApi.getAll();
      if (res.data?.success && Array.isArray(res.data.data)) {
        const list = res.data.data;
        setDeliveries(list);

        const currentId = targetId || orderId || (list.length > 0 ? list[0].order_id : null);
        if (currentId) {
          setOrderId(currentId);
          // Fetch full detailed delivery with tracking history
          const detailRes = await deliveriesApi.getById(currentId);
          if (detailRes.data?.success) {
            setSelectedDelivery(detailRes.data.data);
          }
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load order delivery tracking.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeliveries(propOrderId);
  }, [propOrderId]);

  // Periodic polling for active deliveries every 30 seconds
  useEffect(() => {
    if (!selectedDelivery || selectedDelivery.delivery_status === 'DELIVERED') return;

    const timer = setInterval(() => {
      if (orderId) {
        deliveriesApi.getById(orderId).then((res) => {
          if (res.data?.success) {
            setSelectedDelivery(res.data.data);
          }
        }).catch(() => {});
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [orderId, selectedDelivery?.delivery_status]);

  const handleSelectOrder = async (id: string) => {
    setOrderId(id);
    setLoading(true);
    try {
      const res = await deliveriesApi.getById(id);
      if (res.data?.success) {
        setSelectedDelivery(res.data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load delivery details');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedDelivery) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
        Loading delivery tracking information...
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 text-base">No Orders to Track</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-4">
          When you place an order for livestock, dairy cattle, or poultry, live delivery tracking and driver GPS will appear here.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition"
          >
            Back to Orders
          </button>
        )}
      </div>
    );
  }

  const delivery = selectedDelivery;

  return (
    <div className="space-y-6">
      {/* Header & Order Selector */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-6 h-6 text-emerald-600" />
              Live Delivery & Order Tracking
            </h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time GPS tracking and dispatch updates for your livestock orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {deliveries.length > 1 && (
            <select
              value={orderId}
              onChange={(e) => handleSelectOrder(e.target.value)}
              className="text-xs rounded-xl border border-gray-300 py-2 px-3 bg-white font-medium text-gray-700 focus:ring-2 focus:ring-emerald-500"
            >
              {deliveries.map((d) => (
                <option key={d.order_id} value={d.order_id}>
                  Order #{d.order_id.slice(0, 8)} - {d.listing_name} ({d.delivery_status})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => fetchDeliveries(orderId)}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 border border-gray-200 transition"
            title="Refresh tracking status"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {delivery && (
        <>
          {/* Order Overview & Status Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Order Reference
                </span>
                <h3 className="text-lg font-bold text-gray-900">
                  #{delivery.order_id.slice(0, 8)} • {delivery.listing_name}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase">
                  {delivery.delivery_status.replace(/_/g, ' ')}
                </span>
                {delivery.distance_km != null && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
                    📍 {delivery.distance_km} km away
                  </span>
                )}
              </div>
            </div>

            {/* Timeline component */}
            <DeliveryStatusTimeline
              currentStatus={delivery.delivery_status}
              orderStatus={delivery.order_status}
              deliveredAt={delivery.delivered_at}
            />
          </div>

          {/* Live Map or GPS Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                Transit Route & Driver GPS
              </h3>
              {delivery.latest_tracking && (
                <span className="text-xs text-gray-500">
                  Last GPS ping: {new Date(delivery.latest_tracking.created_at).toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* If driver coordinates and destination coordinates are available, show DeliveryTrackingMap */}
            {delivery.delivery_latitude && delivery.delivery_longitude ? (
              <DeliveryTrackingMap
                driverLocation={
                  delivery.assigned_driver_lat && delivery.assigned_driver_lon
                    ? {
                        latitude: delivery.assigned_driver_lat,
                        longitude: delivery.assigned_driver_lon,
                        name: delivery.assigned_driver_name,
                      }
                    : delivery.latest_tracking?.latitude && delivery.latest_tracking?.longitude
                    ? {
                        latitude: delivery.latest_tracking.latitude,
                        longitude: delivery.latest_tracking.longitude,
                        name: delivery.assigned_driver_name,
                      }
                    : null
                }
                destinationLocation={{
                  latitude: delivery.delivery_latitude,
                  longitude: delivery.delivery_longitude,
                  address: `${delivery.delivery_address}, ${delivery.delivery_city}`,
                }}
                deliveryStatus={delivery.delivery_status}
                distanceKm={delivery.distance_km}
                etaText={delivery.eta_text}
                lastUpdated={delivery.latest_tracking?.created_at}
              />
            ) : (
              <div className="p-8 bg-gray-50 rounded-2xl border border-gray-200 text-center text-sm text-gray-500">
                GPS coordinates for destination address will appear once confirmed by seller/driver.
              </div>
            )}
          </div>

          {/* Details Grid: Delivery Info, Driver, Seller */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Delivery Destination */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Delivery Destination
              </span>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">{delivery.delivery_name}</h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {delivery.delivery_address}, {delivery.delivery_city}, {delivery.delivery_state} -{' '}
                    <span className="font-semibold">{delivery.delivery_pincode}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {delivery.delivery_phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Assigned Driver */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Assigned Delivery Driver
              </span>
              {delivery.assigned_driver_name ? (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {delivery.assigned_driver_name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {delivery.assigned_driver_phone}
                    </p>
                    <span className="inline-block mt-2 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      AgroRent Certified Driver
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500 py-3">
                  Driver assignment in progress by AgroRent logistics dispatch.
                </div>
              )}
            </div>

            {/* Seller Info */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Seller / Farm Origin
              </span>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">{delivery.seller_name}</h4>
                  <p className="text-xs text-gray-500 mt-1">Origin: {delivery.listing_location}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {delivery.seller_phone}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking History Breadcrumbs */}
          {delivery.tracking_history && delivery.tracking_history.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h4 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Delivery Tracking Activity History
              </h4>
              <div className="space-y-3">
                {delivery.tracking_history.map((rec: any, idx: number) => (
                  <div
                    key={rec.id || idx}
                    className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                          {rec.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(rec.created_at).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{rec.note}</p>
                      {rec.latitude && rec.longitude && (
                        <span className="text-[10px] text-gray-400 mt-0.5 block">
                          GPS: {rec.latitude.toFixed(4)}, {rec.longitude.toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
