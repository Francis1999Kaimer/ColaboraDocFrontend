// app/register/page.js (o donde tengas tu página de registro)
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { useAuth } from '../context/authcontext'; // Ajusta la ruta

const Loader = () => (
  <div className="flex min-h-screen items-center justify-center bg-white text-gray-900 p-4">
    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function Register() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [names, setNames] = useState('');
  const [lastnames, setLastNames] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080';
      await axios.post(`${apiUrl}/api/auth/register`, {
        email,
        lastnames,
        names,
        password,
      });
      setMensaje('Registro exitoso. Redirigiendo a inicio de sesión...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setMensaje(err.response?.data?.message || err.response?.data || 'Error al registrar');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (!authLoading && user)) {
    return <Loader />;
  }

  return (
    <div className="flex h-full bg-white text-gray-900">
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 ">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-6 text-center">Registrarse</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-1">Correo electrónico</label>
              <input
                type="email"
                id="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-gray-300 p-2 w-full rounded"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="names" className="block mb-1">Nombres</label>
              <input
                type="text"
                id="names"
                placeholder="Nombres"
                value={names}
                onChange={(e) => setNames(e.target.value)}
                className="border border-gray-300 p-2 w-full rounded"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="lastnames" className="block mb-1">Apellidos</label>
              <input
                type="text"
                id="lastnames"
                placeholder="Apellidos"
                value={lastnames}
                onChange={(e) => setLastNames(e.target.value)}
                className="border border-gray-300 p-2 w-full rounded"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="password" className="block mb-1">Contraseña</label>
              <input
                type="password"
                id="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-300 p-2 w-full rounded"
                required
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>

          {mensaje && <p className={`mt-4 text-center text-sm ${mensaje.startsWith('Registro exitoso') ? 'text-green-600' : 'text-red-600'}`}>{mensaje}</p>}

          <div className="mt-6 pt-6  text-center text-sm">
            <p>
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
      <div className="hidden md:block md:w-1/2">
        <img
          src="/images/fondoRegistro.png"
          alt="Imagen de registro"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}