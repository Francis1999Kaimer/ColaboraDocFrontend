import { useState, useEffect, useCallback } from 'react';
import annotationWebSocketService from '../services/AnnotationWebSocketService';
import { authenticatedFetch } from '../utils/cookieUtils';

class AnnotationManager {
  constructor() {
    this.annotations = new Map();
    this.listeners = new Set();
    this.wsService = annotationWebSocketService;
  }

  
  async initialize(documentId, userId, userName) {
    this.documentId = documentId;
    this.userId = userId;
    this.userName = userName;

    try {
      
      await this.wsService.connect(documentId, userId, userName);
      
      
      this.wsService.onAnnotationUpdate = this.handleWebSocketAnnotationUpdate.bind(this);
      
      
      await this.loadAnnotations();
      
      return true;
    } catch (error) {
      console.error('Error initializing AnnotationManager:', error);
      throw error;
    }
  }
  
  async loadAnnotations() {
    try {
      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${this.documentId}/annotations`
      );

      if (response.ok) {
        const annotations = await response.json();
        annotations.forEach(annotation => {
          this.annotations.set(annotation.id, annotation);
        });
        this.notifyListeners();
      } else {
        console.error('Error loading annotations:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading annotations:', error);
    }
  }

  
  handleWebSocketAnnotationUpdate(data) {
    switch (data.type) {
      case 'CREATE_ANNOTATION':
        this.annotations.set(data.annotation.id, data.annotation);
        break;
      case 'UPDATE_ANNOTATION':
        const existing = this.annotations.get(data.annotationId);
        if (existing) {
          this.annotations.set(data.annotationId, { ...existing, ...data.updates });
        }
        break;
      case 'DELETE_ANNOTATION':
        this.annotations.delete(data.annotationId);
        break;
      case 'ANNOTATIONS_SYNC':
        
        this.annotations.clear();
        data.annotations.forEach(annotation => {
          this.annotations.set(annotation.id, annotation);
        });
        break;
    }
    this.notifyListeners();
  }

  
  async createAnnotation(annotationData) {
    try {
      const annotation = {
        ...annotationData,
        id: this.generateId(),
        documentId: this.documentId,
        userId: this.userId,
        userName: this.userName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      
      this.annotations.set(annotation.id, annotation);
      this.notifyListeners();

      
      this.wsService.createAnnotation(annotation);

      
      await this.saveAnnotationToAPI(annotation);

      return annotation;
    } catch (error) {
      console.error('Error creating annotation:', error);
      
      this.annotations.delete(annotation.id);
      this.notifyListeners();
      throw error;
    }
  }

  
  async updateAnnotation(annotationId, updates) {
    try {
      const annotation = this.annotations.get(annotationId);
      if (!annotation) {
        throw new Error('Annotation not found');
      }

      
      if (annotation.userId !== this.userId) {
        throw new Error('No tienes permisos para editar esta anotación');
      }

      const updatedAnnotation = {
        ...annotation,
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: this.userId
      };

      
      this.annotations.set(annotationId, updatedAnnotation);
      this.notifyListeners();

      
      this.wsService.updateAnnotation(annotationId, updates);

      
      await this.updateAnnotationInAPI(annotationId, updates);

      return updatedAnnotation;
    } catch (error) {
      console.error('Error updating annotation:', error);
      
      await this.loadAnnotations();
      throw error;
    }
  }

  
  async deleteAnnotation(annotationId) {
    try {
      const annotation = this.annotations.get(annotationId);
      if (!annotation) {
        throw new Error('Annotation not found');
      }

      
      if (annotation.userId !== this.userId) {
        throw new Error('No tienes permisos para eliminar esta anotación');
      }

      
      this.annotations.delete(annotationId);
      this.notifyListeners();

      
      this.wsService.deleteAnnotation(annotationId);

      
      await this.deleteAnnotationFromAPI(annotationId);
    } catch (error) {
      console.error('Error deleting annotation:', error);
      
      await this.loadAnnotations();
      throw error;
    }
  }
  
  async saveAnnotationToAPI(annotation) {
    const response = await authenticatedFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${this.documentId}/annotations`,
      {
        method: 'POST',
        body: JSON.stringify(annotation)
      }
    );

    if (!response.ok) {
      throw new Error('Error saving annotation to server');
    }

    return response.json();
  }

