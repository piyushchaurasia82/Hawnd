import React, { useEffect, useState } from 'react';
import DashboardBarChart from './charts/bar/DashboardBarChart.tsx';
import { tokenManager } from '../services/api';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [teamPerformance, setTeamPerformance] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('All Time');
  const [projects, setProjects] = useState<any[]>([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectTypeFilter, setProjectTypeFilter] = useState('All Projects');
  const [selectedProjectId, setSelectedProjectId] = useState('All Projects');
  const [graphRange, setGraphRange] = useState<'Week' | 'Month' | 'Year'>('Month');
  const projectTypeOptions = [
    { value: 'All Projects', label: 'All Projects' },
    { value: 'internal', label: 'Internal Projects' },
    { value: 'external', label: 'External Projects' },
  ];

  useEffect(() => {
    const token = tokenManager.getAccessToken();
    function decodeJwt(token: string) {
      if (!token) return null;
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
      } catch (error) {
        return null;
      }
    }
    function isTokenExpired(token: string) {
      const decoded = decodeJwt(token);
      if (!decoded || !decoded.exp) return true;
      const expiryTime = decoded.exp * 1000;
      const currentTime = Date.now();
      return expiryTime <= currentTime;
    }
    if (!token || isTokenExpired(token)) {
      tokenManager.clearTokens();
      navigate('/auth', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    // Fetch projects and group by type
    const fetchProjects = async () => {
      try {
        const res = await api.get('/api/projectmanagement/projects/');
        const data = res.data.data || res.data.projects || res.data;
        setProjects(Array.isArray(data) ? data : []);
      } catch {
        setProjects([]);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    // Fetch users, roles, user_roles, and tasks for team performance
    const fetchTeamPerformance = async () => {
      try {
        const [usersRes, tasksRes, userRolesRes, rolesRes] = await Promise.all([
          api.get('/api/projectmanagement/users/'),
          api.get('/api/projectmanagement/tasks/'),
          api.get('/api/projectmanagement/user_roles/'),
          api.get('/api/projectmanagement/roles/'),
        ]);
        const users = usersRes.data.data || usersRes.data.users || usersRes.data;
        const tasks = tasksRes.data.data || tasksRes.data.tasks || tasksRes.data;
        const userRoles = userRolesRes.data.data || userRolesRes.data.user_roles || userRolesRes.data;
        const roles = rolesRes.data.data || rolesRes.data.roles || rolesRes.data;

        // Map role_id to role name
        const roleIdToName = new Map();
        roles.forEach((role: any) => {
          if (role.id && (role.name || role.description)) {
            roleIdToName.set(role.id, (role.name || role.description).trim());
          }
        });
        // Map user_id to array of role names
        const userIdToRoleNames = new Map();
        userRoles.forEach((ur: any) => {
          const roleName = roleIdToName.get(ur.role_id);
          if (roleName) {
            if (!userIdToRoleNames.has(ur.user_id)) {
              userIdToRoleNames.set(ur.user_id, []);
            }
            userIdToRoleNames.get(ur.user_id).push(roleName);
          }
        });

        const performance = users.map((user: any) => {
          const userTasks = tasks.filter((task: any) =>
            Array.isArray(task.task_assignees) &&
            task.task_assignees.some(
              (a: any) =>
                (typeof a === 'object' && String(a.user_id) === String(user.id)) ||
                String(a) === String(user.id)
            )
          );
          const completed = userTasks.filter((task: any) => (task.status || '').toLowerCase() === 'done').length;
          const inProgress = userTasks.filter((task: any) => (task.status || '').toLowerCase() === 'in progress').length;
          // Try to get last login/session info
          const lastActive = user.last_login || user.last_active || user.updated_at || '—';
          // Get all roles for the user
          const rolesArr = userIdToRoleNames.get(user.id) || [];
          return {
            name: user.name || user.username || user.first_name + ' ' + user.last_name,
            role: rolesArr.length > 0 ? rolesArr.join(', ') : '—',
            tasksCompleted: completed,
            tasksInProgress: inProgress,
            lastActive,
          };
        });
        setTeamPerformance(performance);
      } catch {
        setTeamPerformance([
          { name: 'Ethan Harper', role: 'UI/UX Designer', tasksCompleted: 25, tasksInProgress: 5, lastActive: '2 hours ago' },
          { name: 'Olivia Bennett', role: 'Frontend Developer', tasksCompleted: 30, tasksInProgress: 3, lastActive: '1 hour ago' },
          { name: 'Liam Carter', role: 'Backend Developer', tasksCompleted: 28, tasksInProgress: 4, lastActive: '3 hours ago' },
          { name: 'Ava Mitchell', role: 'Product Manager', tasksCompleted: 22, tasksInProgress: 2, lastActive: '4 hours ago' },
          { name: 'Noah Parker', role: 'QA Engineer', tasksCompleted: 20, tasksInProgress: 1, lastActive: '5 hours ago' },
        ]);
      }
    };
    fetchTeamPerformance();
  }, []);

  useEffect(() => {
    // Fetch user profile after login
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/projectmanagement/get-profile/');
        localStorage.setItem('user_profile', JSON.stringify(res.data));
        // Optionally, you can set this in state/context if needed
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    api.get('/api/projectmanagement/tasks/')
      .then(res => {
        const data = res.data.data || res.data.tasks || res.data;
        setTasks(Array.isArray(data) ? data : []);
      })
      .catch(() => setTasks([]));
  }, []);

  // Compute high priority tasks with due date in the next 7 days for reminders, status In Progress or To Do
  const upcomingHighPriorityTasks = tasks.filter((task: any) => {
    if (!task.due_date || !task.priority || !task.status) return false;
    const due = new Date(task.due_date);
    const now = new Date();
    const in7Days = new Date(now);
    in7Days.setDate(now.getDate() + 7);
    const status = (task.status || '').toLowerCase().replace(/\s/g, '');
    return (
      task.priority.toLowerCase() === 'high' &&
      due >= now &&
      due <= in7Days &&
      (status === 'inprogress' || status === 'todo')
    );
  });

  // Compute project progress: completed tasks / total tasks for each project
  const projectIdToProgress = React.useMemo(() => {
    const map: { [key: string]: number } = {};
    projects.forEach((project: any) => {
      const projectTasks = tasks.filter((task: any) => String(task.project_id) === String(project.id));
      const completed = projectTasks.filter((task: any) => {
        const status = (task.status || '').toLowerCase();
        return status === 'done' || status === 'completed';
      }).length;
      const total = projectTasks.length;
      map[project.id] = total > 0 ? Math.round((completed / total) * 100) : 0;
    });
    return map;
  }, [projects, tasks]);

  return (
    <div className="p-8 bg-[#FAFAFA] min-h-screen">
      {/* Welcome Header */}
      <div className="mb-8">
        {/* <h2 className="text-lg font-semibold text-gray-700">Dashboard</h2> */}
        <h1 className="text-5xl font-bold mt-2 text-gray-900">
          Welcome back, <span className="text-orange-500">{tokenManager.getUsername() || 'User'}</span>
        </h1>
      </div>

      {/* Project Summary & Reminder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-semibold text-gray-800">Project Summary</span>
            <span className="flex-1 border-b-2 border-orange-400 ml-2"></span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <select
              className="px-3 py-2 rounded border border-gray-200 text-sm"
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
            >
              <option value="All Projects">All Projects</option>
              {projects.map((project: any) => (
                <option key={project.id} value={String(project.id)}>{project.project_title || project.name}</option>
              ))}
            </select>
            <select
              className="ml-2 px-3 py-2 rounded border border-gray-200 text-sm"
              value={graphRange}
              onChange={e => setGraphRange(e.target.value as 'Week' | 'Month' | 'Year')}
            >
              <option value="Week">Week</option>
              <option value="Month">Month</option>
              <option value="Year">Year</option>
            </select>
          </div>
          <DashboardBarChart
            tasks={selectedProjectId === 'All Projects' ? tasks : tasks.filter((task: any) => String(task.project_id) === selectedProjectId)}
            range={graphRange}
          />
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-semibold text-gray-800">Reminder</span>
            <span className="flex-1 border-b-2 border-orange-400 ml-2"></span>
          </div>
          <ul className="text-sm space-y-2 mb-0">
            {upcomingHighPriorityTasks.length === 0 ? (
              <li className="text-gray-400">No high priority tasks due soon.</li>
            ) : (
              upcomingHighPriorityTasks.map((task: any, idx: number) => {
                const status = (task.status || '').toLowerCase().replace(/\s/g, '');
                const isGreen = status === 'done' || status === 'completed';
                return (
                  <li key={task.id || idx} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                    {task.task_title || task.name}
                    <span className="ml-auto text-xs text-gray-400">{task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''}</span>
                    <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold
                      ${status === 'inprogress' ? 'bg-orange-100 text-orange-600' : ''}
                      ${status === 'todo' ? 'bg-blue-100 text-blue-600' : ''}
                      ${isGreen ? 'bg-green-100 text-green-600' : ''}
                      ${!['inprogress', 'done', 'completed', 'todo'].includes(status) ? 'bg-gray-100 text-gray-600' : ''}
                    `}>
                      {task.status}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>

      {/* Active and Recent Projects */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="mb-4">
          <span className="text-xl font-semibold text-orange-600">Active and Recent Projects</span>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search projects"
              className="w-full px-4 py-2 rounded bg-gray-50 border border-gray-200 text-sm outline-none pr-10"
              value={projectSearch}
              onChange={e => setProjectSearch(e.target.value)}
            />
            {projectSearch && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setProjectSearch('')}
                aria-label="Clear search"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 18 18"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 6l6 6m0-6l-6 6"/></svg>
              </button>
            )}
          </div>
          <select
            className="ml-2 px-4 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold"
            value={projectTypeFilter}
            onChange={e => setProjectTypeFilter(e.target.value)}
          >
            {projectTypeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 px-4 !bg-gray-100 font-semibold">Project Name</th>
                <th className="py-2 px-4 !bg-gray-100 font-semibold">Project Owner</th>
                <th className="py-2 px-4 !bg-gray-100 font-semibold">Status</th>
                <th className="py-2 px-4 !bg-gray-100 font-semibold">Progress</th>
                <th className="py-2 px-4 !bg-gray-100 font-semibold">Priority</th>
              </tr>
            </thead>
            <tbody>
              {projects
                .filter((project: any) => {
                  // Filter by type
                  if (projectTypeFilter !== 'All Projects') {
                    return (project.internal_external || '').toLowerCase() === projectTypeFilter.toLowerCase();
                  }
                  return true;
                })
                .filter((project: any) => {
                  // Filter by search
                  const search = projectSearch.toLowerCase();
                  return (
                    (project.project_title && project.project_title.toLowerCase().includes(search)) ||
                    (project.project_owner && project.project_owner.toLowerCase().includes(search))
                  );
                })
                .slice(0, 5)
                .map((project: any, idx: number) => {
                  // Progress bar logic
                  const progress = projectIdToProgress[project.id] ?? 0;
                  return (
                    <tr key={project.id || idx} className="border-b hover:bg-orange-50">
                      <td className="py-2 px-4 font-medium text-gray-800">
                        <span
                          className="cursor-pointer text-orange-600 hover:underline"
                          onClick={() => navigate(`/projects/${project.id}/tasks`)}
                        >
                          {project.project_title || project.name}
                        </span>
                      </td>
                      <td className="py-2 px-4">{project.project_owner || project.owner_name || project.owner || project.manager_name || '-'}</td>
                      <td className="py-2 px-4">
                        {(() => {
                          const status = (project.status || '').toLowerCase().replace(/\s/g, '');
                          return (
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold
                              ${status === 'inprogress' ? 'bg-orange-100 text-orange-600' : ''}
                              ${status === 'todo' ? 'bg-blue-100 text-blue-600' : ''}
                              ${status === 'completed' ? 'bg-green-100 text-green-600' : ''}
                              ${!['inprogress', 'todo', 'completed'].includes(status) ? 'bg-gray-100 text-gray-600' : ''}
                            `}>
                              {project.status}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-2 bg-orange-500" style={{ width: `${progress}%` }}></div>
                          </div>
                          <span className="text-orange-600 font-semibold">{progress}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold
                          ${project.priority === 'High' ? 'bg-red-100 text-red-600' : ''}
                          ${project.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                          ${project.priority === 'Low' ? 'bg-green-100 text-green-600' : ''}
                        `}>{project.priority}</span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base font-semibold text-gray-800">Team Performance</span>
          <span className="flex-1 border-b-2 border-orange-400 ml-2"></span>
          <span className="text-xs text-gray-400 ml-auto">Last 2 weeks</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-orange-50">
                <th className="py-2 px-4 !bg-gray-100 font-semibold">Name</th>
                <th className="py-2 px-4 !bg-gray-100 font-semibold">Role</th>
                <th className="py-2 px-4 !bg-gray-100 font-semibold">Tasks Completed</th>
                <th className="py-2 px-4 !bg-gray-100 font-semibold">Tasks In Progress</th>
              </tr>
            </thead>
            <tbody>
              {teamPerformance.map((member, idx) => (
                <tr key={idx} className="border-t hover:bg-orange-50">
                  <td className="py-2 px-4 font-medium text-gray-800">{member.name}</td>
                  <td className="py-2 px-4 text-orange-600 font-semibold">{member.role}</td>
                  <td className="py-2 px-4">{member.tasksCompleted}</td>
                  <td className="py-2 px-4">{member.tasksInProgress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Management */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base font-semibold text-orange-600">Task Management</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={`px-4 py-1 rounded-full font-semibold ${selectedPriority === 'High' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600'}`}
            onClick={() => setSelectedPriority(selectedPriority === 'High' ? '' : 'High')}
          >High</button>
          <button
            className={`px-4 py-1 rounded-full font-semibold ${selectedPriority === 'Medium' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600'}`}
            onClick={() => setSelectedPriority(selectedPriority === 'Medium' ? '' : 'Medium')}
          >Medium</button>
          <button
            className={`px-4 py-1 rounded-full font-semibold ${selectedPriority === 'Low' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600'}`}
            onClick={() => setSelectedPriority(selectedPriority === 'Low' ? '' : 'Low')}
          >Low</button>
          <select
            className="ml-auto px-3 py-1 rounded border border-gray-200 text-sm"
            value={selectedDateRange}
            onChange={e => setSelectedDateRange(e.target.value)}
          >
            <option value="All Time">All Time</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-orange-50">
                <th className="py-2 px-4 !bg-gray-100 font-semibold">Task Name</th>
                <th className="py-2 px-4 !bg-gray-100 font-semibold">Assignee</th>
                <th className="py-2 px-4 !bg-gray-100 font-semibold">Status</th>
                <th className="py-2 px-4 !bg-gray-100 font-semibold">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks
                .filter((task: any) =>
                  !selectedPriority || (task.priority && task.priority.toLowerCase() === selectedPriority.toLowerCase())
                )
                .filter((task: any) => {
                  if (selectedDateRange === 'All Time') return true;
                  if (!task.due_date) return false;
                  const due = new Date(task.due_date);
                  const now = new Date();
                  if (selectedDateRange === 'Today') {
                    return due.toDateString() === now.toDateString();
                  } else if (selectedDateRange === 'This Week') {
                    const startOfWeek = new Date(now);
                    startOfWeek.setDate(now.getDate() - now.getDay());
                    startOfWeek.setHours(0,0,0,0);
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    endOfWeek.setHours(23,59,59,999);
                    return due >= startOfWeek && due <= endOfWeek;
                  } else if (selectedDateRange === 'This Month') {
                    return due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear();
                  }
                  return true;
                })
                .slice(0, 5)
                .map((task: any, idx: number) => (
                  <tr key={task.id || idx} className="border-t hover:bg-orange-50">
                    <td className="py-2 px-4 font-medium text-gray-800">{task.task_title || task.name}</td>
                    <td className="py-2 px-4">{Array.isArray(task.task_assignees) && task.task_assignees.length > 0 ? task.task_assignees.map((a: any) => a.user_name).filter(Boolean).join(', ') : '-'}</td>
                    <td className="py-2 px-4">
                      {(() => {
                        const status = (task.status || '').toLowerCase().replace(/\s/g, '');
                        const isGreen = status === 'done' || status === 'completed';
                        return (
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold
                              ${status === 'inprogress' ? 'bg-orange-100 text-orange-600' : ''}
                              ${isGreen ? 'bg-green-100 text-green-600' : ''}
                              ${status === 'todo' ? 'bg-blue-100 text-blue-600' : ''}
                              ${!['inprogress', 'done', 'completed', 'todo'].includes(status) ? 'bg-gray-100 text-gray-600' : ''}
                            `}
                          >
                            {task.status}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-2 px-4">{task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '-'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Requests Queue */}
      
    </div>
  );
};

export default Dashboard; 