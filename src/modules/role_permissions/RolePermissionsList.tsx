import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
    
interface RolePermissionsListProps {
  moduleName: string;
}

interface Role {
  id: number;
  name: string;
  users_count?: number;
}

interface Permission {
  id: number;
  code_name: string;
  name?: string;
  description?: string;
}

interface RolePermission {
  id: number;
  role: number;
  permission: number;
}

interface UserRole {
  id: number;
  user_id: number;
  role_id: number;
}

// Utility to truncate to 20 words and add ...
function truncateWords(text: string, wordLimit = 20) {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + '...';
}

const RolePermissionsList: React.FC<RolePermissionsListProps> = ({ moduleName }) => {
  const navigate = useNavigate();
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Create form states
  const [createSelectedRole, setCreateSelectedRole] = useState<string>("");
  const [createSelectedPermissions, setCreateSelectedPermissions] = useState<number[]>([]);
  const [isCreatePermissionDropdownOpen, setIsCreatePermissionDropdownOpen] = useState(false);
  
  // List filter states
  const [filterPermissions, setFilterPermissions] = useState<string[]>([]);
  const [isFilterPermissionDropdownOpen, setIsFilterPermissionDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [allRolesDropdown, setAllRolesDropdown] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesResponse, permissionsResponse, rolePermissionsResponse, userRolesResponse] = await Promise.all([
        api.get('/api/projectmanagement/roles/'),
        api.get('/api/projectmanagement/permissions/'),
        api.get('/api/projectmanagement/role-permissions/'),
        api.get('/api/projectmanagement/user_roles/'),
      ]);
      const rolesData: Role[] = Array.isArray(rolesResponse.data)
        ? rolesResponse.data
        : rolesResponse.data.data || rolesResponse.data.roles || [];
      const permissionsData: Permission[] = Array.isArray(permissionsResponse.data)
        ? permissionsResponse.data
        : permissionsResponse.data.data || permissionsResponse.data.permissions || [];
      const rolePermissionsData: RolePermission[] = (Array.isArray(rolePermissionsResponse.data)
        ? rolePermissionsResponse.data
        : rolePermissionsResponse.data.data || rolePermissionsResponse.data.role_permissions || [])
        .map((rp: any) => ({
          id: rp.id,
          role: rp.role_id ?? rp.role,
          permission: rp.permission_id ?? rp.permission
        }));
      const userRolesData: UserRole[] = Array.isArray(userRolesResponse.data)
        ? userRolesResponse.data
        : userRolesResponse.data.data || userRolesResponse.data.user_roles || [];
      setRoles(rolesData);
      setPermissions(permissionsData);
      setRolePermissions(rolePermissionsData);
      setUserRoles(userRolesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [moduleName]);

  const handleCreatePermissionToggle = (permissionId: number) => {
    setCreateSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleFilterPermissionToggle = (permission: string) => {
    setFilterPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleCreateRolePermission = async () => {
    if (!createSelectedRole || createSelectedPermissions.length === 0) {
      alert('Please select both role and permissions');
      return;
    }

    try {
      // Find the role ID from the selected role name
      const selectedRole = roles.find(r => r.name === createSelectedRole);
      if (!selectedRole) {
        alert('Selected role not found');
        return;
      }

      // Find permission IDs from selected permission names
      const selectedPermissionIds = createSelectedPermissions;

      // Prevent duplicate role-permission creation
      const existingMappings = rolePermissions.filter(rp => rp.role === selectedRole.id && selectedPermissionIds.includes(rp.permission));
      if (existingMappings.length > 0) {
        alert('Some selected permissions are already assigned to this role. Please deselect them.');
        return;
      }

      // Create role permissions in one request (bulk)
      await api.post('/api/projectmanagement/role-permissions/', {
        role_id: selectedRole.id,
        permission: selectedPermissionIds
      });

      // Clear the create form
      setCreateSelectedRole("");
      setCreateSelectedPermissions([]);
      setIsCreatePermissionDropdownOpen(false);

      // Refresh the list
      await fetchData();

    } catch (error: any) {
      console.error('Error creating role permissions:', error);
      alert(error?.response?.data?.error || 'Failed to create role permissions. Please try again.');
    }
  };

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="text-[16px] text-black mb-4 flex items-center gap-1">
        <span className="hover:underline cursor-pointer text-orange-500" onClick={() => navigate('/')}>Dashboard</span>
        <span className="mx-1">/</span>
        <span className="text-gray-700">Role Permissions</span>
      </div>
      
      {/* Create Role Permission Section */}
      <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200">
        <h1 className="text-2xl font-bold mb-6">Create Role Permission</h1>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <select
            className="border rounded px-4 py-2 w-full sm:min-w-[420px]"
            value={createSelectedRole}
            onChange={e => setCreateSelectedRole(e.target.value)}
          >
            <option value="">Select Role</option>
            {roles.map(role => (
              <option key={role.id} value={role.name}>{role.name}</option>
            ))}
          </select>
          <div className="relative">
            <button
              type="button"
              className="border rounded px-4 py-2 w-full sm:min-w-[420px] text-left bg-white flex justify-between items-center"
              onClick={() => setIsCreatePermissionDropdownOpen(!isCreatePermissionDropdownOpen)}
            >
              <span className="truncate">
                {createSelectedPermissions.length === 0
                  ? "Select Permissions"
                  : permissions
                      .filter(p => createSelectedPermissions.includes(p.id))
                      .map(p => p.name || p.code_name)
                      .join(', ')}
              </span>
              <span className="ml-2">▼</span>
            </button>
            {isCreatePermissionDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {permissions.map(permission => (
                  <label
                    key={permission.id}
                    className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={createSelectedPermissions.includes(permission.id)}
                      onChange={() => handleCreatePermissionToggle(permission.id)}
                      className="mr-3"
                    />
                    <span className="font-semibold">{permission.name || permission.code_name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 ml-auto">
            <button 
              className="bg-gray-100 px-4 py-2 rounded border" 
              onClick={() => { 
                setCreateSelectedRole(""); 
                setCreateSelectedPermissions([]); 
              }}
            >
              Cancel
            </button>
            <button 
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:bg-orange-300"
              onClick={handleCreateRolePermission}
              disabled={!createSelectedRole || createSelectedPermissions.length === 0}
            >
              Create
            </button>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 w-full">
          <div className="relative w-full sm:w-auto">
            <button className="border rounded px-4 py-2 bg-gray-50 w-full sm:w-auto" onClick={() => setAllRolesDropdown(!allRolesDropdown)}>
              All Roles <span className="ml-2">▼</span>
            </button>
            {allRolesDropdown && (
              <div className="absolute z-10 bg-white border rounded shadow mt-1 w-full">
                <div className="px-4 py-2 cursor-pointer" onClick={() => { setAllRolesDropdown(false); }}>All Roles</div>
                {roles.map(role => (
                  <div 
                    key={role.id} 
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100" 
                    onClick={() => { 
                      setAllRolesDropdown(false); 
                    }}
                  >
                    {role.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 w-full sm:w-auto">
            <input
              type="text"
              className="border rounded px-4 py-2 w-full"
              placeholder="Search roles"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <button
              type="button"
              className="border rounded px-4 py-2 min-w-[200px] w-full sm:w-auto text-left bg-white flex justify-between items-center"
              onClick={() => setIsFilterPermissionDropdownOpen(!isFilterPermissionDropdownOpen)}
            >
              <span className="truncate">
                {filterPermissions.length === 0 
                  ? "Filter by Permissions" 
                  : `${filterPermissions.length} Filter${filterPermissions.length === 1 ? '' : 's'}`}
              </span>
              <span className="ml-2">▼</span>
            </button>
            {isFilterPermissionDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {permissions.map(permission => (
                  <div
                    key={permission.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    onClick={() => handleFilterPermissionToggle(permission.code_name)}
                  >
                    <input
                      type="checkbox"
                      checked={filterPermissions.includes(permission.code_name)}
                      onChange={() => {}}
                      className="mr-3"
                    />
                    <span>{permission.code_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-lg w-full">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100 text-gray-700 text-left">
              <tr className="!bg-gray-100">
                <th className="px-6 py-4 !bg-gray-100 whitespace-nowrap w-[200px]">Role</th>
                <th className="px-6 py-4 !bg-gray-100 whitespace-nowrap w-[400px]">Permission</th>
                <th className="px-6 py-4 !bg-gray-100 whitespace-nowrap text-center w-[100px]">Users</th>
                <th className="px-6 py-4 !bg-gray-100 w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => {
                const rolePerms = rolePermissions.filter(rp => rp.role === role.id);
                const permissionObjs = rolePerms
                  .map(rp => permissions.find(p => Number(p.id) === Number(rp.permission)))
                  .filter(Boolean);
                return (
                  <tr key={role.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium" title={role.name}>{truncateWords(role.name)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {permissionObjs.length === 0 ? (
                        <span className="text-gray-400">No permissions assigned</span>
                      ) : (
                        permissionObjs.map((permObj, idx) => (
                          <span key={permObj!.id} className="inline-block mr-1 bg-gray-50 px-2 py-1 rounded text-xs border align-middle">
                            <span className="font-semibold">{permObj!.name || permObj!.code_name}</span>
                            {idx < permissionObjs.length - 1 ? ', ' : ''}
                          </span>
                        ))
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {userRoles.filter(ur => ur.role_id === role.id).length}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => navigate(`/${moduleName}/edit/${role.id}`)} className="text-orange-600 hover:text-orange-800 font-semibold mr-2">Edit</button>
                      <button
                        onClick={async () => {
                          if (!window.confirm('Are you sure you want to delete all permissions for this role?')) return;
                          try {
                            // Find all role-permission mappings for this role
                            const mappings = rolePermissions.filter(rp => rp.role === role.id);
                            await Promise.all(mappings.map(m => api.delete(`/api/projectmanagement/role-permissions/${m.id}/`)));
                            await fetchData();
                          } catch (error: any) {
                            console.error('Error deleting role permissions:', error);
                            alert(error?.response?.data?.error || 'Failed to delete role permissions.');
                          }
                        }}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {roles.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-8">No roles found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RolePermissionsList;
