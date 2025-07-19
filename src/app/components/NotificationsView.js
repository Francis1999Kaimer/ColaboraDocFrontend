'use client';
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const BellIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

const CheckIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const XMarkIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TrashIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const Loader = ({ text }) => (
  <div className="flex items-center justify-center p-4 text-gray-900"> 
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
      <p className="text-sm">{text}</p>
    </div>
  </div>
);

const NotificationCard = ({ notification, onMarkAsRead, onDelete }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAsRead = async () => {
    if (notification.read) return;
    
    setIsLoading(true);
    try {
      await onMarkAsRead(notification.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmMessage = `¿Estás seguro de que quieres eliminar esta notificación?\n\nEsta acción no se puede deshacer.`;
    
    if (window.confirm(confirmMessage)) {
      setIsLoading(true);
      try {
        await onDelete(notification.id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getNotificationTypeColor = (type) => {
    switch(type?.toLowerCase()) {
      case 'invitation': return 'bg-blue-50 border-blue-200';
      case 'role_change': return 'bg-green-50 border-green-200';
      case 'user_removed': return 'bg-red-50 border-red-200';
      case 'user_restored': return 'bg-purple-50 border-purple-200';
      case 'project_update': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getNotificationIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'invitation': return '📩';
      case 'role_change': return '👤';
      case 'user_removed': return '🚫';
      case 'user_restored': return '🔄';
      case 'project_update': return '📋';
      default: return '🔔';
    }
  };

  return (    <div className={`p-4 rounded-lg border transition-all ${
      notification.read 
        ? 'bg-gray-50 border-gray-200 opacity-75' 
        : `${getNotificationTypeColor(notification.type)} shadow-sm hover:shadow-md`
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
            <h4 className={`font-semibold ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
              {notification.title}
            </h4>
            {!notification.read && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                Nueva
              </span>
            )}
          </div>
          
          <p className={`text-sm mb-3 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {notification.createdAt 
                ? new Date(notification.createdAt).toLocaleString('es-ES')
                : 'Fecha no disponible'
              }
            </span>
            
            {notification.relatedProject && (
              <span className="bg-gray-200 px-2 py-1 rounded">
                Proyecto: {notification.relatedProject}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col space-y-1 ml-4">
          {!notification.read && (
            <button
              onClick={handleMarkAsRead}
              disabled={isLoading}
              className="p-1.5 text-green-600 hover:bg-green-100 rounded-full transition-colors disabled:opacity-50"
              title="Marcar como leída"
            >
              {isLoading ? (
                <div className="w-4 h-4 border border-green-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <CheckIcon className="w-4 h-4" />
              )}
            </button>
          )}
          
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="p-1.5 text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
            title="Eliminar notificación"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function NotificationsView() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); 
  const apiUrl = 'https://localhost:8080';  
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {

      const response = await axios.get(`${apiUrl}/api/notifications`, { withCredentials: true });
        if (Array.isArray(response.data)) {
        setNotifications(response.data);
      } else {
        setNotifications([]);
        setError("Los datos recibidos no tienen el formato esperado.");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Error al cargar notificaciones.";
      setError(errorMessage);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await axios.put(
        `${apiUrl}/api/notifications/${notificationId}/read`,
        {},
        { withCredentials: true }
      );

      
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );

    } catch (err) {
      console.error("Error marking notification as read:", err);
      console.error("Error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: `${apiUrl}/api/notifications/${notificationId}/read`
      });
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Error al marcar la notificación como leída.";
      alert(`❌ Error: ${errorMessage}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    
    if (unreadNotifications.length === 0) {
      alert("No hay notificaciones sin leer.");
      return;
    }

    const confirmMessage = `¿Estás seguro de que quieres marcar todas las ${unreadNotifications.length} notificaciones como leídas?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await axios.put(
          `${apiUrl}/api/notifications/read-all`,
          {},
          { withCredentials: true }
        );        
        setNotifications(prevNotifications =>
          prevNotifications.map(notification => ({ ...notification, read: true }))
        );

        alert(`✅ Se marcaron ${unreadNotifications.length} notificaciones como leídas.`);

      } catch (err) {
        console.error("Error marking all notifications as read:", err);
        const errorMessage = err.response?.data?.message || err.response?.data?.error || "Error al marcar todas las notificaciones como leídas.";
        alert(`❌ Error: ${errorMessage}`);
      }
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await axios.delete(
        `${apiUrl}/api/notifications/${notificationId}`,
        { withCredentials: true }
      );      
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.id !== notificationId)
      );

    } catch (err) {
      console.error("Error deleting notification:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Error al eliminar la notificación.";
      alert(`❌ Error: ${errorMessage}`);
    }
  };  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);  const filteredNotifications = notifications.filter(notification => {
    switch(filter) {
      case 'unread': return !notification.read;
      case 'read': return notification.read;
      default: return true;
    }
  });
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return <Loader text="Cargando notificaciones..." />;
  }
  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">        <div className="flex items-center space-x-2">
          <BellIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-700">
            Notificaciones
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
              </span>
            )}
          </h3>
        </div>
        
 
      </div>

      
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todas ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Sin leer ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            filter === 'read'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Leídas ({notifications.length - unreadCount})
        </button>
      </div>      {error && (
        <div className="p-4 mb-4 text-sm text-red-800 bg-red-100 rounded-md border border-red-200">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-red-600">⚠️</span>
            <span className="font-medium">Error al cargar notificaciones:</span>
          </div>
          <p>{error}</p>
        </div>
      )}

      {!error && filteredNotifications.length === 0 && (
        <div className="text-center py-8">
          <BellIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">
            {notifications.length === 0 
              ? "No tienes notificaciones."
              : `No tienes notificaciones ${filter === 'unread' ? 'sin leer' : filter === 'read' ? 'leídas' : ''}.`
            }
          </p>
        </div>
      )}

      {!error && filteredNotifications.length > 0 && (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
            />
          ))}
        </div>
      )}
    </div>
  );
}
