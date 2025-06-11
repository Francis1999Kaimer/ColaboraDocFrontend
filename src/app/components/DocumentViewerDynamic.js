'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';


const LoadingComponent = () => (
  <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Cargando visor de documentos...</p>
    </div>
  </div>
);


const DocumentViewer = dynamic(
  () => import('./DocumentViewer'),
  {
    loading: () => <LoadingComponent />,
    ssr: false
  }
);

const DocumentViewerDynamic = ({ 
  documentUrl, 
  documentId, 
  currentUser, 
  annotations = [], 
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationDelete,
  onCursorMove,
  cursors = [],
  isReadOnly = false 
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <LoadingComponent />;
  }

  return (
    <DocumentViewer
      documentUrl={documentUrl}
      documentId={documentId}
      currentUser={currentUser}
      annotations={annotations}
      onAnnotationCreate={onAnnotationCreate}
      onAnnotationUpdate={onAnnotationUpdate}
      onAnnotationDelete={onAnnotationDelete}
      onCursorMove={onCursorMove}
      cursors={cursors}
      isReadOnly={isReadOnly}
    />
  );
};

export default DocumentViewerDynamic;
