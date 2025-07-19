'use client';
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const UserCircleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const TrashIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const ArrowUturnLeftIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
  </svg>
);

const Loader = ({ text }) => (
  <div className="flex items-center justify-center p-4 text-gray-900"> 
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
      <p className="text-sm">{text}</p>
    </div>
  </div>
);

const DeletedUserCard = ({ deletedUser, onRestore }) => {
  const user = deletedUser.user;
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    const confirmMessage = `¿Estás seguro de que quieres restaurar a ${user.names} ${user.lastnames}?\n\nEl usuario volverá a tener acceso al proyecto con su rol anterior.`;
    
    if (window.confirm(confirmMessage)) {
      setIsRestoring(true);
      try {
        await onRestore(deletedUser);
      } finally {
        setIsRestoring(false);
      }
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'ADMIN': return 'text-red-600 bg-red-100';
      case 'EDITOR': return 'text-blue-600 bg-blue-100';
      case 'VIEWER': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleDisplayName = (role) => {
    switch(role) {
      case 'ADMIN': return 'Administrador';
      case 'EDITOR': return 'Editor';
      case 'VIEWER': return 'Visualizador';
      default: return role;
    }
  };

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserCircleIcon className="text-red-400 h-10 w-10" />
          <div>
            <h4 className="font-semibold text-gray-800">{user.names} {user.lastnames}</h4>
            <p className="text-sm text-gray-500">Email: {user.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm font-medium text-gray-600">Rol anterior:</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(deletedUser.roleCode)}`}>
                {getRoleDisplayName(deletedUser.roleCode)}
              </span>
            </div>
            {deletedUser.deletedAt && (
              <p className="text-xs text-red-600 mt-1">
                Eliminado: {new Date(deletedUser.deletedAt).toLocaleString('es-ES')}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col space-y-1">
          <button
            onClick={handleRestore}
            disabled={isRestoring}
            className="px-3 py-1 text-xs text-green-600 border border-green-600 rounded-md hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Restaurar usuario al proyecto"
          >
            {isRestoring ? (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Restaurando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <ArrowUturnLeftIcon className="w-3 h-3" />
                <span>Restaurar</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function DeletedUsersView({ projectId, canManageUsers, onClose }) {
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const apiUrl = 'https://localhost:8080';

  const fetchDeletedUsers = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${apiUrl}/api/projects/${projectId}/users/deleted`, { withCredentials: true });
      
      if (Array.isArray(response.data)) {
        setDeletedUsers(response.data);
      } else {
        setDeletedUsers([]);
        setError("Los datos recibidos no tienen el formato esperado.");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Error al cargar usuarios eliminados.";
      setError(errorMessage);
      setDeletedUsers([]);
      console.error("Error fetching deleted users:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, apiUrl]);

  const handleRestoreUser = async (deletedUser) => {
    try {
      await axios.post(
        `${apiUrl}/api/projects/${projectId}/users/${deletedUser.user.iduser}/restore`,
        {},
        { withCredentials: true }
      );

      
      setDeletedUsers(prevUsers => 
        prevUsers.filter(user => user.user.iduser !== deletedUser.user.iduser)
      );

      alert(`✅ Usuario restaurado exitosamente.\n${deletedUser.user.names} ${deletedUser.user.lastnames} ha sido restaurado al proyecto con su rol anterior.`);
      
    } catch (err) {
      console.error("Error restoring user:", err);
      let errorMessage = "Error al restaurar el usuario al proyecto.";
      
      if (err.response?.status === 403) {
        errorMessage = "No tienes permisos para restaurar usuarios en este proyecto.";
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.message || err.response?.data || "Solicitud inválida.";
      } else if (err.response?.status === 404) {
        errorMessage = "Usuario o proyecto no encontrado.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data) {
        errorMessage = typeof err.response.data === 'string' ? err.response.data : "Error en el servidor.";
      }
      
      alert(`❌ Error: ${errorMessage}`);
      
      
      fetchDeletedUsers();
    }
  };

  useEffect(() => {
    fetchDeletedUsers();
  }, [fetchDeletedUsers]);

  const filteredDeletedUsers = deletedUsers.filter(deletedUser =>
    deletedUser.user.names.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deletedUser.user.lastnames.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deletedUser.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Loader text="Cargando usuarios eliminados..." />;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrashIcon className="h-6 w-6 text-red-600" />
            <h3 className="text-xl font-semibold text-gray-900">Usuarios Eliminados del Proyecto</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {!canManageUsers && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Solo los administradores pueden gestionar usuarios eliminados.
              </p>
            </div>
          )}

          {deletedUsers.length > 0 && (
            <div className="mb-4">
              <input
                type="search"
                placeholder="Buscar usuarios eliminados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              />
            </div>
          )}

          {error && (
            <div className="p-3 mb-4 text-sm text-red-800 bg-red-100 rounded-md">
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          {!error && filteredDeletedUsers.length === 0 && (
            <div className="text-center py-8">
              <UserCircleIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">
                {deletedUsers.length === 0 
                  ? "No hay usuarios eliminados en este proyecto."
                  : "No se encontraron usuarios que coincidan con la búsqueda."
                }
              </p>
            </div>
          )}

          {!error && filteredDeletedUsers.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Se encontraron {filteredDeletedUsers.length} usuario(s) eliminado(s)
                {searchTerm && ` que coinciden con "${searchTerm}"`}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDeletedUsers.map((deletedUser) => (
                  <DeletedUserCard
                    key={deletedUser.user.iduser}
                    deletedUser={deletedUser}
                    onRestore={canManageUsers ? handleRestoreUser : null}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
