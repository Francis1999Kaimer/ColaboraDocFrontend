import { authenticatedFetch } from '../utils/cookieUtils';

class DocumentDownloadService {
  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080';
  }
  /**
   * Download a document version
   * @param {string} versionId - The version ID to download
   * @param {Object} options - Additional options for filename generation
   * @param {string} options.documentName - The document name
   * @param {number} options.versionNumber - The version number
   * @returns {Promise<void>} 
   */  
  async downloadVersion(versionId, options = {}) {
    try {
      
      const response = await authenticatedFetch(`${this.apiUrl}/api/versions/${versionId}/download`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error ${response.status}: ${errorData || 'Error al descargar el archivo'}`);
      }      
      const contentDisposition = response.headers.get('Content-Disposition') ||
                                response.headers.get('content-disposition') ||
                                response.headers.get('Content-disposition') ||
                                response.headers.get('CONTENT-DISPOSITION');
        let downloadFilename = `document_version_${versionId}`;
      let originalExtension = '';
      
      if (contentDisposition) {
        console.log('Found Content-Disposition:', contentDisposition);
        
        
        let filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (!filenameMatch) {
          filenameMatch = contentDisposition.match(/filename=([^;]+)/);
        }
        
        if (filenameMatch) {
          const serverFilename = filenameMatch[1].trim();
          console.log('Extracted filename:', serverFilename);
          
          
          const lastDotIndex = serverFilename.lastIndexOf('.');
          if (lastDotIndex !== -1) {
            originalExtension = serverFilename.substring(lastDotIndex);
          }
        }
      } else {
        console.log('Content-Disposition header not available (CORS issue)');
        
        
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        if (contentType) {
          
          const typeToExtension = {
            'application/pdf': '.pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
            'application/vnd.ms-excel': '.xls',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
            'application/vnd.ms-powerpoint': '.ppt',
            'text/plain': '.txt',
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'application/zip': '.zip'
          };
          
          originalExtension = typeToExtension[contentType] || '';
        }
      }

      
      if (options.documentName && options.versionNumber) {
        
        const sanitizedDocumentName = options.documentName.replace(/[<>:"/\\|?*]/g, '_');
        downloadFilename = `${sanitizedDocumentName}_V${options.versionNumber}${originalExtension}`;
        console.log('Using custom filename format:', downloadFilename);
      } else {
        downloadFilename = `document_version_${versionId}${originalExtension}`;
        console.log('Using fallback filename:', downloadFilename);
      }

      
      const blob = await response.blob();
      this.triggerDownload(blob, downloadFilename);

      return { success: true, filename: downloadFilename };
    } catch (error) {
      console.error('Error downloading version:', error);
      throw error;
    }
  }

  /**
   * Check if a file type supports annotations
   * @param {string} mimeType - The MIME type of the file
   * @returns {boolean} Whether the file supports annotations
   */
  supportsAnnotations(mimeType) {
    return mimeType?.toLowerCase() === 'application/pdf';
  }

  /**
   * Trigger file download in browser
   * @param {Blob} blob - The file blob
   * @param {string} filename - The filename
   */
  triggerDownload(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    
    
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}


const documentDownloadService = new DocumentDownloadService();

export default documentDownloadService;
