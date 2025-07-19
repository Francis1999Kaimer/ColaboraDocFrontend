import { useState, useEffect } from 'react';

export default function EditVersionModal({ isOpen, onClose, version, onVersionUpdated }) {
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (version) {
      setComments(version.comments || '');
    }
  }, [version]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onVersionUpdated(version.idversion, { comments });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al actualizar la versión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">Editar Comentarios de Versión (V{version?.versionNumber})</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="versionComments" className="block text-sm font-medium text-gray-700">Comentarios</label>
            <textarea
              id="versionComments" value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows="4"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            ></textarea>
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