import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Eye, EyeOff } from 'lucide-react';
import MultiSelect from '../../components/form/MultiSelect';
import { useCurrentUser } from '../../context/CurrentUserContext';
import { postAuditLog } from '../../services/api';
import { useToast } from '../../components/ui/alert/ToastContext';

const UsersCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useCurrentUser();
  const { showToast } = useToast();
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rolesOptions, setRolesOptions] = useState<{ value: string; text: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [projects, setProjects] = useState<{ value: string; label: string }[]>([]);
  const [tasks, setTasks] = useState<{ value: string; label: string; project_id?: string | number }[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<(string | number)[]>([]);

  // Fetch roles, projects, tasks
  const fetchRoles = async () => {
    try {
      const rolesRes = await api.get('/api/projectmanagement/roles/');
      const rolesArr = Array.isArray(rolesRes.data)
        ? rolesRes.data
        : rolesRes.data.data || rolesRes.data.roles || [];
      setRolesOptions(Array.isArray(rolesArr) ? rolesArr.map((r: any) => ({ value: String(r.id), text: r.name || r.description })) : []);
    } catch (e) {
      setRolesOptions([]);
    }
  };

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      const res = await api.get('/api/projectmanagement/projects/');
      const arr = Array.isArray(res.data)
        ? res.data
        : res.data.data || res.data.projects || [];
      setProjects(arr.map((p: any) => ({
        value: String(p.id),
        label: p.project_title || p.name || `Project ${p.id}`
      })));
    } catch (e) {
      setProjects([]);
    }
  };

  // Fetch all tasks for a selected project using the full filter endpoint
  const fetchTasks = async (projectId: string) => {
    try {
      const url = `/api/projectmanagement/tasks/?project_id=${projectId}&task_title=&start_date=&due_date=&priority=&status=`;
      const res = await api.get(url);
      const arr = Array.isArray(res.data)
        ? res.data
        : res.data.data || res.data.tasks || [];
      setTasks(arr.map((t: any) => ({
        value: String(t.id),
        label: t.task_title || t.name || `Task ${t.id}`,
        project_id: t.project_id
      })));
    } catch (e) {
      setTasks([]);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjects[0]) {
      fetchTasks(selectedProjects[0]);
    } else {
      setTasks([]);
    }
  }, [selectedProjects]);

  // Save handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      // Validation
      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        setError('Please fill all required fields.');
        setLoading(false);
        return;
      }
      
      // Password validation
      const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
      if (!passwordRegex.test(password)) {
        setError('Password must be at least 8 characters, include one uppercase letter and one special character.');
        setLoading(false);
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }

      // Generate username from email if not provided
      const username = fullName.trim() || email.split('@')[0];
      
      // Create user in project management system (this is what login and user directory use)
      const userPayload = {
        username: username,
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: password,
        is_active: isActive ? "True" : "False"
      };
      
      const userRes = await api.post('/api/projectmanagement/users/', userPayload);
      
      // Extract user ID from response
      const userId = userRes.data.id || userRes.data.user_id;
      
      if (!userId) {
        throw new Error('User created but no user ID returned');
      }
      
      // Assign roles if selected
      if (selectedRoles.length > 0) {
        try {
          await Promise.all(selectedRoles.map(roleId =>
            api.post('/api/projectmanagement/user_roles/', { 
              user_id: userId, 
              role_id: roleId 
            })
          ));
        } catch (roleError) {
        }
      }
      
      // Assign projects if selected
      if (selectedProjects.length > 0) {
        try {
          await Promise.all(selectedProjects.map(projectId =>
            api.post('/api/projectmanagement/project_members/', { 
              project_id: projectId, 
              user_id: userId 
            })
          ));
        } catch (projectError) {
        }
      }
      
      // Assign tasks if selected
      if (selectedTasks.length > 0) {
        try {
          await Promise.all(selectedTasks.map(async (taskId) => {
            // Fetch current task details
            const taskRes = await api.get(`/api/projectmanagement/tasks/${taskId}/`);
            const taskData = taskRes.data.data || taskRes.data;
            // Build payload with all required fields
            const payload = {
              project_id: taskData.project_id ?? null,
              task_title: taskData.task_title ?? '',
              assignees: taskData.assignees ?? '',
              assigned_to_id: userId
            };
            await api.put(`/api/projectmanagement/tasks/${taskId}/`, payload);
          }));
        } catch (taskError) {
        }
      }
      
      // Audit log: User Created
      const performerName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : (JSON.parse(localStorage.getItem('user_data') || '{}').username || 'Unknown');
      await postAuditLog({
        action: 'User Created',
        affected_user: `${firstName} ${lastName}`.trim(),
        performer: performerName,
        description: `User account for ${firstName} ${lastName} was created by ${performerName}.`
      });
      
      showToast({
        type: 'success',
        title: 'User Created',
        message: `User "${firstName} ${lastName}" created successfully! They can now login with username: ${username}`,
        duration: 5000
      });
      
      // Reset form
      setFirstName('');
      setLastName('');
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setSelectedRoles([]);
      setSelectedProjects([]);
      setSelectedTasks([]);
      setIsActive(true);
      
      // Navigate back to user list after a short delay
      setTimeout(() => {
        navigate('/users', { state: { userCreated: true } });
      }, 2000);
      
    } catch (error: any) {
      let errorMessage = 'Failed to create user. Please try again.';
      let errorTitle = 'Error';
      if (error.response?.data) {
        const data = error.response.data;
        if (data.status === 'validation_error' && data.errors) {
          errorTitle = 'Validation Error';
          if (data.errors.username && data.errors.email) {
            errorMessage = 'User with this username and email already exists.';
          } else if (data.errors.username) {
            errorMessage = 'User with this username already exists.';
          } else if (data.errors.email) {
            errorMessage = 'User with this email already exists.';
          } else {
            errorMessage = Object.entries(data.errors).map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`).join('; ');
          }
        } else if (data.status === 'error' && data.message) {
          errorTitle = 'Error';
          errorMessage = data.message;
        } else if (data.status === 'success' && data.message) {
          errorTitle = 'Success';
          errorMessage = data.message;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      }
      showToast({
        type: errorTitle === 'Success' ? 'success' : 'error',
        title: errorTitle,
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="text-[16px] text-black mb-4 flex items-center gap-1">
        <span className="hover:underline cursor-pointer text-orange-500" onClick={() => navigate('/')}>Dashboard</span>
        <span className="mx-1">/</span>
        <span className="hover:underline cursor-pointer text-orange-500" onClick={() => navigate('/users')}>Users</span>
        <span className="mx-1">/</span>
        <span className="font-semibold">Create User</span>
      </nav>
      <h1 className="text-2xl font-bold mb-6">Add New User</h1>
      <form onSubmit={handleSubmit}>
        {/* User Information */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block font-semibold mb-1">User Name </label>
              <input
                type="text"
                placeholder="Enter user name"
                className="w-full rounded bg-gray-100 h-12 p-3 text-sm placeholder-gray-400"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">First Name</label>
              <input
                type="text"
                placeholder="Enter First Name"
                className="w-full rounded bg-gray-100 h-12 p-3 text-sm placeholder-gray-400"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Last Name</label>
              <input
                type="text"
                placeholder="Enter Last Name"
                className="w-full rounded bg-gray-100 h-12 p-3 text-sm placeholder-gray-400"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <label className="block font-semibold mb-1">Email</label>
              <input
                type="email"
                placeholder="Enter email"
                className="w-full rounded bg-gray-100 h-12 p-3 text-sm placeholder-gray-400 pr-32"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <label className="block font-semibold mb-1">Enter Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                className="w-full rounded bg-gray-100 h-12 p-3 text-sm placeholder-gray-400 pr-14"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-4 inset-y-2 flex items-center bg-transparent border-0 p-0 m-0"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ width: 24, height: '100%', transform: 'translateY(7px)' }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="relative">
              <label className="block font-semibold mb-1">Confirm Password</label>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                className="w-full rounded bg-gray-100 h-12 p-3 text-sm placeholder-gray-400 pr-14"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-4 inset-y-0 flex items-center bg-transparent border-0 p-0 m-0"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                style={{ width: 24, height: '100%', transform: 'translateY(14px)' }}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        </div>
        {/* Roles */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Assign Roles</h2>
          <MultiSelect
            label="Assign Roles"
            options={rolesOptions}
            defaultSelected={selectedRoles.map(String)}
            onChange={vals => setSelectedRoles(vals)}
          />
        </div>
        {/* Assignments */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Assignments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold mb-1">Assign Projects</label>
              <select
                className="w-full rounded bg-gray-100 h-12 p-3 text-sm placeholder-gray-400"
                value={selectedProjects[0] || ''}
                onChange={e => setSelectedProjects(e.target.value ? [e.target.value] : [])}
              >
                <option value="">Select a project</option>
                {projects.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Assign Tasks (Optional)</label>
              <select
                className="w-full rounded bg-gray-100 h-12 p-3 text-sm placeholder-gray-400"
                value={selectedTasks[0] || ''}
                onChange={e => setSelectedTasks(e.target.value ? [e.target.value] : [])}
                disabled={!selectedProjects[0]}
              >
                <option value="">{selectedProjects[0] ? 'Select a task' : 'Select a project first'}</option>
                {tasks
                  .filter(opt => String(opt.project_id) === String(selectedProjects[0]))
                  .map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
              </select>
            </div>
          </div>
        </div>
        {/* Status and Buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-8">
          <div className="flex items-center gap-4">
            <span className="block font-semibold mb-1">Status</span>
            <div className="flex gap-0 overflow-hidden border border-orange-500 w-fit">
                <button
                    type="button"
                    className={`py-1 px-6 font-semibold text-[16px] transition-all ${isActive ? 'bg-orange-500 text-white' : 'bg-white text-orange-500'} border-none outline-none`}
                    onClick={() => setIsActive(true)}
                >
                    Active
                </button>
                <button
                    type="button"
                    className={`py-1 px-6 font-semibold text-[16px] transition-all ${!isActive ? 'bg-orange-500 text-white' : 'bg-white text-orange-500'} border-none outline-none`}
                    onClick={() => setIsActive(false)}
                >
                    Inactive
                </button>
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg transition bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 text-sm"
              disabled={loading}
            >
              Save
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg transition bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 font-bold px-8 py-3 text-sm"
              onClick={() => navigate('/users')}
            >
              Cancel
            </button>
          </div>
        </div>
        {error && <div className="text-red-600 mt-2 text-xs">{error}</div>}
        {success && <div className="text-green-600 mt-2 text-xs">{success}</div>}
      </form>
    </div>
  );
};

export default UsersCreate;
