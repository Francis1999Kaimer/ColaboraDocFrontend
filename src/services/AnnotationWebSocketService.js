import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { getCurrentUser } from '../utils/cookieUtils';

class AnnotationWebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.activeUsers = new Map();
    this.userColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    this.currentUserColor = this.getRandomColor();
  }

  getRandomColor() {
    return this.userColors[Math.floor(Math.random() * this.userColors.length)];
  }
  async connect(documentId, userId, userName) {
    if (this.connected) {
      this.disconnect();
    }

    return new Promise(async (resolve, reject) => {
      try {
        
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          reject(new Error('Usuario no autenticado'));
          return;
        }

        
        const socket = new SockJS(`${process.env.NEXT_PUBLIC_API_URL}/ws`);
        
        this.client = new Client({
          webSocketFactory: () => socket,
          connectHeaders: {
            'X-User-Id': currentUser.id || userId,
            'X-User-Name': currentUser.username || userName
          },
          debug: (str) => {
            console.log('STOMP Debug:', str);
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });

        this.client.onConnect = (frame) => {
          console.log('Connected to WebSocket:', frame);
          this.connected = true;
          this.documentId = documentId;
          this.userId = userId;
          this.userName = userName;
          
          this.subscribeToAnnotations();
          this.subscribeToUsers();
          this.subscribeToCursors();
          
          
          this.announceUserPresence();
          
          resolve();
        };

        this.client.onStompError = (frame) => {
          console.error('STOMP error:', frame);
          this.connected = false;
          reject(new Error('WebSocket connection failed'));
        };

        this.client.onWebSocketError = (error) => {
          console.error('WebSocket error:', error);
          this.connected = false;
          reject(error);
        };

        this.client.activate();
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        reject(error);
      }
    });
  }

  subscribeToAnnotations() {
    const annotationsTopic = `/topic/documents/${this.documentId}/annotations`;
    
    const subscription = this.client.subscribe(annotationsTopic, (message) => {
      try {
        const data = JSON.parse(message.body);
        this.handleAnnotationMessage(data);
      } catch (error) {
        console.error('Error parsing annotation message:', error);
      }
    });

    this.subscriptions.set('annotations', subscription);
  }

  subscribeToUsers() {
    const usersTopic = `/topic/documents/${this.documentId}/users`;
    
    const subscription = this.client.subscribe(usersTopic, (message) => {
      try {
        const data = JSON.parse(message.body);
        this.handleUserMessage(data);
      } catch (error) {
        console.error('Error parsing user message:', error);
      }
    });

    this.subscriptions.set('users', subscription);
  }

  subscribeToCursors() {
    const cursorsTopic = `/topic/documents/${this.documentId}/cursors`;
    
    const subscription = this.client.subscribe(cursorsTopic, (message) => {
      try {
        const data = JSON.parse(message.body);
        this.handleCursorMessage(data);
      } catch (error) {
        console.error('Error parsing cursor message:', error);
      }
    });

    this.subscriptions.set('cursors', subscription);
  }

  handleAnnotationMessage(data) {
    if (this.onAnnotationUpdate) {
      this.onAnnotationUpdate(data);
    }
  }

  handleUserMessage(data) {
    switch (data.type) {
      case 'USER_JOINED':
        this.activeUsers.set(data.userId, {
          id: data.userId,
          name: data.userName,
          color: data.color || this.getRandomColor(),
          joinedAt: new Date()
        });
        break;
      case 'USER_LEFT':
        this.activeUsers.delete(data.userId);
        break;
      case 'USERS_LIST':
        this.activeUsers.clear();
        data.users.forEach(user => {
          this.activeUsers.set(user.id, user);
        });
        break;
    }

    if (this.onUsersUpdate) {
      this.onUsersUpdate(Array.from(this.activeUsers.values()));
    }
  }

  handleCursorMessage(data) {
    if (data.userId !== this.userId && this.onCursorUpdate) {
      this.onCursorUpdate(data);
    }
  }

  announceUserPresence() {
    this.sendMessage('/app/documents/' + this.documentId + '/users/join', {
      userId: this.userId,
      userName: this.userName,
      color: this.currentUserColor,
      timestamp: new Date().toISOString()
    });
  }

  
  createAnnotation(annotation) {
    const message = {
      type: 'CREATE_ANNOTATION',
      annotation: {
        ...annotation,
        id: this.generateId(),
        userId: this.userId,
        userName: this.userName,
        createdAt: new Date().toISOString()
      }
    };

    this.sendMessage('/app/documents/' + this.documentId + '/annotations', message);
  }

  updateAnnotation(annotationId, updates) {
    const message = {
      type: 'UPDATE_ANNOTATION',
      annotationId,
      updates: {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: this.userId
      }
    };

    this.sendMessage('/app/documents/' + this.documentId + '/annotations', message);
  }

  deleteAnnotation(annotationId) {
    const message = {
      type: 'DELETE_ANNOTATION',
      annotationId,
      deletedBy: this.userId,
      deletedAt: new Date().toISOString()
    };

    this.sendMessage('/app/documents/' + this.documentId + '/annotations', message);
  }

  
  updateCursor(x, y, pageNumber) {
    const message = {
      userId: this.userId,
      userName: this.userName,
      color: this.currentUserColor,
      x,
      y,
      pageNumber,
      timestamp: new Date().toISOString()
    };

    this.sendMessage('/app/documents/' + this.documentId + '/cursors', message);
  }

  
  sendMessage(destination, message) {
    if (this.connected && this.client) {
      try {
        this.client.publish({
          destination,
          body: JSON.stringify(message)
        });
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }

  
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  
  onAnnotationUpdate = null;
  onUsersUpdate = null;
  onCursorUpdate = null;

  
  getActiveUsers() {
    return Array.from(this.activeUsers.values());
  }

  getCurrentUserColor() {
    return this.currentUserColor;
  }

  isConnected() {
    return this.connected;
  }

  disconnect() {
    if (this.connected) {
      
      this.sendMessage('/app/documents/' + this.documentId + '/users/leave', {
        userId: this.userId,
        timestamp: new Date().toISOString()
      });
    }

    
    this.subscriptions.forEach(subscription => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });
    this.subscriptions.clear();

    
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (error) {
        console.error('Error deactivating client:', error);
      }
    }

    this.connected = false;
    this.client = null;
    this.activeUsers.clear();
    this.documentId = null;
    this.userId = null;
    this.userName = null;
  }
}


const annotationWebSocketService = new AnnotationWebSocketService();
export default annotationWebSocketService;
