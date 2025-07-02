import React, { useState, useEffect } from 'react';
import { FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import type { ModuleConfig } from '../../config/types';
import modules from '../../config/loadModules';
import api from '../../services/api';

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
    // Add more fields as needed
}
interface ProjectTakProps {
    moduleName: string;
}

const ProjectTasks: React.FC<ProjectTakProps> = ({ moduleName }) => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState<'team' | 'my'>('team');
    const [searchQuery, setSearchQuery] = useState('');
    const config: ModuleConfig = modules[moduleName as keyof typeof modules];
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        dueDate: '',
        taskName: ''
    });
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        api.get(`${API_BASE_URL}/api/projectmanagement/tasks/?project_id=${id}`)
            .then(res => {
                setTasks(res.data.data || []);
            })
            .catch(() => setTasks([]))
            .finally(() => setLoading(false));
    }, [id, API_BASE_URL]);

    // console.log(tasks);
    const handleEdit = (id: number) => {
        navigate(`/tasks/edit/${id}`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'In Progress':
                return 'bg-orange-500';
            case 'Done':
                return 'bg-green-500';
            case 'Todo':
                return 'bg-blue-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High':
                return 'bg-red-500';
            case 'Medium':
                return 'bg-orange-500';
            case 'Low':
                return 'bg-blue-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <div className="p-4">
            {/* Header */}
            <div className="mb-4">
                <div className="text-[16px] text-black mb-1">Projects / Project / Tasks</div>
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
                <button
                    className={`px-4 py-2 font-semibold text-[16px] border-b-2 transition-all ${activeTab === 'team' ? 'border-orange-500 text-black' : 'border-transparent text-gray-500'}`}
                    onClick={() => setActiveTab('team')}
                >
                    Team Tasks
                </button>
                <button
                    className={`px-4 py-2 font-semibold text-[16px] border-b-2 transition-all ${activeTab === 'my' ? 'border-orange-500 text-black' : 'border-transparent text-gray-500'}`}
                    onClick={() => setActiveTab('my')}
                >
                    My Tasks
                </button>
            </div>
            {/* Filters */}
            <div className="mb-6 space-y-4">
                <div className="flex gap-4">
                    <select 
                        className="bg-[#F1F1F1] border-0 rounded px-4 py-2 text-black"
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="">Status</option>
                        <option value="todo">Todo</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                    </select>
                    <select 
                        className="bg-[#F1F1F1] border-0 rounded px-4 py-2 text-black"
                        value={filters.priority}
                        onChange={(e) => setFilters({...filters, priority: e.target.value})}
                    >
                        <option value="">Priority</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <select 
                        className="bg-[#F1F1F1] border-0 rounded px-4 py-2 text-black"
                        value={filters.dueDate}
                        onChange={(e) => setFilters({...filters, dueDate: e.target.value})}
                    >
                        <option value="">Due Date</option>
                    </select>
                    <select 
                        className="bg-[#F1F1F1] border-0 rounded px-4 py-2 text-black"
                        value={filters.taskName}
                        onChange={(e) => setFilters({...filters, taskName: e.target.value})}
                    >
                        <option value="">Task Name</option>
                    </select>
                </div>
                <input
                    type="text"
                    placeholder="Search tasks"
                    className="w-1/3 bg-white border border-gray-300 rounded px-4 py-2 text-black placeholder:text-gray-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            {/* Tasks Table */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading tasks...</div>
                ) : (
                <table className="min-w-full">
                    <thead>
                        <tr className="text-left border-b border-gray-200">
                            <th className="px-4 py-3 text-sm font-semibold">Task Name</th>
                            <th className="px-4 py-3 text-sm font-semibold">Status</th>
                            <th className="px-4 py-3 text-sm font-semibold">Priority</th>
                            <th className="px-4 py-3 text-sm font-semibold">Due Date</th>
                            <th className="px-4 py-3 text-sm font-semibold">Edit Task</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {tasks.map((task) => (
                            <tr key={task.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4">{task.task_title}</td>
                                <td className="px-4 py-4">
                                    <span className={`px-3 py-1 rounded text-white text-sm ${getStatusColor(task.status)}`}>
                                        {task.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className={`px-3 py-1 rounded text-white text-sm ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                    </span>
                                </td>
                                <td className="px-4 py-4">{task.due_date ? format(new Date(task.due_date), 'dd-MM-yyyy') : ''}</td>
                                <td onClick={() => handleEdit(task.id)} className="px-4 py-4">
                                    <button className="text-black hover:text-gray-700">
                                        <FiEdit size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                )}
            </div>
        </div>
    );
};

export default ProjectTasks; 