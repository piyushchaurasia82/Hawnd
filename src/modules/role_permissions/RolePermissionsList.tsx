import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import GenericFilter from "../../components/GenericFilter";
import modules from "../../config/loadModules";
import type { ModuleConfig } from "../../config/types";
    
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
  users_count: number;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
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

// SVG icon components
const EditIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13.5l6.75-6.75a2.121 2.121 0 113 3L12 16.5H9v-3z" /></svg>
);
const TrashIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
);

// Loading spinner
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <svg className="animate-spin h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
    </svg>
  </div>
);

const RolePermissionsList: React.FC<RolePermissionsListProps> = ({ moduleName }) => {
  const navigate = useNavigate();
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Create form states
  const [createSelectedRole, setCreateSelectedRole] = useState<string>("");
  const [createSelectedPermissions, setCreateSelectedPermissions] = useState<string[]>([]);
  const [isCreatePermissionDropdownOpen, setIsCreatePermissionDropdownOpen] = useState(false);
  
  // List filter states
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterPermissions, setFilterPermissions] = useState<string[]>([]);
  const [isFilterPermissionDropdownOpen, setIsFilterPermissionDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [allRolesDropdown, setAllRolesDropdown] = useState(false);

  const config: ModuleConfig = modules[moduleName as keyof typeof modules];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesResponse, permissionsResponse, rolePermissionsResponse, usersResponse, userRolesResponse] = await Promise.all([
        api.get('/api/projectmanagement/roles/'),
        api.get('/api/projectmanagement/permissions/'),
        api.get('/api/projectmanagement/role-permissions/'),
        api.get('/api/projectmanagement/users/'),
        api.get('/api/projectmanagement/user_roles/'),
      ]);
      const rolesData: Role[] = Array.isArray(rolesResponse.data)
        ? rolesResponse.data
        : rolesResponse.data.data || rolesResponse.data.roles || [];
      const permissionsData: Permission[] = Array.isArray(permissionsResponse.data)
        ? permissionsResponse.data
        : permissionsResponse.data.data || permissionsResponse.data.permissions || [];
      const rolePermissionsData: RolePermission[] = Array.isArray(rolePermissionsResponse.data)
        ? rolePermissionsResponse.data
        : rolePermissionsResponse.data.data || rolePermissionsResponse.data.role_permissions || [];
      const usersData: User[] = Array.isArray(usersResponse.data)
        ? usersResponse.data
        : usersResponse.data.data || usersResponse.data.users || [];
      const userRolesData: UserRole[] = Array.isArray(userRolesResponse.data)
        ? userRolesResponse.data
        : userRolesResponse.data.data || userRolesResponse.data.user_roles || [];
      setRoles(rolesData);
      setPermissions(permissionsData);
      setRolePermissions(rolePermissionsData);
      setUsers(usersData);
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

  // Group role-permission mappings by role
  const groupedData = roles.map(role => {
    const rolePerms = rolePermissions.filter(rp => rp.role === role.id);
    const permissionObjs = rolePerms.map(rp => permissions.find(p => p.id === rp.permission)).filter(Boolean);
    const permissionCodes = permissionObjs.map(p => p!.code_name);
    const usersWithRole = userRoles.filter(ur => ur.role_id === role.id).map(ur => ur.user_id);
    return {
      role: role.id,
      role_name: role.name,
      permissions: permissionCodes,
      permissionObjs,
      users_count: usersWithRole.length
    };
  });

  // Filtering logic for grouped data
  const filteredData = groupedData.filter(item => {
    const matchesRole = filterRole ? item.role_name === filterRole : true;
    const matchesPermissions = filterPermissions.length === 0 || filterPermissions.every(fp => item.permissions.includes(fp));
    const matchesSearch = search ? item.role_name.toLowerCase().includes(search.toLowerCase()) : true;
    return matchesRole && matchesPermissions && matchesSearch;
  });

  const handleCreatePermissionToggle = (permission: string) => {
    setCreateSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
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
      const selectedPermissionIds = permissions
        .filter(p => createSelectedPermissions.includes(p.code_name))
        .map(p => p.id);

      // Prevent duplicate role-permission creation
      const existingMappings = rolePermissions.filter(rp => rp.role === selectedRole.id && selectedPermissionIds.includes(rp.permission));
      if (existingMappings.length > 0) {
        alert('Some selected permissions are already assigned to this role. Please deselect them.');
        return;
      }

      // Create role permissions for each selected permission
      const promises = selectedPermissionIds.map(permissionId =>
        api.post('/api/projectmanagement/role-permissions/', {
          role: selectedRole.id,
          permission: permissionId
        })
      );

      await Promise.all(promises);

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

  // Delete a role-permission mapping
  const handleDeleteRolePermission = async (roleId: number, permissionCode: string) => {
    if (!window.confirm('Are you sure you want to remove this permission from the role?')) return;
    try {
      // Find the permission id
      const permission = permissions.find(p => p.code_name === permissionCode);
      if (!permission) throw new Error('Permission not found');
      // Find the role-permission mapping
      const mapping = rolePermissions.find(rp => rp.role === roleId && rp.permission === permission.id);
      if (!mapping) throw new Error('Role-permission mapping not found');
      await api.delete(`/api/projectmanagement/role-permissions/${mapping.id}/`);
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting role permission:', error);
      alert(error?.response?.data?.error || 'Failed to delete role permission.');
    }
  };

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 mb-4">Role Permissions / Create Role Permission</div>
      
      {/* Create Role Permission Section */}
      <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200">
        <h1 className="text-2xl font-bold mb-6">Create Role Permission</h1>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <select
            className="border rounded px-4 py-2 min-w-[420px]"
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
              className="border rounded px-4 py-2 min-w-[420px] text-left bg-white flex justify-between items-center"
              onClick={() => setIsCreatePermissionDropdownOpen(!isCreatePermissionDropdownOpen)}
            >
              <span className="truncate">
                {createSelectedPermissions.length === 0 
                  ? "Select Permissions" 
                  : `${createSelectedPermissions.length} Permission${createSelectedPermissions.length === 1 ? '' : 's'} selected`}
              </span>
              <span className="ml-2">▼</span>
            </button>
            {isCreatePermissionDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {permissions.map(permission => (
                  <div
                    key={permission.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    onClick={() => handleCreatePermissionToggle(permission.code_name)}
                  >
                    <input
                      type="checkbox"
                      checked={createSelectedPermissions.includes(permission.code_name)}
                      onChange={() => {}}
                      className="mr-3"
                    />
                    <span>{permission.code_name}</span>
                  </div>
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
              Create Role Permission
            </button>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        {loading && <LoadingSpinner />}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <div className="relative">
            <button className="border rounded px-4 py-2 bg-gray-50" onClick={() => setAllRolesDropdown(!allRolesDropdown)}>
              All Roles <span className="ml-2">▼</span>
            </button>
            {allRolesDropdown && (
              <div className="absolute z-10 bg-white border rounded shadow mt-1 w-full">
                <div className="px-4 py-2 cursor-pointer" onClick={() => { setFilterRole(""); setAllRolesDropdown(false); }}>All Roles</div>
                {roles.map(role => (
                  <div 
                    key={role.id} 
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100" 
                    onClick={() => { 
                      setFilterRole(role.name); 
                      setAllRolesDropdown(false); 
                    }}
                  >
                    {role.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="text"
              className="border rounded px-4 py-2 w-full"
              placeholder="Search roles"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <button
              type="button"
              className="border rounded px-4 py-2 min-w-[200px] text-left bg-white flex justify-between items-center"
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
        <div className="overflow-x-auto bg-white rounded-lg">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100 text-gray-700 text-left">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap w-[200px]">Role</th>
                <th className="px-6 py-4 whitespace-nowrap w-[400px]">Permission</th>
                <th className="px-6 py-4 whitespace-nowrap text-center w-[100px]">Users</th>
                <th className="px-6 py-4 w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.role} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium" title={item.role_name}>{truncateWords(item.role_name)}</span>
                  </td>
                  <td className="px-6 py-4">
                    {item.permissionObjs.map((permObj, idx) => (
                      <span key={permObj!.code_name} title={permObj!.description || permObj!.code_name} className="inline-block mr-1 bg-gray-50 px-2 py-1 rounded text-xs border align-middle">
                        {truncateWords(permObj!.code_name)}{idx < item.permissionObjs.length - 1 ? ', ' : ''}
                        <button
                          className="ml-1 text-red-500 hover:text-red-700"
                          title="Remove permission from role"
                          onClick={() => handleDeleteRolePermission(item.role, permObj!.code_name)}
                          style={{ verticalAlign: 'middle' }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </td>
                  <td className="px-6 py-4 text-center">{item.users_count}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => navigate(`/${moduleName}/edit/${item.role}`)} className="text-orange-600 hover:text-orange-800 font-semibold mr-2">Edit</button>
                    <button
                      onClick={async () => {
                        if (!window.confirm('Are you sure you want to delete all permissions for this role?')) return;
                        try {
                          // Find all role-permission mappings for this role
                          const mappings = rolePermissions.filter(rp => rp.role === item.role);
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
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-8">No role permissions found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RolePermissionsList;
