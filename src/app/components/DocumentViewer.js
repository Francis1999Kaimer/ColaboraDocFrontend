import React, { useEffect, useRef, useState, useCallback } from 'react';

const DocumentViewer = ({ 
  documentUrl, 
  annotations = [], 
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationDelete,
  onCursorMove,
  cursors = [],
  currentUser,
  isReadOnly = false
}) => {  const canvasContainerRef = useRef(null);
  const annotationLayerRef = useRef(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [annotationMode, setAnnotationMode] = useState(null); 
  const [showAnnotationPanel, setShowAnnotationPanel] = useState(false);
  const [pdfjsLib, setPdfjsLib] = useState(null);
  const canvasRef = useRef(null);
  
  
  const scale = 1.2;
  
  useEffect(() => {
    const loadPDFJS = async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        
        
        if (typeof window !== 'undefined') {
          
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
          
          
          try {
            const workerTest = await fetch('/pdf.worker.min.mjs');
            if (!workerTest.ok) {
              
              pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
              
              const workerTestJS = await fetch('/pdf.worker.min.js');
              if (!workerTestJS.ok) {
                
                pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
              }
            }
          } catch (fetchError) {
            console.warn('Worker fetch test failed, using CDN fallback:', fetchError);
            pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
          }
        }
        
        setPdfjsLib(pdfjs);
      } catch (error) {
        console.error('Error loading PDF.js:', error);
        setError('Error al cargar el sistema de visualización PDF');
      }
    };

    loadPDFJS();
  }, []);
  
  useEffect(() => {
    if (!documentUrl || !pdfjsLib) return;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadingTask = pdfjsLib.getDocument({
          url: documentUrl,
          cMapUrl: '/cmaps/',
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Error al cargar el documento PDF');
      } finally {        setLoading(false);
      }
    };

    loadPDF();
  }, [documentUrl, pdfjsLib]);
  
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(1); 
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
        setError('Error al renderizar la página');
      }
    };

    renderPage();
  }, [pdfDocument, scale]);
  
  const handleMouseDown = useCallback((e) => {
    if (isReadOnly || !annotationMode) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentAnnotation({
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      type: annotationMode,
      pageNumber: 1 
    });
  }, [isReadOnly, annotationMode]);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    
    if (onCursorMove) {
      onCursorMove(x, y, 1); 
    }

    if (isDrawing && currentAnnotation) {
      setCurrentAnnotation(prev => ({
        ...prev,
        endX: x,
        endY: y
      }));
    }
  }, [isDrawing, currentAnnotation, onCursorMove]);

  const handleMouseUp = useCallback((e) => {
    if (!isDrawing || !currentAnnotation) return;

    setIsDrawing(false);

    
    const minSize = 10;
    const width = Math.abs(currentAnnotation.endX - currentAnnotation.startX);
    const height = Math.abs(currentAnnotation.endY - currentAnnotation.startY);

    if (width > minSize || height > minSize) {
      const annotation = {
        ...currentAnnotation,
        id: Date.now().toString(),
        userId: currentUser?.id,
        userName: currentUser?.name,
        createdAt: new Date().toISOString(),
        text: annotationMode === 'note' ? 'Nueva nota' : '',
        color: currentUser?.color || '#FFD700'
      };

      if (onAnnotationCreate) {
        onAnnotationCreate(annotation);
      }

      if (annotationMode === 'note') {
        setShowAnnotationPanel(true);
      }
    }

    setCurrentAnnotation(null);
  }, [isDrawing, currentAnnotation, annotationMode, currentUser, onAnnotationCreate]);
  
  const renderAnnotations = () => {
    const pageAnnotations = annotations.filter(ann => ann.pageNumber === 1);
    
    return pageAnnotations.map(annotation => (
      <div
        key={annotation.id}
        className="absolute border-2 cursor-pointer"
        style={{
          left: Math.min(annotation.startX, annotation.endX),
          top: Math.min(annotation.startY, annotation.endY),
          width: Math.abs(annotation.endX - annotation.startX),
          height: Math.abs(annotation.endY - annotation.startY),
          borderColor: annotation.color,
          backgroundColor: annotation.type === 'highlight' ? 
            `${annotation.color}33` : 'transparent',
          pointerEvents: isReadOnly ? 'none' : 'auto'
        }}
        onClick={() => handleAnnotationClick(annotation)}
        title={annotation.text || `${annotation.type} por ${annotation.userName}`}
      >
        {annotation.type === 'note' && (
          <div 
            className="absolute -top-2 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: annotation.color }}
          >
            ✓
          </div>
        )}
      </div>
    ));
  };

  
  const renderCursors = () => {
    return cursors
      .filter(cursor => cursor.pageNumber === 1)
      .map(cursor => (
        <div
          key={cursor.userId}
          className="absolute pointer-events-none z-50"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: 'translate(-2px, -2px)'
          }}
        >
          <div 
            className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
            style={{ backgroundColor: cursor.color }}
          />
          <div 
            className="absolute top-4 left-0 px-2 py-1 rounded text-xs text-white whitespace-nowrap shadow-lg"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.userName}
          </div>
        </div>
      ));
  };

  const handleAnnotationClick = (annotation) => {
    if (isReadOnly) return;
    
    
    setShowAnnotationPanel(true);
    
  };
  
  const handleDownload = () => {
    if (documentUrl) {
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = 'documento.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando documento...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️</div>
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (    <div className="flex flex-col h-full bg-gray-100">
      
      <div className="flex items-center justify-between p-4 bg-white border-b shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold text-gray-700">Editor de Anotaciones</span>
        </div>

        <div className="flex items-center space-x-4">
          
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2"
          >
            <span>📥</span>
            <span>Descargar</span>
          </button>

          
          {!isReadOnly && (
            <div className="flex items-center space-x-2 border-l pl-4">
              <button
                onClick={() => setAnnotationMode(annotationMode === 'highlight' ? null : 'highlight')}
                className={`px-3 py-2 rounded flex items-center space-x-1 ${
                  annotationMode === 'highlight' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <span>📝</span>
                <span>Resaltar</span>
              </button>
              <button
                onClick={() => setAnnotationMode(annotationMode === 'note' ? null : 'note')}
                className={`px-3 py-2 rounded flex items-center space-x-1 ${
                  annotationMode === 'note' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <span>💬</span>
                <span>Nota</span>
              </button>
              <button
                onClick={() => setAnnotationMode(annotationMode === 'arrow' ? null : 'arrow')}
                className={`px-3 py-2 rounded flex items-center space-x-1 ${
                  annotationMode === 'arrow' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <span>➤</span>
                <span>Flecha</span>
              </button>
            </div>
          )}
        </div>
      </div>

      
      <div className="flex-1 overflow-auto">
        <div className="flex justify-center p-4">
          <div 
            ref={canvasContainerRef}
            className="relative bg-white shadow-lg"
            style={{ 
              width: 'fit-content',
              cursor: annotationMode ? 'crosshair' : 'default'
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => setIsDrawing(false)}
              className="block"
            />
            
            
            <div ref={annotationLayerRef} className="absolute inset-0">
              {renderAnnotations()}
              {renderCursors()}
              
              
              {isDrawing && currentAnnotation && (
                <div
                  className="absolute border-2 border-dashed"
                  style={{
                    left: Math.min(currentAnnotation.startX, currentAnnotation.endX),
                    top: Math.min(currentAnnotation.startY, currentAnnotation.endY),
                    width: Math.abs(currentAnnotation.endX - currentAnnotation.startX),
                    height: Math.abs(currentAnnotation.endY - currentAnnotation.startY),
                    borderColor: currentUser?.color || '#FFD700',
                    backgroundColor: currentAnnotation.type === 'highlight' ? 
                      `${currentUser?.color || '#FFD700'}33` : 'transparent'
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      
      {showAnnotationPanel && (
        <div className="absolute right-4 top-20 w-80 bg-white border rounded-lg shadow-lg p-4 z-40">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Detalles de Anotación</h3>
            <button
              onClick={() => setShowAnnotationPanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            <textarea
              placeholder="Escribir comentario..."
              className="w-full p-2 border rounded"
              rows="3"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAnnotationPanel(false)}
                className="px-3 py-1 text-gray-600 border rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
