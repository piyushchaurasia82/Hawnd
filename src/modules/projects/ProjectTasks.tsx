import React, { useState, useEffect } from 'react';
import { FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../services/api';
import { useToast } from '../../components/ui/alert/ToastContext';
import { useCurrentUser } from '../../context/CurrentUserContext';

interface Task {
    id: number;
    name: string;
    project_id: number;
    status: string;
    priority: string;
    due_date: string;
    description: string;
    assigned_to_id?: number;
    created_by_id?: number;
    task_title?: string;
    task_assignees?: { user_name: string }[];
    // Add more fields as needed
}

const ProjectTasks: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState<'team' | 'my'>('team');
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        dueDate: '',
        taskName: ''
    });
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    // Pagination logic
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const { showToast } = useToast();
    const { user, userRole } = useCurrentUser();

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        api.get(`${API_BASE_URL}/api/projectmanagement/tasks/?project_id=${id}`)
            .then(res => {
                const data = res.data.data || [];
                // Sort by updated_at (or created_at if updated_at is missing), descending
                data.sort((a: any, b: any) => {
                  const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
                  const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
                  return bTime - aTime;
                });
                setTasks(data);
            })
            .catch(() => setTasks([]))
            .finally(() => setLoading(false));
    }, [id, API_BASE_URL]);

    // Set My Tasks as default for developers
    useEffect(() => {
        if (userRole && userRole.trim().toLowerCase().includes('developer')) {
            setActiveTab('my');
        }
    }, [userRole]);

    // console.log(tasks);
    const handleEdit = (id: number) => {
        navigate(`/tasks/edit/${id}`);
    };

    // Filtering logic
    const filteredTasks = tasks.filter(task => {
        // For 'My Tasks' tab, show only tasks assigned to current user for both admin and developer
        if (activeTab === 'my' && user && user.id && userRole && (userRole.trim().toLowerCase().includes('developer') || userRole.trim().toLowerCase().includes('admin'))) {
            if (Array.isArray(task.task_assignees)) {
                return task.task_assignees.some((a: any) => String(a.user_id || a.id) === String(user.id));
            }
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
            const taskDue = task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '';
            dueDateMatch = taskDue === filters.dueDate;
        }
        // Search filter (character by character, task_title or name)
        let searchMatch = true;
        if (searchQuery.trim()) {
            const searchLower = searchQuery.toLowerCase();
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

    return (
        <div className="p-4">
            {/* Header */}
            <div className="mb-4">
                <nav className="text-[16px] text-black mb-1 flex items-center gap-1">
                    <span className="hover:underline cursor-pointer text-orange-500" onClick={() => navigate('/projects')}>Projects</span>
                    <span className="mx-1">/</span>
                    
                    <span className="font-semibold">Tasks</span>
                </nav>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Project Tasks</h1>
                        <p className="text-gray-600 text-sm">Manage and track all tasks related to this project</p>
                    </div>
                    <button  onClick={() => navigate(`/tasks/create/${id}`)} className="bg-orange-500 text-white px-4 py-2 rounded font-semibold">
                        Add Task
                    </button>
                </div>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                {!(userRole && userRole.trim().toLowerCase().includes('developer')) && (
                    <button
                        className={`px-4 py-2 font-semibold text-[16px] border-b-2 transition-all ${activeTab === 'team' ? 'border-orange-500 text-black' : 'border-transparent text-gray-500'}`}
                        onClick={() => setActiveTab('team')}
                    >
                        Team Tasks
                    </button>
                )}
                <button
                    className={`px-4 py-2 font-semibold text-[16px] border-b-2 transition-all ${activeTab === 'my' ? 'border-orange-500 text-black' : 'border-transparent text-gray-500'}`}
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
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6Z"/></svg>
                    </span>
                </div>
                <div className="flex gap-2">
                    <select
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm min-w-[120px]"
                    >
                        <option value="">Status</option>
                        <option value="Todo">Todo</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                    </select>
                    <select
                        value={filters.priority}
                        onChange={e => setFilters({ ...filters, priority: e.target.value })}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm min-w-[120px]"
                    >
                        <option value="">Priority</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                    <select
                        value={filters.dueDate}
                        onChange={e => setFilters({ ...filters, dueDate: e.target.value })}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm min-w-[120px]"
                    >
                        <option value="">Due Date</option>
                        {/* TODO: Populate due dates dynamically if needed */}
                    </select>
                </div>
            </div>
            {/* Tasks Table */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading tasks...</div>
                ) : (
                <table className="min-w-full">
                    <thead>
                        <tr className="text-left border-b border-gray-200">
                            <th className="px-4 py-3 !bg-gray-100 text-sm font-semibold">Task Name</th>
                            <th className="px-4 py-3 !bg-gray-100 text-sm font-semibold">Status</th>
                            <th className="px-4 py-3 !bg-gray-100 text-sm font-semibold">Priority</th>
                            <th className="px-4 py-3 !bg-gray-100 text-sm font-semibold">Due Date</th>
                            <th className="px-4 py-3 !bg-gray-100 text-sm font-semibold">Assignee</th>
                            <th className="px-4 py-3 !bg-gray-100 text-sm font-semibold">Edit Task</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {pagedTasks.map((task) => (
                            <tr key={task.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4">{task.task_title}</td>
                                <td className="px-4 py-4">
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
                                <td className="px-4 py-4">
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
                                <td className="px-4 py-4">{task.due_date ? format(new Date(task.due_date), 'dd-MM-yyyy') : ''}</td>
                                <td className="px-4 py-4">
                                  {Array.isArray(task.task_assignees) && task.task_assignees.length > 0
                                    ? task.task_assignees.map(a => a.user_name).filter(Boolean).join(', ')
                                    : '-'}
                                </td>
                                <td onClick={() => handleEdit(task.id)} className="px-4 py-4">
                                    <button className="text-black hover:text-gray-700 mr-3" title="Edit Task">
                                        <FiEdit size={18} />
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
                                                            const evt = new CustomEvent('toast:remove', { detail: { id: toastId } });
                                                            window.dispatchEvent(evt);
                                                        }
                                                    },
                                                    {
                                                        label: 'Cancel',
                                                        variant: 'default',
                                                        onClick: () => {
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

export default ProjectTasks; 