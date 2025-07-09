import { useEffect, useState } from 'react';
import RoundChartOne from './charts/round/RoundChartOne';
import api from '../services/api';

// Helper to get username from localStorage
function getUsername() {
  let username = '';
  try {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed && parsed.username) return parsed.username;
      if (parsed && parsed.name) return parsed.name;
    }
    const userProfile = localStorage.getItem('user_profile');
    if (userProfile) {
      const parsed = JSON.parse(userProfile);
      if (parsed && parsed.data && parsed.data.username) return parsed.data.username;
      if (parsed && parsed.data && parsed.data.name) return parsed.data.name;
    }
  } catch {}
  return username || 'User';
}

// Color logic for status and priority (from TasksList)
function getStatusBadge(status: string) {
  const s = (status || '').toLowerCase().replace(/\s/g, '');
  const isGreen = s === 'completed' || s === 'done';
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border
      ${s === 'inprogress' ? 'border-orange-500 text-orange-600 bg-orange-50' : ''}
      ${isGreen ? 'border-green-500 text-green-700 bg-green-50' : ''}
      ${s === 'todo' ? 'border-blue-500 text-blue-600 bg-blue-50' : ''}
    `}>
      <span className={`w-2 h-2 rounded-full mr-1
        ${s === 'inprogress' ? 'bg-orange-500' : ''}
        ${isGreen ? 'bg-green-500' : ''}
        ${s === 'todo' ? 'bg-blue-500' : ''}
      `}></span>
      {status}
    </span>
  );
}

function getPriorityBadge(priority: string) {
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border
      ${priority === 'High' ? 'border-red-500 text-red-600 bg-red-50' : ''}
      ${priority === 'Medium' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' : ''}
      ${priority === 'Low' ? 'border-green-500 text-green-700 bg-green-50' : ''}
    `}>
      <span className={`w-2 h-2 rounded-full mr-1
        ${priority === 'High' ? 'bg-red-500' : ''}
        ${priority === 'Medium' ? 'bg-yellow-400' : ''}
        ${priority === 'Low' ? 'bg-green-500' : ''}
      `}></span>
      {priority}
    </span>
  );
}

export default function DeveloperDashboard() {
  const username = getUsername();
  const [tasks, setTasks] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Get userId from localStorage (user_data or user_profile)
  useEffect(() => {
    let id = null;
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed && parsed.id) id = parsed.id;
      }
      if (!id) {
        const userProfile = localStorage.getItem('user_profile');
        if (userProfile) {
          const parsed = JSON.parse(userProfile);
          if (parsed && parsed.data && parsed.data.id) id = parsed.data.id;
        }
      }
    } catch {}
    setUserId(id ? String(id) : null);
  }, []);

  // Fetch tasks from API and filter for current user
  useEffect(() => {
    if (!userId) return;
    api.get('/api/projectmanagement/tasks/')
      .then(res => {
        const allTasks = res.data.data || res.data.tasks || res.data || [];
        // Filter tasks where current user is an assignee
        const userTasks = allTasks.filter((task: any) => {
          if (Array.isArray(task.task_assignees)) {
            return task.task_assignees.some((a: any) => String(a.user_id || a.id) === String(userId));
          }
          return false;
        });
        setTasks([...userTasks]); // ensure new array reference
      })
      .catch(() => setTasks([]));
  }, [userId]);

  // Compute reminders: high priority, due in next 7 days, status In Progress or To Do
  const now = new Date();
  const in7Days = new Date(now);
  in7Days.setDate(now.getDate() + 7);
  const reminders = tasks.filter((task: any) => {
    if (!task.due || !task.priority || !task.status) return false;
    const due = new Date(task.due);
    const status = (task.status || '').toLowerCase().replace(/\s/g, '');
    return (
      task.priority.toLowerCase() === 'high' &&
      due >= now &&
      due <= in7Days &&
      (status === 'inprogress' || status === 'todo')
    );
  });

  // Calculate task status counts for the pie chart
  const inProgressCount = tasks.filter((t: any) => (t.status || '').toLowerCase().replace(/\s/g, '') === 'inprogress').length;
  const notStartedCount = tasks.filter((t: any) => (t.status || '').toLowerCase().replace(/\s/g, '') === 'todo' || (t.status || '').toLowerCase().replace(/\s/g, '') === 'notstarted').length;
  const completedCount = tasks.filter((t: any) => (t.status || '').toLowerCase().replace(/\s/g, '') === 'completed' || (t.status || '').toLowerCase().replace(/\s/g, '') === 'done').length;

  return (
    <div className="p-8 bg-[#FAFAFA] min-h-screen">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold mt-2 text-gray-900">
          Welcome back, <span className="text-orange-500">{username}</span>
        </h1>
      </div>
      {/* Team Performance & Reminders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Team Performance Chart */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-black">Task Summary</h2>
          <RoundChartOne key={tasks.length} data={[inProgressCount, notStartedCount, completedCount]} />
        </div>
        {/* Reminders Block */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-semibold text-gray-800">Reminder</span>
            <span className="flex-1 border-b-2 border-orange-400 ml-2"></span>
          </div>
          <ul className="text-sm space-y-2 mb-0">
            {reminders.length === 0 ? (
              <li className="text-gray-400">No high priority tasks due soon.</li>
            ) : (
              reminders.map((reminder: any, idx: number) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                  {reminder.task}
                  <span className="ml-auto text-xs text-gray-400">{reminder.due}</span>
                  <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold
                    ${(reminder.status || '').toLowerCase().replace(/\s/g, '') === 'inprogress' ? 'bg-orange-100 text-orange-600' : ''}
                    ${(reminder.status || '').toLowerCase().replace(/\s/g, '') === 'todo' ? 'bg-blue-100 text-blue-600' : ''}
                  `}>
                    {reminder.status}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
      {/* Task Overview Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-orange-500">Task Overview</h2>
        <table className="w-full rounded-lg border border-gray-200 overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left text-orange-500 !bg-gray-100" style={{background:'#f2f4f7'}}>Task</th>
              <th className="p-3 text-left text-orange-500 !bg-gray-100" style={{background:'#f2f4f7'}}>Status</th>
              <th className="p-3 text-left text-orange-500 !bg-gray-100" style={{background:'#f2f4f7'}}>Priority</th>
              <th className="p-3 text-left text-orange-500 !bg-gray-100" style={{background:'#f2f4f7'}}>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((row: any, idx: number) => (
              <tr key={idx} className="border-t border-gray-100">
                <td className="p-3">{row.task_title || row.name}</td>
                <td className="p-3">{getStatusBadge(row.status)}</td>
                <td className="p-3">{getPriorityBadge(row.priority)}</td>
                <td className="p-3">{row.due_date ? new Date(row.due_date).toLocaleDateString('en-GB') : (row.due || '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 