import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import GenericForm from '../../components/GenericForm';
import modules from '../../config/loadModules';
import type { ModuleConfig } from '../../config/types';

const UserRolesCreate = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const config: ModuleConfig = modules['user_roles'];

    if (!config) {
        return <h1 className="text-xl font-semibold text-red-600">Module not found</h1>;
    }

    const handleSubmit = async (formData: any) => {
        try {
            const { roles: selectedRoles, ...otherData } = formData;
            
            // Create multiple user-role relationships
            const promises = selectedRoles.map((roleId: number) => 
                api.post(`${config.apiBaseUrl}${config.endpoints.create.url}/`, {
                    ...otherData,
                    role_id: roleId
                })
            );
            
            await Promise.all(promises);
            navigate(`/user_roles`);
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to create user roles';
            setError(errorMessage);
            console.error('Error creating:', error);
        }
    };

    if (error) {
        return <div className="p-4 text-red-600">Error: {error}</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Create {config.displayName}</h1>
            <form className="space-y-4 sm:space-y-6 w-full max-w-lg mx-auto px-2 sm:px-0">
                <GenericForm
                    config={config}
                    onSubmit={handleSubmit}
                />
            </form>
        </div>
    );
};

export default UserRolesCreate;
