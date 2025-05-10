// app/login/page.js (o donde tengas tu página de login)
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { useAuth } from '../context/authcontext'; // Ajusta la ruta

const Loader = () => ( // Puedes mover este Loader a un componente reutilizable
  <div className="flex min-h-screen items-center justify-center bg-white text-gray-900 p-4">
    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function Login() {
  const router = useRouter();
  const { user, login: authLogin, loading: authLoading, checkUserLoggedIn } = useAuth(); // Renombrar login a authLogin
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Si el usuario ya está logueado y no estamos en proceso de carga inicial del auth, redirigir
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
      const res = await axios.post(`${apiUrl}/api/auth/login`, {
        email,
        password,
      }, {
        withCredentials: true
      });
  
      console.log('Respuesta del servidor:', res.data);
      authLogin(res.data); // Usar la función login del AuthContext
      // No es necesario guardar en localStorage aquí, AuthContext lo hace
      router.push('/dashboard');
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setMensaje(err.response?.data?.message || err.response?.data || 'Error al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (!authLoading && user)) { // Muestra loader si está cargando auth o si hay usuario (esperando redirect)
    return <Loader />;
  }

  return (
    <div className="flex h-full bg-white text-gray-900">
      {/* Formulario a la izquierda */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-6 text-center">Iniciar Sesión</h2>

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
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {mensaje && <p className="mt-4 text-center text-sm text-red-600">{mensaje}</p>}

          <div className="mt-6 pt-6 text-center text-sm">
            <p>
              ¿No tienes una cuenta?{' '}
              <Link href="/register" className="text-blue-600 hover:underline">
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Imagen a la derecha */}
      <div className="hidden md:block md:w-1/2">
        <img
          src="/images/fondoRegistro.png"
          alt="Imagen de login"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}