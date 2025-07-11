import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/ui/button/Button';
import Avatar from '../../components/ui/avatar/Avatar';
import PencilIcon from '../../icons/pencil.svg';
import TrashIcon from '../../icons/trash.svg';

const STATUS_OPTIONS = [
  { label: 'Status', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const PROJECT_OPTIONS = [
  { label: 'Project Assigned', value: '' },
  { label: 'Project A', value: 'project_a' },
  { label: 'Project B', value: 'project_b' },
  { label: 'Project C', value: 'project_c' },
];

function getInitials(first: string, last: string) {
  if (!first && !last) return '?';
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
}

const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [project, setProject] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('Fetching users from project management system...');
      const [usersRes, userRolesRes, rolesRes] = await Promise.all([
        api.get('/api/projectmanagement/users/'),
        api.get('/api/projectmanagement/user_roles/'),
        api.get('/api/projectmanagement/roles/'),
      ]);
      
      console.log('Users response:', usersRes.data);
      console.log('User roles response:', userRolesRes.data);
      console.log('Roles response:', rolesRes.data);
      
      const usersData = usersRes.data.data || usersRes.data;
      const userRolesData = userRolesRes.data.data || userRolesRes.data.user_roles || userRolesRes.data;
      const rolesData = rolesRes.data.data || rolesRes.data.roles || rolesRes.data;
      
      console.log('Processed users data:', usersData);
      console.log('Processed user roles data:', userRolesData);
      console.log('Processed roles data:', rolesData);
      
      setUsers(usersData || []);
      setUserRoles(userRolesData || []);
      setRoles(rolesData || []);
    } catch (e) {
      console.error('Error fetching users:', e);
      setUsers([]);
      setUserRoles([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    
    // Refresh users when the page gains focus (e.g., when navigating back from create user)
    const handleFocus = () => {
      fetchUsers();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line
  }, []);

  const handleEdit = (id: number) => {
    navigate(`/users/edit/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/api/projectmanagement/users/${id}/`);
        fetchUsers();
      } catch (e) {
        alert('Failed to delete user.');
      }
    }
  };

  // Helper to get all role names for a user
  const getUserRoleNames = (userId: number) => {
    const assignedRoleIds = userRoles.filter((ur: any) => ur.user_id === userId).map((ur: any) => ur.role_id);
    return roles.filter((r: any) => assignedRoleIds.includes(r.id)).map((r: any) => r.name);
  };

  // Dynamic role options
  const roleOptions = [
    { label: 'Role', value: '' },
    ...roles.map((r: any) => ({ label: r.name, value: r.name }))
  ];

  // Filter and sort users client-side
  let filteredUsers = users.filter((user: any) => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const searchLower = search.toLowerCase();
    let matchesSearch = !searchLower || fullName.includes(searchLower) || email.includes(searchLower);
    let matchesRole = !role || getUserRoleNames(user.id).includes(role);
    let matchesStatus = !status || (status === 'active' ? (user.is_active === 'True' || user.is_active === 'true' || user.is_active === true) : (user.is_active === 'False' || user.is_active === 'false' || user.is_active === false));
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Sort by role or status if selected
  if (role) {
    filteredUsers = filteredUsers.sort((a: any, b: any) => {
      const aHasRole = getUserRoleNames(a.id).includes(role);
      const bHasRole = getUserRoleNames(b.id).includes(role);
      return (aHasRole === bHasRole) ? 0 : aHasRole ? -1 : 1;
    });
  }
  if (status) {
    filteredUsers = filteredUsers.sort((a: any, b: any) => {
      const aActive = a.is_active === 'True' || a.is_active === 'true' || a.is_active === true;
      const bActive = b.is_active === 'True' || b.is_active === 'true' || b.is_active === true;
      if (status === 'active') return (aActive === bActive) ? 0 : aActive ? -1 : 1;
      if (status === 'inactive') return (aActive === bActive) ? 0 : !aActive ? -1 : 1;
      return 0;
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 mb-2 flex gap-1">
        <span>Home</span>
        <span>/</span>
        <span>Users</span>
        <span>/</span>
        <span className="font-semibold text-black">User Directory</span>
      </nav>
      {/* Title and Add User */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">User Directory</h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate('/users/create')} className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500">
            + Add User
          </Button>
        </div>
      </div>
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by name/email"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6Z"/></svg>
          </span>
        </div>
        <div className="flex gap-2">
          <select value={role} onChange={e => setRole(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm min-w-[120px]">
            {roleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm min-w-[120px]">
            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select value={project} onChange={e => setProject(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm min-w-[150px]">
            {PROJECT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>
      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-700">
              <th className="px-6 py-3 text-left font-medium">Name</th>
              <th className="px-6 py-3 text-left font-medium">Email</th>
              <th className="px-6 py-3 text-left font-medium">Role</th>
              <th className="px-6 py-3 text-left font-medium">Status</th>
              <th className="px-6 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8">No users found.</td></tr>
            ) : (
              filteredUsers.map((user: any) => (
                <tr key={user.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-6 py-4 flex items-center gap-3">
                    {/* Avatar with fallback to initials */}
                    {user.avatar_url ? (
                      <Avatar src={user.avatar_url} alt={user.first_name + ' ' + user.last_name} size="small" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600 text-base">
                        {getInitials(user.first_name, user.last_name)}
                      </div>
                    )}
                    <span>{user.first_name} {user.last_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block bg-gray-100 rounded px-3 py-1 text-xs font-medium text-gray-800">
                      {user.email}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block bg-gray-100 rounded px-3 py-1 text-xs font-medium text-gray-800">
                      {getUserRoleNames(user.id).join(', ') || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.is_active === "True" || user.is_active === "true" ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100">
                        <span className="w-2 h-2 rounded-full bg-green-700 mr-2"></span>
                        <span className="font-bold text-green-700">Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100">
                        <span className="w-2 h-2 rounded-full bg-red-700 mr-2"></span>
                        <span className="font-bold text-red-700">Inactive</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleEdit(user.id)} className="text-black hover:text-orange-500 mr-2" title="Edit">
                      <img src={PencilIcon} width={18} height={18} alt="Edit" />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800" title="Delete">
                      <img src={TrashIcon} width={18} height={18} alt="Delete" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersList;
