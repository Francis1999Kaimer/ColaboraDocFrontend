
'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/authcontext';

const SidebarLoader = ({ text = "Cargando..." }) => (
  <div className="flex flex-col items-center justify-center p-6 text-gray-700">
    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
    <p className="text-xs">{text}</p>
  </div>
);

export default function MyInvitations() {
  const { user, loading: authLoading } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080';

  const fetchPendingInvitations = useCallback(async () => {
    if (!user || authLoading) {
        if (!authLoading && !user) setLoadingInvitations(false); 
        return;
    }
    setLoadingInvitations(true);
    setError('');
    try {
      const response = await axios.get(`${apiUrl}/api/projects/invitations/pending`, { withCredentials: true });
      setInvitations(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Error al cargar invitaciones.");
      console.error("Error fetching pending invitations:", err);
      setInvitations([]);
    } finally {
      setLoadingInvitations(false);
    }
  }, [user, authLoading, apiUrl]);

  useEffect(() => {
    fetchPendingInvitations();
  }, [fetchPendingInvitations]);

  const handleRespondToInvitation = async (projectUserId, accept) => {
    setActionInProgress(projectUserId);
    setError('');
    try {
      await axios.post(`${apiUrl}/api/projects/invitations/${projectUserId}/respond`, { accept }, { withCredentials: true });
      fetchPendingInvitations(); 

    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || `Error al responder a la invitación.`);
      console.error("Error responding to invitation:", err);
    } finally {
        setActionInProgress(null);
    }
  };

  if (authLoading) return <SidebarLoader text="Verificando usuario..." />; 
  if (!user) return <p className="text-center p-4 text-sm text-gray-500">Inicia sesión para ver tus invitaciones.</p>;
  if (loadingInvitations) return <SidebarLoader text="Cargando invitaciones..." />;

  return (
    <div className="p-3 md:p-4"> 

      {error && <p className="p-2 mb-3 text-xs text-red-700 bg-red-100 rounded-md">{error}</p>}
      
      {invitations.length === 0 && !loadingInvitations && (
        <div className="text-center text-gray-500 py-6 px-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No tienes invitaciones pendientes.</p>
        </div>
      )}

      {invitations.length > 0 && (
        <ul className="space-y-2.5">
          {invitations.map((inv) => (
            <li key={inv.id} className="p-2.5 border border-gray-200 rounded-md shadow-sm bg-white">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Proyecto: <span className="font-semibold text-blue-600">{inv.project?.name || 'N/D'}</span>
                </p>
                <p className="text-xs text-gray-600">
                  Rol: <span className="font-medium">{inv.roleCode}</span>
                </p>
              
                <p className="text-xs text-gray-500 mt-0.5">
                  Invitado por: {inv.invitedBy?.names || 'Sistema'} el {inv.invitationDate ? new Date(inv.invitationDate).toLocaleDateString() : ''}
                </p>
              </div>
              <div className="flex space-x-2 mt-2 justify-end">
                <button
                  onClick={() => handleRespondToInvitation(inv.id, true)}
                  disabled={actionInProgress === inv.id}
                  className="px-2.5 py-1 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600 disabled:opacity-60"
                >
                  {actionInProgress === inv.id && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-1"></div>}
                  Aceptar
                </button>
                <button
                  onClick={() => handleRespondToInvitation(inv.id, false)}
                  disabled={actionInProgress === inv.id}
                  className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-60"
                >
                   {actionInProgress === inv.id && <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin inline-block mr-1"></div>}
                  Rechazar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}