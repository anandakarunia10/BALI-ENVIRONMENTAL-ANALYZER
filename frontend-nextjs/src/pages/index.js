import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Import Map secara dinamis untuk mencegah error "window is not defined"
const Map = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-200 animate-pulse flex items-center justify-center font-bold text-slate-400">
      Memuat Peta Interaktif...
    </div>
  )
});

const Home = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // State Koordinat Titik & Radius
  const [coords, setCoords] = useState({ lat: -8.134097, lng: 115.073296 });
  const [dates, setDates] = useState({ start: '2025-01-01', end: '2025-03-01' });
  const [radius, setRadius] = useState(5);

  // ✅ STATE POLIGON
  const [polygonCoords, setPolygonCoords] = useState(null);

  // Fungsi Klasifikasi Status (Helper)
  const getStatusUHI = (temp) => {
    if (!temp) return { label: 'Menunggu...', color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200' };
    if (temp < 28) return { label: 'Sejuk / Normal', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-500' };
    if (temp < 33) return { label: 'Waspada / Hangat', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-500' };
    return { label: 'Panas Ekstrem', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-500' };
  };

  const getStatusNDVI = (val) => {
    if (val === undefined || val === null) return { label: 'Menunggu...', color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200' };
    if (val > 0.5) return { label: 'Vegetasi Lebat', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-600' };
    if (val > 0.2) return { label: 'Vegetasi Sedang', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-500' };
    return { label: 'Lahan Terbuka', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-500' };
  };

  const status = getStatusUHI(data?.results?.average_temp_celsius);
  const ndviStatus = getStatusNDVI(data?.results?.average_ndvi);

  const chartData = [
    { name: 'Sejuk', suhu: 25, fill: '#1565C0' }, 
    { name: 'Lokasi', suhu: data?.results?.average_temp_celsius || 0, fill: '#2E7D32' }, 
    { name: 'Ekstrem', suhu: 40, fill: '#ef4444' },
  ];

  // ✅ FIX: Gunakan useCallback agar Map tidak re-render terus menerus
  const handlePolygonCreated = useCallback((leafletCoords) => {
    const formatted = leafletCoords.map(c => [c.lng, c.lat]);
    formatted.push(formatted[0]); // Tutup poligon
    setPolygonCoords(formatted);
    console.log("📍 Poligon Disinkronkan:", formatted);
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      // ✅ SINKRONISASI: Pastikan Port 8000 sesuai dengan Flask
      let url = `http://127.0.0.1:8000/api/uhi-analysis?date_start=${dates.start}&date_end=${dates.end}`;
      
      if (polygonCoords) {
        // Gunakan encodeURIComponent agar karakter [ ] tidak merusak URL
        url += `&polygon=${encodeURIComponent(JSON.stringify(polygonCoords))}`;
      } else {
        url += `&lat=${coords.lat}&lng=${coords.lng}&radius=${radius}`;
      }

      const res = await fetch(url);
      const result = await res.json();
      
      if (result.status === "success") {
        setData(result);
      } else {
        alert("Gagal: " + (result.message || "Kesalahan internal"));
      }
    } catch (err) {
      alert("Koneksi Gagal: Pastikan API Flask sudah running di Port 8000");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-slate-50 text-slate-900 overflow-hidden">
      <Head>
        <title>EcoMonitor | Nanda Putra</title>
      </Head>

      <header className="bg-[#2E7D32] text-white p-3 md:p-4 flex justify-between items-center shadow-lg z-20 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-[#1565C0] p-1.5 md:p-2 rounded-lg text-lg md:text-xl shadow-inner">🌍</div>
          <div>
            <h1 className="text-sm md:text-lg font-bold leading-none tracking-tight">BALI ENVIRONMENTAL ANALYZER</h1>
            <p className="text-[8px] md:text-[10px] text-green-100 font-medium tracking-widest uppercase mt-0.5">Spatial Decision Support System</p>
          </div>
        </div>
        <div className="text-right text-[9px] md:text-[11px] font-medium opacity-90 border-l border-green-600 pl-2 md:pl-4">
          Nanda Putra<br/>
          <span className="text-[8px] md:text-[10px] text-green-200 uppercase font-black">TRPL 4A</span>
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        
        <aside className="w-full md:w-96 bg-white p-4 md:p-6 border-b md:border-b-0 md:border-r flex flex-col shadow-sm z-10 overflow-y-auto max-h-[50vh] md:max-h-none shrink-0">
          <div className="flex items-center gap-2 mb-1">
             <div className="w-1.5 h-6 bg-[#1565C0] rounded-full"></div>
             <h2 className="text-slate-800 font-black text-lg md:text-xl tracking-tight uppercase">Dashboard</h2>
          </div>
          
          <div className="space-y-4 md:space-y-5 my-4 md:my-6">
            {/* INDIKATOR MODE AKTIF */}
            <div className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center justify-between ${polygonCoords ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
               <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${polygonCoords ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  {polygonCoords ? 'Mode: Custom Polygon' : 'Mode: Point & Radius'}
               </div>
               {polygonCoords && (
                 <button onClick={() => setPolygonCoords(null)} className="text-[8px] bg-white px-2 py-0.5 rounded border border-blue-300 hover:bg-blue-100 transition-colors">RESET</button>
               )}
            </div>

            {/* INPUT KOORDINAT */}
            <div className={`grid grid-cols-2 gap-3 transition-opacity ${polygonCoords ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-500 uppercase">Latitude</label>
                <input 
                  type="number" step="any"
                  value={coords.lat}
                  onChange={(e) => setCoords({...coords, lat: e.target.value})}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2 md:p-3 text-[11px] font-bold outline-none focus:ring-2 focus:ring-[#1565C0]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-500 uppercase">Longitude</label>
                <input 
                  type="number" step="any"
                  value={coords.lng}
                  onChange={(e) => setCoords({...coords, lng: e.target.value})}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2 md:p-3 text-[11px] font-bold outline-none focus:ring-2 focus:ring-[#1565C0]"
                />
              </div>
            </div>

            {/* SLIDER RADIUS */}
            <div className={`flex flex-col gap-1.5 transition-opacity ${polygonCoords ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase flex justify-between items-center">
                Radius Analisis <span className="bg-slate-100 px-2 py-0.5 rounded text-[#2E7D32] font-black">{radius} KM</span>
              </label>
              <input 
                type="range" min="1" max="20" step="1"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer accent-[#2E7D32]"
              />
            </div>

            {/* INPUT TANGGAL */}
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="date" value={dates.start}
                onChange={(e) => setDates({...dates, start: e.target.value})}
                className="bg-slate-50 border border-slate-200 rounded-xl p-2 md:p-3 text-[10px] font-bold text-slate-600"
              />
              <input 
                type="date" value={dates.end}
                onChange={(e) => setDates({...dates, end: e.target.value})}
                className="bg-slate-50 border border-slate-200 rounded-xl p-2 md:p-3 text-[10px] font-bold text-slate-600"
              />
            </div>
          </div>

          <button 
            onClick={handleAnalyze} disabled={loading}
            className={`w-full py-4 rounded-2xl font-black text-xs md:text-sm text-white shadow-lg transform active:scale-95 transition-all ${
              loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#2E7D32] hover:bg-[#1B5E20]'
            }`}
          >
            {loading ? '⌛ Menganalisis Area...' : '🚀 Mulai Analisis Spasial'}
          </button>

          {data && (
            <div className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
                <div className={`${status.bg} p-4 border-l-4 ${status.border} rounded-r-xl shadow-sm`}>
                  <div className="flex justify-between items-start mb-1">
                    <label className={`text-[9px] uppercase font-black ${status.color}`}>Average Temp (LST)</label>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${status.border} bg-white/80`}>{status.label}</span>
                  </div>
                  <div className="text-3xl font-black text-slate-800">{data?.results?.average_temp_celsius || 'N/A'}°C</div>
                </div>

                <div className={`${ndviStatus.bg} p-4 border-l-4 ${ndviStatus.border} rounded-r-xl shadow-sm`}>
                  <div className="flex justify-between items-start mb-1">
                    <label className={`text-[9px] uppercase font-black ${ndviStatus.color}`}>Veg. Index (NDVI)</label>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${ndviStatus.border} bg-white/80`}>{ndviStatus.label}</span>
                  </div>
                  <div className="text-3xl font-black text-slate-800">{data?.results?.average_ndvi || '0'}</div>
                </div>
              </div>
              
              {/* CHART KOMPARASI */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <label className="text-[9px] uppercase font-black text-slate-400 tracking-widest block mb-4 text-center">Komparasi Ambang Batas</label>
                <div className="h-32 md:h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800}} />
                      <YAxis hide domain={[0, 50]} />
                      <Tooltip contentStyle={{fontSize: '10px', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="suhu" radius={[6, 6, 0, 0]} barSize={30}>
                        {chartData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* METADATA CITRA */}
              <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200 text-[9px] space-y-2 uppercase font-bold text-slate-500">
                <div className="flex justify-between"><span>📅 Landsat 8 Date:</span> <b className="text-blue-600">{data?.results?.acquisition_date || '-'}</b></div>
                <div className="flex justify-between"><span>☁️ Cloud Cover:</span> <b className="text-green-600">{data?.results?.cloud_cover || '-'}</b></div>
              </div>
            </div>
          )}
        </aside>

        {/* MAP SECTION */}
        <main className="flex-1 relative bg-slate-100 h-full min-h-[400px]">
          <Map 
            tileUrl={data?.results?.tile_url} 
            center={[parseFloat(coords.lat), parseFloat(coords.lng)]} 
            onPolygonCreated={handlePolygonCreated} 
          />
        </main>
      </div>
    </div>
  );
};

export default Home;