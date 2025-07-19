'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/authcontext';
import MyInvitations from '../components/MyInvitations';
import NotificationsView from '../components/NotificationsView';
import axios from 'axios';
import Link from 'next/link';


const PencilIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);


const Loader = ({ text = "Cargando..." }) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-900 p-4">
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-lg">{text}</p>
    </div>
  </div>
);


const CreateProjectModal = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del proyecto es obligatorio.");
      setSuccessMessage('');
      return;
    }
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    try {
      await onSubmit({ name, description });
      setName('');
      setDescription('');
      setSuccessMessage('¡Proyecto creado exitosamente!');
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      setError(err.message || "Error al crear el proyecto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-gray-800">Crear Nuevo Proyecto</h3>
          <button onClick={() => { onClose(); setError(''); setSuccessMessage(''); }} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Proyecto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="projectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id="projectDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            ></textarea>
          </div>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          {successMessage && <p className="text-green-500 text-sm mb-3">{successMessage}</p>}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => { onClose(); setError(''); setSuccessMessage(''); }}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!successMessage}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? "Creando..." : "Crear Proyecto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const EditProjectModal = ({ project, isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
    }
  }, [project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del proyecto es obligatorio.");
      setSuccessMessage('');
      return;
    }
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    try {
      await onSubmit(project.idproject, { name, description });
      setSuccessMessage('¡Proyecto actualizado exitosamente!');
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      setError(err.message || "Error al actualizar el proyecto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-gray-800">Editar Proyecto</h3>
          <button onClick={() => { onClose(); setError(''); setSuccessMessage(''); }} className="text-gray-500 hover:text-gray-700">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="editProjectName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Proyecto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="editProjectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="editProjectDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id="editProjectDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            ></textarea>
          </div>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          {successMessage && <p className="text-green-500 text-sm mb-3">{successMessage}</p>}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => { onClose(); setError(''); setSuccessMessage(''); }}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!successMessage}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



