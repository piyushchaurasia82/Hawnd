import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../components/ui/alert/ToastContext';
import { useCurrentUser } from '../../context/CurrentUserContext';

const TimeLogsEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user, userRole } = useCurrentUser();
    const isDeveloper = userRole && userRole.trim().toLowerCase().includes('developer');
    const [tasks, setTasks] = useState<{ id: number; task_title: string }[]>([]);
    const [form, setForm] = useState({
        task_id: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        total_hours: '',
        description: '',
        status: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

    // Fetch tasks and time log data
    useEffect(() => {
        api.get('/api/projectmanagement/tasks/')
            .then(res => {
                let allTasks = res.data.data || [];
                // If developer, filter tasks assigned to current user
                if (isDeveloper && user && user.id) {
                    allTasks = allTasks.filter((task: any) =>
                        Array.isArray(task.task_assignees)
                            ? task.task_assignees.some((a: any) => String(a.user_id || a.id) === String(user.id))
                            : String(task.assigned_to_id) === String(user.id)
                    );
                }
                setTasks(allTasks);
            })
            .catch(() => setTasks([]));
        if (id) {
            api.get(`/api/projectmanagement/time_logs/${id}/`)
                .then(res => {
                    const data = res.data.data;
                    // Robustly extract 'HH:mm' from ISO or time string
                    function extractTime(val: any) {
                        if (!val) return '';
                        try {
                            const d = new Date(val);
                            if (!isNaN(d.getTime())) {
                                // Pad hours and minutes
                                const h = String(d.getHours()).padStart(2, '0');
                                const m = String(d.getMinutes()).padStart(2, '0');
                                return `${h}:${m}`;
                            }
                        } catch {}
                        // Fallback: try to match HH:mm in string
                        const match = val.match(/(\d{2}:\d{2})/);
                        return match ? match[1] : '';
                    }
                    setForm({
                        task_id: data.task_id ? String(data.task_id) : '',
                        start_date: data.start_date ? data.start_date.slice(0, 10) : '',
                        end_date: data.end_date ? data.end_date.slice(0, 10) : '',
                        start_time: extractTime(data.start_time),
                        end_time: extractTime(data.end_time),
                        total_hours: data.total_hours !== undefined && data.total_hours !== null ? String(data.total_hours) : '',
                        description: data.description || '',
                        status: data.status || '',
                    });
                })
                .catch(() => setError('Failed to load time log.'));
        }
    }, [id, isDeveloper, user]);

    // Calculate total hours if start and end time are set
    useEffect(() => {
        if (form.start_time && form.end_time) {
            // Parse 'HH:mm' format
            const [startHour, startMinute] = form.start_time.split(':').map(Number);
            const [endHour, endMinute] = form.end_time.split(':').map(Number);
            const start = startHour * 60 + startMinute;
            const end = endHour * 60 + endMinute;
            let diff = (end - start) / 60;
            if (diff < 0) diff += 24; // handle overnight times
            setForm(f => ({ ...f, total_hours: diff > 0 ? diff.toFixed(2) : '' }));
        } else {
            setForm(f => ({ ...f, total_hours: '' }));
        }
    }, [form.start_time, form.end_time]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
        setFieldErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const errors: { [key: string]: string } = {};
        if (!form.task_id) errors.task_id = 'Task Name is required';
        if (!form.start_date) errors.start_date = 'Start Date is required';
        if (!form.end_date) errors.end_date = 'End Date is required';
        if (!form.start_time) errors.start_time = 'Start Time is required';
        if (!form.end_time) errors.end_time = 'End Time is required';
        if (!form.total_hours) errors.total_hours = 'Total Hours is required';
        if (!form.status) errors.status = 'Status is required';
        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            showToast({ type: 'error', title: 'Validation Error', message: 'Please fill all required fields.' });
            setLoading(false);
            return;
        }
        try {
            const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
            // Combine date and time for ISO string
            const startDateTime = form.start_date && form.start_time ? new Date(`${form.start_date}T${form.start_time}`).toISOString() : '';
            const endDateTime = form.end_date && form.end_time ? new Date(`${form.end_date}T${form.end_time}`).toISOString() : '';
            const payload = {
                user_id: userData.id,
                task_id: Number(form.task_id),
                start_date: form.start_date ? new Date(form.start_date).toISOString() : '',
                end_date: form.end_date ? new Date(form.end_date).toISOString() : '',
                start_time: startDateTime,
                end_time: endDateTime,
                total_hours: Number(form.total_hours),
                description: form.description,
                status: form.status.trim(),
            };
            await api.put(`/api/projectmanagement/time_logs/${id}/`, payload);
            showToast({ type: 'success', title: 'Success', message: 'Time log updated successfully!' });
            navigate('/time_logs');
        } catch (err: any) {
            setError('Failed to update time log.');
            showToast({ type: 'error', title: 'Error', message: 'Failed to update time log.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <nav className="text-sm text-black mb-2 flex items-center gap-1">
                <span className="hover:underline cursor-pointer text-orange-500" onClick={() => navigate('/')}>Dashboard</span>
                <span className="mx-1">/</span>
                <span className="hover:underline cursor-pointer text-orange-500" onClick={() => navigate('/time_logs')}>Time Logs</span>
                <span className="mx-1">/</span>
                <span className="font-semibold">Edit Time Log</span>
            </nav>
            <h1 className="text-2xl font-bold mb-6">Edit Time Log</h1>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Task Name */}
                    <div>
                        <label className="block mb-2 font-semibold">Task Name <span className="text-red-500">*</span></label>
                        <select
                            name="task_id"
                            value={form.task_id}
                            onChange={handleChange}
                            className="w-full bg-[#F6F2ED] rounded px-4 py-3 text-black outline-none"
                            
                        >
                            <option value="">Enter Task Name</option>
                            {tasks.map(task => (
                                <option key={task.id} value={task.id}>{task.task_title}</option>
                            ))}
                        </select>
                        {fieldErrors.task_id && <div className="text-red-500 text-sm mt-1">{fieldErrors.task_id}</div>}
                    </div>
                    {/* Start Date */}
                    <div>
                        <label className="block mb-2 font-semibold">Start Date <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                type="date"
                                name="start_date"
                                value={form.start_date}
                                onChange={handleChange}
                                className="w-full bg-[#F6F2ED] rounded px-4 py-3 text-black outline-none "
                                
                            />
                        </div>
                        {fieldErrors.start_date && <div className="text-red-500 text-sm mt-1">{fieldErrors.start_date}</div>}
                    </div>
                    {/* End Date */}
                    <div>
                        <label className="block mb-2 font-semibold">End Date <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                type="date"
                                name="end_date"
                                value={form.end_date}
                                onChange={handleChange}
                                className="w-full bg-[#F6F2ED] rounded px-4 py-3 text-black outline-none "
                                
                            />
                        </div>
                        {fieldErrors.end_date && <div className="text-red-500 text-sm mt-1">{fieldErrors.end_date}</div>}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Start Time */}
                    <div>
                        <label className="block mb-2 font-semibold">Start Time <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                type="time"
                                name="start_time"
                                value={form.start_time}
                                onChange={handleChange}
                                className="w-full bg-[#F6F2ED] rounded px-4 py-3 text-black outline-none "
                            />
                        </div>
                        {fieldErrors.start_time && <div className="text-red-500 text-sm mt-1">{fieldErrors.start_time}</div>}
                    </div>
                    {/* End Time */}
                    <div>
                        <label className="block mb-2 font-semibold">End Time <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                type="time"
                                name="end_time"
                                value={form.end_time}
                                onChange={handleChange}
                                className="w-full bg-[#F6F2ED] rounded px-4 py-3 text-black outline-none "
                            />
                        </div>
                        {fieldErrors.end_time && <div className="text-red-500 text-sm mt-1">{fieldErrors.end_time}</div>}
                    </div>
                    {/* Total Hours */}
                    <div>
                        <label className="block mb-2 font-semibold">Total Hours <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                type="text"
                                name="total_hours"
                                value={form.total_hours}
                                readOnly
                                className="w-full bg-[#F6F2ED] rounded px-4 py-3 text-black outline-none "
                            />
                        </div>
                        {fieldErrors.total_hours && <div className="text-red-500 text-sm mt-1">{fieldErrors.total_hours}</div>}
                    </div>
                    {/* Status Dropdown */}
                    <div>
                        <label className="block mb-2 font-semibold">Status <span className="text-red-500">*</span></label>
                        <select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            className="w-full bg-[#F6F2ED] rounded px-4 py-3 text-black outline-none"
                        >
                            <option value="">Select Status</option>
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Done">Done</option>
                        </select>
                        {fieldErrors.status && <div className="text-red-500 text-sm mt-1">{fieldErrors.status}</div>}
                    </div>
                </div>
                {/* Description */}
                <div>
                    <label className="block mb-2 font-semibold">Description</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        className="w-full bg-[#F6F2ED] rounded px-4 py-3 text-black outline-none min-h-[90px]"
                        rows={4}
                        placeholder=""
                    />
                </div>
                {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
                <div className="flex gap-4 justify-end">
                    <button
                        type="button"
                        className="bg-gray-200 text-gray-800 font-semibold rounded px-6 py-2 hover:bg-gray-300"
                        onClick={() => navigate('/time_logs')}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="bg-orange-500 text-white font-semibold rounded px-6 py-2 hover:bg-orange-600"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Update'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TimeLogsEdit;
