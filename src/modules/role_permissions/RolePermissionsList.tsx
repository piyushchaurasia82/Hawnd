import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import GenericFilter from "../../components/GenericFilter";
import modules from "../../config/loadModules";
import type { ModuleConfig } from "../../config/types";
import ComponentCard from "../../components/common/ComponentCard";

interface RolePermissionsListProps {
  moduleName: string;
}

interface Role {
  id: number;
  name: string;
}

interface Permission {
  id: number;
  code_name: string;
  description: string;
}

interface RolePermission {
  id: number;
  role: number;
  permission: number;
}

interface GroupedRolePermission {
  role: number;
  role_name: string;
  permissions: string[];
}

// Utility to truncate to 20 words and add ...
function truncateWords(text: string, wordLimit = 20) {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + '...';
}

// SVG icon components
const EditIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13.5l6.75-6.75a2.121 2.121 0 113 3L12 16.5H9v-3z" /></svg>
);
const TrashIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
);

const RolePermissionsList: React.FC<RolePermissionsListProps> = ({ moduleName }) => {
  const navigate = useNavigate();
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedRolePermission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  
  const config: ModuleConfig = modules[moduleName as keyof typeof modules];

  const handleFilter = (newFilters: { [key: string]: string }) => {
    setFilters(newFilters);
    fetchData(newFilters);
  };

  const fetchData = async (currentFilters: { [key: string]: string } = {}) => {
    try {
      const queryParams = new URLSearchParams(currentFilters).toString();
      const filterSuffix = queryParams ? `?${queryParams}` : '';

      // Fetch all data in parallel
      const [rolesResponse, permissionsResponse, rolePermissionsResponse] = await Promise.all([
        api.get('/api/projectmanagement/roles/' + filterSuffix),
        api.get('/api/projectmanagement/permissions/' + filterSuffix),
        api.get('/api/projectmanagement/role-permissions/' + filterSuffix)
      ]);

      // Extract data with fallbacks
      const rolesData: Role[] = Array.isArray(rolesResponse.data)
        ? rolesResponse.data
        : rolesResponse.data.data || rolesResponse.data.roles || [];

      const permissionsData: Permission[] = Array.isArray(permissionsResponse.data)
        ? permissionsResponse.data
        : permissionsResponse.data.data || permissionsResponse.data.permissions || [];

      const rolePermissionsData: RolePermission[] = Array.isArray(rolePermissionsResponse.data)
        ? rolePermissionsResponse.data
        : rolePermissionsResponse.data.data || rolePermissionsResponse.data.role_permissions || [];

      setRolePermissions(rolePermissionsData);

      // Group role permissions by role
      const groupedByRole: Record<number, string[]> = rolePermissionsData.reduce((acc: Record<number, string[]>, rp: RolePermission) => {
        if (!acc[rp.role]) {
          acc[rp.role] = [];
        }
        const permission = permissionsData.find((p: Permission) => p.id === rp.permission);
        if (permission?.code_name) {
          acc[rp.role].push(permission.code_name);
        }
        return acc;
      }, {} as Record<number, string[]>);

      // Create final grouped data structure
      const grouped = Object.entries(groupedByRole).map(([roleId, permissions]): GroupedRolePermission => {
        const roleIdNum = parseInt(roleId);
        const role = rolesData.find((r: Role) => r.id === roleIdNum);
        return {
          role: roleIdNum,
          role_name: role?.name || 'Unknown Role',
          permissions
        };
      });

      setGroupedData(grouped);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (config) {
      fetchData(filters);
    }
  }, [moduleName, config]);

  if (!config) {
    return <h1 className="text-xl font-semibold text-red-600">Module not found</h1>;
  }
  if (loading) {
    return <div className="text-gray-600 text-lg p-4">Loading...</div>;
  }

  const handleEdit = (roleId: number) => {
    // Find the first role_permission record for this role to get the ID for editing
    const firstRolePermission = rolePermissions.find(rp => rp.role === roleId);
    if (firstRolePermission) {
      navigate(`/${moduleName}/edit/${firstRolePermission.id}`);
    }
  };

  const handleDelete = async (roleId: number) => {
    if (window.confirm(`Are you sure you want to delete all permissions for this role?`)) {
      try {
        // Delete all role_permissions for this role
        const rolePermissionsToDelete = rolePermissions.filter(rp => rp.role === roleId);
        const promises = rolePermissionsToDelete.map(rp =>
          api.delete(`${config.apiBaseUrl}${config.endpoints.delete.url.replace(':id', rp.id.toString())}/`)
        );
        await Promise.all(promises);
        window.location.reload();
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">{config.displayName} List</h1>
      <div className="mb-6">
        <GenericFilter config={config} onFilter={handleFilter} />
      </div>
      <div className="mt-4">
        <div className="overflow-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100 text-gray-700 text-left">
              <tr>
                <th className="px-4 py-2 whitespace-nowrap">Role</th>
                <th className="px-4 py-2 whitespace-nowrap">Permissions</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedData.map((item) => (
                <tr key={item.role} className="border-t">
                  <td className="px-4 py-2"><span title={item.role_name}>{truncateWords(item.role_name)}</span></td>
                  <td className="px-4 py-2">{item.permissions.map((p, idx) => (
                    <span key={p} title={p}>
                      {truncateWords(p)}{idx < item.permissions.length - 1 ? ', ' : ''}
                    </span>
                  ))}</td>
                  <td className="px-4 py-2">
                    <div className="flex space-x-3">
                      <button onClick={() => handleEdit(item.role)} className="text-green-600 hover:text-green-800" title="Edit">
                        <EditIcon />
                      </button>
                      <button onClick={() => handleDelete(item.role)} className="text-red-600 hover:text-red-800" title="Delete">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {groupedData.length === 0 && (
            <div className="text-center text-gray-500 py-8">No role permissions found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RolePermissionsList;
