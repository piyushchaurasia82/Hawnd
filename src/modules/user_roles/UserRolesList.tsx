import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import GenericFilter from '../../components/GenericFilter';
import modules from '../../config/loadModules';
import type { ModuleConfig } from '../../config/types';
import { format } from 'date-fns';

interface UserRolesListProps {
    moduleName: string;
}

interface UserRole {
    id: number;
    user_id: number;
    role_id: number;
    assigned_at: string;
}

interface User {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
}

interface Role {
    id: number;
    name: string;
}

interface GroupedUserRole {
    user_id: number;
    user_name: string;
    roles: string[];
    assigned_at: string;
    main_id: number;
}

// SVG icon components
const EyeIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 12S5.25 5.25 12 5.25 22.5 12 22.5 12 18.75 18.75 12 18.75 1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={2} /></svg>
);
const EditIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13.5l6.75-6.75a2.121 2.121 0 113 3L12 16.5H9v-3z" /></svg>
);
const TrashIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
);

const UserRolesList: React.FC<UserRolesListProps> = ({ moduleName }) => {
    const navigate = useNavigate();
    const [userRoles, setUserRoles] = useState<UserRole[]>([]);
    const [groupedData, setGroupedData] = useState<GroupedUserRole[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [[],setUsers] = useState<User[]>([]);
    const [[],setRoles] = useState<Role[]>([]);

    const config: ModuleConfig = modules[moduleName as keyof typeof modules];

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all data in parallel
                const [userRolesResponse, usersResponse, rolesResponse] = await Promise.all([
                    api.get('/api/projectmanagement/user_roles/'),
                    api.get('/api/projectmanagement/users/'),
                    api.get('/api/projectmanagement/roles/'),
                ]);
                const userRolesData: UserRole[] = Array.isArray(userRolesResponse.data)
                    ? userRolesResponse.data
                    : userRolesResponse.data.data || userRolesResponse.data.user_roles || [];
                setUserRoles(userRolesData);

                const usersData: User[] = Array.isArray(usersResponse.data)
                    ? usersResponse.data
                    : usersResponse.data.data || usersResponse.data.users || [];
                setUsers(usersData);

                const rolesData: Role[] = Array.isArray(rolesResponse.data)
                    ? rolesResponse.data
                    : rolesResponse.data.data || rolesResponse.data.roles || [];
                setRoles(rolesData);

                // Group the data
                const grouped = groupUserRoles(userRolesData, usersData, rolesData);
                setGroupedData(grouped);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (config) {
            fetchData();
        }
    }, [moduleName, config]);

    const groupUserRoles = (userRolesData: UserRole[], usersData: User[], rolesData: Role[]): GroupedUserRole[] => {
        // Use a Map to ensure each user_id is only processed once
        const grouped = new Map<number, GroupedUserRole>();

        userRolesData.forEach(userRole => {
            const user = usersData.find(u => String(u.id) === String(userRole.user_id));
            let displayName = '';
            if (user) {
                if (user.first_name || user.last_name) {
                    displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                    if (user.username) displayName += ` (${user.username})`;
                } else if (user.username) {
                    displayName = user.username;
                } else if (user.name) {
                    displayName = user.name;
                } else {
                    displayName = '-';
                }
            } else {
                displayName = '-';
            }
            if (!grouped.has(userRole.user_id)) {
                grouped.set(userRole.user_id, {
                    user_id: userRole.user_id,
                    user_name: displayName,
                    roles: [],
                    assigned_at: userRole.assigned_at,
                    main_id: userRole.id
                });
            }
            const group = grouped.get(userRole.user_id)!;
            group.roles.push(
                (rolesData.find(r => r.id === userRole.role_id)?.name) || `Role ID: ${userRole.role_id}`
            );
        });

        return Array.from(grouped.values());
    };

    if (!config) {
        return <h1 className="text-xl font-semibold text-red-600">Module not found</h1>;
    }

    if (loading) {
        return <div className="text-gray-600 text-lg p-4">Loading...</div>;
    }

    const handleEdit = (userId: number) => {
        // Find the first user_role record for this user to get the ID for editing
        const firstUserRole = userRoles.find(ur => ur.user_id === userId);
        if (firstUserRole) {
            navigate(`/${moduleName}/edit/${firstUserRole.id}`);
        }
    };

    const handleDelete = async (userId: number) => {
        if (window.confirm(`Are you sure you want to delete all roles for this user?`)) {
            try {
                // Delete all user_roles for this user
                const userRolesToDelete = userRoles.filter(ur => ur.user_id === userId);
                const promises = userRolesToDelete.map(ur => 
                    api.delete(`${config.apiBaseUrl}${config.endpoints.delete.url.replace(':id', ur.id.toString())}/`)
                );
                await Promise.all(promises);
                window.location.reload();
            } catch (error) {
                console.error('Error deleting:', error);
            }
        }
    };

    const handleShow = (userId: number) => {
        // Find the first user_role record for this user to get the ID for showing
        const firstUserRole = userRoles.find(ur => ur.user_id === userId);
        if (firstUserRole) {
            navigate(`/${moduleName}/show/${firstUserRole.id}`);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">{config.displayName} List</h1>
            <div className="mb-6">
                <GenericFilter config={config} />
            </div>
            <div className="mt-4">
                <div className="overflow-auto">
                    <table className="min-w-full border border-gray-200 text-sm">
                        <thead className="bg-gray-100 text-gray-700 text-left">
                            <tr>
                                {/* <th className="px-4 py-2 whitespace-nowrap">ID</th> */}
                                <th className="px-4 py-2 whitespace-nowrap">User</th>
                                <th className="px-4 py-2 whitespace-nowrap">Roles</th>
                                <th className="px-4 py-2 whitespace-nowrap">Assigned At</th>
                                <th className="px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedData.map((item) => (
                                <tr key={item.user_id} className="border-t">
                                    {/* <td className="px-4 py-2">{item.main_id}</td> */}
                                    <td className="px-4 py-2">{item.user_name}</td>
                                    <td className="px-4 py-2">
                                        {item.roles.length > 0 ? item.roles.join(', ') : '-'}
                                    </td>
                                    <td className="px-4 py-2">{item.assigned_at ? format(new Date(item.assigned_at), 'dd/MM/yyyy') : '-'}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex space-x-3">
                                            <button onClick={() => handleShow(item.user_id)} className="text-blue-600 hover:text-blue-800" title="Show">
                                                <EyeIcon />
                                            </button>
                                            <button onClick={() => handleEdit(item.user_id)} className="text-green-600 hover:text-green-800" title="Edit">
                                                <EditIcon />
                                            </button>
                                            <button onClick={() => handleDelete(item.user_id)} className="text-red-600 hover:text-red-800" title="Delete">
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {groupedData.length === 0 && (
                        <div className="text-center text-gray-500 py-8">No user roles found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserRolesList;
