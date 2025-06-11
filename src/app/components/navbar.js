
"use client";

import { useState } from 'react';
import { useAuth } from '../context/authcontext'; 
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();
  const pathname = usePathname(); 

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const showLoginButton = !user && pathname !== '/login';
  const showRegisterButton = !user && pathname !== '/register';
  const isDashboardPage = pathname === '/dashboard'; 

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/#precios", label: "Precios" },
    { href: "/#prueba", label: "Solicitar prueba" },
  ];

  if (loading) {
    return (
      <nav className="flex items-center justify-between px-6 py-4 shadow-md bg-gray-100 text-black">
        <Link href="/" className="flex items-center space-x-2">
          <img src="/icons/casco.png" alt="Logo" className="h-8 w-8" />
          <span className="text-xl font-semibold">ColaboraDoc</span>
        </Link>
        <div className="h-8 w-24 bg-gray-300 rounded animate-pulse"></div>
      </nav>
    );
  }

  return (
    <>
      <nav className="flex items-center justify-between px-6 py-4 shadow-md bg-gray-100 text-black">
        <Link href="/" className="flex items-center space-x-2">
          <img src="/icons/casco.png" alt="Logo" className="h-8 w-8" />
          <span className="text-xl font-semibold">ColaboraDoc</span>
        </Link>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex space-x-6 items-center">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="hover:text-blue-600">
                {link.label}
              </Link>
            ))}
            {user && !isDashboardPage && (
              <Link href="/dashboard" className="hover:text-blue-600">
                Dashboard
              </Link>
            )}
            {!user && showRegisterButton && (
              <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                Registrarse
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <button
                onClick={async () => {
                  await logout();
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Cerrar Sesión
              </button>
            ) : (
              showLoginButton && (
                <Link
                  href="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  Ingresar
                </Link>
              )
            )}
          </div>

          <button
            className="md:hidden focus:outline-none"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="md:hidden bg-gray-100 shadow-lg">
          <div className="text-black flex flex-col space-y-2 px-6 py-4">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="hover:text-blue-600 py-2" onClick={closeMenu}>
                {link.label}
              </Link>
            ))}
  
            {user && !isDashboardPage && (
               <Link href="/dashboard" className="hover:text-blue-600 py-2" onClick={closeMenu}>
                 Dashboard
               </Link>
            )}
            {!user && showRegisterButton && (
              <Link href="/register" className="hover:text-blue-600 py-2" onClick={closeMenu}>
                Registrarse
              </Link>
            )}
            
            {user ? (
              <button
                onClick={async () => {
                  await logout();
                  closeMenu();
                }}
                className="w-full mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-center"
              >
                Cerrar Sesión
              </button>
            ) : (
              showLoginButton && (
                <Link
                  href="/login"
                  className="w-full mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-center"
                  onClick={closeMenu}
                >
                  Ingresar
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
}