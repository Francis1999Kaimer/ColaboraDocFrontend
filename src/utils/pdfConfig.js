
import * as pdfjsLib from 'pdfjs-dist';


if (typeof window !== 'undefined') {
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export { pdfjsLib };


export const setupPDFWorker = () => {
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    
    
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }
  }
};

export const loadPDFDocument = async (url) => {
  try {
    setupPDFWorker();
    const loadingTask = pdfjsLib.getDocument(url);
    return await loadingTask.promise;
  } catch (error) {
    console.error('Error loading PDF document:', error);
    throw error;
  }
};

export default pdfjsLib;
