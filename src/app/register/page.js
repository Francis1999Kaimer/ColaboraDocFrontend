// app/register/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { useAuth } from '../context/authcontext'; 

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
  const [lastnames, setLastnames] = useState(''); 
  const [password, setPassword] = useState('');
  

  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState(''); 

 
  const [validationErrors, setValidationErrors] = useState({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedbackMessage('');
    setFeedbackType('');
    setValidationErrors({}); 
    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080';
   
      await axios.post(`${apiUrl}/api/auth/register`, {
        email,
        names,    
        lastnames,  
        password,
      });
      setFeedbackMessage('Registro exitoso. Redirigiendo a inicio de sesión...');
      setFeedbackType('success');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      let genericErrorMessage = 'Error al registrar. Por favor, inténtalo de nuevo.';
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'string') {
    
          setFeedbackMessage(errorData);
        } else if (typeof errorData.message === 'string') {
     
          setFeedbackMessage(errorData.message);
        } else if (typeof errorData.error === 'string') {
        
            setFeedbackMessage(errorData.error);
        } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
    
          setValidationErrors(errorData);
          setFeedbackMessage('Por favor, corrige los errores indicados en el formulario.');
        } else {
          setFeedbackMessage(genericErrorMessage);
        }
      } else if (err.request) {
      
        setFeedbackMessage('No se pudo conectar al servidor. Verifica tu conexión a internet.');
      } else {
 
        setFeedbackMessage(genericErrorMessage);
      }
      setFeedbackType('error');
      console.error("Error en registro:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (!authLoading && user)) {
    return <Loader />;
  }

  return (
    <div className="flex h-full bg-white text-gray-900"> 
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">

            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Registrarse
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="names" className="block text-sm font-medium text-gray-700">Nombres</label>
              <input
                type="text" id="names" placeholder="Ingresa tus nombres"
                value={names} onChange={(e) => setNames(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${validationErrors.names ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                required disabled={isSubmitting}
              />
              {validationErrors.names && <p className="mt-1 text-xs text-red-600">{validationErrors.names}</p>}
            </div>
            <div>
              <label htmlFor="lastnames" className="block text-sm font-medium text-gray-700">Apellidos</label>
              <input
                type="text" id="lastnames" placeholder="Ingresa tus apellidos"
                value={lastnames} onChange={(e) => setLastnames(e.target.value)} 
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${validationErrors.lastnames ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                required disabled={isSubmitting}
              />
              {validationErrors.lastnames && <p className="mt-1 text-xs text-red-600">{validationErrors.lastnames}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo electrónico</label>
              <input
                type="email" id="email" placeholder="tu@correo.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${validationErrors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                required disabled={isSubmitting}
              />
              {validationErrors.email && <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                type="password" id="password" placeholder="Mínimo 8 caracteres"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${validationErrors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                required disabled={isSubmitting}
              />
              {validationErrors.password && <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>}
            </div>
            
            {feedbackMessage && !Object.keys(validationErrors).length && ( 
                <p className={`text-sm ${feedbackType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {feedbackMessage}
                </p>
            )}
             {feedbackMessage && Object.keys(validationErrors).length > 0 && ( 
                <p className={`text-sm text-red-600`}>
                {feedbackMessage}
                </p>
            )}


            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Registrarse'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
      <div className="hidden md:block md:w-1/2 bg-gray-50">
        <img
          src="/images/fondoRegistro.png"
          alt="Fondo decorativo de arquitectura o ingeniería"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}