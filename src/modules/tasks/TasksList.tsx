import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../components/ui/alert/ToastContext';
import { useCurrentUser } from '../../context/CurrentUserContext';

const TasksList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'team' | 'my'>('team');
  const [filters, setFilters] = useState({ status: '', priority: '', dueDate: '', name: '' });
  const [search, setSearch] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { showToast } = useToast();
  const { user, userRole } = useCurrentUser();

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`${API_BASE_URL}/api/projectmanagement/tasks/`)
      .then(res => {
        setTasks(res.data.data || res.data.tasks || res.data || []);
      })
      .catch(() => setError('Failed to load tasks.'))
      .finally(() => setLoading(false));
  }, [API_BASE_URL]);

  // Sort tasks so that newly created/updated tasks appear at the top
  const sortedTasks = [...tasks].sort((a: any, b: any) => {
    const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
    const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
    return bTime - aTime;
  });

  // Filtering logic
  const filteredTasks = sortedTasks.filter(task => {
    // For 'My Tasks' tab, show only tasks assigned to current user for both admin and developer
    if (activeTab === 'my' && user && user.id && userRole && (userRole.trim().toLowerCase().includes('developer') || userRole.trim().toLowerCase().includes('admin'))) {
      // Check task_assignees (array of objects with user_id or id)
      if (Array.isArray(task.task_assignees)) {
        return task.task_assignees.some((a: any) => String(a.user_id || a.id) === String(user.id));
      }
      // Fallback: check assigned_to_id
      return String(task.assigned_to_id) === String(user.id);
    }
    // Status filter
    let statusMatch = true;
    if (filters.status) {
      statusMatch = (task.status || '').toLowerCase() === filters.status.toLowerCase();
    }
    // Priority filter
    let priorityMatch = true;
    if (filters.priority) {
      priorityMatch = (task.priority || '').toLowerCase() === filters.priority.toLowerCase();
    }
    // Due date filter
    let dueDateMatch = true;
    if (filters.dueDate) {
      const taskDue = task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB') : '';
      dueDateMatch = taskDue === filters.dueDate;
    }
    // Search filter (character by character, task_title or name)
    let searchMatch = true;
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      searchMatch = (task.task_title || task.name || '').toLowerCase().includes(searchLower);
    }
    return statusMatch && priorityMatch && dueDateMatch && searchMatch;
  });

  // Pagination logic (use filteredTasks)
  const totalPages = Math.ceil(filteredTasks.length / pageSize);
  const pagedTasks = filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Collect unique due dates for filter dropdowns
  const dueDates = Array.from(new Set(tasks.map(t => t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB') : ''))).filter(Boolean);

  // Set My Tasks as default for developers
  React.useEffect(() => {
    if (userRole && userRole.trim().toLowerCase().includes('developer')) {
      setActiveTab('my');
    }
  }, [userRole]);

  return (
    <div className="p-8">
      <nav className="text-[16px] text-black mb-1 flex items-center gap-1">
        <span className="hover:underline cursor-pointer text-orange-500" onClick={() => navigate('/')}>Dashboard</span>
        <span className="mx-1">/</span>
        <span className="font-semibold">Project Tasks</span>
      </nav>
      {/* <div className="text-[18px] text-black mb-1 font-medium">Projects / Project / Tasks</div> */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold">Project Tasks</h1>
          <div className="text-gray-500 text-[15px]">Manage and track all tasks related to this project</div>
        </div>
        <button
          className="bg-orange-500 text-white font-semibold rounded px-6 py-2 text-lg hover:bg-orange-600"
          onClick={() => navigate('/tasks/create')}
        >
          Add Task
        </button>
      </div>
      {/* Tabs */}
      <div className="flex border-b mb-6 mt-6">
        {!(userRole && userRole.trim().toLowerCase().includes('developer')) && (
        <button
          className={`pr-4 py-2 text-base font-semibold border-b-2 transition-all duration-150 ${activeTab === 'team' ? 'border-orange-500 text-black' : 'border-transparent text-gray-500'}`}
          onClick={() => setActiveTab('team')}
        >
          Team Tasks
        </button>
        )}
        <button
          className={`pr-4 py-2 text-base font-semibold border-b-2 transition-all duration-150 ${activeTab === 'my' ? 'border-orange-500 text-black' : 'border-transparent text-gray-500'}`}
          onClick={() => setActiveTab('my')}
        >
          My Tasks
        </button>
      </div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search tasks"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6Z"/></svg>
          </span>
        </div>
        <div className="flex gap-2">
          <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm min-w-[120px]" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">Status</option>
            <option value="In Progress">In Progress</option>
            <option value="Todo">Todo</option>
            <option value="Completed">Completed</option>
          </select>
          <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm min-w-[120px]" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="">Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm min-w-[120px]" value={filters.dueDate} onChange={e => setFilters(f => ({ ...f, dueDate: e.target.value }))}>
            <option value="">Due Date</option>
            {dueDates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto w-full">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading tasks...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
        <table className="min-w-full text-base">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="px-6 py-3 text-left font-semibold !bg-gray-100" style={{background:'#f2f4f7'}}>Task Name</th>
              <th className="px-6 py-3 text-left font-semibold !bg-gray-100" style={{background:'#f2f4f7'}}>Status</th>
              <th className="px-6 py-3 text-left font-semibold !bg-gray-100" style={{background:'#f2f4f7'}}>Priority</th>
              <th className="px-6 py-3 text-left font-semibold !bg-gray-100" style={{background:'#f2f4f7'}}>Due Date</th>
              <th className="px-6 py-3 text-left font-semibold !bg-gray-100" style={{background:'#f2f4f7'}}>Assignee</th>
              <th className="px-6 py-3 text-left font-semibold !bg-gray-100" style={{background:'#f2f4f7'}}>Edit Task</th>
            </tr>
          </thead>
          <tbody>
            {pagedTasks.map(task => (
              <tr key={task.id}>
                <td className="px-6 py-4">{task.task_title || task.name}</td>
                <td className="px-6 py-4">
                  {(() => {
                    const status = (task.status || '').toLowerCase().replace(/\s/g, '');
                    const isGreen = status === 'completed' || status === 'done';
                    return (
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border
                          ${status === 'inprogress' ? 'border-orange-500 text-orange-600 bg-orange-50' : ''}
                          ${isGreen ? 'border-green-500 text-green-700 bg-green-50' : ''}
                          ${status === 'todo' ? 'border-blue-500 text-blue-600 bg-blue-50' : ''}
                        `}
                      >
                        <span
                          className={`w-2 h-2 rounded-full mr-1
                            ${status === 'inprogress' ? 'bg-orange-500' : ''}
                            ${isGreen ? 'bg-green-500' : ''}
                            ${status === 'todo' ? 'bg-blue-500' : ''}
                          `}
                        ></span>
                        {task.status}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border
                      ${task.priority === 'High' ? 'border-red-500 text-red-600 bg-red-50' : ''}
                      ${task.priority === 'Medium' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' : ''}
                      ${task.priority === 'Low' ? 'border-green-500 text-green-700 bg-green-50' : ''}
                    `}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mr-1
                        ${task.priority === 'High' ? 'bg-red-500' : ''}
                        ${task.priority === 'Medium' ? 'bg-yellow-400' : ''}
                        ${task.priority === 'Low' ? 'bg-green-500' : ''}
                      `}
                    ></span>
                    {task.priority}
                  </span>
                </td>
                <td className="px-6 py-4">{task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB') : ''}</td>
                <td className="px-6 py-4">
                  {Array.isArray(task.task_assignees) && task.task_assignees.length > 0
                    ? task.task_assignees
                        .map((a: any) => a.user_name)
                        .filter(Boolean)
                        .join(', ')
                    : '-'}
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => navigate(`/tasks/edit/${task.id}`)} className="text-black mr-3" title="Edit Task">
                    <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const toastId = showToast({
                        type: 'warning',
                        title: 'Confirm Deletion',
                        message: 'Are you sure you want to delete this task? This action cannot be undone.',
                        duration: 8000,
                        actions: [
                          {
                            label: 'Delete',
                            variant: 'danger',
                            onClick: async () => {
                              try {
                                await api.delete(`${API_BASE_URL}/api/projectmanagement/tasks/${task.id}/`);
                                setTasks(tasks => tasks.filter(t => t.id !== task.id));
                                showToast({
                                  type: 'success',
                                  title: 'Task Deleted',
                                  message: 'The task has been deleted successfully.',
                                  duration: 4000
                                });
                              } catch (err) {
                                alert('Failed to delete task.');
                              }
                              // Remove the confirmation toast
                              const evt = new CustomEvent('toast:remove', { detail: { id: toastId } });
                              window.dispatchEvent(evt);
                            }
                          },
                          {
                            label: 'Cancel',
                            variant: 'default',
                            onClick: () => {
                              // Remove the confirmation toast
                              const evt = new CustomEvent('toast:remove', { detail: { id: toastId } });
                              window.dispatchEvent(evt);
                            }
                          }
                        ]
                      });
                    }}
                    className="text-red-600 hover:text-red-800" title="Delete Task"
                  >
                    <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1 text-lg disabled:text-gray-300">{'<'}</button>
          <span className="px-2 py-1 rounded-full bg-gray-100 font-semibold">{currentPage}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-2 py-1 text-lg disabled:text-gray-300">{'>'}</button>
          <span className="ml-2 text-gray-500">... {totalPages}</span>
          {/* Jump to page input */}
          <span className="ml-4 text-gray-700">Jump to page:</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={e => {
              let val = parseInt(e.target.value, 10);
              if (isNaN(val)) val = 1;
              if (val < 1) val = 1;
              if (val > totalPages) val = totalPages;
              setCurrentPage(val);
            }}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-center ml-2"
          />
        </div>
      )}
    </div>
  );
};

export default TasksList;
