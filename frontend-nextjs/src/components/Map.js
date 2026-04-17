import { MapContainer, TileLayer, LayersControl, useMap, ZoomControl, useMapEvents, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { useEffect, useState } from 'react';

// 🛠️ IMPORT GEOMAN & GEOSEARCH
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

// FIX: Menangani masalah icon default Leaflet di Next.js
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// --- 🖱️ KOMPONEN MAP EVENTS (Klik Koordinat) ---
function MapEvents({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng); // Mengirim {lat, lng} ke parent
      }
    },
  });
  return null;
}

// --- 🖱️ KOMPONEN MOUSE COORDINATES (Koordinat Real-time) ---
function MouseCoordinates() {
  const [coords, setCoords] = useState({ lat: 0, lng: 0 });
  const map = useMap();

  useEffect(() => {
    const handleMouseMove = (e) => setCoords(e.latlng);
    map.on('mousemove', handleMouseMove);
    return () => map.off('mousemove', handleMouseMove);
  }, [map]);

  return (
    <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[9px] font-mono font-black shadow-md border border-slate-200 text-slate-700 pointer-events-none">
      LAT: {coords.lat.toFixed(5)} | LNG: {coords.lng.toFixed(5)}
    </div>
  );
}

// --- 🔍 KOMPONEN SEARCH FIELD ---
function SearchField() {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider({
      params: { 'accept-language': 'id', countrycodes: 'id' },
    });

    const searchControl = new GeoSearchControl({
      provider: provider,
      style: 'bar',
      showMarker: true,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: 'Cari lokasi di Bali...',
      position: 'topleft',
      autocomplete: true,
      autocompleteDelay: 250,
      showLocation: true,
    });

    map.addControl(searchControl);
    return () => map.removeControl(searchControl);
  }, [map]);

  return null;
}

// --- 🖋️ KOMPONEN HELPER VIEW & GEOMAN ---
function ChangeView({ center, onPolygonCreated }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    map.pm.addControls({
      position: 'topleft',
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawCircle: false,
      drawPolygon: true,
      editMode: true,
      removalMode: true,
    });

    map.on('pm:create', (e) => {
      if (e.shape === 'Polygon') {
        const layer = e.layer;
        map.eachLayer((l) => {
          if (l instanceof L.Polygon && l !== layer && !l._url) {
            map.removeLayer(l);
          }
        });

        const coords = layer.getLatLngs()[0];
        if (onPolygonCreated) onPolygonCreated(coords);
      }
    });

    if (center) {
      map.setView(center, map.getZoom());
      setTimeout(() => map.invalidateSize(), 400);
    }

    return () => {
      map.pm.removeControls();
      map.off('pm:create');
    };
  }, [center, map, onPolygonCreated]);

  return null;
}

// --- 🌍 KOMPONEN UTAMA MAP ---
export default function Map({ tileUrl, center, onPolygonCreated, onMapClick }) {
  const { BaseLayer, Overlay } = LayersControl;

  return (
    <div className="h-full w-full relative group">
      <MapContainer 
        center={center || [-8.11, 115.09]} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <MapEvents onMapClick={onMapClick} />
        
        <SearchField />
        <ChangeView center={center} onPolygonCreated={onPolygonCreated} />
        <MouseCoordinates />
        
        {/* 📍 MARKER PENANDA LOKASI AKTIF */}
        {center && (
          <Marker position={center}>
            <Popup>
              <div className="text-[10px] font-bold">
                Titik Analisis:<br/>
                {center[0].toFixed(5)}, {center[1].toFixed(5)}
              </div>
            </Popup>
          </Marker>
        )}

        <ZoomControl position="bottomright" />

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
            <Overlay checked name="Hasil Analisis Spasial GEE">
              <TileLayer 
                key={tileUrl} 
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