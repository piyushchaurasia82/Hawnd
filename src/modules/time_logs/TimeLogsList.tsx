import React, { useEffect, useState } from 'react';
import { FiEdit2 } from 'react-icons/fi';
import { FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { format } from 'date-fns';
import { useToast } from '../../components/ui/alert/ToastContext';
import { saveAs } from 'file-saver';
import { useCurrentUser } from '../../context/CurrentUserContext';
import Select from 'react-select';

interface TimeLog {
  id: number;
  task_name: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  total_hours: string;
  description: string;
  status?: string;
  task_assignees?: any[];
  assigned_to_id?: number;
  task_id?: number;
}

function formatTime(timeStr: string | null | undefined) {
  if (!timeStr) return '';
  // If it's just HH:mm or HH:mm:ss, return as is (or format to HH:mm AM/PM)
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
    const [h, m] = timeStr.split(':');
    const hour = Number(h);
    const minute = m;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12.toString().padStart(2, '0')}:${minute} ${ampm}`;
  }
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;
    // Format as UTC
    const hour = d.getUTCHours();
    const minute = d.getUTCMinutes();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
  } catch {
    return timeStr;
  }
}

const TimeLogsList: React.FC = () => {
  const navigate = useNavigate();
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({start: '', end: ''});
  const [filteredLogs, setFilteredLogs] = useState<TimeLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [jumpPage, setJumpPage] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { showToast } = useToast();
  const { userRole, user } = useCurrentUser();
  const isDeveloper = userRole && userRole.trim().toLowerCase().includes('developer');
  const isAdmin = userRole && userRole.trim().toLowerCase().includes('admin');

  // New: State to hold IDs of tasks assigned to current user (for developer)
  const [myTaskIds, setMyTaskIds] = useState<number[]>([]);

  // New: State for user filter (admin only)
  const [userFilter, setUserFilter] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);
      const url = `/api/projectmanagement/time_logs/?${params.toString()}`;
      const res = await api.get(url);
      setTimeLogs(res.data.data || []);
    } catch (err) {
      setError('Failed to load time logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, [statusFilter, dateRange.start, dateRange.end]);

  // Fetch tasks assigned to current user if developer
  useEffect(() => {
    if (isDeveloper && user && user.id) {
      api.get('/api/projectmanagement/tasks/').then(res => {
        const tasks = res.data.data || [];
        const assigned = tasks.filter((task: any) =>
          Array.isArray(task.task_assignees)
            ? task.task_assignees.some((a: any) => String(a.user_id || a.id) === String(user.id))
            : String(task.assigned_to_id) === String(user.id)
        );
        setMyTaskIds(assigned.map((t: any) => t.id));
      }).catch(() => setMyTaskIds([]));
    } else {
      setMyTaskIds([]);
    }
  }, [isDeveloper, user]);

  // Fetch all users and all tasks for admin filter
  useEffect(() => {
    if (isAdmin) {
      api.get('/api/projectmanagement/users/').then(res => {
        const data = res.data.data || res.data.users || res.data;
        setUsers(Array.isArray(data) ? data : []);
      }).catch(() => setUsers([]));
      api.get('/api/projectmanagement/tasks/').then(res => {
        setAllTasks(res.data.data || []);
      }).catch(() => setAllTasks([]));
    }
  }, [isAdmin]);

  // Filter logs by status, date range (independent), and search (character by character) on the frontend
  useEffect(() => {
    let logs = [...timeLogs];
    if (statusFilter) {
      logs = logs.filter(log => log.status === statusFilter);
    }
    if (dateRange.start) {
      logs = logs.filter(log => log.start_date && new Date(log.start_date) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      logs = logs.filter(log => log.end_date && new Date(log.end_date) <= new Date(dateRange.end));
    }
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      logs = logs.filter(log => log.task_name?.toLowerCase().includes(searchLower));
    }
    // Admin: filter by userFilter (task assigned to user)
    if (isAdmin && userFilter) {
      // Find all task IDs assigned to the selected user
      const filteredTaskIds = allTasks.filter((task: any) => {
        if (Array.isArray(task.task_assignees)) {
          return task.task_assignees.some((a: any) => String(a.user_id || a.id) === userFilter);
        }
        return String(task.assigned_to_id) === userFilter;
      }).map((t: any) => t.id);
      logs = logs.filter(log => typeof log.task_id === 'number' && filteredTaskIds.includes(log.task_id));
    }
    // Updated developer filter: only show logs where the task is assigned to the current user
    if (isDeveloper && user && user.id) {
      logs = logs.filter(log => typeof log.task_id === 'number' && myTaskIds.includes(log.task_id));
    }
    setFilteredLogs(logs);
  }, [statusFilter, search, dateRange.start, dateRange.end, timeLogs, isDeveloper, user, myTaskIds, isAdmin, userFilter, allTasks]);

  // Sort logs by start_date descending (latest first)
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const aDate = a.start_date ? new Date(a.start_date).getTime() : 0;
    const bDate = b.start_date ? new Date(b.start_date).getTime() : 0;
    return bDate - aDate;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedLogs.length / pageSize);
  const pagedLogs = sortedLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleDelete = async (id: number) => {
    // Show confirmation toast
    const toastId = showToast({
      type: 'warning',
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this time log? This action cannot be undone.',
      duration: 8000,
      actions: [
        {
          label: 'Delete',
          variant: 'danger',
          onClick: async () => {
            setDeletingId(id);
            try {
              await api.delete(`/api/projectmanagement/time_logs/${id}/`);
              setTimeLogs(logs => logs.filter(log => log.id !== id));
              showToast({
                type: 'success',
                title: 'Time Log Deleted',
                message: 'The time log has been permanently removed.',
                duration: 5000
              });
            } catch (err) {
              showToast({
                type: 'error',
                title: 'Delete Failed',
                message: 'Failed to delete the time log. Please try again.',
                duration: 5000
              });
            } finally {
              setDeletingId(null);
              // Remove the confirmation toast
              const evt = new CustomEvent('toast:remove', { detail: { id: toastId } });
              window.dispatchEvent(evt);
            }
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
  };

  // CSV download handler
  const handleDownloadCSV = () => {
    // Prepare CSV header
    const header = [
      'Task Name',
      'Start Date',
      'End Date',
      'Start Time',
      'End Time',
      'Total Hours',
      'Status',
      'Description'
    ];
    // Prepare CSV rows
    const rows = sortedLogs.map(log => [
      log.task_name,
      log.start_date ? format(new Date(log.start_date), 'yyyy-MM-dd') : '',
      log.end_date ? format(new Date(log.end_date), 'yyyy-MM-dd') : '',
      log.start_time,
      log.end_time,
      log.total_hours,
      log.status || '',
      log.description || ''
    ]);
    // Combine header and rows
    const csvContent = [header, ...rows]
      .map(row => row.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(','))
      .join('\r\n');
    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'time_logs.csv');
  };

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-black mb-2 flex items-center gap-1">
        <span className="hover:underline cursor-pointer text-orange-500" onClick={() => navigate('/')}>Dashboard</span>
        <span className="mx-1">/</span>
        <span className="font-semibold">Time Logs</span>
      </nav>
      {/* Title */}
      <h1 className="text-2xl font-bold mb-6">Time Logs</h1>
      {/* Filters */}
      {isAdmin ? (
        <div className="mb-4">
          <div className="relative max-w-xl mb-3">
            <input
              type="text"
              placeholder="Search by Task or Description"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pl-10 pr-10 text-sm focus:outline-none focus:border-orange-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6Z"/></svg>
            </span>
            {search && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setSearch('')}
                tabIndex={-1}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
          <div className="flex gap-2 items-start flex-wrap">
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange(r => ({...r, start: e.target.value}))}
                className="rounded-lg border bg-white px-3 py-2 text-sm min-w-[120px] border-gray-200 focus:border-orange-500 focus:ring-0 focus:outline-none"
                placeholder="Start Date"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange(r => ({...r, end: e.target.value}))}
                className="rounded-lg border bg-white px-3 py-2 text-sm min-w-[120px] border-gray-200 focus:border-orange-500 focus:ring-0 focus:outline-none"
                placeholder="End Date"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1">Status</label>
              <Select
                classNamePrefix="react-select"
                value={
                  [
                    { value: '', label: 'Status' },
                    { value: 'To Do', label: 'To Do' },
                    { value: 'In Progress', label: 'In Progress' },
                    { value: 'Done', label: 'Done' },
                  ].find(opt => opt.value === statusFilter)
                }
                onChange={opt => setStatusFilter(opt ? opt.value : '')}
                options={[
                  { value: '', label: 'Status' },
                  { value: 'To Do', label: 'To Do' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Done', label: 'Done' },
                ]}
                isSearchable={false}
                placeholder="Status"
                styles={{
                  container: base => ({ ...base, minWidth: 120 }),
                  control: (base, state) => ({
                    ...base,
                    minHeight: 38,
                    height: 38,
                    fontSize: '0.875rem',
                    borderColor: state.isFocused ? '#F97316' : '#E5E7EB', // orange-500 on focus, gray-200 default
                    backgroundColor: '#F3F4F6', // gray-100
                    boxShadow: state.isFocused ? '0 0 0 1.5px #F97316' : 'none',
                    '&:hover': {
                      borderColor: state.isFocused ? '#F97316' : '#E5E7EB',
                      backgroundColor: '#FFF7ED', // orange-50
                    },
                  }),
                  valueContainer: base => ({ ...base, height: 38, paddingTop: 0, paddingBottom: 0 }),
                  indicatorsContainer: base => ({ ...base, height: 38 }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? '#F97316'
                      : state.isFocused
                      ? '#FFF7ED'
                      : '#fff',
                    color: state.isSelected ? '#fff' : '#111827',
                    '&:hover': {
                      backgroundColor: '#FFF7ED',
                      color: '#111827',
                    },
                  }),
                  menu: base => ({ ...base, zIndex: 20 }),
                }}
              />
            </div>
            {/* User filter for admin */}
            <div className="flex flex-col min-w-[180px]">
              <label className="text-xs font-medium mb-1">User</label>
              <Select
                classNamePrefix="react-select"
                value={
                  [
                    { value: '', label: 'All Users' },
                    ...users.map(u => ({
                      value: String(u.id),
                      label: `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''} (${u.username || u.email || u.id})`
                    }))
                  ].find(opt => opt.value === userFilter)
                }
                onChange={opt => setUserFilter(opt ? opt.value : '')}
                options={[
                  { value: '', label: 'All Users' },
                  ...users.map(u => ({
                    value: String(u.id),
                    label: `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''} (${u.username || u.email || u.id})`
                  }))
                ]}
                isSearchable
                placeholder="All Users"
                styles={{
                  container: base => ({ ...base, minWidth: 180 }),
                  control: (base, state) => ({
                    ...base,
                    minHeight: 38,
                    height: 38,
                    fontSize: '0.875rem',
                    borderColor: state.isFocused ? '#F97316' : '#E5E7EB', // orange-500 on focus, gray-200 default
                    backgroundColor: '#F3F4F6', // gray-100
                    boxShadow: state.isFocused ? '0 0 0 1.5px #F97316' : 'none',
                    '&:hover': {
                      borderColor: state.isFocused ? '#F97316' : '#E5E7EB',
                      backgroundColor: '#FFF7ED', // orange-50
                    },
                  }),
                  valueContainer: base => ({ ...base, height: 38, paddingTop: 0, paddingBottom: 0 }),
                  indicatorsContainer: base => ({ ...base, height: 38 }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? '#F97316'
                      : state.isFocused
                      ? '#FFF7ED'
                      : '#fff',
                    color: state.isSelected ? '#fff' : '#111827',
                    '&:hover': {
                      backgroundColor: '#FFF7ED',
                      color: '#111827',
                    },
                  }),
                  menu: base => ({ ...base, zIndex: 20 }),
                }}
              />
            </div>
            {/* Remove All Filters and Download CSV Buttons */}
            <div className="flex flex-col justify-end mt-5">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-100"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                    setDateRange({ start: '', end: '' });
                    setUserFilter('');
                  }}
                >
                  Remove All Filters
                </button>
                {!isDeveloper && (
                  <button
                    type="button"
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-100"
                    onClick={handleDownloadCSV}
                  >
                    Export CSV
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-start gap-3 mb-4">
          <div className="flex-1 relative max-w-xl">
            <input
              type="text"
              placeholder="Search by Task or Description"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pl-10 pr-10 text-sm focus:outline-none focus:border-orange-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6Z"/></svg>
            </span>
            {search && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setSearch('')}
                tabIndex={-1}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
          <div className="flex gap-2 items-start mt-[-16px]">
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange(r => ({...r, start: e.target.value}))}
                className="rounded-lg border bg-white px-3 py-2 text-sm min-w-[120px] border-gray-200 focus:border-orange-500 focus:ring-0 focus:outline-none"
                placeholder="Start Date"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange(r => ({...r, end: e.target.value}))}
                className="rounded-lg border bg-white px-3 py-2 text-sm min-w-[120px] border-gray-200 focus:border-orange-500 focus:ring-0 focus:outline-none"
                placeholder="End Date"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1">Status</label>
              <Select
                classNamePrefix="react-select"
                value={
                  [
                    { value: '', label: 'Status' },
                    { value: 'To Do', label: 'To Do' },
                    { value: 'In Progress', label: 'In Progress' },
                    { value: 'Done', label: 'Done' },
                  ].find(opt => opt.value === statusFilter)
                }
                onChange={opt => setStatusFilter(opt ? opt.value : '')}
                options={[
                  { value: '', label: 'Status' },
                  { value: 'To Do', label: 'To Do' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Done', label: 'Done' },
                ]}
                isSearchable={false}
                placeholder="Status"
                styles={{ container: base => ({ ...base, minWidth: 120 }) }}
              />
            </div>
            {/* Remove All Filters and Download CSV Buttons */}
            <div className="flex flex-col justify-end mt-5">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-100"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                    setDateRange({ start: '', end: '' });
                  }}
                >
                  Remove All Filters
                </button>
                {!isDeveloper && (
                  <button
                    type="button"
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-100"
                    onClick={handleDownloadCSV}
                  >
                    Download CSV
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Table */}
      <div className="bg-white rounded shadow-sm">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : (
          <>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left px-4 py-3 !bg-gray-100 font-semibold">Task Name</th>
                <th className="text-left px-4 py-3 !bg-gray-100 font-semibold">Start Date</th>
                <th className="text-left px-4 py-3 !bg-gray-100 font-semibold">End Date</th>
                <th className="text-left px-4 py-3 !bg-gray-100 font-semibold">Start Time</th>
                <th className="text-left px-4 py-3 !bg-gray-100 font-semibold">End Time</th>
                <th className="text-left px-4 py-3 !bg-gray-100 font-semibold">Total Hours</th>
                <th className="text-left px-4 py-3 !bg-gray-100 font-semibold">Status</th>
                <th className="text-left px-4 py-3 !bg-gray-100 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedLogs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-[#F6F2ED]">
                  <td className="px-4 py-3">{log.task_name}</td>
                  <td className="px-4 py-3">{log.start_date ? format(new Date(log.start_date), 'dd-MM-yyyy') : ''}</td>
                  <td className="px-4 py-3">{log.end_date ? format(new Date(log.end_date), 'dd-MM-yyyy') : ''}</td>
                  <td className="px-4 py-3">{formatTime(log.start_time)}</td>
                  <td className="px-4 py-3">{formatTime(log.end_time)}</td>
                  <td className="px-4 py-3">{log.total_hours}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border
                        ${log.status === 'In Progress' ? 'border-orange-500 text-orange-600 bg-orange-50' : ''}
                        ${log.status === 'Done' ? 'border-green-500 text-green-700 bg-green-50' : ''}
                        ${log.status === 'To Do' ? 'border-blue-500 text-blue-600 bg-blue-50' : ''}
                      `}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mr-1
                          ${log.status === 'In Progress' ? 'bg-orange-500' : ''}
                          ${log.status === 'Done' ? 'bg-green-500' : ''}
                          ${log.status === 'To Do' ? 'bg-blue-500' : ''}
                        `}
                      ></span>
                      {log.status || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-gray-700 hover:text-orange-500 mr-2" onClick={() => navigate(`/time_logs/edit/${log.id}`)}>
                      <FiEdit2 />
                    </button>
                    <button
                      className={`text-red-600 hover:text-red-800 ${deletingId === log.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => handleDelete(log.id)}
                      disabled={deletingId === log.id}
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-wrap justify-center items-center gap-2 py-4">
              <button
                className="px-3 py-1 rounded border bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  className={`px-3 py-1 rounded border ${currentPage === i + 1 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="px-3 py-1 rounded border bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
              {/* Jump to page */}
              <div className="flex items-center gap-1 ml-4">
                <span className="text-sm">Jump to</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpPage}
                  onChange={e => setJumpPage(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const page = Number(jumpPage);
                      if (page >= 1 && page <= totalPages) {
                        handlePageChange(page);
                        setJumpPage('');
                      }
                    }
                  }}
                  className="w-16 px-2 py-1 border rounded text-sm"
                  placeholder="Page"
                />
                <button
                  className="px-2 py-1 rounded border bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
                  onClick={() => {
                    const page = Number(jumpPage);
                    if (page >= 1 && page <= totalPages) {
                      handlePageChange(page);
                      setJumpPage('');
                    }
                  }}
                  disabled={!jumpPage || Number(jumpPage) < 1 || Number(jumpPage) > totalPages}
                >
                  Go
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
};

export default TimeLogsList;
