"use client";

import React, { useState } from 'react';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.status === 'success') {
        // --- PROSES SIMPAN TIKET DI COOKIE ---
        // expires: 1 artinya tiket berlaku 1 hari
        Cookies.set('token', data.access_token, { expires: 1, path: '/' });
        
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect ke Dashboard
        window.location.href = '/dashboard';
      } else {
        alert(data.message || "Email/Password salah!");
      }
    } catch (err) {
      alert("Gagal konek ke Laravel. Cek artisan serve!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/40 w-full max-w-md">
        <h1 className="text-3xl font-black text-slate-900 uppercase text-center mb-8 tracking-tighter">BaliEnv Login</h1>
        
        <div className="space-y-4">
          <input 
            type="email" placeholder="Email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/40 border border-white/80 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input 
            type="password" placeholder="Password" required
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/40 border border-white/80 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button 
            type="submit" disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl active:scale-95 disabled:bg-slate-400"
          >
            {loading ? 'AUTHENTICATING...' : 'LOGIN'}
          </button>
        </div>
      </form>
    </div>
  );
}