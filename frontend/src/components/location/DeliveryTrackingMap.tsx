import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import '../../utils/leafletSetup.js';
import { createCustomMarkerIcon } from '../../utils/leafletSetup.js';
import { Truck, MapPin, Navigation, Clock } from 'lucide-react';

interface DeliveryTrackingMapProps {
  driverLocation?: { latitude: number; longitude: number; name?: string } | null;
  destinationLocation?: { latitude: number; longitude: number; address?: string } | null;
  deliveryStatus: string;
  distanceKm?: number;
  etaText?: string;
  lastUpdated?: string;
  height?: string;
}

export const DeliveryTrackingMap: React.FC<DeliveryTrackingMapProps> = ({
  driverLocation,
  destinationLocation,
  deliveryStatus,
  distanceKm,
  etaText,
  lastUpdated,
  height = '420px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = destinationLocation
        ? [destinationLocation.latitude, destinationLocation.longitude]
        : [12.9716, 77.5946];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      L.control
        .attribution({
          position: 'bottomright',
          prefix: 'AgroRent GPS Tracking',
        })
        .addTo(map);

      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers and path
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    const bounds = L.latLngBounds([]);

    // 1. Add destination marker
    if (destinationLocation?.latitude && destinationLocation?.longitude) {
      const destPos: [number, number] = [
        destinationLocation.latitude,
        destinationLocation.longitude,
      ];
      const destMarker = L.marker(destPos, {
        icon: createCustomMarkerIcon('destination', 'Farm Destination'),
      }).bindPopup(`
        <div style="font-size: 13px;">
          <strong>Farm Destination</strong><br/>
          ${destinationLocation.address || 'Delivery Location'}
        </div>
      `);
      destMarker.addTo(group);
      bounds.extend(destPos);
    }

    // 2. Add driver marker
    if (driverLocation?.latitude && driverLocation?.longitude) {
      const driverPos: [number, number] = [
        driverLocation.latitude,
        driverLocation.longitude,
      ];
      const driverMarker = L.marker(driverPos, {
        icon: createCustomMarkerIcon('driver', driverLocation.name || 'Driver'),
      }).bindPopup(`
        <div style="font-size: 13px;">
          <strong>🚚 ${driverLocation.name || 'Delivery Driver'}</strong><br/>
          Status: ${deliveryStatus.replace(/_/g, ' ')}
        </div>
      `);
      driverMarker.addTo(group);
      bounds.extend(driverPos);
    }

    // 3. Draw dashed route line between driver and destination
    if (
      driverLocation?.latitude &&
      driverLocation?.longitude &&
      destinationLocation?.latitude &&
      destinationLocation?.longitude
    ) {
      const polyline = L.polyline(
        [
          [driverLocation.latitude, driverLocation.longitude],
          [destinationLocation.latitude, destinationLocation.longitude],
        ],
        {
          color: '#2563eb',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8',
        }
      );
      polyline.addTo(group);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [driverLocation, destinationLocation, deliveryStatus]);

  const formatLastUpdated = (dtStr?: string) => {
    if (!dtStr) return 'Recently';
    const date = new Date(dtStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Floating Status Card Over Map */}
      <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-xs z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Live Dispatch
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            {deliveryStatus.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              Remaining Distance
            </span>
            <span className="font-bold text-gray-900">
              {distanceKm != null ? `${distanceKm} km` : 'Calculating...'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Estimated Arrival
            </span>
            <span className="font-semibold text-emerald-700">
              {etaText || 'ETA unavailable'}
            </span>
          </div>

          {lastUpdated && (
            <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between">
              <span>Driver GPS sync:</span>
              <span className="text-gray-600 font-medium">{formatLastUpdated(lastUpdated)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
