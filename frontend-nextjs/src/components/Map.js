import { MapContainer, TileLayer, LayersControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// 🛠️ IMPORT GEOMAN (Wajib setelah npm install)
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

// FIX: Menangani masalah icon default Leaflet yang sering hilang di Next.js
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// Komponen Helper untuk Handle View & Tool Gambar Poligon
function ChangeView({ center, onPolygonCreated }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // --- 🖋️ KONFIGURASI GEOMAN (Alat Gambar) ---
    map.pm.addControls({
      position: 'topleft',
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawCircle: false,
      drawPolygon: true, // Hanya aktifkan poligon untuk analisis area
      editMode: true,
      dragMode: true,
      removalMode: true,
    });

    // --- 📡 EVENT LISTENER: Saat Poligon Selesai Digambar ---
    map.on('pm:create', (e) => {
      if (e.shape === 'Polygon') {
        const layer = e.layer;
        const coords = layer.getLatLngs()[0]; // Mengambil array koordinat [Lat, Lng]
        
        // Kirim data ke parent (index.js) melalui props
        if (onPolygonCreated) {
          onPolygonCreated(coords);
        }
      }
    });

    // --- 📱 LOGIKA RESPONSIVE & VIEW ---
    if (center) {
      map.setView(center, map.getZoom());
      setTimeout(() => {
        map.invalidateSize();
      }, 400); 
    }

    // Cleanup saat komponen di-unmount agar tidak double controls
    return () => {
      map.pm.removeControls();
      map.off('pm:create');
    };
  }, [center, map, onPolygonCreated]);

  return null;
}

export default function Map({ tileUrl, center, onPolygonCreated }) {
  const { BaseLayer, Overlay } = LayersControl;

  return (
    <div className="h-full w-full relative">
      <MapContainer 
        center={center || [-8.11, 115.09]} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        {/* Helper sekarang menerima props onPolygonCreated */}
        <ChangeView center={center} onPolygonCreated={onPolygonCreated} />

        <LayersControl position="topright">
          
          <BaseLayer checked name="Satelit (Esri Imagery)">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; Esri'
            />
          </BaseLayer>

          <BaseLayer name="Street View (Standard)">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
          </BaseLayer>

          <BaseLayer name="Dark Mode (Night View)">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
            />
          </BaseLayer>

          {tileUrl && (
            <Overlay checked name="Analisis Thermal & Vegetasi">
              <TileLayer 
                url={tileUrl} 
                opacity={0.7} 
              />
            </Overlay>
          )}

        </LayersControl>
      </MapContainer>
    </div>
  );
}