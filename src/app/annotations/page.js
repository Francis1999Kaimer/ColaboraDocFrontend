 'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios'; 
import documentDownloadService from '../../services/DocumentDownloadService'; 
import annotationService from '../../services/AnnotationService'; 
import { useAuth } from '../context/authcontext'; 


function hexToRgba(hex, alpha) {
    if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) return hex; 
    
    let c = hex.substring(1).split('');
    if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    
    const r = (c >> 16) & 255;
    const g = (c >> 8) & 255;
    const b = c & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


const PDF_CONFIG = {
  SCALE: 1.5,
  WORKER_TIMEOUT: 10000,
  FALLBACK_TIMEOUT: 15000,
  RENDER_TIMEOUT: 15000
};

const ERROR_MESSAGES = {
  NO_VERSION: 'No se especificó una versión del documento',
  NO_DOCUMENT: 'No se especificó el ID del documento',
  EMPTY_FILE: 'El archivo descargado está vacío',
  SMALL_FILE: 'El archivo descargado es demasiado pequeño para ser un PDF válido',
  INVALID_PDF: 'El archivo no es un PDF válido',
  TIMEOUT: 'El PDF tardó demasiado en procesarse. Intenta con un archivo más pequeño.',
  WORKER_ERROR: 'Error de configuración de PDF.js. El PDF se descargó correctamente pero no se pudo procesar.',
  CORRUPTED: 'El archivo PDF está corrupto o no es válido.',
  PASSWORD: 'El PDF está protegido con contraseña.',
  MISSING: 'No se pudo encontrar el contenido del PDF.'
};


const DEFAULT_ANNOTATION_STYLE = { fontSize: 30, fontFamily: "Arial", color: "#000000", backgroundColor: "transparent", borderWidth: 1, borderColor: "#0000FF" };
const DEFAULT_ANNOTATION_SIZE = { width: 250 / PDF_CONFIG.SCALE, height: 40 / PDF_CONFIG.SCALE };
const DEFAULT_ARROW_STYLE = { color: "#FF0000", strokeWidth: 3 }; 
const DEFAULT_SHAPE_STYLE = { 
    shapeType: "SQUARE",
    fillColor: "#808080", 
    fillOpacity: 0.5,     
    strokeColor: "#0000FF",
    strokeWidth: 2 
};

const DEFAULT_SHAPE_SIZE = 30; 


const StaticShapeAnnotation = ({ annotation, scaledDimensions, onEdit, isEditing }) => {
    if (isEditing) return null;

    const coords = JSON.parse(annotation.coordinates); 
    const styleProps = JSON.parse(annotation.styleProperties); 
    const finalFillColor = hexToRgba(styleProps.fillColor, styleProps.fillOpacity ?? 1); 


    
    const x = (coords.x / 100) * scaledDimensions.width;
    const y = (coords.y / 100) * scaledDimensions.height;
    const width = (coords.width / 100) * scaledDimensions.width;
    const height = (coords.height / 100) * scaledDimensions.height;

    return (
        <div
            style={{ position: 'absolute', top: y, left: x, width, height, pointerEvents: 'auto', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); onEdit(annotation); }}
            onMouseOver={(e) => e.currentTarget.style.filter = 'drop-shadow(0 0 3px rgba(59, 130, 246, 0.9))'}
            onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
            title="Haz clic para editar"
        >
            <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                {styleProps.shapeType === 'SQUARE' ? (
                    <rect x="0" y="0" width="100%" height="100%" fill={finalFillColor} stroke={styleProps.strokeColor}  strokeWidth={styleProps.strokeWidth} />
                ) : (
                    <ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill={finalFillColor} stroke={styleProps.strokeColor}  strokeWidth={styleProps.strokeWidth} />
                )}
            </svg>
        </div>
    );
};