const ProjectCard = ({ project, onDelete, onEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm(`¿Estás seguro de que quieres eliminar el proyecto "${project.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(project.idproject);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error al eliminar el proyecto. Por favor intenta de nuevo.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(project);
  };

  return (
    <div className="relative bg-gray-50 p-4 rounded-lg shadow hover:shadow-md transition-shadow">
      <Link
         href={`/project?projectId=${project.idproject}`} 
        passHref
      >
        <div className="block cursor-pointer pr-24"> 
          <h3 className="text-xl font-semibold text-blue-700 mb-2">{project.name}</h3>
          <p className="text-gray-600 text-sm">{"Descripción: " + project.description || "Sin descripción."}</p>
          <p className="text-gray-600 text-sm">{"ID:          " + project.idproject}</p>
        </div>
      </Link>
      
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={handleEdit}
          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
          title="Editar proyecto"
        >
          <PencilIcon />
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Eliminar proyecto"
        >
          {isDeleting ? (
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};



const DeletedProjectCard = ({ project, onRestore }) => {
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm(`¿Estás seguro de que quieres restaurar el proyecto "${project.name}"?`)) {
      return;
    }

    setIsRestoring(true);
    try {
      await onRestore(project.idproject);
    } catch (error) {
      console.error('Error restoring project:', error);
      alert('Error al restaurar el proyecto. Por favor intenta de nuevo.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="relative bg-red-50 border border-red-200 p-4 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="pr-10">
        <div className="flex items-center mb-2">
          <TrashIcon className="text-red-500 mr-2 flex-shrink-0" />
          <h3 className="text-xl font-semibold text-gray-700">{project.name}</h3>
        </div>
        <p className="text-gray-600 text-sm mb-1">{"Descripción: " + (project.description || "Sin descripción.")}</p>
        <p className="text-gray-600 text-sm mb-2">{"ID: " + project.idproject}</p>
        {project.deletedAt && (
          <p className="text-red-600 text-xs">
            Eliminado: {new Date(project.deletedAt).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        )}
      </div>
      
      <button
        onClick={handleRestore}
        disabled={isRestoring}
        className="absolute top-4 right-4 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Restaurar proyecto"
      >
        {isRestoring ? (
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <RestoreIcon />
        )}
      </button>
    </div>
  );
};


const EnvelopeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}  className={`h-5 w-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);
const BellIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}  className={`h-5 w-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a64.004 64.004 0 0 0-5.714 0" />
  </svg>
);

const TrashIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const RestoreIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
  </svg>
);

const DatabaseIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125S3.75 19.903 3.75 17.625V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
  </svg>
);


const BackupButton = () => {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const apiUrl = 'https://localhost:8080';

  const handleCreateBackup = async () => {
    if (isCreatingBackup) return;

    const confirmMessage = '¿Estás seguro de que quieres crear un backup de la base de datos?\n\nEsto puede tomar unos momentos.';
    
    if (!window.confirm(confirmMessage)) return;

    setIsCreatingBackup(true);
    try {
      const response = await axios.post(`${apiUrl}/api/admin/backup/create`, {}, { withCredentials: true });
      
      if (response.data.success) {
        alert(`✅ Backup creado exitosamente.\n\nArchivo: ${response.data.filePath}\nFecha: ${new Date(response.data.timestamp).toLocaleString('es-ES')}`);
      } else {
        throw new Error(response.data.message || 'Error desconocido al crear backup');
      }
    } catch (err) {
      console.error('Error creating backup:', err);
      let errorMessage = "Error al crear el backup.";
      
      if (err.response?.status === 403) {
        errorMessage = "No tienes permisos para crear backups del sistema.";
      } else if (err.response?.status === 500) {
        errorMessage = "Error interno del servidor al crear el backup.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  return (
    <button
      onClick={handleCreateBackup}
      disabled={isCreatingBackup}
      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      title="Crear backup de la base de datos"
    >
      {isCreatingBackup ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <DatabaseIcon />
      )}
      <span>{isCreatingBackup ? 'Creando Backup...' : 'Crear Backup'}</span>
    </button>
  );
};



const DeletedProjectsView = ({ onRefresh }) => {
  const [deletedProjects, setDeletedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const apiUrl = 'https://localhost:8080';

  const fetchDeletedProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${apiUrl}/api/projects/deleted`, { withCredentials: true });
      if (Array.isArray(response.data)) {
        setDeletedProjects(response.data);
      } else {
        setDeletedProjects([]);
        setError("Los datos recibidos no tienen el formato esperado.");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Error al cargar proyectos eliminados.";
      setError(errorMessage);
      setDeletedProjects([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  const handleRestoreProject = async (projectId) => {
    try {
      await axios.post(`${apiUrl}/api/projects/${projectId}/restore`, {}, { withCredentials: true });
      
      
      setDeletedProjects(prev => prev.filter(p => p.idproject !== projectId));
      
      
      if (onRefresh) {
        onRefresh();
      }
      
      alert('✅ Proyecto restaurado exitosamente.');
    } catch (err) {
      console.error('Error restoring project:', err);
      let errorMessage = "Error al restaurar el proyecto.";
      
      if (err.response?.status === 403) {
        errorMessage = "No tienes permisos para restaurar este proyecto.";
      } else if (err.response?.status === 404) {
        errorMessage = "Proyecto no encontrado.";
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.message || "El proyecto no se puede restaurar.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      alert(`❌ Error: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchDeletedProjects();
  }, [fetchDeletedProjects]);

  const filteredDeletedProjects = deletedProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-2"></div>
          <span className="text-gray-600">Cargando proyectos eliminados...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <TrashIcon className="text-red-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-700">Proyectos Eliminados</h3>
      </div>
      
      {deletedProjects.length > 0 && (
        <div className="mb-4">
          <input
            type="search"
            placeholder="Buscar proyectos eliminados..."
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

      {!error && filteredDeletedProjects.length === 0 && (
        <div className="text-center py-8">
          <TrashIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
          <p className="text-gray-500">
            {searchTerm ? 'No se encontraron proyectos eliminados con ese término.' : 'No hay proyectos eliminados.'}
          </p>
          {!searchTerm && (
            <p className="text-gray-400 text-sm mt-1">
              Los proyectos eliminados aparecerán aquí.
            </p>
          )}
        </div>
      )}

      {!error && filteredDeletedProjects.length > 0 && (
        <div className="space-y-3">
          {filteredDeletedProjects.map((project) => (
            <DeletedProjectCard
              key={project.idproject}
              project={project}
              onRestore={handleRestoreProject}
            />
          ))}
        </div>
      )}
    </div>
  );
};


export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  const [deletedProjectsCount, setDeletedProjectsCount] = useState(0);

  const apiUrl = 'https://localhost:8080';
  const [activeRightTab, setActiveRightTab] = useState('invitations');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchProjects = useCallback(async () => {
    if (!user || authLoading) {
      setProjectsLoading(false);
      return;
    }
    setProjectsLoading(true);
    setProjectsError('');
    try {
      const response = await axios.get(`${apiUrl}/api/projects/list`, { withCredentials: true });
      if (Array.isArray(response.data)) {
        setProjects(response.data);
      } else {
        setProjects([]);
        setProjectsError("Los datos recibidos de los proyectos no tienen el formato esperado.");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Error al cargar los proyectos.";
      setProjectsError(errorMessage);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }, [user, authLoading, apiUrl]);

  const fetchDeletedProjectsCount = useCallback(async () => {
    if (!user || authLoading) return;
    
    try {
      const response = await axios.get(`${apiUrl}/api/projects/deleted`, { withCredentials: true });
      if (Array.isArray(response.data)) {
        setDeletedProjectsCount(response.data.length);
      }
    } catch (err) {
      setDeletedProjectsCount(0);
    }
  }, [user, authLoading, apiUrl]);

  useEffect(() => {
    fetchDeletedProjectsCount();
  }, [fetchDeletedProjectsCount]);

  const handleRefreshProjects = useCallback(() => {
    fetchProjects();
    fetchDeletedProjectsCount();
  }, [fetchProjects, fetchDeletedProjectsCount]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (projectData) => {
    try {
      await axios.post(`${apiUrl}/api/projects/create`, projectData, { withCredentials: true });
      await fetchProjects();
    } catch (err) {
      console.error('Dashboard: Error creating project:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || err.response?.data?.error || "Error al crear el proyecto.");
    }
  };

  
  const handleUpdateProject = async (projectId, projectData) => {
    try {
      await axios.put(`${apiUrl}/api/projects/${projectId}`, projectData, { withCredentials: true });
      await fetchProjects();
    } catch (err) {
      console.error('Dashboard: Error updating project:', err.response?.data || err.message);
      let errorMessage = "Error al actualizar el proyecto.";
      if (err.response?.status === 403) {
        errorMessage = "No tienes permisos para editar este proyecto.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      throw new Error(errorMessage);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await axios.delete(`${apiUrl}/api/projects/delete/${projectId}`, { withCredentials: true });
      await fetchProjects();
      await fetchDeletedProjectsCount();
    } catch (err) {
      console.error('Dashboard: Error deleting project:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || err.response?.data?.error || "Error al eliminar el proyecto.");
    }
  };

  
  const handleOpenEditModal = (project) => {
    setProjectToEdit(project);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setProjectToEdit(null);
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (authLoading || (!user && !authLoading && typeof window !== 'undefined' && !window.location.pathname.includes('/login'))) {
    return <Loader text="Verificando sesión..." />;
  }
  if (!user && !authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
      />
      
      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleUpdateProject}
        project={projectToEdit}
      />

      <div className="flex flex-col md:flex-row max-w-full mx-auto">
        <main className="flex-grow p-4 md:p-6 lg:p-8 w-full md:w-[70%] lg:w-[75%]">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    Bienvenido, {user?.names || 'Usuario'}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Gestiona tus proyectos y colaboraciones.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Mis Proyectos</h2>
                <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 text-base"
                  >
                    + Crear Nuevo Proyecto
                  </button>
                  {user?.names === 'Admin' && <BackupButton />}
                </div>
              </div>

              <div className="mb-6">
                <input
                  type="search"
                  placeholder="Buscar proyectos por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {projectsLoading && <Loader text="Cargando proyectos..." />}
              
              {!projectsLoading && projectsError && (
                <div className="p-4 my-4 text-sm text-red-800 bg-red-100 rounded-lg" role="alert">
                  <span className="font-medium">Error:</span> {projectsError}
                </div>
              )}

              {!projectsLoading && !projectsError && filteredProjects.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0v-4a2 2 0 012-2h6a2 2 0 012 2v4m-6 0h-2"/>
                  </svg>
                  <p className="mt-4 text-lg text-gray-500">
                    {searchTerm ? 'No se encontraron proyectos con ese término.' : 'No tienes proyectos todavía.'}
                  </p>
                  {!searchTerm && <p className="text-gray-500 text-sm">¡Crea uno para empezar!</p>}
                </div>
              )}
              {!projectsLoading && !projectsError && filteredProjects.length > 0 && (
                <div className="grid grid-cols-1 gap-6">
                  
                  {filteredProjects.map((project) => (
                    <ProjectCard
                      key={project.idproject}
                      project={project}
                      onDelete={handleDeleteProject}
                      onEdit={handleOpenEditModal}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
        <aside className="w-full md:w-[30%] lg:w-[25%] bg-white border-l border-gray-200 md:min-h-screen md:sticky md:top-0">
          <div className="p-1 sticky top-0 bg-white z-10 border-b border-gray-200">
            <nav className="flex justify-around">
              <button
                onClick={() => setActiveRightTab('invitations')}
                className={`flex-1 py-2.5 px-1 text-center text-xs font-medium border-b-2 transition-colors
                  ${activeRightTab === 'invitations' 
                    ? 'border-blue-600 text-blue-700' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <EnvelopeIcon className="inline-block mr-1 mb-0.5" />
                <span className="hidden sm:inline">Invitaciones</span>
                <span className="sm:hidden">Invit.</span>
              </button>
              <button
                onClick={() => setActiveRightTab('notifications')}
                className={`flex-1 py-2.5 px-1 text-center text-xs font-medium border-b-2 transition-colors
                  ${activeRightTab === 'notifications' 
                    ? 'border-blue-600 text-blue-700' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                 <BellIcon className="inline-block mr-1 mb-0.5" />
                <span className="hidden sm:inline">Notificaciones</span>
                <span className="sm:hidden">Notif.</span>
              </button>
              <button
                onClick={() => setActiveRightTab('deleted')}
                className={`flex-1 py-2.5 px-1 text-center text-xs font-medium border-b-2 transition-colors relative
                  ${activeRightTab === 'deleted' 
                    ? 'border-red-600 text-red-700' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <TrashIcon className="inline-block mr-1 mb-0.5" />
                <span className="hidden sm:inline">Eliminados</span>
                <span className="sm:hidden">Elim.</span>
                {deletedProjectsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                    {deletedProjectsCount}
                  </span>
                )}
              </button>
            </nav>
          </div>
          
          <div className="overflow-y-auto h-[calc(100vh-var(--header-height,60px))]">
            {activeRightTab === 'invitations' && <MyInvitations onActionSuccess={handleRefreshProjects} />}
            {activeRightTab === 'notifications' && <NotificationsView />}
            {activeRightTab === 'deleted' && <DeletedProjectsView onRefresh={handleRefreshProjects} />}
          </div>
        </aside>
      </div>
    </div>
  );
}