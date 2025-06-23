import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import GenericForm from '../../components/GenericForm';
import modules from '../../config/loadModules';
import type { ModuleConfig } from '../../config/types';

interface RolePermissionsCreateProps {
    moduleName: string;
}

const RolePermissionsCreate: React.FC<RolePermissionsCreateProps> = ({ moduleName }) => {
    const config: ModuleConfig | undefined = moduleName ? modules[moduleName] : undefined;
    const navigate = useNavigate();
    const [roles, setRoles] = useState<{ id: number; name: string; description?: string }[]>([]);
    const [permissions, setPermissions] = useState<{ id: number; code_name: string; description?: string }[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch roles and permissions on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch roles
                const rolesResponse = await api.get(`/api/projectmanagement/roles/`);
                const rolesData = Array.isArray(rolesResponse.data)
                  ? rolesResponse.data
                  : rolesResponse.data.data || rolesResponse.data.roles || [];
                setRoles(rolesData);

                // Fetch permissions
                const permissionsResponse = await api.get(`/api/projectmanagement/permissions/`);
                const permissionsData = Array.isArray(permissionsResponse.data)
                  ? permissionsResponse.data
                  : permissionsResponse.data.data || permissionsResponse.data.permissions || [];
                setPermissions(permissionsData);
            } catch (err) {
                setError('Failed to fetch roles or permissions');
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (!config) return <div className="text-red-600 text-lg font-semibold p-4">Module not found</div>;
    if (loading) return <div className="text-gray-600 text-lg p-4">Loading...</div>;
    if (error) return <div className="text-red-600 text-lg font-semibold p-4">{error}</div>;

    // Enhance config with dropdown fields
    const enhancedConfig: ModuleConfig = {
        ...config,
        formConfig: {
            ...config.formConfig,
            fields: ['role', 'permission'],
            validation: {
                role: { required: 'Role is required' },
                permission: { required: 'At least one permission is required' },
            },
        },
        fields: [
            {
                name: 'role',
                label: 'Role',
                type: 'select',
                options: roles.map((role) => ({
                    value: role.id,
                    label: role.name,
                })),
                required: true,
                visibleInForm: true,
            },
            {
                name: 'permission',
                label: 'Permissions',
                type: 'multiselect',
                options: permissions.map((perm) => ({
                    value: perm.id,
                    label: perm.code_name,
                })),
                required: true,
                visibleInForm: true,
            },
        ],
    };

    const handleSubmit = async (formData: { [key: string]: any }) => {
        try {
            const { permission, ...otherData } = formData;
            // Create multiple role-permission relationships
            const promises = permission.map((permId: number) =>
                api.post(`${config.apiBaseUrl}${config.endpoints.create.url}/`, {
                    ...otherData,
                    permission: permId
                })
            );
            await Promise.all(promises);
            navigate(`/${moduleName}`);
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to create role permissions';
            setError(errorMessage);
            console.error('Error creating:', error);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Create {config.displayName}</h1>
            <form className="space-y-4 sm:space-y-6 w-full max-w-lg mx-auto px-2 sm:px-0">
                <GenericForm config={enhancedConfig} onSubmit={handleSubmit} />
            </form>
        </div>
    );
};

export default RolePermissionsCreate;
