import React from 'react';

const ActiveUsersIndicator = ({ 
  activeUsers = [], 
  currentUser, 
  maxVisible = 4,
  showNames = true,
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm'
  };

  const allUsers = currentUser ? [currentUser, ...activeUsers] : activeUsers;
  const visibleUsers = allUsers.slice(0, maxVisible);
  const remainingCount = Math.max(0, allUsers.length - maxVisible);

  if (allUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      {showNames && (
        <span className="text-sm text-gray-600">
          {allUsers.length === 1 ? 'Usuario activo:' : 'Usuarios activos:'}
        </span>
      )}
      
      <div className="flex -space-x-1">
        {visibleUsers.map((user, index) => (
          <div
            key={user.id}
            className={`${sizeClasses[size]} rounded-full border-2 border-white flex items-center justify-center font-bold text-white shadow-sm relative`}
            style={{ backgroundColor: user.color }}
            title={`${user.name}${user.id === currentUser?.id ? ' (tú)' : ''}`}
          >
            {user.name?.charAt(0).toUpperCase() || '?'}
            
            
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
            
            
            {user.id === currentUser?.id && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white flex items-center justify-center">
                <span className="text-xs text-white">✓</span>
              </div>
            )}
          </div>
        ))}
        
        
        {remainingCount > 0 && (
          <div
            className={`${sizeClasses[size]} rounded-full border-2 border-white bg-gray-500 flex items-center justify-center font-bold text-white shadow-sm`}
            title={`${remainingCount} usuario${remainingCount > 1 ? 's' : ''} más`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
      
      {showNames && allUsers.length > 0 && (
        <span className="text-sm text-gray-500">
          ({allUsers.length})
        </span>
      )}
    </div>
  );
};

export default ActiveUsersIndicator;
