"use client"; // Wajib ditambahkan paling atas untuk deteksi path

import { usePathname } from "next/navigation";
import NavbarUHI from "../components/NavbarUHI";
import "../styles/globals.css";

export default function RootLayout({ children }) {
  const pathname = usePathname();

  // Tentukan path mana saja yang tidak ingin menampilkan Navbar
  const hideNavbar = pathname === "/login";

  return (
    <html lang="en">
      <body className="antialiased">
        {/* Navbar hanya dirender jika bukan di halaman login */}
        {!hideNavbar && <NavbarUHI />}
        
        <main>{children}</main>
      </body>
    </html>
  );
}