import NavbarUHI from "../components/NavbarUHI"; // Naik 1 level ke src, lalu masuk components
import "../styles/globals.css";               // Naik 1 level ke src, lalu masuk styles

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NavbarUHI /> 
        <main>{children}</main>
      </body>
    </html>
  );
}