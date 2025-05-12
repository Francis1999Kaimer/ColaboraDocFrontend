// components/UploadVersionModal.js
'use client';
import { useState } from 'react';
import axios from 'axios';

export default function UploadVersionModal({ isOpen, onClose, documentId, onVersionUploaded }) {
  const [versionNumber, setVersionNumber] = useState('');
  const [dropboxFileId, setDropboxFileId] = useState('');
  const [comments, setComments] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!versionNumber || !dropboxFileId.trim()) {
      setError("Número de versión e ID de Dropbox son obligatorios.");
      return;
    }
    if (!documentId) {
        setError("ID de documento no proporcionado.");
        return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const payload = {
        documentId,
        versionNumber: parseInt(versionNumber),
        dropboxFileId,
        comments,
      
      };
      const response = await axios.post(`${apiUrl}/api/versions`, payload, { withCredentials: true });
      onVersionUploaded(response.data);
      setVersionNumber('');
      setDropboxFileId('');
      setComments('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Error al subir la versión.");
      console.error("Error uploading version:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">Subir Nueva Versión</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="versionNum" className="block text-sm font-medium text-gray-700 mb-1">
              Número de Versión <span className="text-red-500">*</span>
            </label>
            <input type="number" id="versionNum" value={versionNumber} onChange={(e) => setVersionNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" required disabled={isSubmitting} />
          </div>
          <div className="mb-4">
            <label htmlFor="dropboxId" className="block text-sm font-medium text-gray-700 mb-1">
              ID Archivo Dropbox <span className="text-red-500">*</span>
            </label>
            <input type="text" id="dropboxId" value={dropboxFileId} onChange={(e) => setDropboxFileId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" required disabled={isSubmitting} />
          </div>
          <div className="mb-6">
            <label htmlFor="versionComments" className="block text-sm font-medium text-gray-700 mb-1">
              Comentarios
            </label>
            <textarea id="versionComments" value={comments} onChange={(e) => setComments(e.target.value)}
              rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isSubmitting}></textarea>
          </div>
          <p className="text-xs text-gray-500 mb-2">Para el documento ID: {documentId}</p>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => { onClose(); setError(''); }} disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? "Subiendo..." : "Subir Versión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}