import { authenticatedFetch } from '../utils/cookieUtils';

class DocumentDownloadService {
  constructor() {
    this.apiUrl = 'https://localhost:8080';
  }

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

  async downloadVersionAsBlob(versionId) {
    try {
      console.log('downloadVersionAsBlob: Iniciando descarga para versionId:', versionId);
      console.log('downloadVersionAsBlob: URL del endpoint:', `${this.apiUrl}/api/versions/${versionId}/download`);
      
      const response = await authenticatedFetch(`${this.apiUrl}/api/versions/${versionId}/download`, {
        method: 'GET'
      });

      console.log('downloadVersionAsBlob: Response status:', response.status);
      console.log('downloadVersionAsBlob: Response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('downloadVersionAsBlob: Error response data:', errorData);
        throw new Error(`Error ${response.status}: ${errorData || 'Error al descargar el archivo'}`);
      }

      
      const contentType = response.headers.get('content-type') || response.headers.get('Content-Type');
      const contentLength = response.headers.get('content-length') || response.headers.get('Content-Length');
      const contentDisposition = response.headers.get('content-disposition') || response.headers.get('Content-Disposition');
      
      console.log('downloadVersionAsBlob: Headers información:');
      console.log('- Content-Type:', contentType);
      console.log('- Content-Length:', contentLength);
      console.log('- Content-Disposition:', contentDisposition);
      
      const blob = await response.blob();
      
      console.log('downloadVersionAsBlob: Blob creado:');
      console.log('- Blob type:', blob.type);
      console.log('- Blob size:', blob.size);
      
      
      if (blob.size > 0) {
        const arrayBuffer = await blob.slice(0, 20).arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const firstBytes = Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join(' ');
        const firstChars = String.fromCharCode.apply(null, uint8Array.slice(0, 10));
        
        console.log('downloadVersionAsBlob: Primeros 20 bytes (hex):', firstBytes);
        console.log('downloadVersionAsBlob: Primeros 10 caracteres:', firstChars);
      }

      return blob;
    } catch (error) {
      console.error('downloadVersionAsBlob: Error downloading version as blob:', error);
      throw error;
    }
  }

  supportsAnnotations(mimeType) {
    return mimeType?.toLowerCase() === 'application/pdf';
  }

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
