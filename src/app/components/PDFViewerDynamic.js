'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';


const LoadingComponent = () => (
  <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Cargando visor PDF...</p>
    </div>
  </div>
);


const PDFViewer = dynamic(
  () => import('./PDFViewer'),
  {
    loading: () => <LoadingComponent />,
    ssr: false
  }
);

const PDFViewerDynamic = ({ documentUrl, documentId, currentUser, isReadOnly = true }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <LoadingComponent />;
  }

  return (
    <PDFViewer
      documentUrl={documentUrl}
      documentId={documentId}
      currentUser={currentUser}
      isReadOnly={isReadOnly}
    />
  );
};

export default PDFViewerDynamic;
