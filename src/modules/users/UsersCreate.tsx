import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Eye, EyeOff } from 'lucide-react';

// MultiSelectDropdown component (copied from src/components/GenericForm.tsx)
const MultiSelectDropdown = ({ options, selectedValues, onChange, label, disabled }: {
  options: { value: string | number; label: string }[];
  selectedValues: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  label?: string;
  disabled?: boolean;
}) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value: string | number) => {
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
        className="border rounded p-2 w-full text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
      >
        {selectedLabels.length > 0 ? selectedLabels.join(', ') : `Select ${label || ''}`}
        <span className="float-right">▼</span>
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
          {options.map((option) => (
            <label key={option.value} className="flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => handleSelect(option.value)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2"
                disabled={disabled}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const UsersCreate: React.FC = () => {
  const navigate = useNavigate();
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rolesOptions, setRolesOptions] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [projects, setProjects] = useState<{ value: string; label: string }[]>([]);
  const [tasks, setTasks] = useState<{ value: string; label: string }[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<(string | number)[]>([]);

  // Fetch roles, projects, tasks
  useEffect(() => {
    async function fetchOptions() {
      try {
        const [rolesRes, projectsRes, tasksRes] = await Promise.all([
          api.get('/api/projectmanagement/roles/'),
          api.get('/api/projectmanagement/projects/'),
          api.get('/api/projectmanagement/tasks/'),
        ]);
        setRolesOptions((rolesRes.data.data || rolesRes.data.roles || rolesRes.data).map((r: any) => ({ value: r.id, label: r.name || r.description })));
        setProjects((projectsRes.data.data || projectsRes.data.projects || projectsRes.data).map((p: any) => ({ value: p.id, label: p.name })));
        setTasks((tasksRes.data.data || tasksRes.data.tasks || tasksRes.data).map((t: any) => ({ value: t.id, label: t.name })));
      } catch (e) {
        // fallback to empty
      }
    }
    fetchOptions();
  }, []);

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
      
      console.log('Creating user in project management system:', userPayload);
      
      const userRes = await api.post('/api/projectmanagement/users/', userPayload);
      console.log('User creation response:', userRes.data);
      
      // Extract user ID from response
      const userId = userRes.data.id || userRes.data.user_id;
      
      if (!userId) {
        throw new Error('User created but no user ID returned');
      }
      
      console.log('Successfully created user with ID:', userId);
      
      // Assign roles if selected
      if (selectedRoles.length > 0) {
        try {
          await Promise.all(selectedRoles.map(roleId =>
            api.post('/api/projectmanagement/user_roles/', { 
              user_id: userId, 
              role_id: roleId 
            })
          ));
          console.log('Roles assigned successfully');
        } catch (roleError) {
          console.warn('Failed to assign some roles:', roleError);
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
          console.log('Projects assigned successfully');
        } catch (projectError) {
          console.warn('Failed to assign some projects:', projectError);
        }
      }
      
      // Assign tasks if selected
      if (selectedTasks.length > 0) {
        try {
          await Promise.all(selectedTasks.map(taskId =>
            api.put(`/api/projectmanagement/tasks/${taskId}/`, { 
              assigned_to_id: userId 
            })
          ));
          console.log('Tasks assigned successfully');
        } catch (taskError) {
          console.warn('Failed to assign some tasks:', taskError);
        }
      }
      
      setSuccess(`User "${firstName} ${lastName}" created successfully! They can now login with username: ${username}`);
      
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
        navigate('/users');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      let errorMessage = 'Failed to create user. Please try again.';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.data && typeof data.data === 'object') {
          const fieldErrors = Object.entries(data.data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          errorMessage = `Validation errors: ${fieldErrors}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 mb-2 flex gap-1">
        <button type="button" onClick={() => navigate('/')} className="hover:underline hover:text-black focus:outline-none bg-transparent p-0 m-0">Home</button>
        <span>/</span>
        <button type="button" onClick={() => navigate('/users')} className="hover:underline hover:text-black focus:outline-none bg-transparent p-0 m-0">Users</button>
        <span>/</span>
        <span className="font-semibold text-black">Create New User</span>
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
                className="absolute right-4 inset-y-0 flex items-center bg-transparent border-0 p-0 m-0"
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
          <div className="max-w-xs relative">
            <MultiSelectDropdown
              options={rolesOptions}
              selectedValues={selectedRoles}
              onChange={setSelectedRoles}
              label="Roles"
            />
          </div>
        </div>
        {/* Assignments */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Assignments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold mb-1">Assign Projects</label>
              <select
                multiple
                className="w-full rounded bg-gray-100 h-12 p-3 text-sm placeholder-gray-400"
                value={selectedProjects}
                onChange={e => setSelectedProjects(Array.from(e.target.selectedOptions, option => option.value))}
              >
                {projects.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Assign Tasks (Optional)</label>
              <select
                multiple
                className="w-full rounded bg-gray-100 h-12 p-3 text-sm placeholder-gray-400"
                value={selectedTasks}
                onChange={e => setSelectedTasks(Array.from(e.target.selectedOptions, option => option.value))}
              >
                {tasks.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {/* Status and Buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-8">
          <div className="flex items-center gap-2">
            <label className="block font-semibold mb-1">Status</label>
            <label className="inline-flex items-center cursor-pointer ml-2">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isActive}
                onChange={e => setIsActive(!!e.target.checked)}
              />
              <div className={
                `w-11 h-6 rounded-full transition-all duration-300
                 ${isActive ? 'bg-orange-500 shadow-lg ring-2 ring-orange-300' : 'bg-gray-200 shadow-inner'}
                 peer-focus:ring-4 peer-focus:ring-orange-300`
              }></div>
              <span className={`ml-3 text-sm font-medium ${isActive ? 'text-orange-700' : 'text-gray-900'}`}>{isActive ? 'Active' : 'Inactive'}</span>
            </label>
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
