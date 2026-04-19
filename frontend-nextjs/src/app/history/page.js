"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HistoryPage() {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/history');
      const data = await res.json();
      setHistories(data);
    } catch (err) {
      console.error("Gagal ambil history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const deleteHistory = async (id) => {
    if (!confirm("Yakin mau hapus riwayat ini?")) return;
    try {
      await fetch(`http://127.0.0.1:8000/api/history/${id}`, { method: 'DELETE' });
      fetchHistory();
    } catch (err) {
      alert("Gagal hapus");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-6xl mx-auto p-6 md:p-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-800">
            Analysis History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Riwayat analisis lokasi yang pernah dilakukan
          </p>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm animate-pulse">
            Memuat data...
          </div>
        ) : histories.length === 0 ? (
          
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-sm font-medium">
              Belum ada riwayat analisis
            </p>
          </div>

        ) : (

          /* Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {histories.map((item) => (
              
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >

                {/* HEADER */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {item.location_name}
                  </h3>

                  {/* META */}
                  <div className="mt-2 space-y-1 text-sm text-slate-500">
                    <p>
                      📍 {item.latitude}, {item.longitude}
                    </p>
                    <p>
                      🗓️ {formatDate(item.date_start)} — {formatDate(item.date_end)}
                    </p>
                  </div>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="bg-blue-50 rounded-xl p-3 text-sm">
                    <p className="text-slate-500">Temperature</p>
                    <p className="font-semibold text-slate-800">
                      🌡️ {item.temperature_avg}°C
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-3 text-sm">
                    <p className="text-slate-500">NDVI</p>
                    <p className="font-semibold text-slate-800">
                      🌿 {item.ndvi_avg}
                    </p>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2 mt-6">
                  <Link
                    href={`/dashboard?lat=${item.latitude}&lng=${item.longitude}&start=${new Date(item.date_start).toISOString().split('T')[0]}&end=${new Date(item.date_end).toISOString().split('T')[0]}&radius=5`}
                    className="flex-1 text-center px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition"
                  >
                    View Map
                  </Link>

                  <button
                    onClick={() => deleteHistory(item.id)}
                    className="px-4 py-2 text-sm font-medium text-rose-600 border border-slate-200 rounded-xl hover:bg-rose-50 transition"
                  >
                    Delete
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}