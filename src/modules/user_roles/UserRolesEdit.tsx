import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import GenericForm from '../../components/GenericForm';
import modules from '../../config/loadModules';
import type { ModuleConfig } from '../../config/types';

interface UserRolesEditProps {
    moduleName: string;
}

const UserRolesEdit: React.FC<UserRolesEditProps> = ({ moduleName }) => {
    const { id } = useParams<{ id: string }>();
    const config: ModuleConfig | undefined = moduleName ? modules[moduleName] : undefined;
    const navigate = useNavigate();
    const [users, setUsers] = useState<{ id: number; username: string; first_name: string; last_name: string }[]>([]);
    const [roles, setRoles] = useState<{ id: number; name: string; description: string }[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch users and roles on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch users
                const usersResponse = await api.get(`/api/projectmanagement/users/`);
                const usersData = Array.isArray(usersResponse.data)
                  ? usersResponse.data
                  : usersResponse.data.data || usersResponse.data.users || [];
                setUsers(usersData);

                // Fetch roles
                const rolesResponse = await api.get(`/api/projectmanagement/roles/`);
                const rolesData = Array.isArray(rolesResponse.data)
                  ? rolesResponse.data
                  : rolesResponse.data.data || rolesResponse.data.roles || [];
                setRoles(rolesData);
            } catch (err) {
                setError('Failed to fetch users or roles');
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (!config) return (
        <div className="text-lg font-medium text-red-600">Module not found</div>
    );
    if (loading) return <div className="text-gray-600 text-lg p-4">Loading...</div>;
    if (error) return <div className="text-red-600 text-lg font-semibold p-4">{error}</div>;

    // Enhance config with dropdown fields
    const enhancedConfig: ModuleConfig = {
        ...config,
        formConfig: {
            ...config.formConfig,
            fields: ['user_id', 'roles', 'assigned_at'],
            validation: {
                user_id: { required: 'User is required' },
                roles: { required: 'Roles are required' },
            },
        },
        fields: [
            {
                name: 'user_id',
                label: 'User',
                type: 'select',
                options: users.map((user) => ({
                    value: user.id,
                    label: `${user.first_name} ${user.last_name} (${user.username})`,
                })),
                required: true,
                visibleInForm: true,
            },
            {
                name: 'roles',
                label: 'Roles',
                type: 'multiselect',
                options: roles.map((role) => ({
                    value: role.id,
                    label: role.name,
                })),
                required: true,
                visibleInForm: true,
            },
            {
                name: 'assigned_at',
                label: 'Assigned At',
                type: 'datetime',
                isPrimaryKey: false,
                readOnly: false,
                visibleInList: true,
                visibleInForm: true,
                filterable: true,
                filterType: 'date',
                required: false,
                maxLength: null,
                unique: false,
                defaultValue: 'CURRENT_TIMESTAMP'
            }
        ],
    };

    const handleSubmit = async (formData: { [key: string]: any }) => {
        try {
            const { roles, ...otherData } = formData;
            
            // First, delete existing user-role relationships for this user
            await api.delete(`${config.apiBaseUrl}${config.endpoints.delete.url.replace(':id', id!)}/`);
            
            // Then create new user-role relationships
            const promises = roles.map((roleId: number) => 
                api.post(`${config.apiBaseUrl}${config.endpoints.create.url}/`, {
                    ...otherData,
                    role_id: roleId
                })
            );
            
            await Promise.all(promises);
            navigate(`/${moduleName}`);
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to update user roles';
            setError(errorMessage);
            console.error('Error updating:', error);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Edit {config.displayName}</h1>
            <form className="space-y-4 sm:space-y-6 w-full max-w-lg mx-auto px-2 sm:px-0">
                <GenericForm config={enhancedConfig} id={id} onSubmit={handleSubmit} isEdit />
            </form>
        </div>
    );
};

export default UserRolesEdit;
