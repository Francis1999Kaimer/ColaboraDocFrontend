import { useState, useEffect } from 'react';

export default function EditDocumentModal({ isOpen, onClose, document, onDocumentUpdated, projectMembers = [] }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [codigo, setCodigo] = useState(''); 
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (document) {
      setName(document.name || '');
      setDescription(document.description || '');
      setCodigo(document.codigo && document.codigo !== 'N/A' ? document.codigo : ''); 
      setAssignedToUserId(document.assignedTo?.iduser || '');
      setDueDate(document.dueDate || '');
    }
  }, [document]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const payload = {
                name,
                description,
                codigo,
                assignedToUserId: assignedToUserId ? parseInt(assignedToUserId, 10) : null,
                dueDate: dueDate || null
            };
            await onDocumentUpdated(document.id, payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al actualizar el documento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">Editar Documento</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="docName" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text" id="docName" value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>

           <div className="mb-4">
            <label htmlFor="editDocCodigo" className="block text-sm font-medium text-gray-700">Código</label>
            <input
              type="text"
              id="editDocCodigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              maxLength="50"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="docDesc" className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              id="docDesc" value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
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


          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}