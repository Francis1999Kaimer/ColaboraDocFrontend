import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useProjectPermissions = (projectId) => {
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const apiUrl = 'https://localhost:8080';

    const fetchUserRole = useCallback(async () => {
        if (!projectId) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const response = await axios.get(
                `${apiUrl}/api/projects/${projectId}/me`, 
                { withCredentials: true }
            );
            
           
            setUserRole(response.data);
            console.log(response.data);
            console.log("1");
            
        } catch (err) {
            setError('Error al verificar permisos');
            setUserRole(null);
            console.error('Error fetching user role:', err);
        } finally {
            setLoading(false);
        }
    }, [projectId, apiUrl]);

    useEffect(() => {
        fetchUserRole();
    }, [fetchUserRole]);

    
    const canInviteUsers = userRole === 'ADMIN';
    const canEditProject = userRole !== 'VIEWER' && userRole !== null;
    const canDeleteProject = userRole === 'ADMIN';

    return {
        userRole,
        canInviteUsers,
        canEditProject,
        canDeleteProject,
        loading,
        error,
        refetch: fetchUserRole
    };
};

export default useProjectPermissions;
