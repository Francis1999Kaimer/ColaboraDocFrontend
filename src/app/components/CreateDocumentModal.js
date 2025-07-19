
'use client';
import { useState } from 'react';
import axios from 'axios';

export default function CreateDocumentModal({ isOpen, onClose, folderId, onDocumentCreated,  projectMembers = [] }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [codigo, setCodigo] = useState(''); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const apiUrl = 'https://localhost:8080';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del documento es obligatorio.");
      return;
    }
    if (!folderId) {
        setError("ID de carpeta no proporcionado.");
        return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const payload = { 
        name, 
        description, 
        codigo, 
        folderId,
        assignedToUserId: assignedToUserId ? parseInt(assignedToUserId, 10) : null,
        dueDate: dueDate || null
      }; 
      const response = await axios.post(`${apiUrl}/api/documents`, payload, { withCredentials: true });
      onDocumentCreated(response.data);
      setName(''); setDescription(''); setCodigo(''); setAssignedToUserId(''); setDueDate('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Error al crear el documento.");
      console.error("Error creating document:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">Crear Nuevo Documento</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="docName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text" id="docName" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" required disabled={isSubmitting}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="docCodigo" className="block text-sm font-medium text-gray-700">Código</label>
            <input 
                type="text" 
                id="docCodigo" 
                value={codigo} 
                onChange={(e) => setCodigo(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                maxLength="50"
            />
        </div>

          <div className="mb-6">
            <label htmlFor="docDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id="docDescription" value={description} onChange={(e) => setDescription(e.target.value)}
              rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isSubmitting}
            ></textarea>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Encargado</label>
              <select
                id="assignedTo"
                value={assignedToUserId}
                onChange={(e) => setAssignedToUserId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              >
                <option value="">-- Sin asignar --</option>
                {projectMembers.map(member => (
                  <option key={member.user.iduser} value={member.user.iduser}>
                    {member.user.names} {member.user.lastnames}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Fecha Límite</label>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>


          <p className="text-xs text-gray-500 mb-2">Se creará en la carpeta seleccionada (ID: {folderId})</p>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => { onClose(); setError(''); }} disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? "Creando..." : "Crear Documento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}