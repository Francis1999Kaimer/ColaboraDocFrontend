'use client';
import { useState } from 'react';

export default function ChangeRoleModal({ isOpen, onClose, projectUser, currentRole, onConfirm }) {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [isChanging, setIsChanging] = useState(false);

  if (!isOpen || !projectUser) return null;

  const getRoleDisplayName = (role) => {
    switch(role) {
      case 'ADMIN': return 'Administrador';
      case 'EDITOR': return 'Editor';
      case 'VIEWER': return 'Visualizador';
      default: return role;
    }
  };

  const getRoleDescription = (role) => {
    switch(role) {
      case 'ADMIN': return 'Puede gestionar el proyecto, invitar usuarios y modificar roles';
      case 'EDITOR': return 'Puede crear, editar y eliminar documentos y carpetas';
      case 'VIEWER': return 'Solo puede visualizar el contenido del proyecto';
      default: return '';
    }
  };

  const handleConfirm = async () => {
    if (selectedRole === currentRole) {
      onClose();
      return;
    }

    setIsChanging(true);
    try {
      await onConfirm(selectedRole);
      onClose();
    } catch (error) {
      
    } finally {
      setIsChanging(false);
    }
  };

  const handleClose = () => {
    if (!isChanging) {
      setSelectedRole(currentRole); 
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          Cambiar Rol de Usuario
        </h3>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium text-gray-700">Usuario:</p>
          <p className="text-base text-gray-900">
            {projectUser.user.names} {projectUser.user.lastnames}
          </p>
          <p className="text-sm text-gray-600">{projectUser.user.email}</p>
        </div>

        <div className="mb-4">
          <label htmlFor="roleSelect" className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar nuevo rol:
          </label>
          <select
            id="roleSelect"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={isChanging}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          >
            <option value="VIEWER">Visualizador</option>
            <option value="EDITOR">Editor</option>
            <option value="ADMIN">Administrador</option>
          </select>
          
          <div className="mt-2 p-2 bg-blue-50 rounded-md">
            <p className="text-xs font-medium text-blue-800">
              {getRoleDisplayName(selectedRole)}
            </p>
            <p className="text-xs text-blue-600">
              {getRoleDescription(selectedRole)}
            </p>
          </div>
        </div>

        {selectedRole !== currentRole && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ El rol del usuario cambiará de <strong>{getRoleDisplayName(currentRole)}</strong> a <strong>{getRoleDisplayName(selectedRole)}</strong>
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isChanging}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isChanging || selectedRole === currentRole}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isChanging && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            )}
            {isChanging ? 'Cambiando...' : (selectedRole === currentRole ? 'Sin cambios' : 'Confirmar Cambio')}
          </button>
        </div>
      </div>
    </div>
  );
}
