// app/dashboard/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/authcontext';
import MyInvitations from '../components/MyInvitations'; 
import axios from 'axios';
import Link from 'next/link';



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


const ProjectCard = ({ project }) => (
  <Link 
    href={`/project?projectId=${project.idproject}&projectName=${encodeURIComponent(project.name)}`} 
    passHref
  >
    <div className="block bg-gray-50 p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
      <h3 className="text-xl font-semibold text-blue-700 mb-2">{project.name}</h3>
      <p className="text-gray-600 text-sm">{"Descripción: " +project.description   || "Sin descripción."}</p>
      <p className="text-gray-600 text-sm">{"ID:          " + project.idproject}</p>
    </div>
  </Link>
);


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



const NotificationsView = () => (
  <div className="p-4">
    <h3 className="text-lg font-semibold text-gray-700 mb-3">Notificaciones</h3>
    <div className="text-center text-gray-500 py-8">
      <BellIcon className="mx-auto h-10 w-10 mb-2" />
      <p>No hay notificaciones nuevas.</p>
    </div>
  </div>
);


export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');


  const [searchTerm, setSearchTerm] = useState('');


  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080';
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
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 sm:mt-0 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 text-base"
                >
                  + Crear Nuevo Proyecto
                </button>
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
                    <ProjectCard key={project.idproject} project={project} /> 
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
                className={`flex-1 py-2.5 px-2 text-center text-sm font-medium border-b-2 transition-colors
                  ${activeRightTab === 'invitations' 
                    ? 'border-blue-600 text-blue-700' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <EnvelopeIcon className="inline-block mr-1.5 mb-0.5" />
                Invitaciones
              </button>
              <button
                onClick={() => setActiveRightTab('notifications')}
                className={`flex-1 py-2.5 px-2 text-center text-sm font-medium border-b-2 transition-colors
                  ${activeRightTab === 'notifications' 
                    ? 'border-blue-600 text-blue-700' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                 <BellIcon className="inline-block mr-1.5 mb-0.5" />
                Notificaciones
              </button>
            </nav>
          </div>
          
          <div className="overflow-y-auto h-[calc(100vh-var(--header-height,60px))]">
            {activeRightTab === 'invitations' && <MyInvitations />}
            {activeRightTab === 'notifications' && <NotificationsView />}
          </div>
        </aside>
      </div>
    </div>
  );
}