"use client";

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation'; // Import hook untuk ambil data URL
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Import Map secara dinamis (Client-side only)
const Map = dynamic(() => import('../../components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-200 animate-pulse flex items-center justify-center font-bold text-slate-400">
      Memuat Peta Interaktif...
    </div>
  )
});

// Komponen Pembungkus Utama untuk menangani SearchParams
function DashboardContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState(null);
  const [prediction, setPrediction] = useState(null); // State Prediction Utuh
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  
  const [coords, setCoords] = useState({ lat: -8.134097, lng: 115.073296 });
  const [dates, setDates] = useState({ start: '2025-01-01', end: '2025-03-01' });
  const [radius, setRadius] = useState(2);
  const [polygonCoords, setPolygonCoords] = useState(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- LOGIKA AUTO-FILL DARI HISTORY ---
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const rad = searchParams.get('radius');

    if (lat && lng) {
      setCoords({ lat: lat, lng: lng });
      if (start) setDates(prev => ({ ...prev, start }));
      if (end) setDates(prev => ({ ...prev, end }));
      if (rad) setRadius(rad);
    }
  }, [searchParams]);

  // --- FUNGSI PREDIKSI AI (LINEAR REGRESSION) - UPDATE: POST REQUEST ---
  const handleGetPrediction = async (historyData) => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/predict-uhi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history_data: historyData }) // Mengirim history dari GEE ke Flask
      });
      const result = await res.json();
      if(result.status === "success") setPrediction(result);
    } catch (err) {
      console.error("Gagal memuat prediksi tren.");
    }
  };

  const handleMapClick = useCallback((latlng) => {
    setCoords({
      lat: latlng.lat.toFixed(6),
      lng: latlng.lng.toFixed(6)
    });
  }, []);

  const handleLocationFound = useCallback((latlng) => {
    setCoords({
      lat: latlng.lat.toFixed(6),
      lng: latlng.lng.toFixed(6)
    });
  }, []);

  const handlePolygonCreated = useCallback((leafletCoords) => {
    const formatted = leafletCoords.map(c => [c.lng, c.lat]);
    formatted.push(formatted[0]); 
    setPolygonCoords(formatted);
  }, []);

  const getStatusUHI = (temp) => {
    if (!temp) return { label: 'Menunggu...', desc: '', color: 'text-slate-400', bg: 'bg-white/40', border: 'border-white/60' };
    if (temp < 28) return { 
      label: 'Nyaman / Ideal', 
      desc: 'Suhu permukaan rendah, area cenderung sejuk dan sehat bagi penduduk.',
      color: 'text-blue-700', bg: 'bg-blue-500/10', border: 'border-blue-500/30' 
    };
    if (temp < 33) return { 
      label: 'Moderate Heat', 
      desc: 'Suhu cukup tinggi, berpotensi menyebabkan efek Urban Heat Island ringan.',
      color: 'text-orange-700', bg: 'bg-orange-500/10', border: 'border-orange-500/30' 
    };
    return { 
      label: 'Extreme Heat Stress', 
      desc: 'Suhu permukaan sangat tinggi, indikasi kuat anomali panas perkotaan yang ekstrem.',
      color: 'text-red-700', bg: 'bg-red-500/10', border: 'border-red-500/30' 
    };
  };

  const getStatusNDVI = (val) => {
    if (val === undefined || val === null) return { label: 'Menunggu...', desc: '', color: 'text-slate-400', bg: 'bg-white/40', border: 'border-white/60' };
    if (val > 0.5) return { 
      label: 'Vegetasi Rapat', 
      desc: 'Kerapatan vegetasi tinggi (hutan/taman luas), pendinginan alami bekerja baik.',
      color: 'text-green-700', bg: 'bg-green-500/10', border: 'border-green-500/30' 
    };
    if (val > 0.2) return { 
      label: 'Vegetasi Sedang', 
      desc: 'Area campuran bangunan dan tanaman, penyerapan panas sedang.',
      color: 'text-emerald-700', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' 
    };
    return { 
      label: 'Lahan Terbuka', 
      desc: 'Vegetasi minim, area didominasi tanah/bangunan yang menyerap panas.',
      color: 'text-rose-700', bg: 'bg-rose-500/10', border: 'border-rose-500/30' 
    };
  };

  const status = getStatusUHI(data?.results?.average_temp_celsius);
  const ndviStatus = getStatusNDVI(data?.results?.average_ndvi);

  const getAutoInsight = () => {
    if (!data) return null;
    const temp = data?.results?.average_temp_celsius;
    const ndvi = data?.results?.average_ndvi;

    if (temp >= 30 && ndvi <= 0.3) {
      return "Area ini memiliki suhu tinggi dengan vegetasi rendah, mengindikasikan potensi Urban Heat Island (UHI) akibat minimnya ruang hijau.";
    } else if (temp < 28 && ndvi > 0.4) {
      return "Area ini memiliki kondisi mikroklimat yang baik dengan vegetasi yang cukup untuk meredam panas permukaan.";
    } else {
      return "Area menunjukkan keseimbangan antara suhu permukaan dan tutupan lahan di sekitar lokasi.";
    }
  };

  const chartData = [
    { name: 'Threshold Sejuk', suhu: 25, fill: '#1565C0' }, 
    { name: 'Suhu Lokasi', suhu: data?.results?.average_temp_celsius || 0, fill: '#2563eb' }, 
    { name: 'Threshold Panas', suhu: 40, fill: '#ef4444' },
  ];

  // --- UPDATE: AUTO-TRIGGER PREDIKSI & DATA MINIMAL CHECK ---
  const handleAnalyze = async () => {
    setLoading(true);
    setPrediction(null); // Reset prediksi saat analisis baru dimulai
    try {
      let url = `http://127.0.0.1:8000/api/uhi-analysis?date_start=${dates.start}&date_end=${dates.end}`;
      if (polygonCoords) {
        url += `&polygon=${encodeURIComponent(JSON.stringify(polygonCoords))}`;
      } else {
        url += `&lat=${coords.lat}&lng=${coords.lng}&radius=${radius}`;
      }
      const res = await fetch(url);
      const result = await res.json();
      if (result.status === "success") {
        setData(result);
        
        // AUTO-TRIGGER: Jalankan prediksi jika history tersedia dan minimal 3 titik data
        if (result.results.history && result.results.history.length >= 3) {
           handleGetPrediction(result.results.history);
        }
      } else {
        alert("Gagal: " + (result.message || "Kesalahan internal"));
      }
    } catch (err) {
      alert("Koneksi Gagal: Pastikan API Flask/Laravel sudah running di Port 8000");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHistory = async () => {
    if (!data) return alert("Analisis data dulu!");
    try {
      const res = await fetch('http://127.0.0.1:8000/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_name: `Analisis ${new Date().toLocaleDateString('id-ID')}`,
          latitude: coords.lat,
          longitude: coords.lng,
          temperature_avg: data?.results?.average_temp_celsius,
          ndvi_avg: data?.results?.average_ndvi,
          date_start: dates.start,
          date_end: dates.end,
          history_data: data?.results?.history || []
        })
      });
      const result = await res.json();
      if (result.status === 'success') alert("✅ Data berhasil disimpan ke History!");
    } catch (err) {
      alert("❌ Gagal menyimpan ke Database Laravel!");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] bg-slate-100 overflow-hidden relative text-slate-900 font-sans">
      
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`absolute z-[100] top-5 left-5 p-3 rounded-xl bg-blue-600 text-white shadow-2xl transition-all duration-500 active:scale-95 ${isSidebarOpen ? 'md:left-[420px]' : 'left-5'}`}
      >
        {isSidebarOpen ? '↩️' : '↪️'}
      </button>

      <aside className={`h-full z-20 overflow-y-auto scrollbar-none transition-all duration-500 ease-in-out
        ${isSidebarOpen ? 'w-full md:w-[400px] translate-x-0' : 'w-0 -translate-x-full'}
        bg-white/60 backdrop-blur-xl border-r border-white/40 shadow-2xl flex flex-col gap-6`}>
        
        <div className={`p-6 flex flex-col gap-6 transition-opacity duration-300 ${!isSidebarOpen ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
            <div>
              <h2 className="text-slate-900 font-black text-xl tracking-tighter uppercase leading-none">Parameter</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Satellite Input Data</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`p-4 rounded-2xl border backdrop-blur-md transition-all duration-500 ${polygonCoords ? 'bg-blue-600/10 border-blue-600/30 text-blue-700 shadow-inner' : 'bg-white/40 border-white/80 text-slate-500 shadow-sm'}`}>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${polygonCoords ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`}></span>
                  {polygonCoords ? 'Mode: Custom Polygon' : 'Mode: Point Radius'}
                </div>
                {polygonCoords && <button onClick={() => setPolygonCoords(null)} className="bg-white/90 px-3 py-1 rounded-lg border border-blue-200 hover:bg-white text-blue-600 font-black">RESET</button>}
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-4 transition-all duration-300 ${polygonCoords ? 'opacity-20 scale-95' : 'opacity-100'}`}>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Latitude</label>
                <input type="number" step="any" value={coords.lat} onChange={(e) => setCoords({...coords, lat: e.target.value})} className="bg-white/40 backdrop-blur-sm border border-white/80 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Longitude</label>
                <input type="number" step="any" value={coords.lng} onChange={(e) => setCoords({...coords, lng: e.target.value})} className="bg-white/40 backdrop-blur-sm border border-white/80 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
            </div>

            <div className={`flex flex-col gap-2 transition-all ${polygonCoords ? 'opacity-20' : 'opacity-100'}`}>
              <label className="text-[10px] font-black text-slate-600 uppercase flex justify-between px-1">
                Radius <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md text-[9px]">{radius} KM</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="10" // <--- GANTI ANGKA INI (Saran: 10 biar pas di layar)
                step="0.5" 
                value={radius} 
                onChange={(e) => setRadius(e.target.value)} 
                className="w-full h-1.5 bg-slate-300/50 rounded-lg accent-blue-600 cursor-pointer" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input type="date" value={dates.start} onChange={(e) => setDates({...dates, start: e.target.value})} className="bg-white/40 border border-white/80 rounded-2xl p-3 text-[11px] font-bold text-slate-700 outline-none" />
              <input type="date" value={dates.end} onChange={(e) => setDates({...dates, end: e.target.value})} className="bg-white/40 border border-white/80 rounded-2xl p-3 text-[11px] font-bold text-slate-700 outline-none" />
            </div>

            <button onClick={handleAnalyze} disabled={loading} className={`w-full py-4 rounded-2xl font-black text-sm text-white shadow-xl transition-all ${loading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {loading ? '⌛ PROCESSING GEE...' : '🚀 EXECUTE ANALYSIS'}
            </button>
          </div>

          {isMounted && data && (
            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-10">
              
              {/* HASIL LST */}
              <div className={`${status.bg} backdrop-blur-md p-5 border ${status.border} rounded-[2rem] shadow-sm relative overflow-hidden group`}>
                <div className="absolute -right-2 -top-2 w-16 h-16 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
                <label className={`text-[10px] uppercase font-black tracking-tighter ${status.color}`}>Thermal Intensity (LST)</label>
                <div className="text-4xl font-black text-slate-900 mt-1">{data?.results?.average_temp_celsius}°C</div>
                <div className={`mt-3 inline-block px-3 py-1 rounded-full text-[10px] font-black border bg-white/60 shadow-sm ${status.color}`}>{status.label}</div>
                <p className="mt-2 text-[10px] text-slate-600 font-medium leading-relaxed italic border-t border-black/5 pt-2">
                   → {status.desc}
                </p>
              </div>

              {/* HASIL NDVI */}
              <div className={`${ndviStatus.bg} backdrop-blur-md p-5 border ${ndviStatus.border} rounded-[2rem] shadow-sm relative overflow-hidden group`}>
                <div className="absolute -right-2 -top-2 w-16 h-16 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
                <label className={`text-[10px] uppercase font-black tracking-tighter ${ndviStatus.color}`}>Vegetation Index (NDVI)</label>
                <div className="text-4xl font-black text-slate-900 mt-1">{data?.results?.average_ndvi}</div>
                <div className={`mt-3 inline-block px-3 py-1 rounded-full text-[10px] font-black border bg-white/60 shadow-sm ${ndviStatus.color}`}>{ndviStatus.label}</div>
                <p className="mt-2 text-[10px] text-slate-600 font-medium leading-relaxed italic border-t border-black/5 pt-2">
                   → {ndviStatus.desc}
                </p>
              </div>

              {/* INSIGHT OTOMATIS */}
              <div className="bg-blue-600/10 border border-blue-600/20 p-5 rounded-[2rem] shadow-sm">
                <label className="text-[10px] uppercase font-black text-blue-700 tracking-widest block mb-2">Automated Insight</label>
                <p className="text-[11px] font-bold text-slate-800 leading-relaxed italic">
                  "{getAutoInsight()}"
                </p>
              </div>

              {/* --- UI PREDICTION (LINEAR REGRESSION) --- */}
              {prediction && prediction.status === "success" && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-[2rem] shadow-sm animate-in zoom-in duration-500">
                   <div className="flex justify-between items-center mb-3">
                      <label className="text-[10px] uppercase font-black text-amber-700 tracking-widest">AI Trend Forecast</label>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black text-white ${prediction.trend === 'naik' ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                        {prediction.trend.toUpperCase()}
                      </span>
                   </div>
                   <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">{prediction.predicted_next}°C</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Next Period Est.</span>
                   </div>
                   <p className="mt-3 text-[10px] text-slate-600 leading-relaxed font-medium">
                     Berdasarkan tren deret waktu di titik ini, suhu diprediksi akan cenderung <b>{prediction.trend}</b> dengan koefisien regresi {prediction.coefficient.toFixed(4)}.
                   </p>
                </div>
              )}

              <button 
                onClick={handleSaveHistory}
                className="w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-blue-600 bg-white/40 border border-blue-600/30 hover:bg-blue-600 hover:text-white transition-all shadow-lg backdrop-blur-md active:scale-95"
              >
                📌 Save Result to History
              </button>

              <div className="bg-white/40 backdrop-blur-md border border-white/80 rounded-[2rem] p-6 shadow-sm">
                <label className="text-[10px] uppercase font-black text-slate-400 block mb-6 text-center tracking-[0.2em]">Thermal Distribution</label>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="name" hide />
                      <Tooltip contentStyle={{borderRadius: '15px', border: 'none', fontWeight: 'bold'}} />
                      <Bar dataKey="suhu" radius={[8, 8, 8, 8]} barSize={40}>
                        {chartData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-blue-600/5 backdrop-blur-sm p-4 rounded-2xl border border-blue-600/10 text-[10px] space-y-2 uppercase font-black text-slate-500">
                 <div className="flex justify-between"><span>Acquisition:</span> <b className="text-blue-600">{data?.results?.acquisition_date || '-'}</b></div>
                 <div className="flex justify-between"><span>Cloud Cover:</span> <b className="text-green-600">{data?.results?.cloud_cover}%</b></div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 absolute inset-0 z-10 md:relative">
        <Map 
          tileUrl={data?.results?.tile_url} 
          center={[parseFloat(coords.lat), parseFloat(coords.lng)]} 
          radius={radius} // Pastikan ini ada agar lingkaran biru muncul
          onPolygonCreated={handlePolygonCreated} 
          onMapClick={handleMapClick}
          onLocationFound={handleLocationFound} // Tambahkan ini agar tidak error "undefined"
        />
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}