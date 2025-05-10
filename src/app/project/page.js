// app/project/page.js
'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/authcontext'; // Ajusta la ruta si es necesario
import Link from 'next/link';

// --- Iconos SVG ---
const FolderIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props} className={`inline-block h-5 w-5 ${props.className || ''}`}>
    <path d="M3.509 5.743A2 2 0 015.33 4.001H8.532a2 2 0 011.774 1.041l.46 1.004a1 1 0 00.887.52h4.838a2 2 0 011.992 1.829l-.011.117V15a2 2 0 01-2 2H5a2 2 0 01-2-2V7.432l.509-1.689z" />
  </svg>
);

const DocumentIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props} className={`inline-block h-5 w-5 ${props.className || ''}`}>
    <path fillRule="evenodd" d="M3 3.75A1.75 1.75 0 014.75 2h5.5a.75.75 0 010 1.5h-5.5A.25.25 0 004.5 3.75v12.5c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25V8.5a.75.75 0 011.5 0v7.75A1.75 1.75 0 0115.25 18H4.75A1.75 1.75 0 013 16.25V3.75z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M11.75 2a.75.75 0 01.75.75V6h2.528c.463 0 .706.51.372.814l-3.249 2.902a.75.75 0 01-.992 0L8.128 6.814A.479.479 0 018.5 6H11V2.75a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

const UserCircleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props} className={`inline-block h-10 w-10 ${props.className || ''}`}>
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clipRule="evenodd" />
  </svg>
);

const ChevronDownIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`inline-block h-4 w-4 transition-transform ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const ChevronRightIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`inline-block h-4 w-4 transition-transform ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

// Iconos para la columna "OPCIONES"
const EyeIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);
const DocumentArrowDownIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);
const ClockIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);
const EllipsisVerticalIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
    </svg>
);
// --- Fin Iconos SVG ---


// Loader Component
const Loader = ({ text = "Cargando..." }) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-900 p-4">
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-lg">{text}</p>
    </div>
  </div>
);


// --- EnhancedDocumentationView ---
const deliverablesTreeData = [
  { id: 'control-proyectos', name: 'CONTROL DE PROYECTOS', icon: FolderIcon },
  { id: 'general-root', name: 'GENERAL', icon: FolderIcon },
  { id: 'civil', name: 'CIVIL', icon: FolderIcon },
  { id: 'piping', name: 'PIPING', icon: FolderIcon },
  { id: 'instrumentacion', name: 'INSTRUMENTACION', icon: FolderIcon },
  { id: 'electricidad', name: 'ELECTRICIDAD', icon: FolderIcon },
  { 
    id: 'mecanica', 
    name: 'MECANICA', 
    icon: FolderIcon,
    subItems: [
      { id: 'mecanica-general', name: 'GENERAL', parentId: 'mecanica', icon: FolderIcon },
      { id: 'mecanica-equipos', name: 'EQUIPOS', parentId: 'mecanica', icon: FolderIcon },
    ]
  },
];

const mockDocuments = [
  { id: 'doc1', categoryId: 'mecanica-general', codigoExt: 'IG-100001-DA-0000-M-ET-00006', titulo: 'ESPECIFICACIÓN TÉCNICA DE COLECTOR DE POLVO', ultRevision: 'A.2' },
  { id: 'doc2', categoryId: 'mecanica-general', codigoExt: 'IG-100001-DA-0000-M-ET-00007', titulo: 'ESPECIFICACIÓN TÉCNICA DE PUENTE GRÚA Y SEMI PORTAL', ultRevision: 'A' },
  { id: 'doc3', categoryId: 'mecanica-general', codigoExt: 'IG-100001-DA-0000-M-ET-00008', titulo: 'ESPECIFICACIÓN TÉCNICA DE BOMBA', ultRevision: 'A' },
  { id: 'doc4', categoryId: 'mecanica-equipos', codigoExt: 'IG-100001-DA-0000-M-EQ-00009', titulo: 'MANUAL DE OPERACIÓN EQUIPO X', ultRevision: 'B.1' },
  { id: 'doc5', categoryId: 'civil', codigoExt: 'IG-100001-DA-0000-C-PL-00001', titulo: 'PLANO DE CIMENTACIÓN EDIFICIO A', ultRevision: 'C' },
  { id: 'doc6', categoryId: 'general-root', codigoExt: 'IG-100001-XX-0000-G-DC-00001', titulo: 'PROCEDIMIENTO GENERAL DE SEGURIDAD', ultRevision: 'A.5' },
];


