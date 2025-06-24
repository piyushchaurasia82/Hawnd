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
    const [initialValues, setInitialValues] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);

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

                // Fetch assigned permissions for this role
                const rolePermsResponse = await api.get(`/api/projectmanagement/role-permissions/?role=${id}`);
                const assignedPerms = Array.isArray(rolePermsResponse.data)
                  ? rolePermsResponse.data
                  : rolePermsResponse.data.data || rolePermsResponse.data.role_permissions || [];
                // Ensure permission IDs are numbers
                const permissionIds = assignedPerms.map((rp: any) => Number(rp.permission));
                console.log('Assigned permission IDs:', permissionIds);
                console.log('Permission options:', permissions);
                // Set initial values for the form
                setInitialValues({
                  role: Number(id),
                  permission: permissionIds
                });
                console.log('Initial values for form:', { role: Number(id), permission: permissionIds });
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

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
                readOnly: true, // Prevent changing role in edit
            },
            {
                name: 'permission',
                label: 'Permissions',
                type: 'multiselect',
                options: permissions.map((perm) => ({
                    value: Number(perm.id),
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
            // First, delete existing role-permission relationships for this role (single delete request)
            await api.delete(`${config.apiBaseUrl}${config.endpoints.delete.url.replace(':id', id!)}/`);
            // Then create new role-permission relationships
            const promises = permission.map((permId: number) =>
                api.post(`${config.apiBaseUrl}${config.endpoints.create.url}/`, {
                    ...otherData,
                    permission: permId
                })
            );
            await Promise.all(promises);
            setSuccess(true);
            setTimeout(() => navigate(`/${moduleName}`), 1200);
        } catch (error: any) {
            console.error('Error updating:', error);
        }
    };

    if (loading || !initialValues) return <div className="p-4 text-gray-600">Loading...</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Edit {config.displayName}</h1>
            {success && (
                <div className="mb-4 p-2 bg-green-100 text-green-800 rounded border border-green-300">
                    Permissions updated successfully! Redirecting to list...
                </div>
            )}
            <GenericForm config={enhancedConfig} id={id} onSubmit={handleSubmit} isEdit initialValues={initialValues} />
        </div>
    );
};

export default RolePermissionsEdit;
