import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import GenericForm from '../../components/GenericForm';
import modules from '../../config/loadModules';
import type { ModuleConfig } from '../../config/types';

interface RolePermissionsEditProps {
    moduleName: string;
}

interface Role {
    id: number;
    name: string;
    description?: string;
}

interface Permission {
    id: number;
    code_name: string;
    description?: string;
}

const MultiSelectDropdown = ({ options, selectedValues, onChange, label, disabled }: {
    options: { value: number; label: string }[];
    selectedValues: number[];
    onChange: (values: number[]) => void;
    label?: string;
    disabled?: boolean;
}) => {
    const [open, setOpen] = useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (value: number) => {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter((v) => v !== value));
        } else {
            onChange([...selectedValues, value]);
        }
    };

    const selectedLabels = options.filter(opt => selectedValues.includes(opt.value)).map(opt => opt.label);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                className="w-full bg-gray-100 rounded h-12 p-2 text-sm border border-gray-300 text-left flex items-center justify-between"
                onClick={() => setOpen((o) => !o)}
                disabled={disabled}
            >
                <span className={selectedLabels.length === 0 ? 'text-gray-400' : ''}>
                    {selectedLabels.length > 0 ? selectedLabels.join(', ') : `Select ${label || ''}`}
                </span>
                <span className="ml-2 text-gray-400">▼</span>
            </button>
            {open && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                    {options.map((option) => (
                        <label key={option.value} className="flex items-center px-2 py-2 cursor-pointer hover:bg-gray-100 text-sm">
                            <input
                                type="checkbox"
                                checked={selectedValues.includes(option.value)}
                                onChange={() => handleSelect(option.value)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2"
                                disabled={disabled}
                            />
                            <span>{option.label}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

const RolePermissionsEdit: React.FC<RolePermissionsEditProps> = ({ moduleName }) => {
    const { id } = useParams<{ id: string }>();
    const config: ModuleConfig | undefined = moduleName ? modules[moduleName] : undefined;
    const navigate = useNavigate();
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedRole, setSelectedRole] = useState<number | ''>('');
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);

    if (!config) return (
        <div className="text-lg font-medium text-red-600">Module not found</div>
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rolesResponse, permissionsResponse, rolePermsResponse] = await Promise.all([
                    api.get('/api/projectmanagement/roles/'),
                    api.get('/api/projectmanagement/permissions/'),
                    api.get(`/api/projectmanagement/role-permissions/?role=${id}`)
                ]);
                const rolesData: Role[] = Array.isArray(rolesResponse.data)
                    ? rolesResponse.data
                    : rolesResponse.data.data || rolesResponse.data.roles || [];
                const permissionsData: Permission[] = Array.isArray(permissionsResponse.data)
                    ? permissionsResponse.data
                    : permissionsResponse.data.data || permissionsResponse.data.permissions || [];
                setRoles(rolesData);
                setPermissions(permissionsData);
                setSelectedRole(Number(id));
                const assignedPerms = Array.isArray(rolePermsResponse.data)
                    ? rolePermsResponse.data
                    : rolePermsResponse.data.data || rolePermsResponse.data.role_permissions || [];
                const permissionIds = assignedPerms
                    .filter((rp: any) => Number(rp.role) === Number(id))
                    .map((rp: any) => Number(rp.permission))
                    .filter((pid: number) => typeof pid === 'number' && !isNaN(pid));
                setSelectedPermissions(permissionIds);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRole || selectedPermissions.length === 0) {
            alert('Please select both role and permissions');
            return;
        }
        try {
            // 1. Fetch all current role-permission mappings for this role
            const resp = await api.get(`/api/projectmanagement/role-permissions/?role=${selectedRole}`);
            const assignedPerms = Array.isArray(resp.data)
                ? resp.data
                : resp.data.data || resp.data.role_permissions || [];
            // 2. Delete each mapping by ID
            await Promise.all(
                assignedPerms
                    .filter((rp: any) => Number(rp.role) === Number(selectedRole))
                    .map((rp: any) =>
                        api.delete(`/api/projectmanagement/role-permissions/${rp.id}/`)
                    )
            );
            // 3. Create new mappings
            const promises = selectedPermissions.map(permissionId =>
                api.post('/api/projectmanagement/role-permissions/', {
                    role: selectedRole,
                    permission: permissionId
                })
            );
            await Promise.all(promises);
            setSuccess(true);
            setTimeout(() => navigate('/role_permissions'), 1200);
        } catch (error) {
            alert('Failed to update role permissions. Please try again.');
            console.error('Error updating:', error);
        }
    };

    if (loading) {
        return <div className="p-8 text-gray-600">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Edit Role Permissions</h1>
            {success && (
                <div className="mb-4 p-2 bg-green-100 text-green-800 rounded border border-green-300">
                    Permissions updated successfully! Redirecting to list...
                </div>
            )}
            <form onSubmit={handleUpdate}>
                <div className="flex flex-row gap-4 mb-6">
                    <div style={{ width: 420 }}>
                        <label className="block mb-2 font-medium">Role<span className="text-red-500">*</span></label>
                        <select
                            className="w-full border rounded px-3 py-2 bg-gray-100"
                            value={selectedRole}
                            onChange={e => setSelectedRole(Number(e.target.value))}
                            disabled
                        >
                            <option value="">Select Role</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ width: 420 }}>
                        <label className="block mb-2 font-medium">Permissions<span className="text-red-500">*</span></label>
                        <MultiSelectDropdown
                            options={permissions.map(p => ({ value: p.id, label: p.code_name }))}
                            selectedValues={selectedPermissions}
                            onChange={setSelectedPermissions}
                            label="Permissions"
                        />
                    </div>
                </div>
                <div className="flex gap-2 mt-6">
                    <button
                        type="button"
                        className="bg-gray-100 text-black px-6 py-2 rounded border border-gray-200 hover:bg-gray-200"
                        onClick={() => navigate('/role_permissions')}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="bg-orange-400 text-white px-6 py-2 rounded hover:bg-orange-500 font-semibold"
                        disabled={!selectedRole || selectedPermissions.length === 0}
                    >
                        Update
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RolePermissionsEdit;
