// layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from './components/navbar.js';
import Footer from './components/footer';
import { AuthProvider } from "./context/authcontext"; // Asegúrate que la ruta sea correcta

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ColaboraDoc",
  description: "Gestión documentaria para proyectos de construcción",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen flex flex-col`}>
        <AuthProvider> {/* Envolver con AuthProvider */}
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}