'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function InviteUserModal({ isOpen, onClose, projectId, onUserInvited }) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [roleCode, setRoleCode] = useState('VIEWER'); 
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080';

  const fetchAllUsers = useCallback(async () => {
    if (!isOpen) return; 
    setLoadingUsers(true);
    setError('');
    try {
      const response = await axios.get(`${apiUrl}/api/users/summary`, { withCredentials: true });
      setUsers(response.data || []);
    } catch (err) {
      console.error("Error fetching all users:", err);
      setError("No se pudo cargar la lista de usuarios.");
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [isOpen, apiUrl]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !roleCode.trim()) {
      setError("Debe seleccionar un usuario y un rol.");
      return;
    }
    if (!projectId) {
        setError("ID de proyecto no proporcionado.");
        return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const payload = { projectId, userId: parseInt(selectedUserId), roleCode };
      const response = await axios.post(`${apiUrl}/api/projects/invite`, payload, { withCredentials: true });
      onUserInvited(response.data);
      setSelectedUserId('');
      setRoleCode('VIEWER');
      setUserSearchTerm('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Error al invitar al usuario.");
      console.error("Error inviting user:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(user =>
    user.names.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.lastnames.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h3 className="text-xl font-semibold mb-4">Invitar Usuario al Proyecto</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar Usuario (Nombre, Apellido o Email)
            </label>
            <input
              type="text"
              id="userSearch"
              placeholder="Escribe para buscar..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
              disabled={loadingUsers || isSubmitting}
            />
            <label htmlFor="selectUser" className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Usuario <span className="text-red-500">*</span>
            </label>
            {loadingUsers ? <p className="text-sm text-gray-500">Cargando usuarios...</p> : (
              <select
                id="selectUser"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                required
                disabled={isSubmitting}
              >
                <option value="" disabled>-- Selecciona un usuario --</option>
                {filteredUsers.map(user => (
                  <option key={user.iduser} value={user.iduser}>
                    {user.names} {user.lastnames} ({user.email})
                  </option>
                ))}
                {filteredUsers.length === 0 && users.length > 0 && <option disabled>No hay coincidencias</option>}
                {users.length === 0 && !loadingUsers && <option disabled>No hay usuarios para mostrar</option>}
              </select>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="userRole" className="block text-sm font-medium text-gray-700 mb-1">
              Asignar Rol <span className="text-red-500">*</span>
            </label>
            <select id="userRole" value={roleCode} onChange={(e) => setRoleCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white" disabled={isSubmitting}>
              <option value="VIEWER">Visualizador</option>
              <option value="EDITOR">Editor</option>
              <option value="ADMIN">Administrador del Proyecto</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 mb-2">Para el proyecto ID: {projectId}</p>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => { onClose(); setError(''); setUserSearchTerm(''); }} disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || loadingUsers || !selectedUserId}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? "Invitando..." : "Enviar Invitación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}