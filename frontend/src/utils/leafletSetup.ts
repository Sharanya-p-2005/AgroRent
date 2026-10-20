import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon paths in Vite bundles
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored and styled markers
export const createCustomMarkerIcon = (
  type: 'farm' | 'driver' | 'destination' | 'equipment',
  label?: string
) => {
  let bgColor = '#16a34a'; // green
  let iconHtml = '🌾';

  if (type === 'driver') {
    bgColor = '#2563eb'; // blue
    iconHtml = '🚚';
  } else if (type === 'destination') {
    bgColor = '#dc2626'; // red
    iconHtml = '📍';
  } else if (type === 'equipment') {
    bgColor = '#d97706'; // amber
    iconHtml = '🚜';
  }

  return L.divIcon({
    className: 'agro-map-custom-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        color: white;
        border-radius: 50%;
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
        border: 2px solid #ffffff;
      ">
        ${iconHtml}
      </div>
      ${
        label
          ? `<div style="
              background: white; 
              color: #1f2937; 
              font-weight: 600; 
              font-size: 11px; 
              padding: 2px 6px; 
              border-radius: 4px; 
              white-space: nowrap; 
              margin-top: 4px; 
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
              text-align: center;
             ">${label}</div>`
          : ''
      }
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
};