const EditableShapeAnnotation = ({ annotation, onSave, onCancel, onAnnotationChange, scaledDimensions }) => {
    const [dragInfo, setDragInfo] = useState(null);
    const coords = JSON.parse(annotation.coordinates); 
    const styleProps = JSON.parse(annotation.styleProperties);
    const finalFillColor = hexToRgba(styleProps.fillColor, styleProps.fillOpacity ?? 1); 

    
    const x = (coords.x / 100) * scaledDimensions.width;
    const y = (coords.y / 100) * scaledDimensions.height;
    const width = (coords.width / 100) * scaledDimensions.width;
    const height = (coords.height / 100) * scaledDimensions.height;

    const handleMouseDown = (e, type, handle = null) => {
        e.stopPropagation();
        setDragInfo({ type, handle, startX: e.clientX, startY: e.clientY, initialCoords: { ...coords } });
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!dragInfo) return;
            e.preventDefault(); 
            
            const deltaX = (e.clientX - dragInfo.startX) / scaledDimensions.width * 100;
            const deltaY = (e.clientY - dragInfo.startY) / scaledDimensions.height * 100;

            let newCoords = { ...dragInfo.initialCoords };

            if (dragInfo.type === 'move') {
                newCoords.x += deltaX;
                newCoords.y += deltaY;
            } else if (dragInfo.type === 'resize') {
                
                const handle = dragInfo.handle;
                
                
                if (handle.includes('e')) { newCoords.width += deltaX; }
                
                if (handle.includes('w')) { newCoords.width -= deltaX; newCoords.x += deltaX; }
                
                if (handle.includes('s')) { newCoords.height += deltaY; }
                
                if (handle.includes('n')) { newCoords.height -= deltaY; newCoords.y += deltaY; }
                
                
                if (newCoords.width < 1) newCoords.width = 1;
                if (newCoords.height < 1) newCoords.height = 1;
            }
            
            onAnnotationChange({ ...annotation, coordinates: JSON.stringify(newCoords) });
        };

        const handleMouseUp = () => setDragInfo(null);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragInfo, onAnnotationChange, annotation, scaledDimensions]);
    
    const handleStyle = { position: 'absolute', width: '12px', height: '12px', backgroundColor: 'white', border: '2px solid #007bff', zIndex: 1002 };

    return (
        <div style={{ position: 'absolute', top: y, left: x, width, height, cursor: 'move' }} onMouseDown={(e) => { if (e.target === e.currentTarget) handleMouseDown(e, 'move'); }}>
            <svg width="100%" height="100%" style={{ overflow: 'visible', pointerEvents: 'none', border: '1px dashed #007bff' }}>
                {styleProps.shapeType === 'SQUARE' ? (
                    <rect x="0" y="0" width="100%" height="100%" fill={finalFillColor} stroke={styleProps.strokeColor} strokeWidth={styleProps.strokeWidth} />
                ) : (
                    <ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill={finalFillColor} stroke={styleProps.strokeColor} strokeWidth={styleProps.strokeWidth} />
                )}
            </svg>
            
            
            
            <div style={{...handleStyle, top: '-6px', left: '-6px', cursor: 'nwse-resize'}} onMouseDown={(e) => handleMouseDown(e, 'resize', 'nw')}></div>
            <div style={{...handleStyle, top: '-6px', right: '-6px', cursor: 'nesw-resize'}} onMouseDown={(e) => handleMouseDown(e, 'resize', 'ne')}></div>
            <div style={{...handleStyle, bottom: '-6px', left: '-6px', cursor: 'nesw-resize'}} onMouseDown={(e) => handleMouseDown(e, 'resize', 'sw')}></div>
            <div style={{...handleStyle, bottom: '-6px', right: '-6px', cursor: 'nwse-resize'}} onMouseDown={(e) => handleMouseDown(e, 'resize', 'se')}></div>
            
            
            <div style={{...handleStyle, top: '-6px', left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize'}} onMouseDown={(e) => handleMouseDown(e, 'resize', 'n')}></div>
            <div style={{...handleStyle, bottom: '-6px', left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize'}} onMouseDown={(e) => handleMouseDown(e, 'resize', 's')}></div>
            <div style={{...handleStyle, top: '50%', left: '-6px', transform: 'translateY(-50%)', cursor: 'ew-resize'}} onMouseDown={(e) => handleMouseDown(e, 'resize', 'w')}></div>
            <div style={{...handleStyle, top: '50%', right: '-6px', transform: 'translateY(-50%)', cursor: 'ew-resize'}} onMouseDown={(e) => handleMouseDown(e, 'resize', 'e')}></div>

            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '10px', display: 'flex', gap: '8px' }} onMouseDown={e => e.stopPropagation()}>
                <button onClick={() => onSave(annotation)} style={{ padding: '4px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Aceptar</button>
                <button onClick={onCancel} style={{ padding: '4px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
            </div>
        </div>
    );
};


const StaticArrowAnnotation = ({ annotation, scaledDimensions, onEdit, isEditing }) => {
    if (isEditing) return null;

    const coords = JSON.parse(annotation.coordinates);
    const styleProps = JSON.parse(annotation.styleProperties);

    const x1 = (coords.x1 / 100) * scaledDimensions.width;
    const y1 = (coords.y1 / 100) * scaledDimensions.height;
    const x2 = (coords.x2 / 100) * scaledDimensions.width;
    const y2 = (coords.y2 / 100) * scaledDimensions.height;

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowHeadLength = Math.min(20, styleProps.strokeWidth * 5);

    
    return (
        <svg 
            width="100%" 
            height="100%" 
            style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                overflow: 'visible', 
                
                pointerEvents: 'none' 
            }}
        >
            <g 
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(annotation);
                }} 
                style={{ cursor: 'pointer', pointerEvents: 'auto' }} 
                onMouseOver={(e) => e.currentTarget.style.filter = 'drop-shadow(0 0 3px rgba(59, 130, 246, 0.9))'}
                onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
                title="Haz clic para editar"
            >
                
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={Math.max(15, styleProps.strokeWidth + 10)} />
                
                
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={styleProps.color} strokeWidth={styleProps.strokeWidth} />
                
                
                <polygon
                    points={`0,0 -${arrowHeadLength},-${arrowHeadLength/2} -${arrowHeadLength},${arrowHeadLength/2}`}
                    fill={styleProps.color}
                    transform={`translate(${x2}, ${y2}) rotate(${angle * 180 / Math.PI})`}
                />
            </g>
        </svg>
    );
};



const EditableArrowAnnotation = ({ annotation, onSave, onCancel, onAnnotationChange, scaledDimensions }) => {
    const [dragInfo, setDragInfo] = useState(null);
    const coords = JSON.parse(annotation.coordinates);
    const styleProps = JSON.parse(annotation.styleProperties);

    
    const x1 = (coords.x1 / 100) * scaledDimensions.width;
    const y1 = (coords.y1 / 100) * scaledDimensions.height;
    const x2 = (coords.x2 / 100) * scaledDimensions.width;
    const y2 = (coords.y2 / 100) * scaledDimensions.height;

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowHeadLength = Math.min(20, styleProps.strokeWidth * 5);

    const handleMouseDown = (e, type, handle = null) => {
        e.stopPropagation();
        setDragInfo({ type, handle, startX: e.clientX, startY: e.clientY, initialCoords: { ...coords } });
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!dragInfo) return;
            const deltaX = (e.clientX - dragInfo.startX) / scaledDimensions.width * 100;
            const deltaY = (e.clientY - dragInfo.startY) / scaledDimensions.height * 100;

            let newCoords = { ...dragInfo.initialCoords };
            if (dragInfo.type === 'move') {
                newCoords.x1 += deltaX; newCoords.y1 += deltaY;
                newCoords.x2 += deltaX; newCoords.y2 += deltaY;
            } else if (dragInfo.type === 'resize') {
                if (dragInfo.handle === 'start') {
                    newCoords.x1 += deltaX; newCoords.y1 += deltaY;
                } else { 
                    newCoords.x2 += deltaX; newCoords.y2 += deltaY;
                }
            }
            onAnnotationChange({ ...annotation, coordinates: JSON.stringify(newCoords) });
        };

        const handleMouseUp = () => setDragInfo(null);

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragInfo, onAnnotationChange, annotation, scaledDimensions]);
    
    const handleStyle = { position: 'absolute', width: '14px', height: '14px', backgroundColor: 'white', border: '2px solid #007bff', borderRadius: '50%', transform: 'translate(-50%, -50%)', zIndex: 1002 };

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'auto' }}>
            <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={styleProps.color} strokeWidth={styleProps.strokeWidth} strokeDasharray="5,5" onMouseDown={(e) => handleMouseDown(e, 'move')} style={{cursor: 'move'}}/>
                <polygon points={`0,0 -${arrowHeadLength},-${arrowHeadLength/2} -${arrowHeadLength},${arrowHeadLength/2}`} fill={styleProps.color} transform={`translate(${x2}, ${y2}) rotate(${angle * 180 / Math.PI})`} />
            </svg>

            
            <div style={{ ...handleStyle, top: `${y1}px`, left: `${x1}px`, cursor: 'grab' }} onMouseDown={(e) => handleMouseDown(e, 'resize', 'start')}></div>
            <div style={{ ...handleStyle, top: `${y2}px`, left: `${x2}px`, cursor: 'grab' }} onMouseDown={(e) => handleMouseDown(e, 'resize', 'end')}></div>

            <div style={{ position: 'absolute', top: `${y2 + 15}px`, left: `${x2}px`, transform: 'translateX(-50%)', display: 'flex', gap: '8px' }} onMouseDown={e => e.stopPropagation()}>
                <button onClick={() => onSave(annotation)} style={{ padding: '4px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Aceptar</button>
                <button onClick={onCancel} style={{ padding: '4px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
            </div>
        </div>
    );
};




const EditableTextAnnotation = ({
  annotation,           
  onSave,
  onCancel,
  onAnnotationChange,   
  scaledDimensions,
  originalDimensions,
  onInteractionChange
}) => {
  
  const [dragInfo, setDragInfo] = useState(null);
  const textareaRef = useRef(null);

  const scale = useMemo(() => scaledDimensions.width / originalDimensions.width, [scaledDimensions, originalDimensions]);

  
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      
      const scrollHeight = textarea.scrollHeight + 2; 
      textarea.style.height = `${scrollHeight}px`;
      const newHeightInBaseUnits = scrollHeight / scale;

      const coords = JSON.parse(annotation.coordinates);
      
      if (Math.abs(coords.height - newHeightInBaseUnits) > 1) {
         
         onAnnotationChange({ 
           ...annotation, 
           coordinates: JSON.stringify({ ...coords, height: newHeightInBaseUnits }) 
         });
      }
    }
  }, [annotation.content, annotation.coordinates, scale, onAnnotationChange, annotation]);

  
  const handleMouseDown = useCallback((e, type) => {
      e.stopPropagation();
      const coords = JSON.parse(annotation.coordinates);
      setDragInfo({
          type,
          startX: e.clientX,
          startY: e.clientY,
          initialXPercent: coords.x,
          initialYPercent: coords.y,
          initialWidthBase: coords.width
      });
  }, [annotation.coordinates]);

  
  useEffect(() => {
      const handleMouseMove = (e) => {
          if (!dragInfo) return;
          e.preventDefault();
          e.stopPropagation();

          const coords = JSON.parse(annotation.coordinates);
          const deltaX_pixels = e.clientX - dragInfo.startX;
          const deltaY_pixels = e.clientY - dragInfo.startY;

          switch (dragInfo.type) {
              case 'move':
                  coords.x = dragInfo.initialXPercent + (deltaX_pixels / scaledDimensions.width * 100);
                  coords.y = dragInfo.initialYPercent + (deltaY_pixels / scaledDimensions.height * 100);
                  break;
              case 'resize-w': {
                  const newWidth = dragInfo.initialWidthBase - (deltaX_pixels / scale);
                  if (newWidth > 50) { 
                      coords.width = newWidth;
                      coords.x = dragInfo.initialXPercent + (deltaX_pixels / scaledDimensions.width * 100);
                  }
                  break;
              }
              case 'resize-e': {
                  const newWidth = dragInfo.initialWidthBase + (deltaX_pixels / scale);
                  if (newWidth > 50) { 
                      coords.width = newWidth;
                  }
                  break;
              }
              default:
                  break;
          }
          
          onAnnotationChange({ ...annotation, coordinates: JSON.stringify(coords) });
      };

      const handleMouseUp = (e) => {
          if (!dragInfo) return;
          e.stopPropagation();
          setDragInfo(null);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
      };
  }, [dragInfo, scale, scaledDimensions, annotation, onAnnotationChange]);

  
  const coords = JSON.parse(annotation.coordinates);
  const styleProps = JSON.parse(annotation.styleProperties);
  const scaledX = (coords.x / 100) * scaledDimensions.width;
  const scaledY = (coords.y / 100) * scaledDimensions.height;
  const scaledWidth = coords.width * scale;

  const containerStyle = {
    position: 'absolute', left: `${scaledX}px`, top: `${scaledY}px`, width: `${scaledWidth}px`,
    cursor: 'move', border: `${styleProps.borderWidth || 1}px solid ${styleProps.borderColor || 'blue'}`,
    zIndex: 1000, backgroundColor: styleProps.backgroundColor || 'transparent',
    boxSizing: 'border-box',
  };
  const textareaStyle = {
    width: '100%', height: 'auto', padding: `${4 * scale}px`, border: 'none',
    outline: 'none', resize: 'none', overflow: 'hidden', backgroundColor: 'transparent',
    color: styleProps.color || '#000000', fontSize: `${(styleProps.fontSize || 30) * scale}px`,
    fontFamily: styleProps.fontFamily || 'Arial', lineHeight: 1.2,
    boxSizing: 'border-box',
  };
  const handleStyle = {position:'absolute',width:'10px',height:'10px',backgroundColor:'white',border:'1px solid #007bff',transform:'translate(-50%, -50%)',zIndex:1001};
  
  
  const handleSave = () => {
      if (annotation.content.trim()) {
          onSave(annotation);
      } else {
          onCancel();
      }
  };

  return (
    <div style={containerStyle} onMouseDown={(e) => { if (e.target === e.currentTarget) handleMouseDown(e, 'move') }} onMouseEnter={() => onInteractionChange(true)} onMouseLeave={() => onInteractionChange(false)}>
      <textarea
        ref={textareaRef}
        style={textareaStyle}
        value={annotation.content} 
        
        onChange={(e) => onAnnotationChange({ ...annotation, content: e.target.value })}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="Escribe aquí..."
        autoFocus
      />
      <div style={{...handleStyle,top:'50%',left:'0',cursor:'ew-resize'}} onMouseDown={(e)=>handleMouseDown(e,'resize-w')}></div>
      <div style={{...handleStyle,top:'50%',left:'100%',cursor:'ew-resize'}} onMouseDown={(e)=>handleMouseDown(e,'resize-e')}></div>
      <div style={{...handleStyle,top:'0',left:'50%',cursor:'not-allowed'}}></div><div style={{...handleStyle,top:'100%',left:'50%',cursor:'not-allowed'}}></div>
      <div style={{...handleStyle,top:'0',left:'0',cursor:'not-allowed'}}></div><div style={{...handleStyle,top:'0',left:'100%',cursor:'not-allowed'}}></div>
      <div style={{...handleStyle,top:'100%',left:'0',cursor:'not-allowed'}}></div><div style={{...handleStyle,top:'100%',left:'100%',cursor:'not-allowed'}}></div>
      <div style={{position:'absolute',top:'100%',left:0,marginTop:'8px',display:'flex',gap:'8px'}} onMouseDown={e=>e.stopPropagation()}>
        <button onClick={handleSave} style={{padding:'4px 12px',backgroundColor:'#28a745',color:'white',border:'none',borderRadius:'4px',cursor:'pointer'}}>Aceptar</button>
        <button onClick={onCancel} style={{padding:'4px 12px',backgroundColor:'#dc3545',color:'white',border:'none',borderRadius:'4px',cursor:'pointer'}}>Cancelar</button>
      </div>
    </div>
  );
};


