// app/dashboard/page.js
'use client';
import { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/authcontext'; // Ajusta la ruta si es necesario
import axios from 'axios';
import Link from 'next/link';

// Loader Component (no changes)
const Loader = ({ text = "Cargando..." }) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-900 p-4">
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-lg">{text}</p>
    </div>
  </div>
);

// Modal para crear proyecto (no changes needed for this specific error, but ensure it calls onSubmit correctly)
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
      await onSubmit({ name, description }); // This will call handleCreateProject
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

// Project Card Component
const ProjectCard = ({ project }) => (
  <Link 
    href={`/project?projectId=${project.idproject}&projectName=${encodeURIComponent(project.name)}`} 
    passHref
  >
    <div className="block bg-gray-50 p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"> {/* Añadido block y cursor-pointer */}
      <h3 className="text-xl font-semibold text-blue-700 mb-2">{project.name}</h3>
      <p className="text-gray-600 text-sm">{project.description || "Sin descripción."}</p>
    </div>
  </Link>
);

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dashboardMessage, setDashboardMessage] = useState({ type: '', text: '' });

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Function to fetch projects
  const fetchProjects = useCallback(async () => { // Wrapped with useCallback
    if (!user) {
      // Set loading to false if no user, to prevent infinite loading state
      // if this function were called prematurely.
      setProjectsLoading(false); 
      return;
    } 

    setProjectsLoading(true);
    setProjectsError('');
    try {
      console.log(`Dashboard: Fetching projects from ${apiUrl}/api/projects`);
      const response = await axios.get(`${apiUrl}/api/projects`, {
        withCredentials: true, 
      });
      console.log('Dashboard: Projects fetched successfully:', response.data);
      if (Array.isArray(response.data)) {
        setProjects(response.data);
      } else {
        console.error('Dashboard: Fetched projects data is not an array:', response.data);
        setProjects([]); // Ensure projects is always an array
        setProjectsError("Los datos recibidos de los proyectos no tienen el formato esperado.");
      }
    } catch (err) {
      console.error('Dashboard: Error fetching projects:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Error al cargar los proyectos.";
      setProjectsError(errorMessage);
      setProjects([]); // Clear projects on error to ensure it's an array
    } finally {
      setProjectsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, apiUrl]); // Add apiUrl if it could change, though unlikely for env var. user is main dep.

  // useEffect to fetch projects when user is loaded or fetchProjects changes
  useEffect(() => {
    if (user && !authLoading) {
      fetchProjects();
    }
  }, [user, authLoading, fetchProjects]); 
  

  const handleLogout = async () => {
    await logout();
    router.push('/login'); // Redirect after logout
  };

  const handleCreateProject = async (projectData) => {
    setDashboardMessage({ type: '', text: '' }); 
    try {
      console.log(`Dashboard: Creating project at ${apiUrl}/api/projects/create with data:`, projectData);
      await axios.post(`${apiUrl}/api/projects/create`, projectData, {
        withCredentials: true,
      });
      console.log('Dashboard: Project created successfully.');
      // SUCCESS: Now re-fetch projects to update the list
      await fetchProjects(); 
      // The modal will show its own success message and close.
      // You could set a global dashboard message too if desired, but list refresh is key.
      // setDashboardMessage({ type: 'success', text: 'Proyecto creado con éxito.' });
    } catch (err) {
      console.error('Dashboard: Error creating project:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Error al crear el proyecto.";
      // No need to setDashboardMessage here as the modal will display the error
      // and the error is re-thrown for the modal.
      throw new Error(errorMessage); 
    }
  };

  if (authLoading || (!user && !authLoading)) { // Initial loading or no user yet
    return <Loader text="Verificando sesión..." />;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-4 md:p-8">
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => {
            setIsCreateModalOpen(false);
            if (dashboardMessage.text.includes("proyecto")) {
                 setDashboardMessage({ type: '', text: '' });
            }
        }}
        onSubmit={handleCreateProject}
      />

      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Bienvenido, {user?.names || 'Usuario'}
              </h1>
              <p className="text-gray-600 mt-1">
                Aquí puedes crear y gestionar tus proyectos de construcción.
              </p>
            </div>

          </div>
        </div>

        {dashboardMessage.text && (
            <div className={`p-4 mb-6 rounded-md text-sm ${
                dashboardMessage.type === 'success' ? 'bg-green-100 text-green-700' : 
                dashboardMessage.type === 'error' ? 'bg-red-100 text-red-700' : ''
            }`}>
                {dashboardMessage.text}
            </div>
        )}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Mis Proyectos</h2>
            <button
              onClick={() => {
                setDashboardMessage({ type: '', text: '' }); 
                setIsCreateModalOpen(true);
              }}
              className="mt-4 sm:mt-0 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 text-lg"
            >
              + Crear Nuevo Proyecto
            </button>
          </div>

          {projectsLoading && <Loader text="Cargando proyectos..." />}
          
          {!projectsLoading && projectsError && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
              <span className="font-medium">Error:</span> {projectsError}
            </div>
          )}

          {!projectsLoading && !projectsError && (!Array.isArray(projects) || projects.length === 0) && (
            <div className="text-center py-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0v-4a2 2 0 012-2h6a2 2 0 012 2v4m-6 0h-2"/>
              </svg>
              <p className="mt-4 text-lg text-gray-500">
                No tienes proyectos todavía.
              </p>
              <p className="text-gray-500">¡Crea uno para empezar!</p>
            </div>
          )}

          {/* Ensure projects is an array before mapping */}
          {!projectsLoading && !projectsError && Array.isArray(projects) && projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.idproject} project={project} /> 
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}