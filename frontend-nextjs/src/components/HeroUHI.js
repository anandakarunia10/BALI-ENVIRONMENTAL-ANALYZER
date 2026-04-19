import Image from 'next/image';
import Link from 'next/link';

export default function HeroUHI() {
  return (
    <section className="relative flex min-h-[calc(100vh-80px)] items-center px-10 bg-white overflow-hidden">
      
      {/* 1. Konten Teks Kiri */}
      <div className="w-full lg:w-1/2 pl-4 md:pl-16 z-10">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-50 border border-blue-100">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            UTS Workshop TRPL 4A
          </span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
          Bali Environmental <br /> 
          <span className="text-blue-600">Analyzer</span>
        </h1>
        
        <p className="text-slate-600 text-lg leading-relaxed mb-10 max-w-lg">
          Platform analisis spasial untuk memantau intensitas <b>Urban Heat Island</b> dan kerapatan vegetasi di Bali menggunakan data satelit Landsat 8.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Link 
            href="/dashboard" 
            className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-[0_10px_20px_rgba(37,99,235,0.3)] hover:bg-blue-700 hover:-translate-y-1 transition-all text-center uppercase tracking-wide"
          >
            Mulai Analisis
          </Link>
          
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800 tracking-tight">Gede Ananda Karunia Putra</span>
            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-tighter">Software Engineering - Undiksha</span>
          </div>
        </div>
      </div>

      {/* 2. Visual Kanan (Lingkaran Biru & Ilustrasi) */}
      <div className="hidden lg:flex w-1/2 relative h-full items-center justify-end">
        {/* Lingkaran Dekoratif */}
        <div className="absolute right-[-10%] w-[600px] h-[600px] bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
           {/* TIPS: Jika kamu punya foto profil atau ilustrasi satelit (PNG Transparan), 
             masukkan di sini. Jika belum, biarkan lingkaran ini memberikan kesan modern. 
           */}
           <div className="text-white opacity-20 text-[200px] font-black rotate-12">
             GEE
           </div>
        </div>
      </div>

      {/* Background Ornament (Opsional agar tidak terlalu sepi) */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-50 -z-10"></div>
    </section>
  );
}