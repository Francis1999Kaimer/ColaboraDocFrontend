
'use client';

import { useState, useEffect, Suspense, useCallback,Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/authcontext';
import useProjectPermissions from '../hooks/useProjectPermissions';
import Link from 'next/link';
import axios from 'axios';


import CreateFolderModal from '../components/CreateFolderModal';
import CreateDocumentModal from '../components/CreateDocumentModal';
import UploadVersionModal from '../components/UploadVersionModal';
import InviteUserModal from '../components/InviteUserModal';
import ChangeRoleModal from '../components/ChangeRoleModal';
import DeletedUsersView from '../components/DeletedUsersView';
import DeleteFolderModal from '../components/DeleteFolderModal';

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

const TrashIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-4 w-4 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);



const ChevronDoubleDownIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`inline-block h-4 w-4 transition-transform ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5" />
  </svg>
);
const ChevronDoubleUpIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`inline-block h-4 w-4 transition-transform ${props.className || ''}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 18.75 7.5-7.5 7.5 7.5m-15-6L12 5.25l7.5 7.5" />
    </svg>
);



const Loader = ({ text = "Cargando..." }) => (
  <div className="flex items-center justify-center p-4 text-gray-900"> 
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
      <p className="text-sm">{text}</p>
    </div>
  </div>
);