  async updateAnnotationInAPI(annotationId, updates) {
    const response = await authenticatedFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${this.documentId}/annotations/${annotationId}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates)
      }
    );

    if (!response.ok) {
      throw new Error('Error updating annotation on server');
    }

    return response.json();
  }
  async deleteAnnotationFromAPI(annotationId) {
    const response = await authenticatedFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${this.documentId}/annotations/${annotationId}`,
      {
        method: 'DELETE'
      }
    );

    if (!response.ok) {
      throw new Error('Error deleting annotation from server');
    }
  }

  
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  
  getAnnotations() {
    return Array.from(this.annotations.values());
  }

  getAnnotationsByPage(pageNumber) {
    return this.getAnnotations().filter(annotation => annotation.pageNumber === pageNumber);
  }

  getAnnotationById(id) {
    return this.annotations.get(id);
  }

  
  searchAnnotations(query) {
    const lowercaseQuery = query.toLowerCase();
    return this.getAnnotations().filter(annotation => 
      annotation.text?.toLowerCase().includes(lowercaseQuery) ||
      annotation.userName?.toLowerCase().includes(lowercaseQuery)
    );
  }

  
  filterAnnotationsByType(type) {
    return this.getAnnotations().filter(annotation => annotation.type === type);
  }

  filterAnnotationsByUser(userId) {
    return this.getAnnotations().filter(annotation => annotation.userId === userId);
  }

  
  getAnnotationStats() {
    const annotations = this.getAnnotations();
    return {
      total: annotations.length,
      byType: annotations.reduce((acc, ann) => {
        acc[ann.type] = (acc[ann.type] || 0) + 1;
        return acc;
      }, {}),
      byUser: annotations.reduce((acc, ann) => {
        acc[ann.userName] = (acc[ann.userName] || 0) + 1;
        return acc;
      }, {}),
      byPage: annotations.reduce((acc, ann) => {
        acc[ann.pageNumber] = (acc[ann.pageNumber] || 0) + 1;
        return acc;
      }, {})
    };
  }

  
  addListener(listener) {
    this.listeners.add(listener);
  }

  removeListener(listener) {
    this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getAnnotations());
      } catch (error) {
        console.error('Error in annotation listener:', error);
      }
    });
  }

  
  destroy() {
    this.wsService.disconnect();
    this.annotations.clear();
    this.listeners.clear();
    this.documentId = null;
    this.userId = null;
    this.userName = null;
  }
}


export const useAnnotationManager = (documentId, userId, userName) => {
  const [manager, setManager] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!documentId || !userId || !userName) return;

    const initializeManager = async () => {
      try {
        setLoading(true);
        setError(null);

        const annotationManager = new AnnotationManager();
        await annotationManager.initialize(documentId, userId, userName);
        
        
        const listener = (updatedAnnotations) => {
          setAnnotations([...updatedAnnotations]);
        };
        annotationManager.addListener(listener);
        
        setManager(annotationManager);
        setAnnotations(annotationManager.getAnnotations());
      } catch (err) {
        console.error('Error initializing annotation manager:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeManager();

    return () => {
      if (manager) {
        manager.destroy();
      }
    };
  }, [documentId, userId, userName]);

  const createAnnotation = useCallback(async (annotationData) => {
    if (!manager) throw new Error('AnnotationManager not initialized');
    return manager.createAnnotation(annotationData);
  }, [manager]);

  const updateAnnotation = useCallback(async (annotationId, updates) => {
    if (!manager) throw new Error('AnnotationManager not initialized');
    return manager.updateAnnotation(annotationId, updates);
  }, [manager]);

  const deleteAnnotation = useCallback(async (annotationId) => {
    if (!manager) throw new Error('AnnotationManager not initialized');
    return manager.deleteAnnotation(annotationId);
  }, [manager]);

  return {
    manager,
    annotations,
    loading,
    error,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation
  };
};

export default AnnotationManager;
