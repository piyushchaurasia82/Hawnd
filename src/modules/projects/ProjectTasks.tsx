import React, { useState } from 'react';
import { FiEdit } from 'react-icons/fi';

interface Task {
    id: number;
    taskName: string;
    projectName: string;
    status: 'In Progress' | 'Todo' | 'Done';
    priority: 'High' | 'Medium' | 'Low';
    dueDate: string;
    description: string;
    assignees: { id: number; avatar: string }[];
}

const dummyTasks: Task[] = [
    {
        id: 1,
        taskName: 'Design landing page',
        projectName: 'Marketing Campaign',
        status: 'In Progress',
        priority: 'High',
        dueDate: '03-05-2024',
        description: 'Design the main landing page for the new marketing campaign.',
        assignees: [{ id: 1, avatar: '👤' }, { id: 2, avatar: '👤' }]
    },
    {
        id: 2,
        taskName: 'Prepare presentation',
        projectName: 'Sales Meeting',
        status: 'Todo',
        priority: 'Medium',
        dueDate: '03-05-2024',
        description: 'Prepare the presentation slides for the upcoming sales meeting.',
        assignees: [{ id: 3, avatar: '👤' }, { id: 4, avatar: '👤' }]
    },
    {
        id: 3,
        taskName: 'Review documentation',
        projectName: 'Product Launch',
        status: 'Done',
        priority: 'Low',
        dueDate: '03-05-2024',
        description: 'Review the product documentation before the launch.',
        assignees: [{ id: 5, avatar: '👤' }, { id: 6, avatar: '👤' }]
    },
    {
        id: 4,
        taskName: 'Fix bugs',
        projectName: 'Software Development',
        status: 'In Progress',
        priority: 'High',
        dueDate: '03-05-2024',
        description: 'Fix the critical bugs reported in the latest software release.',
        assignees: [{ id: 7, avatar: '👤' }, { id: 8, avatar: '👤' }]
    },
    {
        id: 5,
        taskName: 'Plan team event',
        projectName: 'Team Building',
        status: 'Todo',
        priority: 'Medium',
        dueDate: '03-05-2024',
        description: 'Plan a team-building event for the upcoming quarter.',
        assignees: [{ id: 9, avatar: '👤' }, { id: 10, avatar: '👤' }]
    }
];

const ProjectTasks: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'team' | 'my'>('team');
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        dueDate: '',
        taskName: ''
    });

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
                <div className="text-[16px] text-black mb-1">Projects / Project Alpha / Tasks</div>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Project Alpha</h1>
                        <p className="text-gray-600 text-sm">Manage and track all tasks related to Project Alpha</p>
                    </div>
                    <button className="bg-orange-500 text-white px-4 py-2 rounded font-semibold">
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
                <table className="min-w-full">
                    <thead>
                        <tr className="text-left border-b border-gray-200">
                            <th className="px-4 py-3 text-sm font-semibold">Task Name</th>
                            <th className="px-4 py-3 text-sm font-semibold">Project Name</th>
                            <th className="px-4 py-3 text-sm font-semibold">Status</th>
                            <th className="px-4 py-3 text-sm font-semibold">Priority</th>
                            <th className="px-4 py-3 text-sm font-semibold">Due Date</th>
                            <th className="px-4 py-3 text-sm font-semibold">Assignees</th>
                            <th className="px-4 py-3 text-sm font-semibold">Edit Task</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {dummyTasks.map((task) => (
                            <tr key={task.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4">{task.taskName}</td>
                                <td className="px-4 py-4">{task.projectName}</td>
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
                                <td className="px-4 py-4">{task.dueDate}</td>
                                <td className="px-4 py-4">
                                    <div className="flex -space-x-2">
                                        {task.assignees.map(a => (
                                            <div key={a.id} className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-sm">
                                                {a.avatar}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <button className="text-black hover:text-gray-700">
                                        <FiEdit size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectTasks; 