import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import GenericForm from '../../components/GenericForm';
import modules from '../../config/loadModules';
import type { ModuleConfig } from '../../config/types';

interface RolePermissionsEditProps {
    moduleName: string;
}

const RolePermissionsEdit: React.FC<RolePermissionsEditProps> = ({ moduleName }) => {
    const { id } = useParams<{ id: string }>();
    const config: ModuleConfig | undefined = moduleName ? modules[moduleName] : undefined;
    const navigate = useNavigate();
    const [roles, setRoles] = useState<{ id: number; name: string; description?: string }[]>([]);
    const [permissions, setPermissions] = useState<{ id: number; code_name: string; description?: string }[]>([]);

    if (!config) return (
        <div className="text-lg font-medium text-red-600">Module not found</div>
    );

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
                console.error('Error fetching data:', err);
            }
        };
        fetchData();
    }, []);

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
            // First, delete existing role-permission relationships for this role
            await api.delete(`${config.apiBaseUrl}${config.endpoints.delete.url.replace(':id', id!)}/`);
            // Then create new role-permission relationships
            const promises = permission.map((permId: number) =>
                api.post(`${config.apiBaseUrl}${config.endpoints.create.url}/`, {
                    ...otherData,
                    permission: permId
                })
            );
            await Promise.all(promises);
            navigate(`/${moduleName}`);
        } catch (error: any) {
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

export default RolePermissionsEdit;
