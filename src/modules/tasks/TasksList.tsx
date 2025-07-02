import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const statusColors: Record<string, string> = {
  'In Progress': 'bg-orange-500 text-white',
  'Todo': 'bg-blue-500 text-white',
  'Completed': 'bg-green-500 text-white',
};
const priorityColors: Record<string, string> = {
  'High': 'bg-red-500 text-white',
  'Medium': 'bg-orange-500 text-white',
  'Low': 'bg-green-500 text-white',
};

const TasksList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'team' | 'my'>('team');
  const [filters, setFilters] = useState({ status: '', priority: '', dueDate: '', name: '' });
  const [search, setSearch] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

  const filteredTasks = tasks.filter(task => {
    return (
      (!filters.status || task.status === filters.status) &&
      (!filters.priority || task.priority === filters.priority) &&
      (!filters.dueDate || (task.due_date && new Date(task.due_date).toLocaleDateString('en-GB') === filters.dueDate)) &&
      (!filters.name || (task.task_title || task.name || '').toLowerCase().includes(filters.name.toLowerCase())) &&
      (!search || (task.task_title || task.name || '').toLowerCase().includes(search.toLowerCase()))
    );
  });

  // Collect unique due dates and task names for filter dropdowns
  const dueDates = Array.from(new Set(tasks.map(t => t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB') : ''))).filter(Boolean);
  const taskNames = Array.from(new Set(tasks.map(t => t.task_title || t.name || ''))).filter(Boolean);

  return (
    <div className="p-8">
      <div className="text-[18px] text-black mb-1 font-medium">Projects / Project / Tasks</div>
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
        <button
          className={`pr-4 py-2 text-base font-semibold border-b-2 transition-all duration-150 ${activeTab === 'team' ? 'border-orange-500 text-black' : 'border-transparent text-gray-500'}`}
          onClick={() => setActiveTab('team')}
        >
          Team Tasks
        </button>
        <button
          className={`pr-4 py-2 text-base font-semibold border-b-2 transition-all duration-150 ${activeTab === 'my' ? 'border-orange-500 text-black' : 'border-transparent text-gray-500'}`}
          onClick={() => setActiveTab('my')}
        >
          My Tasks
        </button>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <select className="rounded bg-gray-100 px-4 py-2 min-w-[120px]" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">Status</option>
          <option value="In Progress">In Progress</option>
          <option value="Todo">Todo</option>
          <option value="Completed">Completed</option>
        </select>
        <select className="rounded bg-gray-100 px-4 py-2 min-w-[120px]" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
          <option value="">Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select className="rounded bg-gray-100 px-4 py-2 min-w-[120px]" value={filters.dueDate} onChange={e => setFilters(f => ({ ...f, dueDate: e.target.value }))}>
          <option value="">Due Date</option>
          {dueDates.map(date => (
            <option key={date} value={date}>{date}</option>
          ))}
        </select>
        <select className="rounded bg-gray-100 px-4 py-2 min-w-[120px]" value={filters.name} onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}>
          <option value="">Task Name</option>
          {taskNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      <input
        type="text"
        placeholder="Search tasks"
        className="w-full rounded border border-gray-200 bg-white px-4 py-3 mb-4 text-base"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {/* Table */}
      <div className="overflow-x-auto w-full">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading tasks...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
        <table className="min-w-full text-base">
          <thead>
            <tr className="bg-orange-50 text-orange-500">
              <th className="px-6 py-3 text-left font-semibold">Task Name</th>
              <th className="px-6 py-3 text-left font-semibold">Status</th>
              <th className="px-6 py-3 text-left font-semibold">Priority</th>
              <th className="px-6 py-3 text-left font-semibold">Due Date</th>
              <th className="px-6 py-3 text-left font-semibold">Edit Task</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map(task => (
              <tr key={task.id}>
                <td className="px-6 py-4">{task.task_title || task.name}</td>
                <td className="px-6 py-4">
                  <span className={`inline-block rounded px-4 py-1 font-semibold ${statusColors[task.status]}`}>{task.status}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block rounded px-4 py-1 font-semibold ${priorityColors[task.priority]}`}>{task.priority}</span>
                </td>
                <td className="px-6 py-4">{task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB') : ''}</td>
                <td className="px-6 py-4">
                  <button onClick={() => navigate(`/tasks/edit/${task.id}`)} className="text-black" title="Edit Task">
                    <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
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

export default TasksList;
