import { NextResponse } from 'next/server';

export function middleware(request) {
  // Ambil token dari cookie
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Definisikan semua rute yang butuh login (TERMASUK ROOT /)
  const isProtectedRoute = 
    pathname === '/' || 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/history') || 
    pathname.startsWith('/map');

  // Logic: Jika tidak ada tiket dan mencoba masuk ke rute terproteksi
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Jika sudah login tapi iseng ke halaman Login, lempar balik ke Dashboard
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// DAFTAR MATCHER (Sudah Benar)
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*', 
    '/history/:path*', 
    '/map/:path*', 
    '/login'
  ],
};