function EnhancedDocumentationView({ projectId }) {
  const [selectedCategory, setSelectedCategory] = useState(deliverablesTreeData[0]?.id || null); // Seleccionar el primer item por defecto
  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const toggleExpand = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };
  
  // Para el ejemplo, cuando se expande una categoría padre, también la seleccionamos.
  // Puedes ajustar esta lógica según tus necesidades.
  const handleToggleAndSelect = (categoryId) => {
    toggleExpand(categoryId);
    // Si es una categoría padre y la estamos expandiendo, también la seleccionamos
    // o si es una categoría sin subitems.
    const category = deliverablesTreeData.find(c => c.id === categoryId) || 
                     deliverablesTreeData.flatMap(c => c.subItems || []).find(s => s.id === categoryId);
    if (category && (!category.subItems || category.subItems.length === 0 || expandedCategories[categoryId])) {
        handleCategorySelect(categoryId);
    } else if (category && category.subItems && category.subItems.length > 0 && !expandedCategories[categoryId]) {
        // Si colapsamos una categoría padre, podríamos deseleccionarla o seleccionar la padre.
        // Por ahora, la mantenemos seleccionada si ya lo estaba, o seleccionamos la padre.
        // Esto puede necesitar más lógica específica.
    }
  };


  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesCategory = doc.categoryId === selectedCategory;
    const matchesSearch = searchTerm === '' || 
                          doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.codigoExt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderTreeItem = (item, level = 0) => {
    const IconComponent = item.icon || FolderIcon;
    const isExpanded = !!expandedCategories[item.id];
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
      <div key={item.id}>
        <button
          onClick={() => hasSubItems ? handleToggleAndSelect(item.id) : handleCategorySelect(item.id)}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          className={`w-full flex items-center text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors
            ${selectedCategory === item.id 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-200'
            }`}
        >
          {hasSubItems && (
            isExpanded 
              ? <ChevronDownIcon className="mr-2 flex-shrink-0" /> 
              : <ChevronRightIcon className="mr-2 flex-shrink-0" />
          )}
          <IconComponent className={`mr-2 flex-shrink-0 h-5 w-5 ${selectedCategory === item.id ? 'text-blue-600' : 'text-gray-500'}`} />
          <span className="truncate flex-grow">{item.name}</span>
        </button>
        {hasSubItems && isExpanded && (
          <div className="mt-1">
            {item.subItems.map(subItem => renderTreeItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };
  

  return (
    <div className="flex flex-col md:flex-row gap-x-6 gap-y-4 mt-2">
      {/* Left Pane: Deliverables Tree */}
      <div className="md:w-1/3 lg:w-1/4 bg-slate-50 p-3 rounded-lg shadow">
        <h3 className="text-base font-semibold text-gray-800 mb-3 px-2">Entregables</h3>
        <nav className="space-y-1">
          {deliverablesTreeData.map(item => renderTreeItem(item))}
        </nav>
      </div>

      {/* Right Pane: Documents Table */}
      <div className="md:w-2/3 lg:w-3/4 flex-grow">
        <div className="mb-4">
          <input
            type="search"
            placeholder="Buscar por código o título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {selectedCategory ? (
          filteredDocuments.length > 0 ? (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full text-sm divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Código Ext.</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Título</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Ult. Revisión</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Opciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{doc.codigoExt}</td>
                      <td className="px-4 py-3 text-gray-700 min-w-[200px]">{doc.titulo}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{doc.ultRevision}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button title="Ver" className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"><EyeIcon /></button>
                          <button title="Descargar" className="p-1.5 text-green-600 hover:bg-green-100 rounded-full transition-colors"><DocumentArrowDownIcon /></button>
                          <button title="Historial" className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-full transition-colors"><ClockIcon /></button>
                          <button title="Más opciones" className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"><EllipsisVerticalIcon /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-lg shadow">
              <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-lg text-gray-500">
                No se encontraron documentos para la categoría seleccionada o el término de búsqueda.
              </p>
            </div>
          )
        ) : (
            <div className="text-center py-10 bg-white rounded-lg shadow">
                <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-lg text-gray-500">
                    Seleccione una categoría de Entregables para ver los documentos.
                </p>
            </div>
        )}
      </div>
    </div>
  );
}
// --- Fin EnhancedDocumentationView ---


// --- Maqueta para Integrantes (sin cambios) ---
const MembersView = () => (
    <div className="space-y-4 mt-6">
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center space-x-3">
          <UserCircleIcon className="text-gray-400" />
          <div>
            <h4 className="font-semibold text-gray-800">Laura Martínez</h4>
            <p className="text-sm text-gray-500">Jefa de Proyecto</p>
          </div>
        </div>
      </div>
      {/* ... más integrantes ... */}
    </div>
);
// --- Fin Maqueta para Integrantes ---


// --- Componente de contenido de la página del proyecto ---
function ProjectDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('documentation');
  const [project, setProject] = useState({ id: null, name: 'Proyecto de prueba' }); // Usamos el nombre de la imagen como placeholder
  const [projectDataLoading, setProjectDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const projectId = searchParams.get('projectId');
    const projectNameQuery = searchParams.get('projectName');

    if (projectId) {
      setProject({ id: projectId, name: decodeURIComponent(projectNameQuery || `Proyecto ${projectId}`) });
      setProjectDataLoading(false); 
    } else if (!authLoading && user) {
      setProject({ id: null, name: 'Proyecto de prueba' }); // Placeholder si no hay ID
      setProjectDataLoading(false);
    }
  }, [searchParams, authLoading, user, router]);

  if (authLoading || (!user && !authLoading)) {
    return <Loader text="Verificando sesión..." />;
  }
  
  if (projectDataLoading && !project.id) { // Solo mostrar loader si aún no tenemos ID y estamos "cargando"
    return <Loader text="Cargando datos del proyecto..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto"> {/* Aumentado max-w para más espacio */}
        {/* Breadcrumbs y título del proyecto */}
        <div className="mb-4">
            <nav className="text-sm mb-2" aria-label="Breadcrumb">
              <ol className="list-none p-0 inline-flex space-x-2">
                <li className="flex items-center">
                  <Link href="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
                </li>
                <li className="flex items-center">
                  <span className="text-gray-400 mx-2">/</span>
                  <span className="text-gray-700 font-medium">{project.name || 'Detalles del Proyecto'}</span>
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                {project.name || 'Cargando nombre...'}
            </h1>
            {/* <p className="text-gray-500 text-sm">ID del Proyecto: {project.id || 'N/A'}</p> */}
        </div>
        
        {/* Pestañas */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('documentation')}
              className={`py-3 px-1 border-b-2 font-semibold text-sm md:text-base
                ${activeTab === 'documentation'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Documentación
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-3 px-1 border-b-2 font-semibold text-sm md:text-base
                ${activeTab === 'members'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Integrantes
            </button>
            {/* Puedes añadir más pestañas aquí si es necesario */}
          </nav>
        </div>

        {/* Contenido de las pestañas */}
        <div>
          {activeTab === 'documentation' && <EnhancedDocumentationView projectId={project.id} />}
          {activeTab === 'members' && <MembersView />}
        </div>
      </div>
    </div>
  );
}
// --- Fin Componente de contenido de la página ---


// Componente principal de la página que envuelve con Suspense
export default function ProjectPage() {
  return (
    <Suspense fallback={<Loader text="Cargando página del proyecto..." />}>
      <ProjectDetailContent />
    </Suspense>
  );
}