const StaticTextAnnotation = ({ annotation, scaledDimensions, originalDimensions, onEdit, isEditing }) => {
    
    if (isEditing) {
        return null;
    }

    const coords = JSON.parse(annotation.coordinates);
    const styleProps = JSON.parse(annotation.styleProperties);
    const scale = scaledDimensions.width / originalDimensions.width;
    
    const style = {
      position: 'absolute',
      left: `${(coords.x / 100) * scaledDimensions.width}px`,
      top: `${(coords.y / 100) * scaledDimensions.height}px`,
      width: `${coords.width * scale}px`,
      height: `${coords.height * scale}px`,
      border: `${styleProps.borderWidth}px solid ${styleProps.borderColor}`,
      backgroundColor: styleProps.backgroundColor,
      color: styleProps.color,
      fontSize: `${styleProps.fontSize * scale}px`,
      fontFamily: styleProps.fontFamily,
      padding: `${4 * scale}px`,
      whiteSpace: 'pre-wrap',
      overflowWrap: 'break-word',
      lineHeight: 1.2,
      boxSizing: 'border-box',
      
      pointerEvents: 'auto', 
      cursor: 'pointer',     
      transition: 'box-shadow 0.2s ease-in-out',
    };
    
    const handleMouseOver = (e) => {
        
        e.currentTarget.style.boxShadow = `0 0 0 2px rgba(59, 130, 246, 0.7)`;
    };

    const handleMouseOut = (e) => {
        e.currentTarget.style.boxShadow = 'none';
    };

    return (
        <div 
            style={style} 
             onClick={(e) => {
            e.stopPropagation(); 
            onEdit(annotation);
            }}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            title="Haz clic para editar"
        >
            {annotation.content}
        </div>
    );
};


