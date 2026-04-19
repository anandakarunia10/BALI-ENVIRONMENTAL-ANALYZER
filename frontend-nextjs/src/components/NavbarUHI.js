"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react'; // Tambahkan useState & useEffect
import Cookies from 'js-cookie'; // Import Cookies untuk logic logout

export default function NavbarUHI() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Cek status login saat navbar dimuat
  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    Cookies.remove('token'); // Hapus tiket
    localStorage.removeItem('user'); // Hapus data user
    window.location.href = '/login'; // Tendang balik ke login
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Map', href: '/dashboard' },
    { name: 'History', href: '/history' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="w-full px-6 md:px-10 h-20 flex items-center justify-between">
        
        {/* Logo & Brand - Mentok Kiri */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tighter uppercase">
            BALI<span className="text-blue-600">ENV</span>
          </span>
        </div>

        {/* Navigation Links - Center-Right */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-bold tracking-wide transition-all hover:text-blue-600 ${
                pathname === link.href ? 'text-blue-600' : 'text-slate-500'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Action Buttons - Mentok Kanan (LOGIC UPDATED) */}
        <div className="flex items-center gap-4">
          {!isLoggedIn ? (
            <>
              <Link href="/login" className="hidden sm:block text-sm font-bold text-slate-600 hover:text-slate-900 px-4 py-2">
                Sign In
              </Link>
              <Link
                href="/login"
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-black rounded-xl shadow-md shadow-blue-100 hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95"
              >
                Get Started
              </Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="px-6 py-2.5 bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-widest rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-sm"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}