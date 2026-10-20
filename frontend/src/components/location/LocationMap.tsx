import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import '../../utils/leafletSetup.js';
import { createCustomMarkerIcon } from '../../utils/leafletSetup.js';

interface MarkerItem {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  type?: 'farm' | 'driver' | 'destination' | 'equipment';
  description?: string;
}

interface LocationMapProps {
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  onLocationSelect?: (lat: number, lon: number) => void;
  selectedLocation?: { latitude: number; longitude: number; label?: string } | null;
  markers?: MarkerItem[];
  height?: string;
  className?: string;
}

export const LocationMap: React.FC<LocationMapProps> = ({
  center = [12.9716, 77.5946], // Default to Bengaluru area
  zoom = 12,
  interactive = false,
  onLocationSelect,
  selectedLocation,
  markers = [],
  height = '360px',
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: L.latLng(center[0], center[1]),
        zoom,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Attribution control in bottom right
      L.control
        .attribution({
          position: 'bottomright',
          prefix: 'AgroRent GPS &copy; OpenStreetMap',
        })
        .addTo(map);

      mapInstanceRef.current = map;
      markerGroupRef.current = L.layerGroup().addTo(map);

      // Invalidate size on load to avoid grey tiles
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

  // Handle click events for interactive location picking
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!interactive) return;
      const { lat, lng } = e.latlng;
      const roundedLat = Math.round(lat * 10000) / 10000;
      const roundedLng = Math.round(lng * 10000) / 10000;

      if (onLocationSelect) {
        onLocationSelect(roundedLat, roundedLng);
      }
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [interactive, onLocationSelect]);

  // Update selected marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedLocation?.latitude && selectedLocation?.longitude) {
      const pos: [number, number] = [selectedLocation.latitude, selectedLocation.longitude];

      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.setLatLng(pos);
      } else {
        const marker = L.marker(pos, {
          icon: createCustomMarkerIcon('destination', selectedLocation.label || 'Selected Location'),
          draggable: interactive,
        }).addTo(map);

        if (interactive) {
          marker.on('dragend', (ev: any) => {
            const latlng = ev.target.getLatLng();
            const rLat = Math.round(latlng.lat * 10000) / 10000;
            const rLng = Math.round(latlng.lng * 10000) / 10000;
            if (onLocationSelect) onLocationSelect(rLat, rLng);
          });
        }

        selectedMarkerRef.current = marker;
      }

      map.setView(pos, Math.max(map.getZoom(), 13), { animate: true });
    } else if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }
  }, [selectedLocation, interactive, onLocationSelect]);

  // Update additional markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (markers.length > 0) {
      const bounds = L.latLngBounds([]);

      markers.forEach((m) => {
        if (m.latitude && m.longitude) {
          const marker = L.marker([m.latitude, m.longitude], {
            icon: createCustomMarkerIcon(m.type || 'farm', m.title),
          });

          if (m.description) {
            marker.bindPopup(`
              <div style="font-size: 13px; padding: 4px;">
                <strong style="display: block; margin-bottom: 2px;">${m.title}</strong>
                <span>${m.description}</span>
              </div>
            `);
          }

          marker.addTo(group);
          bounds.extend([m.latitude, m.longitude]);
        }
      });

      if (selectedLocation?.latitude && selectedLocation?.longitude) {
        bounds.extend([selectedLocation.latitude, selectedLocation.longitude]);
      }

      if (bounds.isValid() && markers.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    }
  }, [markers, selectedLocation]);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 ${className}`}>
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />
      {interactive && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 text-xs text-gray-700 font-medium pointer-events-none flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Click on map to pin your farm or delivery point
        </div>
      )}
    </div>
  );
};