function EnhancedDocumentationView({ projectId }) {
  const [deliverablesTree, setDeliverablesTree] = useState([]);
  const [selectedFolderContent, setSelectedFolderContent] = useState({ documents: [], childFolders: [] });
  
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState('');

  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [documentSearchTerm, setDocumentSearchTerm] = useState('');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080';
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [parentFolderForModal, setParentFolderForModal] = useState(null);
  const [isCreateDocumentModalOpen, setIsCreateDocumentModalOpen] = useState(false);
  const [folderForDocumentModal, setFolderForDocumentModal] = useState(null);
  const [isUploadVersionModalOpen, setIsUploadVersionModalOpen] = useState(false);
  const [documentForVersionModal, setDocumentForVersionModal] = useState(null);
  const [isDeleteFolderModalOpen, setIsDeleteFolderModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);

  const [expandedDocumentVersions, setExpandedDocumentVersions] = useState({}); 
  const [loadedVersions, setLoadedVersions] = useState({});
  const [versionsLoading, setVersionsLoading] = useState({}); 
  const [versionsError, setVersionsError] = useState({});   



  const toggleDocumentVersions = (documentId) => {
    const isCurrentlyOpen = !!expandedDocumentVersions[documentId];
    setExpandedDocumentVersions(prev => ({ ...prev, [documentId]: !isCurrentlyOpen }));

    if (!isCurrentlyOpen && !loadedVersions[documentId]) { 
      fetchVersionsForDocument(documentId);
    }
  };

  const fetchVersionsForDocument = async (documentId) => {
    setVersionsLoading(prev => ({ ...prev, [documentId]: true }));
    setVersionsError(prev => ({ ...prev, [documentId]: '' })); 
    try {
      console.log(`Fetching versions for document ID: ${documentId} from ${apiUrl}/api/documents/${documentId}/versions`);
      const response = await axios.get(`${apiUrl}/api/documents/${documentId}/versions`, { withCredentials: true });
      if (Array.isArray(response.data)) {
        const sortedVersions = response.data.sort((a, b) => (b.versionNumber || 0) - (a.versionNumber || 0));
        setLoadedVersions(prev => ({ ...prev, [documentId]: sortedVersions }));
      } else {
        console.error("Versions data is not an array for doc ID:", documentId, response.data);
        setVersionsError(prev => ({ ...prev, [documentId]: "Formato de datos de versiones inesperado."}));
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || "Error al cargar versiones.";
      setVersionsError(prev => ({ ...prev, [documentId]: errorMessage}));
      console.error(`Error fetching versions for document ${documentId}:`, err);
    } finally {
      setVersionsLoading(prev => ({ ...prev, [documentId]: false }));
    }
  };


  const mapApiFolderToFrontendTree = useCallback((apiFolder) => {
    if (!apiFolder) return null;
    return {
      id: apiFolder.idfolder,
      name: apiFolder.name,
      description: apiFolder.description,
      type: 'folder',
      children: apiFolder.childFolders ? apiFolder.childFolders.map(mapApiFolderToFrontendTree) : [],
      documents: apiFolder.documents ? apiFolder.documents.map(doc => ({
        id: doc.iddocument,
        folderId: apiFolder.idfolder, 
        codigoExt: doc.codigoExt || 'N/A',
        name: doc.name, 
        ultRevision: doc.ultRevision || 'N/A', 
      })) : [],
    };
  }, []);

  const fetchProjectHierarchy = useCallback(async () => {
    if (!projectId) return;
    setTreeLoading(true);
    setTreeError('');
    setDeliverablesTree([]);


    try {
      console.log(`Fetching project hierarchy for project ID: ${projectId} from ${apiUrl}/api/projects/${projectId}/folders`);
      const response = await axios.get(`${apiUrl}/api/projects/${projectId}/folders`, { withCredentials: true });
      
      if (Array.isArray(response.data)) {
        const fetchedTree = response.data.map(mapApiFolderToFrontendTree);
        setDeliverablesTree(fetchedTree);

        if (fetchedTree.length > 0 && !selectedFolderId) {
   
        } else if (fetchedTree.length === 0) {
            setSelectedFolderId(null); 
            setSelectedFolderContent({ documents: [], childFolders: [] });
        } else if (selectedFolderId) {
        
            const currentSelected = findFolderRecursive(fetchedTree, selectedFolderId);
            if (currentSelected) {
                setSelectedFolderContent({
                    documents: currentSelected.documents || [],
                    childFolders: currentSelected.children || []
                });
            } else { 
                setSelectedFolderId(null);
                setSelectedFolderContent({ documents: [], childFolders: [] });
            }
        }
      } else {
        console.error("Project hierarchy data is not an array:", response.data);
        setTreeError("Formato de datos de jerarquía inesperado.");
      }
    } catch (err) {
      setTreeError(err.response?.data?.error || err.response?.data?.message || 'Error al cargar la estructura del proyecto.');
      console.error("Error fetching project hierarchy:", err);
    } finally {
      setTreeLoading(false);
    }
  }, [projectId, apiUrl, mapApiFolderToFrontendTree]);

  useEffect(() => {
    fetchProjectHierarchy();
  }, [fetchProjectHierarchy]);

  const findFolderRecursive = useCallback((items, folderId) => {
    for (const item of items) {
        if (item.id === folderId) return item;
        if (item.children) {
            const found = findFolderRecursive(item.children, folderId);
            if (found) return found;
        }
    }
    return null;
  }, []);


  useEffect(() => {
    if (selectedFolderId && deliverablesTree.length > 0) {
      const folderNode = findFolderRecursive(deliverablesTree, selectedFolderId);
      if (folderNode) {
        setSelectedFolderContent({
          documents: folderNode.documents || [],
          childFolders: folderNode.children || [] 
        });
      } else {
        setSelectedFolderContent({ documents: [], childFolders: [] });
      }
    } else {
      setSelectedFolderContent({ documents: [], childFolders: [] });
    }
  }, [selectedFolderId, deliverablesTree, findFolderRecursive]);


  const handleFolderCreated = (newFolderDTO) => {
    fetchProjectHierarchy();
    alert("Carpeta creada con éxito!");
  };

  const handleDocumentCreated = (newDocumentDTO) => {
    fetchProjectHierarchy();
    alert("Documento creado con éxito!");
  };
    const handleVersionUploaded = (newVersionDTO) => { 
    console.log("Frontend: Versión subida DTO:", newVersionDTO);
   
    if (expandedDocumentVersions[newVersionDTO.documentId]) {
      fetchVersionsForDocument(newVersionDTO.documentId);
    }

    fetchProjectHierarchy(); 
    alert("Nueva versión subida con éxito!");
  };

  const handleDeleteFolder = (folderId) => {
    const folder = findFolderById(deliverablesTree, folderId);
    if (folder) {
      setFolderToDelete(folder);
      setIsDeleteFolderModalOpen(true);
    }
  };

  const handleFolderDeleted = (deletedFolder) => {
    fetchProjectHierarchy();
    alert(`Carpeta "${deletedFolder.name}" movida a la papelera con éxito!`);
  };

  
  const findFolderById = (folders, targetId) => {
    for (const folder of folders) {
      if (folder.id === targetId) {
        return folder;
      }
      if (folder.childFolders && folder.childFolders.length > 0) {
        const found = findFolderById(folder.childFolders, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleExpand = (folderId) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleFolderSelect = (folderId) => {
    setSelectedFolderId(folderId);
    setDocumentSearchTerm(''); 
  };
  
  const handleToggleAndSelect = (folderId) => {
    toggleExpand(folderId);
    handleFolderSelect(folderId); 
  };

  const filteredDocuments = selectedFolderContent.documents.filter(doc => {
    const matchesSearch = documentSearchTerm === '' || 
                          (doc.name && doc.name.toLowerCase().includes(documentSearchTerm.toLowerCase())) ||
                          (doc.codigoExt && doc.codigoExt.toLowerCase().includes(documentSearchTerm.toLowerCase()));
    return matchesSearch;
  });

  const renderTreeItem = (item, level = 0) => {
    const IconComponent = FolderIcon;
    const isExpanded = !!expandedFolders[item.id];
    const hasSubItems = item.children && item.children.length > 0;

    return (

      <div key={item.id} className="relative">
        <div className="flex items-center">
       
          <button
            onClick={() => hasSubItems ? handleToggleAndSelect(item.id) : handleFolderSelect(item.id)}
            style={{ paddingLeft: `${level * 1.25 + (hasSubItems ? 0 : 0)}rem` }}
            className={`flex-grow flex items-center text-left pl-2 pr-1 py-2 rounded-md text-sm font-medium transition-colors
              ${selectedFolderId === item.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            {hasSubItems && (isExpanded ? <ChevronDownIcon className="mr-1.5 shrink-0 h-4 w-4" /> : <ChevronRightIcon className="mr-1.5 shrink-0 h-4 w-4" />)}
            {!hasSubItems && <span className="inline-block mr-1.5 h-4 w-4 shrink-0"></span>}
            <IconComponent className={`mr-1.5 shrink-0 h-5 w-5 ${selectedFolderId === item.id ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className="truncate flex-grow">{item.name}</span>
          </button>


          <div className="ml-auto flex items-center space-x-0.5 pr-1"> 
            <button
              title="Crear Subcarpeta"
              onClick={(e) => { e.stopPropagation(); setParentFolderForModal(item.id); setIsCreateFolderModalOpen(true); console.log(parentFolderForModal) }}
              className="p-1 text-blue-500 hover:bg-blue-100 rounded"
            > <FolderIcon className="h-4 w-4" /> </button>
            <button
              title="Crear Documento"
              onClick={(e) => { e.stopPropagation(); setFolderForDocumentModal(item.id); setIsCreateDocumentModalOpen(true); }}
              className="p-1 text-green-500 hover:bg-green-100 rounded" 
            > <DocumentIcon className="h-4 w-4" /> </button>
            <button
              title="Eliminar Carpeta"
              onClick={(e) => { e.stopPropagation(); handleDeleteFolder(item.id); }}
              className="p-1 text-red-500 hover:bg-red-100 rounded"
            > <TrashIcon className="h-4 w-4" /> </button>
          </div>
        </div>
     
        {hasSubItems && isExpanded && (
          <div className="mt-0.5">
            {item.children.map(subItem => renderTreeItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  if (treeLoading) return <div className="w-full md:w-auto"><Loader text="Cargando estructura..." /></div>;
  if (treeError) return <div className="w-full p-4 text-center text-red-600 bg-red-100 rounded-md">{treeError}</div>;

  return (
    <>
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen} onClose={() => setIsCreateFolderModalOpen(false)}
        projectId={!parentFolderForModal ? projectId : null} parentFolderId={parentFolderForModal}
        onFolderCreated={handleFolderCreated}
        
      />
      <CreateDocumentModal
        isOpen={isCreateDocumentModalOpen} onClose={() => setIsCreateDocumentModalOpen(false)}
        folderId={folderForDocumentModal} onDocumentCreated={handleDocumentCreated}
      />      <UploadVersionModal
        isOpen={isUploadVersionModalOpen} onClose={() => setIsUploadVersionModalOpen(false)}
        documentId={documentForVersionModal} onVersionUploaded={handleVersionUploaded}
      />
      <DeleteFolderModal
        isOpen={isDeleteFolderModalOpen} 
        onClose={() => setIsDeleteFolderModalOpen(false)}
        folder={folderToDelete}
        onFolderDeleted={handleFolderDeleted}
      />

      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setParentFolderForModal(null); setIsCreateFolderModalOpen(true); }}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 shadow-sm"
        > + Nueva Carpeta Raíz </button>
      </div>

      <div className="flex flex-col md:flex-row gap-x-6 gap-y-4">
        <div className="md:w-1/3 lg:w-1/4 bg-gray-50 p-3 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 px-1">Carpetas del Proyecto</h3>
          <nav className="space-y-0.5">
            {deliverablesTree.length > 0 ? 
                deliverablesTree.map(item => renderTreeItem(item)) :
                ( !treeLoading && <p className="text-sm text-gray-500 px-2 py-4 text-center">No hay carpetas. ¡Crea la primera!</p> )
            }
          </nav>
        </div>

        <div className="md:w-2/3 lg:w-3/4 flex-grow">
          <div className="mb-4">
            <input type="search" placeholder="Buscar documentos en la carpeta actual..." value={documentSearchTerm} onChange={(e) => setDocumentSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>
          
          {selectedFolderId ? (
            filteredDocuments.length > 0 ? (
              <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="min-w-full text-sm divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-3 w-10 sm:w-12"></th> 
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Código Ext.</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Título</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Ult. Rev.</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Opciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                   {filteredDocuments.map(doc => (
                     <Fragment key={doc.id}>
                       <tr className="hover:bg-gray-50 transition-colors">
                         <td className="px-2 py-3 text-center">
                           <button 
                             onClick={() => toggleDocumentVersions(doc.id)} 
                             className="p-1 text-gray-400 hover:text-blue-600 rounded-full focus:outline-none"
                             title={expandedDocumentVersions[doc.id] ? "Ocultar versiones" : "Mostrar versiones"}
                           >
                             {expandedDocumentVersions[doc.id] ? <ChevronDoubleUpIcon className="h-4 w-4" /> : <ChevronDoubleDownIcon className="h-4 w-4" />}
                           </button>
                         </td>
                         <td className="px-4 py-3 whitespace-nowrap text-gray-700">{doc.codigoExt}</td>
                         <td className="px-4 py-3 text-gray-700 min-w-[200px]">{doc.name}</td> 
                         <td className="px-4 py-3 whitespace-nowrap text-gray-700">{doc.ultRevision}</td>
                         <td className="px-4 py-3 whitespace-nowrap">
                           <div className="flex items-center space-x-1">
                             <button title="Ver Detalles" className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-full"><EyeIcon /></button>
                             <button title="Descargar" className="p-1.5 text-green-600 hover:bg-green-100 rounded-full"><DocumentArrowDownIcon /></button>
                             <button title="Historial de Versiones" className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-full"><ClockIcon /></button>
                             <button 
                               title="Subir Nueva Versión" 
                               onClick={() => {setDocumentForVersionModal(doc.id); setIsUploadVersionModalOpen(true);}}
                               className="p-1.5 text-teal-500 hover:bg-teal-100 rounded-full"
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.338 2.166c1.552.322 2.81 1.526 2.81 3.111A2.625 2.625 0 0 1 18.75 19.5H6.75Z" />
                               </svg>
                             </button>
                             <button title="Más opciones" className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full"><EllipsisVerticalIcon /></button>
                           </div>
                         </td>
                       </tr>
               
                       {expandedDocumentVersions[doc.id] && (
                         <tr key={`${doc.id}-versions-row`} className="bg-slate-50"> 
                           <td colSpan={5} className="p-0"> 
                             <div className="px-6 py-3 border-t border-gray-200">
                               {versionsLoading[doc.id] && <div className="py-2"><Loader text="Cargando versiones..." /></div>}
                               {versionsError[doc.id] && <p className="text-xs text-red-600 py-2">{versionsError[doc.id]}</p>}
                               {!versionsLoading[doc.id] && !versionsError[doc.id] && loadedVersions[doc.id] && loadedVersions[doc.id].length > 0 && (
                                 <div>
                                   <h4 className="text-xs font-semibold text-gray-700 mb-1.5">Versiones:</h4>
                                   <ul className="space-y-1.5 text-xs">
                                     {loadedVersions[doc.id].map(version => (
                                       <li key={version.idversion} className="p-1.5 bg-white border border-gray-200 rounded-md shadow-sm">
                                         <div className="flex justify-between items-center">
                                             <div>
                                                 <span className="font-medium text-gray-800">V{version.versionNumber}</span> - 
                                                 <span className="font-mono text-blue-700 ml-1">{version.dropboxFileId}</span>
                                             </div>
                                             <span className="text-gray-400 text-[10px]">
                                                 {version.uploadedAt ? new Date(version.uploadedAt).toLocaleString() : 'N/A'}
                                             </span>
                                         </div>
                                         {version.comments && <p className="italic text-gray-600 mt-0.5 text-[11px] pl-2">"{version.comments}"</p>}
                                         <p className="text-gray-500 text-[11px] pl-2">
                                             Subido por: {version.uploadedBy?.names || 'N/A'}
                                         </p>
                                      
                                       </li>
                                     ))}
                                   </ul>
                                 </div>
                               )}
                               {!versionsLoading[doc.id] && !versionsError[doc.id] && loadedVersions[doc.id] && loadedVersions[doc.id].length === 0 && (
                                 <p className="text-xs text-gray-500 py-2">Este documento no tiene versiones registradas.</p>
                               )}
                             </div>
                           </td>
                         </tr>
                       )}
                     </Fragment>
                   ))}
                 </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 bg-white rounded-lg shadow-md">
                <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-lg text-gray-500">
                  {documentSearchTerm ? 'No hay documentos que coincidan.' : 'Esta carpeta está vacía.'}
                </p>
                {selectedFolderId && (
                  <button
                    onClick={() => { setFolderForDocumentModal(selectedFolderId); setIsCreateDocumentModalOpen(true); }}
                    className="mt-4 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 shadow-sm"
                  > + Crear Documento Aquí </button>
                )}
              </div>
            )
          ) : (
              <div className="text-center py-10 bg-white rounded-lg shadow-md">
                  <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-lg text-gray-500">
                      Seleccione una carpeta para ver su contenido.
                  </p>
              </div>
          )}
        </div>
      </div>
    </>
  );
}

const UserCard = ({ projectUser, canManageRoles, onRoleChange, onRemoveUser }) => {
  const user = projectUser.user; 
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  
  const handleRoleChangeConfirm = async (newRole) => {
    await onRoleChange(projectUser, newRole);
  };

  const handleRemoveUser = () => {
    const confirmMessage = `¿Estás seguro de que quieres eliminar a ${user.names} ${user.lastnames} del proyecto?\n\nEsta acción no se puede deshacer.`;
    if (window.confirm(confirmMessage)) {
      onRemoveUser(projectUser);
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'ADMIN': return 'text-red-600 bg-red-100';
      case 'EDITOR': return 'text-blue-600 bg-blue-100';
      case 'VIEWER': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleDisplayName = (role) => {
    switch(role) {
      case 'ADMIN': return 'Administrador';
      case 'EDITOR': return 'Editor';
      case 'VIEWER': return 'Visualizador';
      default: return role;
    }
  };

  return (
    <>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserCircleIcon className="text-gray-400 h-10 w-10" /> 
            <div>
              <h4 className="font-semibold text-gray-800">{user.names} {user.lastnames}</h4>
              <p className="text-sm text-gray-500">Email: {user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-medium text-gray-600">Rol:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(projectUser.roleCode)}`}>
                  {getRoleDisplayName(projectUser.roleCode)}
                </span>
              </div>
            </div>
          </div>
          
          {canManageRoles && (
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => setIsChangeRoleModalOpen(true)}
                className="px-3 py-1 text-xs text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                title="Cambiar rol del usuario"
              >
                Cambiar Rol
              </button>
              <button
                onClick={handleRemoveUser}
                className="px-3 py-1 text-xs text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
                title="Eliminar usuario del proyecto"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <ChangeRoleModal
        isOpen={isChangeRoleModalOpen}
        onClose={() => setIsChangeRoleModalOpen(false)}
        projectUser={projectUser}
        currentRole={projectUser.roleCode}
        onConfirm={handleRoleChangeConfirm}
      />
    </>
  );
};


function MembersView({ projectId }) {
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState('');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080';
  const [isInviteUserModalOpen, setIsInviteUserModalOpen] = useState(false);
  const [isDeletedUsersViewOpen, setIsDeletedUsersViewOpen] = useState(false);

  
  const { canInviteUsers, userRole, loading: permissionsLoading, error: permissionsError } = useProjectPermissions(projectId);

  
  const canManageRoles = userRole === 'ADMIN';

  const fetchMembers = useCallback(async () => {
    if (!projectId) return;
    setLoadingMembers(true);
    setMembersError('');
    try {
      const response = await axios.get(`${apiUrl}/api/projects/${projectId}/users`, { withCredentials: true });
      setMembers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setMembersError(err.response?.data?.error || err.response?.data?.message || "Error al cargar integrantes.");
      console.error("Error fetching project members:", err);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [projectId, apiUrl]);
  const handleRoleChange = async (projectUser, newRole) => {
    try {
      const payload = {
        userId: projectUser.user.iduser,
        newRoleCode: newRole
      };


      await axios.put(
        `${apiUrl}/api/projects/${projectId}/users/${projectUser.user.iduser}/role`,
        payload,
        { withCredentials: true }
      );


      
      setMembers(prevMembers => 
        prevMembers.map(member => 
          member.user.iduser === projectUser.user.iduser 
            ? { ...member, roleCode: newRole }
            : member
        )
      );

      
      const roleNames = {
        'ADMIN': 'Administrador',
        'EDITOR': 'Editor', 
        'VIEWER': 'Visualizador'
      };
      
      alert(`✅ Rol actualizado exitosamente.\n${projectUser.user.names} ${projectUser.user.lastnames} ahora es ${roleNames[newRole]} del proyecto.`);
      
    } catch (err) {
      console.error("Error changing user role:", err);
      let errorMessage = "Error al cambiar el rol del usuario.";
      
      if (err.response?.status === 403) {
        errorMessage = "No tienes permisos para cambiar roles en este proyecto.";
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.message || err.response?.data || "Solicitud inválida.";
      } else if (err.response?.status === 404) {
        errorMessage = "Usuario o proyecto no encontrado.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data) {
        errorMessage = typeof err.response.data === 'string' ? err.response.data : "Error en el servidor.";
      }
      
      alert(`❌ Error: ${errorMessage}`);
      
      
      fetchMembers();
    }
  };  
  
  const handleRemoveUser = async (projectUser) => {
    try {
      await axios.delete(
        `${apiUrl}/api/projects/${projectId}/users/${projectUser.user.iduser}`,
        { withCredentials: true }
      );

      
      setMembers(prevMembers => 
        prevMembers.filter(member => member.user.iduser !== projectUser.user.iduser)
      );

      alert(`✅ Usuario eliminado exitosamente.\n${projectUser.user.names} ${projectUser.user.lastnames} ha sido removido del proyecto.`);
      
    } catch (err) {
      console.error("Error removing user:", err);
      let errorMessage = "Error al eliminar el usuario del proyecto.";
      
      if (err.response?.status === 403) {
        errorMessage = "No tienes permisos para eliminar usuarios de este proyecto.";
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.message || err.response?.data || "Solicitud inválida.";
      } else if (err.response?.status === 404) {
        errorMessage = "Usuario o proyecto no encontrado.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data) {
        errorMessage = typeof err.response.data === 'string' ? err.response.data : "Error en el servidor.";
      }
      
      alert(`❌ Error: ${errorMessage}`);
      
      
      fetchMembers();
    }
  };

  const handleLeaveProject = async () => {
    const confirmMessage = `¿Estás seguro de que quieres abandonar este proyecto?\n\nEsta acción no se puede deshacer y perderás acceso a todos los documentos y recursos del proyecto.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await axios.post(
          `${apiUrl}/api/projects/${projectId}/leave`,
          {},
          { withCredentials: true }
        );

        alert(`✅ Has abandonado el proyecto exitosamente.\nSerás redirigido al dashboard.`);
        
        
        window.location.href = '/dashboard';
        
      } catch (err) {
        console.error("Error leaving project:", err);
        let errorMessage = "Error al abandonar el proyecto.";
        
        if (err.response?.status === 403) {
          errorMessage = "No puedes abandonar este proyecto. Los últimos administradores no pueden abandonar un proyecto.";
        } else if (err.response?.status === 400) {
          errorMessage = err.response?.data?.message || err.response?.data || "Solicitud inválida.";
        } else if (err.response?.status === 404) {
          errorMessage = "Proyecto no encontrado.";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response?.data) {
          errorMessage = typeof err.response.data === 'string' ? err.response.data : "Error en el servidor.";
        }
        
        alert(`❌ Error: ${errorMessage}`);
      }
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleUserInvited = (invitationDetails) => {
    console.log("Frontend: Detalles de la invitación creada:", invitationDetails);
    if (invitationDetails && invitationDetails.user) {
        alert(`Invitación enviada a ${invitationDetails.user.names} ${invitationDetails.user.lastnames}. El usuario debe aceptar la invitación.`);
    } else {
        alert("Invitación enviada exitosamente. El usuario debe aceptarla.");
    }
    
    fetchMembers();
  };

  
  if (permissionsLoading || loadingMembers) {
    return <Loader text="Cargando datos del proyecto..." />;
  }

  
  if (permissionsError) {
    return (
      <div className="p-4 text-center text-red-600 bg-red-100 rounded-md">
        {permissionsError}
      </div>
    );
  }

  
  if (membersError) {
    return <p className="text-center p-4 text-red-600 bg-red-100 rounded-md">{membersError}</p>;
  }

  return (
    <>
      <InviteUserModal
        isOpen={isInviteUserModalOpen}
        onClose={() => setIsInviteUserModalOpen(false)}
        projectId={projectId}
        onUserInvited={handleUserInvited}
      />      
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          {canInviteUsers && (
            <button
              onClick={() => setIsInviteUserModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 shadow-sm"
            >
              + Invitar Usuario
            </button>
          )}
          
          {canManageRoles && (
            <button
              onClick={() => setIsDeletedUsersViewOpen(true)}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 shadow-sm"
            >
              Ver Usuarios Eliminados
            </button>
          )}
        </div>
        
        <div className="flex space-x-2">
          
          <button
            onClick={handleLeaveProject}
            className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 shadow-sm"
            title="Abandonar este proyecto"
          >
            Abandonar Proyecto
          </button>
          
          {!canInviteUsers && (
            <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Solo los administradores pueden invitar nuevos usuarios.
              </p>
            </div>
          )}
        </div>
      </div><div className="space-y-4">
        {members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">            {members.map((projectUser) => ( 
              <UserCard 
                key={projectUser.id} 
                projectUser={projectUser} 
                canManageRoles={canManageRoles}
                onRoleChange={handleRoleChange}
                onRemoveUser={handleRemoveUser}
              /> 
            ))}
          </div>
        ) : (
          <p className="text-gray-500 py-8 text-center">No hay integrantes actualmente en este proyecto.</p>
        )}      </div>
      
      
      {isDeletedUsersViewOpen && (
        <DeletedUsersView
          projectId={projectId}
          canManageUsers={canManageRoles}
          onClose={() => setIsDeletedUsersViewOpen(false)}
        />
      )}
    </>
  );
};

function ProjectDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('documentation');
  const [projectDetails, setProjectDetails] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState('');

  const projectId = searchParams.get('projectId');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!projectId) { 
        if (!authLoading && user) { 
            setProjectError("ID de proyecto no especificado en la URL.");
            setProjectLoading(false);
        } else if (!authLoading && !user){
         
        }
        return;
    }
    

    if (authLoading || !user) return;


    setProjectLoading(true);
    setProjectError('');
    const fetchProjectDetails = async () => {
      try {
   
        const projectNameFromQuery = searchParams.get('projectName');
        if (!projectNameFromQuery) console.warn("projectName no encontrado en query params, usando placeholder.");
        
        setProjectDetails({ 
            id: projectId, 
            name: decodeURIComponent(projectNameFromQuery || `Proyecto ID: ${projectId}`),
        });
      } catch (err) {
        setProjectError(err.response?.data?.error || err.response?.data?.message || "Error al cargar detalles del proyecto.");
        console.error("Error fetching project details:", err);
        setProjectDetails(null);
      } finally {
        setProjectLoading(false);
      }
    };
    fetchProjectDetails();
  }, [projectId, searchParams, authLoading, user, router]);


  if (authLoading) return <Loader text="Verificando sesión..." />;
  if (!user && !authLoading) return null; 
  if (projectLoading && projectId) return <Loader text="Cargando datos del proyecto..." />; 
  if (projectError) return <div className="p-6 text-center text-red-600 bg-red-100 rounded-md shadow-md">{projectError}</div>;
  if (!projectDetails && projectId) return <div className="p-6 text-center text-gray-500 bg-gray-100 rounded-md shadow-md">No se pudieron cargar los detalles del proyecto.</div>;
  if (!projectId) return <div className="p-6 text-center text-gray-500 bg-gray-100 rounded-md shadow-md">ID de proyecto no encontrado.</div>; 

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-full mx-auto px-0">
        <div className="mb-6">
            <nav className="text-sm mb-2" aria-label="Breadcrumb">
              <ol className="list-none p-0 inline-flex space-x-1.5 items-center">
                <li className="flex items-center">
                  <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 hover:underline">Dashboard</Link>
                </li>
                <li className="flex items-center text-gray-400"> <ChevronRightIcon className="h-3.5 w-3.5" /> </li>
                <li className="flex items-center">
                  <span className="text-gray-700 font-medium truncate max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-lg xl:max-w-lg" title={projectDetails.name}>
                    {projectDetails.name}
                  </span>
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 truncate" title={projectDetails.name}>
                {projectDetails.name}
            </h1>
        </div>
        
        <div className="mb-6 border-b border-gray-300">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('documentation')}
              className={`py-3 px-1 border-b-2 font-semibold text-sm whitespace-nowrap ${activeTab === 'documentation' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'}`}
            > Documentación y Entregables </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-3 px-1 border-b-2 font-semibold text-sm whitespace-nowrap ${activeTab === 'members' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'}`}
            > Integrantes del Proyecto </button>
          </nav>
        </div>

        <div>
          {activeTab === 'documentation' && projectDetails.id && <EnhancedDocumentationView projectId={projectDetails.id} />}
          {activeTab === 'members' && projectDetails.id && <MembersView projectId={projectDetails.id} />}
        </div>
      </div>
    </div>
  );
}

export default function ProjectPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-100"><Loader text="Cargando página del proyecto..." /></div>}>
      <ProjectDetailContent />
    </Suspense>
  );
}