const AnnotationLayer = ({ annotations, tool, onAddAnnotation, editingAnnotation, onSaveAnnotation, onCancelEdit, onEditAnnotation, scaledDimensions, originalDimensions, currentPage, onAnnotationInteraction, onAnnotationChange }) => {
    const layerRef = useRef(null);
    const [drawingArrow, setDrawingArrow] = useState(null);

    
    console.log(`[AnnotationLayer Render] Tool: %c${tool}`, 'color: #007bff; font-weight: bold;', `| Editing: %c${!!editingAnnotation}`, 'color: #dc3545; font-weight: bold;', '| Drawing Arrow:', !!drawingArrow);

    const getCoordsPercent = (e) => {
        if (!layerRef.current) return null;
        const rect = layerRef.current.getBoundingClientRect();
        const xPercent = ((e.clientX - rect.left) / scaledDimensions.width) * 100;
        const yPercent = ((e.clientY - rect.top) / scaledDimensions.height) * 100;
        return { x: xPercent, y: yPercent };
    };
    


    
const handleClick = (e) => {
    
    console.log(`[handleClick] Fired. Tool: ${tool}, Is editing: ${!!editingAnnotation}, Target:`, e.target);

    
    if (editingAnnotation) {
        console.log(`[handleClick] Aborting: an annotation is already being edited.`);
        return;
    }

    
    
    
    if (e.target !== layerRef.current) {
        console.log(`[handleClick] Aborting: click target is not the main layer.`);
        return;
    }

    
    if (tool === 'TEXT') {
        const coords = getCoordsPercent(e);
        if (coords) {
            console.log('%c[handleClick] ADDING TEXT ANNOTATION at:', 'background: #28a745; color: white; padding: 2px 5px; border-radius: 3px;', coords);
            onAddAnnotation({ annotationType: 'TEXT', coords });
        } else {
            console.error("[handleClick] Could not get coordinates for TEXT.");
        }
        return; 
    }

    
    if (tool === 'SHAPE') {
        const coords = getCoordsPercent(e);
        if (coords) {
            console.log('%c[handleClick] ADDING SHAPE ANNOTATION at:', 'background: #28a745; color: white; padding: 2px 5px; border-radius: 3px;', coords);
            onAddAnnotation({ annotationType: 'SHAPE', coords });
        } else {
            console.error("[handleClick] Could not get coordinates for SHAPE.");
        }
        return; 
    }
};

    
    const handleMouseDown = (e) => {
        console.log(`[handleMouseDown] Fired. Tool: ${tool}, Is editing: ${!!editingAnnotation}`);
        
        const canDrawArrow = tool === 'ARROW' && !editingAnnotation;
        console.log(`[handleMouseDown] Can I start drawing arrow? %c${canDrawArrow}`, `color: ${canDrawArrow ? 'green' : 'red'}; font-weight: bold;`);
        
        if (canDrawArrow) {
            const coords = getCoordsPercent(e);
            if(coords) {
                console.log('%c[handleMouseDown] STARTING ARROW DRAW at:', 'background: #17a2b8; color: white; padding: 2px 5px; border-radius: 3px;', coords);
                setDrawingArrow({ x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y });
            } else {
                 console.error("[handleMouseDown] Could not get coordinates.");
            }
        }
    };

    
    const handleMouseMove = (e) => {
        if (!drawingArrow) return; 
        
        const coords = getCoordsPercent(e);
        if(coords) {
            
            if (coords.x.toFixed(1) !== drawingArrow.x2.toFixed(1) || coords.y.toFixed(1) !== drawingArrow.y2.toFixed(1)) {
                 console.log(`[handleMouseMove] Drawing arrow to...`, coords);
            }
            setDrawingArrow(prev => ({ ...prev, x2: coords.x, y2: coords.y }));
        }
    };

    
    const handleMouseUp = (e) => {
        
        if (!drawingArrow) {
            
            
            return;
        }

        console.log('%c[handleMouseUp] FINISHING ARROW DRAW.', 'background: #ffc107; color: black; padding: 2px 5px; border-radius: 3px;');
        
        if (drawingArrow.x1 !== drawingArrow.x2 || drawingArrow.y1 !== drawingArrow.y2) {
            console.log('%c[handleMouseUp] ADDING ARROW ANNOTATION with coords:', 'background: #28a745; color: white; padding: 2px 5px; border-radius: 3px;', drawingArrow);
            onAddAnnotation({ annotationType: 'ARROW', coords: drawingArrow });
        } else {
            console.log("[handleMouseUp] Arrow has zero length, not adding.");
        }
        setDrawingArrow(null); 
    };

    const getCursor = () => {
        if (tool === 'TEXT' || tool === 'ARROW' || tool === 'SHAPE') return 'crosshair';
        return 'default';
    };

    return (
        <div 
            ref={layerRef} 
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: getCursor() }}
        >
            
            {annotations.map((ann) => {
                const isEditingThis = editingAnnotation?.idannotation === ann.idannotation;
                
            
            switch(ann.annotationType) {
                case 'ARROW':
                    return isEditingThis ? null : <StaticArrowAnnotation key={ann.idannotation} annotation={ann} scaledDimensions={scaledDimensions} onEdit={onEditAnnotation} isEditing={isEditingThis} />;
                case 'SHAPE':
                    return isEditingThis ? null : <StaticShapeAnnotation key={ann.idannotation} annotation={ann} scaledDimensions={scaledDimensions} onEdit={onEditAnnotation} isEditing={isEditingThis} />;
                case 'TEXT':
                default:
                    return <StaticTextAnnotation key={ann.idannotation} annotation={ann} scaledDimensions={scaledDimensions} originalDimensions={originalDimensions} onEdit={onEditAnnotation} isEditing={isEditingThis} />;
            }
            
            })}

        {editingAnnotation && editingAnnotation.pageNumber === currentPage + 1 && (() => {
            
            switch(editingAnnotation.annotationType) {
                case 'ARROW':
                    return <EditableArrowAnnotation annotation={editingAnnotation} onSave={onSaveAnnotation} onCancel={onCancelEdit} onAnnotationChange={onAnnotationChange} scaledDimensions={scaledDimensions} />;
                case 'SHAPE':
                    return <EditableShapeAnnotation annotation={editingAnnotation} onSave={onSaveAnnotation} onCancel={onCancelEdit} onAnnotationChange={onAnnotationChange} scaledDimensions={scaledDimensions} />;
                case 'TEXT':
                default:
                    return <EditableTextAnnotation annotation={editingAnnotation} onSave={onSaveAnnotation} onCancel={onCancelEdit} onAnnotationChange={onAnnotationChange} scaledDimensions={scaledDimensions} originalDimensions={originalDimensions} onInteractionChange={onAnnotationInteraction} />;
            }
            
        })()}



            {drawingArrow && (
                 <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}>
                    <line
                        x1={`${drawingArrow.x1}%`} y1={`${drawingArrow.y1}%`}
                        x2={`${drawingArrow.x2}%`} y2={`${drawingArrow.y2}%`}
                        stroke="rgba(255, 0, 0, 0.7)" strokeWidth="3" strokeDasharray="5,5"
                    />
                </svg>
            )}
        </div>
    );
};

const usePDFLoader = () => {
  const validatePdfFile = useCallback((arrayBuffer) => {
    if (arrayBuffer.byteLength < 100) throw new Error(ERROR_MESSAGES.SMALL_FILE);
    const signature = String.fromCharCode(...new Uint8Array(arrayBuffer).slice(0, 4));
    if (signature !== '%PDF') throw new Error(`${ERROR_MESSAGES.INVALID_PDF}. Signatura encontrada: "${signature}"`);
    return true;
  }, []);

  const createTimeoutPromise = useCallback((timeout, errorMessage) => {
    return new Promise((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeout));
  }, []);

  const loadPdfWithWorker = useCallback(async (pdfjsLib, arrayBuffer) => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, verbosity: 0 });
    return Promise.race([loadingTask.promise, createTimeoutPromise(PDF_CONFIG.WORKER_TIMEOUT, 'Timeout worker')]);
  }, [createTimeoutPromise]);

  const loadPdfWithoutWorker = useCallback(async (pdfjsLib, arrayBuffer) => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    const fallbackTask = pdfjsLib.getDocument({ data: arrayBuffer, verbosity: 0, useWorkerFetch: false, disableAutoFetch: true, disableStream: true });
    return Promise.race([fallbackTask.promise, createTimeoutPromise(PDF_CONFIG.FALLBACK_TIMEOUT, 'Timeout fallback')]);
  }, [createTimeoutPromise]);

  const renderPdfPage = useCallback(async (page, pageNumber) => {
    const viewport = page.getViewport({ scale: PDF_CONFIG.SCALE });
    const canvas = document.createElement('canvas');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const context = canvas.getContext('2d');
    const renderContext = { canvasContext: context, viewport, enableWebGL: false, renderInteractiveForms: false };
    const renderPromise = page.render(renderContext).promise;
    await Promise.race([renderPromise, createTimeoutPromise(PDF_CONFIG.RENDER_TIMEOUT, `Timeout render página ${pageNumber}`)]);
    return { pageNumber, imageUrl: canvas.toDataURL('image/png'), width: viewport.width, height: viewport.height };
  }, [createTimeoutPromise]);

  const handlePdfError = useCallback((error) => {
    console.error('Error procesando PDF:', error);
    if (error.message.includes('Timeout')) throw new Error(ERROR_MESSAGES.TIMEOUT);
    if (error.message.includes('worker') || error.message.includes('fetch') || error.message.includes('CORS')) throw new Error(ERROR_MESSAGES.WORKER_ERROR);
    if (error.name === 'InvalidPDFException') throw new Error(ERROR_MESSAGES.CORRUPTED);
    if (error.name === 'PasswordException') throw new Error(ERROR_MESSAGES.PASSWORD);
    if (error.name === 'MissingPDFException') throw new Error(ERROR_MESSAGES.MISSING);
    throw new Error(`Error inesperado al procesar el PDF: ${error.message}`);
  }, []);

  const loadPdfAsImages = useCallback(async (pdfFile, setLoadingMessage) => {
    try {
      setLoadingMessage('Inicializando PDF.js...');
      const pdfjsLib = await import('pdfjs-dist');
      const arrayBuffer = await pdfFile.arrayBuffer();
      validatePdfFile(arrayBuffer);
      
      let pdf;
      try {
        setLoadingMessage('Intentando cargar con worker...');
        pdf = await loadPdfWithWorker(pdfjsLib, arrayBuffer);
      } catch (workerError) {
        console.warn('Fallo worker, intentando fallback:', workerError.message);
        setLoadingMessage('Worker falló, intentando sin worker...');
        pdf = await loadPdfWithoutWorker(pdfjsLib, arrayBuffer);
      }
      
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        setLoadingMessage(`Convirtiendo página ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        pages.push(await renderPdfPage(page, i));
      }
      return pages;
    } catch (error) {
      handlePdfError(error);
    }
  }, [validatePdfFile, loadPdfWithWorker, loadPdfWithoutWorker, renderPdfPage, handlePdfError]);

  return { loadPdfAsImages };
};

const PDFCanvas = ({ 
  currentPageData,
  currentPage,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  annotations,
  tool,
  onAddAnnotation,
  editingAnnotation,
  onSaveAnnotation,
  onCancelEdit,
  onSelectAnnotation,
  selectedAnnotationId,
  onEditAnnotation,
  onAnnotationChange
}) => {
  const [dragState, setDragState] = useState({ isDragging: false, startX: 0, startY: 0, scrollX: 0, scrollY: 0 });
  const [isInteractingWithAnnotation, setIsInteractingWithAnnotation] = useState(false);
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  const scaledDimensions = useMemo(() => {
    if (!currentPageData) return { width: 0, height: 0 };
    const scale = zoomLevel / 100;
    return {
      width: currentPageData.width * scale,
      height: currentPageData.height * scale
    };
  }, [currentPageData, zoomLevel]);

 

const handleMouseDown = useCallback((e) => {
    console.groupCollapsed(`%c[PDFCanvas onMouseDown]`, 'color: #e83e8c; font-weight: bold;');
    console.log(`Tool: %c${tool}`, 'font-weight: bold;');
    console.log(`isInteractingWithAnnotation: %c${isInteractingWithAnnotation}`, 'font-weight: bold;');
    console.log('Target element:', e.target);
    console.log('CurrentTarget element:', e.currentTarget);
    
    const shouldPan = tool === 'CURSOR' && !isInteractingWithAnnotation;
    
    console.log(`Decision: Should I handle panning? %c${shouldPan}`, `color: ${shouldPan ? 'green' : 'red'}; font-weight: bold;`);
    
    if (!shouldPan) {
        console.log('Action: %cIgnoring event, letting it bubble up to AnnotationLayer.', 'color: #17a2b8');
        console.groupEnd();
        return; 
    }
    
    console.log('Action: %cPreventing default and starting drag.', 'color: #dc3545');
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      scrollX: containerRef.current.scrollLeft,
      scrollY: containerRef.current.scrollTop
    });
    console.groupEnd();

}, [tool, isInteractingWithAnnotation]);



  const handleMouseMove = useCallback((e) => {
    if (!dragState.isDragging || !containerRef.current) return;
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    containerRef.current.scrollLeft = dragState.scrollX - deltaX;
    containerRef.current.scrollTop = dragState.scrollY - deltaY;
  }, [dragState]);

  const handleMouseUp = useCallback(() => {
    setDragState(prev => ({ ...prev, isDragging: false }));
  }, []);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      if (e.deltaY < 0) onZoomIn();
      else onZoomOut();
    }
  }, [onZoomIn, onZoomOut]);

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);


  const annotationsForCurrentPage = useMemo(() => {
    return annotations.filter(ann => ann.pageNumber === currentPage + 1);
  }, [annotations, currentPage]);


  useEffect(() => {
    if (containerRef.current && scaledDimensions.width > 0) {
      const container = containerRef.current;
      const { clientWidth, clientHeight, scrollWidth, scrollHeight } = container;
      if (scaledDimensions.width < clientWidth) container.scrollLeft = 0;
      else {
        const centerX = container.scrollLeft + clientWidth / 2;
        container.scrollLeft = Math.max(0, (centerX / scrollWidth) * scaledDimensions.width - clientWidth / 2);
      }
      if (scaledDimensions.height < clientHeight) container.scrollTop = 0;
      else {
        const centerY = container.scrollTop + clientHeight / 2;
        container.scrollTop = Math.max(0, (centerY / scrollHeight) * scaledDimensions.height - clientHeight / 2);
      }
    }
  }, [scaledDimensions, zoomLevel]);



  return (
    <div 
      ref={containerRef}
      className={`relative bg-white overflow-auto h-full ${dragState.isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ userSelect: 'none' }}
    >
      <div 
        className="relative min-h-full"
        style={{
          width: scaledDimensions.width > 0 ? `${scaledDimensions.width}px` : '100%',
          minWidth: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div 
          className="relative"
          style={{
            width: `${scaledDimensions.width}px`,
            height: `${scaledDimensions.height}px`,
          }}
        >
          <img
            ref={imageRef}
            src={currentPageData.imageUrl}
            alt={`Página ${currentPage + 1}`}
            className="block shadow-lg"
            style={{ 
              width: '100%',
              height: '100%',
              maxWidth: 'none',
              pointerEvents: 'none',
              display: 'block'
            }}
            draggable={false}
          />
          <div 
            className="absolute top-0 left-0"
            style={{ 
              width: '100%', 
              height: '100%'
            }}
          >
            <AnnotationLayer
              annotations={annotationsForCurrentPage}
              tool={tool}
              onAddAnnotation={onAddAnnotation}
              editingAnnotation={editingAnnotation}
              onSaveAnnotation={onSaveAnnotation}
              onCancelEdit={onCancelEdit}
              onEditAnnotation={onEditAnnotation} 
              scaledDimensions={scaledDimensions}
              originalDimensions={currentPageData}
              currentPage={currentPage}
              onAnnotationInteraction={setIsInteractingWithAnnotation}
              onSelectAnnotation={onSelectAnnotation}
              selectedAnnotationId={selectedAnnotationId}
              onAnnotationChange={onAnnotationChange}

            />
          </div>
        </div>
      </div>
    </div>
  );
};

const FloatingNavigation = ({ 
  currentPage, 
  totalPages, 
  onPreviousPage, 
  onNextPage,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  showAnnotationsList,
  onToggleAnnotationsList,
  onSetTool,
  currentTool
}) => {
  const [showAnnotationTools, setShowAnnotationTools] = useState(false);

  const toggleAnnotationTools = () => {
    setShowAnnotationTools(!showAnnotationTools);
  };

  const handleTextAnnotation = () => {
    console.log('Text annotation tool selected');
   
   
  };

  const handleArrowAnnotation = () => {
    console.log('Arrow annotation tool selected');
    
  };

  const handleShapeAnnotation = () => {
    console.log('Shape annotation tool selected');
    
  };

  const handleAnnotationsList = () => {
    console.log('Annotations list button clicked');
    onToggleAnnotationsList();
  };

  return (
    <div className="px-2 sm:px-0">
      {showAnnotationTools && (
        <div className="absolute bottom-12 sm:bottom-20 left-1/2 transform -translate-x-1/2 mb-1 sm:mb-2">
          <div className="flex flex-col space-y-1 sm:space-y-2 bg-white rounded-lg shadow-lg p-2 sm:p-3 border">
            <button
              onClick={() => { 
                  onSetTool('TEXT');
                  setShowAnnotationTools(false);
              }}
              className={`flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full transition-all duration-200 shadow-md hover:shadow-lg ${
                    currentTool === 'TEXT' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              title="Anotación de texto"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>

            <button
              onClick={() => { 
                  onSetTool('ARROW');
                  setShowAnnotationTools(false);
              }}
              className={`flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full transition-all duration-200 shadow-md hover:shadow-lg ${
                    currentTool === 'ARROW' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`} 
              title="Anotación con flecha"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
                        
            <button
              onClick={() => { 
                  onSetTool('SHAPE');
                  setShowAnnotationTools(false);
              }}
              className={`flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full transition-all duration-200 shadow-md hover:shadow-lg ${
                    currentTool === 'SHAPE' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`} 
              title="Formas geométricas"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>
          </div>
        </div>
      )}
       <div className="flex items-center space-x-2 sm:space-x-4 bg-white rounded-full shadow-lg px-3 sm:px-6 py-2 sm:py-3 border max-w-full overflow-x-auto">
        <button
          onClick={onZoomOut}
          disabled={zoomLevel <= 20}
          className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          title="Zoom out"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <div className="text-xs sm:text-xs text-gray-600 font-medium px-1 sm:px-2 min-w-[35px] sm:min-w-[50px] text-center">
          {zoomLevel}%
        </div>
        <button
          onClick={onZoomIn}
          disabled={zoomLevel >= 200}
          className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          title="Zoom in"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <div className="w-px h-6 sm:h-8 bg-gray-300"></div>
        <button
          onClick={toggleAnnotationTools}
          className={`flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full transition-all duration-200 shadow-md hover:shadow-lg ${
            showAnnotationTools 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
          title="Herramientas de anotación"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={handleAnnotationsList}
          className={`flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full transition-all duration-200 shadow-md hover:shadow-lg ${
            showAnnotationsList 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
          title="Lista de anotaciones"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </button>
        <div className="w-px h-6 sm:h-8 bg-gray-300"></div>
        <button
          onClick={onPreviousPage}
          disabled={currentPage === 0}
          className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          title="Página anterior"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-xs sm:text-sm text-gray-600 font-medium px-1 sm:px-2 whitespace-nowrap">
          {currentPage + 1} / {totalPages}
        </div>
        <button
          onClick={onNextPage}
          disabled={currentPage === totalPages - 1}
          className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          title="Página siguiente"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};





const AnnotationEditToolbar = ({ annotation, onStyleChange }) => {
  if (!annotation) return null;

  const styleProps = JSON.parse(annotation.styleProperties);

  const handleInputChange = (property, value) => {
    const finalValue = (['fontSize', 'strokeWidth'].includes(property)) ? Number(value) : value;
    onStyleChange(property, finalValue);
  };
  
  const toggleShape = () => {
    const newShape = styleProps.shapeType === 'SQUARE' ? 'CIRCLE' : 'SQUARE';
    onStyleChange('shapeType', newShape);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-white rounded-lg shadow-xl p-2 sm:p-3 border border-gray-200">
        
        
        {annotation.annotationType === 'TEXT' && (
          
          <>
            <div className="flex items-center gap-2 w-full sm:w-auto"><label htmlFor="fontSize" className="text-xs font-medium text-gray-600">Tamaño:</label><input type="range" id="fontSize" min="12" max="72" step="2" value={styleProps.fontSize || 30} onChange={(e) => handleInputChange('fontSize', e.target.value)} className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" /><span className="text-xs text-gray-700 w-6 text-center">{styleProps.fontSize || 30}</span></div>
            <div className="w-full sm:w-px h-px sm:h-6 bg-gray-300"></div>
            <div className="flex items-center gap-2 w-full sm:w-auto"><label htmlFor="fontColor" className="text-xs font-medium text-gray-600">Texto:</label><input type="color" id="fontColor" value={styleProps.color || '#000000'} onChange={(e) => handleInputChange('color', e.target.value)} className="w-6 h-6 p-0 border-none rounded cursor-pointer" title="Color del texto" /></div>
            <div className="w-full sm:w-px h-px sm:h-6 bg-gray-300"></div>
            <div className="flex items-center gap-2 w-full sm:w-auto"><label htmlFor="borderColor" className="text-xs font-medium text-gray-600">Borde:</label><input type="color" id="borderColor" value={styleProps.borderColor || '#0000FF'} onChange={(e) => handleInputChange('borderColor', e.target.value)} className="w-6 h-6 p-0 border-none rounded cursor-pointer" title="Color del borde" /></div>
          </>
        )}

        
        {annotation.annotationType === 'ARROW' && (
          
          <>
            <div className="flex items-center gap-2 w-full sm:w-auto"><label htmlFor="arrowColor" className="text-xs font-medium text-gray-600">Color:</label><input type="color" id="arrowColor" value={styleProps.color || '#FF0000'} onChange={(e) => handleInputChange('color', e.target.value)} className="w-6 h-6 p-0 border-none rounded cursor-pointer" title="Color de la flecha" /></div>
            <div className="w-full sm:w-px h-px sm:h-6 bg-gray-300"></div>
            <div className="flex items-center gap-2 w-full sm:w-auto"><label htmlFor="strokeWidth" className="text-xs font-medium text-gray-600">Grosor:</label><input type="range" id="strokeWidth" min="1" max="20" step="1" value={styleProps.strokeWidth || 3} onChange={(e) => handleInputChange('strokeWidth', e.target.value)} className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" /><span className="text-xs text-gray-700 w-6 text-center">{styleProps.strokeWidth || 3}</span></div>
          </>
        )}

        
        {annotation.annotationType === 'SHAPE' && (
          <>
            
            <button onClick={toggleShape} title="Cambiar forma" className="p-2 rounded-md hover:bg-gray-100">
                {styleProps.shapeType === 'SQUARE' ? 
                    <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg> :
                    <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
                }
            </button>
            <div className="w-full sm:w-px h-px sm:h-6 bg-gray-300"></div>

            
          <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-medium text-gray-600">Relleno:</label>
              
              <input 
                type="color" 
                value={styleProps.fillColor || '#808080'} 
                onChange={(e) => handleInputChange('fillColor', e.target.value)} 
                className="w-6 h-6 p-0 border-none rounded cursor-pointer" 
                title="Color de relleno" 
              />
              
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={styleProps.fillOpacity ?? 0.5} 
                onChange={(e) => handleInputChange('fillOpacity', e.target.value)} 
                className="w-16 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                title="Opacidad del relleno"
              />
            </div>
            <div className="w-full sm:w-px h-px sm:h-6 bg-gray-300"></div>
            
            
            <div className="flex items-center gap-2 w-full sm:w-auto"><label className="text-xs font-medium text-gray-600">Borde:</label><input type="color" value={styleProps.strokeColor} onChange={(e) => handleInputChange('strokeColor', e.target.value)} className="w-6 h-6 p-0 border-none rounded cursor-pointer" title="Color del borde" /></div>
            <div className="w-full sm:w-px h-px sm:h-6 bg-gray-300"></div>

            
            <div className="flex items-center gap-2 w-full sm:w-auto"><label className="text-xs font-medium text-gray-600">Grosor:</label><input type="range" min="1" max="20" step="1" value={styleProps.strokeWidth || 2} onChange={(e) => handleInputChange('strokeWidth', e.target.value)} className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" /><span className="text-xs text-gray-700 w-6 text-center">{styleProps.strokeWidth || 2}</span></div>
          </>
        )}
      </div>
    </div>
  );
};

const AnnotationsList = ({ isVisible, onClose, annotations, onAnnotationClick, onDeleteAnnotation }) => {
  const getAnnotationIcon = (type) => {
    switch (type.toUpperCase()) {
      case 'TEXT': return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
      case 'ARROW': return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>;
      case 'SHAPE': return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
      default: return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0H7" /></svg>;
    }
  };

  const getTypeLabel = (type) => {
    switch (type.toUpperCase()) {
      case 'TEXT': return 'Texto';
      case 'ARROW': return 'Flecha';
      case 'SHAPE': return 'Forma';
      default: return 'Anotación';
    }
  };

  if (!isVisible) return null;

  
  const handleDeleteClick = (e, annotationId) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de que quieres eliminar esta anotación?')) {
      onDeleteAnnotation(annotationId);
    }
  };

  return (
    <div className="w-full sm:w-80 bg-white shadow-lg border-l border-gray-200 flex flex-col h-full transform transition-transform duration-300 ease-in-out">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          Anotaciones
        </h2>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors" title="Cerrar lista de anotaciones">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-4 bg-blue-50 border-b border-gray-200">
        <div className="text-sm text-gray-600 mb-1">Total de anotaciones</div>
        <div className="text-2xl font-bold text-blue-600">{annotations.length}</div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {annotations.length === 0 ? (
            <p className="text-center text-gray-500 mt-8">No hay anotaciones en este documento.</p>
          ) : (
            annotations.map((annotation) => (
              <div
                key={annotation.idannotation}
                className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => onAnnotationClick(annotation.pageNumber)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-full text-white" style={{ backgroundColor: annotation.color || '#3B82F6' }}>
                      {getAnnotationIcon(annotation.annotationType)}
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {getTypeLabel(annotation.annotationType)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <span>Página {annotation.pageNumber}</span>
                    
                    <button
                      onClick={(e) => handleDeleteClick(e, annotation.idannotation)}
                      className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar anotación"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-gray-800 leading-relaxed break-words">{annotation.content}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-medium">{annotation.createdBy.names}</span>
                  <span>{new Date(annotation.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};




const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => {
      setMatches(media.matches);
    };

    
    if (media.addEventListener) {
        media.addEventListener('change', listener);
    } else {
        media.addListener(listener);
    }
    
    return () => {
        if (media.removeEventListener) {
            media.removeEventListener('change', listener);
        } else {
            media.removeListener(listener);
        }
    };
  }, [matches, query]);

  return matches;
};


const PDFViewerPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Inicializando...');
  const [error, setError] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [initialZoomSet, setInitialZoomSet] = useState(false);
  const [showAnnotationsList, setShowAnnotationsList] = useState(false);
  const [documentInfo, setDocumentInfo] = useState({ documentName: 'Cargando...', versionNumber: '...' });

  
  const [annotations, setAnnotations] = useState([]);
  const [loadingAnnotations, setLoadingAnnotations] = useState(true);
  const [tool, setTool] = useState('CURSOR');
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);

  const isSmallScreen = useMediaQuery('(max-width: 639px)');

  const { loadPdfAsImages } = usePDFLoader();
  
  const urlParams = useMemo(() => ({
    versionId: searchParams.get('versionId'),
    documentId: searchParams.get('documentId'),
  }), [searchParams]);


  const handleAnnotationDataChange = useCallback((updatedAnnotation) => {
    setEditingAnnotation(updatedAnnotation);
  }, []);

  const currentPageData = useMemo(() => pdfPages[currentPage], [pdfPages, currentPage]);
  
  const displayName = useMemo(() => `${documentInfo.documentName} v${documentInfo.versionNumber}`, [documentInfo]);

  const fetchDocumentInfo = useCallback(async (documentId, versionId) => {
    try {
      setLoadingMessage('Obteniendo información del documento...');
      const apiUrl = 'https://localhost:8080';
      const response = await axios.get(`${apiUrl}/api/documents/${documentId}/versions`, {
        withCredentials: true,
      });

      const targetVersion = response.data.find(v => v.idversion === parseInt(versionId));
      if (!targetVersion) throw new Error(`Versión con ID ${versionId} no encontrada.`);

      setDocumentInfo({
        documentName: targetVersion.document.name,
        versionNumber: targetVersion.versionNumber.toString()
      });
      return targetVersion;
    } catch (error) {
      console.error('Error fetching document info:', error);
      const message = (error.response?.status === 403 || error.response?.status === 401)
        ? "No tienes permiso para ver este documento."
        : `Error al obtener información del documento: ${error.message}`;
      throw new Error(message);
    }
  }, []);

  const loadPdf = useCallback(async () => {
    const { versionId, documentId } = urlParams;
    if (!versionId || !documentId) {
      setError(versionId ? ERROR_MESSAGES.NO_DOCUMENT : ERROR_MESSAGES.NO_VERSION);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      await fetchDocumentInfo(documentId, versionId);
      
      setLoadingMessage('Descargando archivo PDF...');
      const pdfBlob = await documentDownloadService.downloadVersionAsBlob(versionId);
      
      const pages = await loadPdfAsImages(pdfBlob, setLoadingMessage);
      setPdfPages(pages);
      
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError(err.message || 'Error desconocido al cargar el documento.');
    } finally {
      setLoading(false);
    }
  }, [urlParams, fetchDocumentInfo, loadPdfAsImages]);


  useEffect(() => {
    const handleGlobalClickCapture = (e) => {
        console.log(
            `%c[GLOBAL CLICK CAPTURE]`, 
            'background: #6f42c1; color: white; padding: 2px 5px; border-radius: 3px;',
            `Target:`, e.target
        );
    };

    const handleGlobalMouseDownCapture = (e) => {
        console.log(
            `%c[GLOBAL MOUSEDOWN CAPTURE]`,
            'background: #fd7e14; color: white; padding: 2px 5px; border-radius: 3px;',
            `Target:`, e.target
        );
    };

    
    window.addEventListener('click', handleGlobalClickCapture, true);
    window.addEventListener('mousedown', handleGlobalMouseDownCapture, true);

    return () => {
        
        window.removeEventListener('click', handleGlobalClickCapture, true);
        window.removeEventListener('mousedown', handleGlobalMouseDownCapture, true);
    };
}, []);

  useEffect(() => {
    if (pdfPages.length > 0 && !initialZoomSet) {
      const firstPage = pdfPages[0];
      if (firstPage.width && firstPage.height) {
        const isPortrait = firstPage.height > firstPage.width;
        setZoomLevel(isPortrait ? 100 : 75);
        setInitialZoomSet(true);
      }
    }
  }, [pdfPages, initialZoomSet]);

  const goToNextPage = useCallback(() => setCurrentPage(p => Math.min(p + 1, pdfPages.length - 1)), [pdfPages.length]);
  const goToPreviousPage = useCallback(() => setCurrentPage(p => Math.max(p - 1, 0)), []);

  const handleZoomIn = useCallback(() => setZoomLevel(z => Math.min(z + 10, 200)), []);
  const handleZoomOut = useCallback(() => setZoomLevel(z => Math.max(z - 10, 20)), []);
  
  const handleToggleAnnotationsList = useCallback(() => setShowAnnotationsList(p => !p), []);

  useEffect(() => { loadPdf(); }, [loadPdf]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowLeft') goToPreviousPage();
      if (e.key === 'ArrowRight') goToNextPage();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goToPreviousPage, goToNextPage]);
  
  const fetchAnnotations = useCallback(async (versionId) => {
    if (!versionId) return;
    setLoadingAnnotations(true);
    try {
      const data = await annotationService.getAnnotationsByVersion(versionId);
      setAnnotations(data || []);
    } catch (err) {
      console.error("Error al cargar anotaciones:", err);
    } finally {
      setLoadingAnnotations(false);
    }
  }, []);


  
  
  const handleAnnotationStyleChange = useCallback((property, value) => {
    if (!editingAnnotation) return;

    console.log(`[PDFViewerPage] Recibido cambio de estilo: '${property}' =`, value);

    setEditingAnnotation(prev => {
      if (!prev) return null; 
      
      
      const newAnnotation = { ...prev };
      const styleProps = JSON.parse(newAnnotation.styleProperties);
      
      styleProps[property] = value;
      
      newAnnotation.styleProperties = JSON.stringify(styleProps);

      console.log("[PDFViewerPage] Objeto 'editingAnnotation' actualizado. Nuevo estado:", newAnnotation);
      
      return newAnnotation;
    });
  }, [editingAnnotation]); 


     
  const handleEditAnnotation = useCallback((annotationToEdit) => {
    if (editingAnnotation) {
        
        
        return;
    }
    console.log(`[PDFViewerPage] Iniciando edición para la anotación ID: ${annotationToEdit.idannotation}. Estado inicial:`, JSON.parse(JSON.stringify(annotationToEdit)));
    setEditingAnnotation(annotationToEdit);
  }, [editingAnnotation]);

  
  const handleSaveAnnotation = useCallback(async (annotationToSave) => {
    
    const { createdBy, createdAt, ...data } = annotationToSave;
    
    data.color = JSON.parse(data.styleProperties).color || '#000000';

    setEditingAnnotation(null); 


    console.log(`[PDFViewerPage] Guardando... Payload final para el backend (anotación ID: ${data.idannotation}):`, data);

    try {
      if (String(data.idannotation).startsWith('temp-')) {
        const { idannotation, ...createData } = data;
        console.log("[PDFViewerPage] Enviando a `createAnnotation`...");
        const newAnnotation = await annotationService.createAnnotation(urlParams.versionId, createData);
        setAnnotations(prev => [...prev.filter(a => a.idannotation !== data.idannotation), newAnnotation]);
        console.log("[PDFViewerPage] Creación exitosa. Anotación recibida del servidor:", newAnnotation);
      } else {
        console.log("[PDFViewerPage] Enviando a `updateAnnotation`...");
        const serverResponse = await annotationService.updateAnnotation(data.idannotation, data);
        
        const finalUpdatedAnnotation = { ...annotationToSave, ...serverResponse };

        setAnnotations(prev => 
            prev.map(a => a.idannotation === finalUpdatedAnnotation.idannotation ? finalUpdatedAnnotation : a)
        );
        console.log("[PDFViewerPage] Actualización exitosa. Anotación final en el estado:", finalUpdatedAnnotation);
      }
    } catch (err) {
      console.error("[PDFViewerPage] ERROR al guardar la anotación:", err);
      alert("No se pudo guardar la anotación. Revisa la consola para más detalles.");
    }
  }, [urlParams.versionId]);


  

const handleAddAnnotation = useCallback(({ annotationType, coords }) => {
    if (!user || editingAnnotation) return;
    
    let newAnnotation;

    switch (annotationType) {
        case 'TEXT':
            newAnnotation = {
                idannotation: `temp-${Date.now()}`, 
                annotationType: 'TEXT',
                pageNumber: currentPage + 1,
                content: '',
                coordinates: JSON.stringify({ x: coords.x, y: coords.y, ...DEFAULT_ANNOTATION_SIZE }),
                styleProperties: JSON.stringify(DEFAULT_ANNOTATION_STYLE), 
                createdBy: { names: user.name }, 
                createdAt: new Date().toISOString(),
            };
            break;
            
        case 'ARROW':
            newAnnotation = {
                idannotation: `temp-${Date.now()}`,
                annotationType: 'ARROW',
                pageNumber: currentPage + 1,
                content: '',
                
                coordinates: JSON.stringify(coords), 
                styleProperties: JSON.stringify(DEFAULT_ARROW_STYLE),
                createdBy: { names: user.name },
                createdAt: new Date().toISOString(),
            };
            break;

        case 'SHAPE':
            const sizeInPercent = (DEFAULT_SHAPE_SIZE / currentPageData.width) * 100;
            newAnnotation = {
                idannotation: `temp-${Date.now()}`,
                annotationType: 'SHAPE',
                pageNumber: currentPage + 1,
                content: '',
                
                coordinates: JSON.stringify({
                    x: coords.x,
                    y: coords.y,
                    width: sizeInPercent,
                    height: sizeInPercent,
                }),
                styleProperties: JSON.stringify(DEFAULT_SHAPE_STYLE),
                createdBy: { names: user.name },
                createdAt: new Date().toISOString(),
            };
            break;

        default:
            return; 
    }

    
    
    setEditingAnnotation(newAnnotation);
    
    setTool('CURSOR'); 

}, [user, currentPage, editingAnnotation, currentPageData]);



  const handleCancelEdit = useCallback(() => setEditingAnnotation(null), []);

  const handleDeleteAnnotation = useCallback(async (annotationId) => {
    try {
      await annotationService.deleteAnnotation(annotationId);
      setAnnotations(prevAnnotations =>
        prevAnnotations.filter(ann => ann.idannotation !== annotationId)
      );
    } catch (err) {
      console.error("Error al eliminar la anotación:", err);
      alert("No se pudo eliminar la anotación. Por favor, inténtalo de nuevo.");
    }
  }, []); 


  const handleSelectAnnotation = useCallback((annotation) => {
    setSelectedAnnotation(annotation);
    console.log('Anotación seleccionada:', annotation);
  }, []);
  
  const handleSetTool = (selectedTool) => setTool(t => (t === selectedTool ? 'CURSOR' : selectedTool));

  
  const handleAnnotationListClick = useCallback((pageNumber) => {
    setCurrentPage(pageNumber - 1);
    
    if (isSmallScreen) {
      setShowAnnotationsList(false);
    }
  }, [isSmallScreen]); 

  useEffect(() => {
    if (urlParams.versionId) fetchAnnotations(urlParams.versionId);
  }, [urlParams.versionId, fetchAnnotations]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-lg mx-auto p-6 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Error al cargar PDF</h2>
          <div className="text-gray-600 mb-4 space-y-2">
            <p className="font-medium">{error}</p>
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
              <p className="font-medium mb-1">📋 Detalles del intento:</p>
              <p>• Archivo: {displayName}</p>
              <p>• Versión ID: {urlParams.versionId || 'N/A'}</p>
              <p>• Documento ID: {urlParams.documentId || 'N/A'}</p>
            </div>
          </div>
          <div className="space-x-2">
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Reintentar</button>
            <button onClick={() => router.back()} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Volver</button>
          </div>
        </div>
      </div>
    );
  }

  if (pdfPages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No se pudieron cargar las páginas del PDF.</p>
          <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="px-2 sm:px-4 py-1 sm:py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center text-sm sm:text-base">← Volver</button>
            <div className="flex-1 text-center px-2">
              <h1 className="text-sm sm:text-xl font-semibold text-gray-800 truncate">{displayName}</h1>
            </div>
            <div className="w-[60px] sm:w-[88px]"></div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 overflow-hidden transition-all duration-300 ${showAnnotationsList ? 'hidden sm:block' : ''}`}>
          <PDFCanvas
            currentPageData={currentPageData}
            currentPage={currentPage}
            zoomLevel={zoomLevel}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            annotations={annotations}
            tool={tool}
            onAddAnnotation={handleAddAnnotation}
            
            
            editingAnnotation={editingAnnotation} 
            onSaveAnnotation={handleSaveAnnotation}
            onCancelEdit={handleCancelEdit}
            onEditAnnotation={handleEditAnnotation}
            onAnnotationChange={handleAnnotationDataChange} 
            

            onSelectAnnotation={handleSelectAnnotation}
            selectedAnnotationId={selectedAnnotation?.idannotation}

             
            
            

          />
        </div>
        <AnnotationsList
          isVisible={showAnnotationsList}
          onClose={handleToggleAnnotationsList}
          annotations={annotations}
          onAnnotationClick={handleAnnotationListClick}
          onDeleteAnnotation={handleDeleteAnnotation} 
        />

        
      </div>
      

     
      <div className="fixed bottom-3 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col-reverse items-center gap-2">
        

        <FloatingNavigation
          currentPage={currentPage}
          totalPages={pdfPages.length}
          onPreviousPage={goToPreviousPage}
          onNextPage={goToNextPage}
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          showAnnotationsList={showAnnotationsList}
          onToggleAnnotationsList={handleToggleAnnotationsList}
          onSetTool={handleSetTool}
          currentTool={tool}
        />
        
        
        
        {editingAnnotation && (
          <AnnotationEditToolbar 
            annotation={editingAnnotation} 
            onStyleChange={handleAnnotationStyleChange}
          />
        )}
      </div>
    </div>
  );
};

export default PDFViewerPage;   