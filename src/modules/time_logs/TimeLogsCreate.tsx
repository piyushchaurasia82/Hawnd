import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../components/ui/alert/ToastContext';
import { useCurrentUser } from '../../context/CurrentUserContext';
import Select from 'react-select';

const TimeLogsCreate: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { userRole, user } = useCurrentUser();
    const [tasks, setTasks] = useState<{ id: number; task_title: string; task_assignees?: any[]; assigned_to_id?: string | number }[]>([]);
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

    useEffect(() => {
        api.get('/api/projectmanagement/tasks/')
            .then(res => setTasks(res.data.data || []))
            .catch(() => setTasks([]));
    }, []);

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
            // Helper to combine date and time into ISO string
            function toIsoDatetime(date: string, time: string) {
                if (!date || !time) return '';
                // If time is '09:00', add ':00' for seconds
                if (/^\d{2}:\d{2}$/.test(time)) time = time + ':00';
                // Combine as local time (no Z)
                return `${date}T${time}`;
            }
            const payload = {
                user_id: userData.id,
                task_id: Number(form.task_id),
                start_date: form.start_date ? new Date(form.start_date).toISOString() : '',
                end_date: form.end_date ? new Date(form.end_date).toISOString() : '',
                start_time: toIsoDatetime(form.start_date, form.start_time),
                end_time: toIsoDatetime(form.end_date, form.end_time),
                total_hours: form.total_hours,
                description: form.description,
                status: form.status,
            };
            await api.post('/api/projectmanagement/time_logs/', payload);
            showToast({ type: 'success', title: 'Success', message: 'Time log created successfully!' });
            navigate('/time_logs');
        } catch (err: any) {
            setError('Failed to create time log.');
            if (err.response && err.response.data) {
                console.error('API Error:', err.response.data);
                showToast({ type: 'error', title: 'Error', message: JSON.stringify(err.response.data) });
            } else {
            showToast({ type: 'error', title: 'Error', message: 'Failed to create time log.' });
            }
        } finally {
            setLoading(false);
        }
    };

    // Filter tasks for developer: only show tasks assigned to the current user
    let filteredTasks = tasks;
    if (userRole && userRole.trim().toLowerCase().includes('developer') && user && user.id) {
        filteredTasks = tasks.filter(task => {
            if (Array.isArray(task.task_assignees)) {
                return task.task_assignees.some((a: any) => String(a.user_id || a.id) === String(user.id));
            }
            return String(task.assigned_to_id) === String(user.id);
        });
    }

    return (
        <div className="p-6">
            <nav className="text-sm text-black mb-2 flex items-center gap-1">
                <span className="hover:underline cursor-pointer text-orange-500" onClick={() => navigate('/')}>Dashboard</span>
                <span className="mx-1">/</span>
                <span className="hover:underline cursor-pointer text-orange-500" onClick={() => navigate('/time_logs')}>Time Logs</span>
                <span className="mx-1">/</span>
                <span className="font-semibold">Create Time Log</span>
            </nav>
            <h1 className="text-2xl font-bold mb-6">Create Time Logs</h1>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Task Name */}
                    <div>
                        <label className="block mb-2 font-semibold">Task Name <span className="text-red-500">*</span></label>
                        <Select
                            name="task_id"
                            options={filteredTasks.map(task => ({ value: task.id, label: task.task_title }))}
                            value={filteredTasks
                                .map(task => ({ value: task.id, label: task.task_title }))
                                .find(option => String(option.value) === String(form.task_id)) || null}
                            onChange={option => {
                                setForm(f => ({ ...f, task_id: option ? String(option.value) : '' }));
                                setFieldErrors(prev => ({ ...prev, task_id: '' }));
                            }}
                            isClearable
                            placeholder="Enter Task Name"
                            classNamePrefix="react-select"
                            styles={{
                                control: (base) => ({ ...base, backgroundColor: '#f2f4f7', minHeight: '48px', borderRadius: '0.375rem', borderColor: '#d1d5db', boxShadow: 'none' }),
                                menu: (base) => ({ ...base, zIndex: 9999 }),
                            }}
                        />
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
                                className="w-full bg-gray-100 rounded px-4 py-3 text-black outline-none "
                                
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
                                className="w-full bg-gray-100 rounded px-4 py-3 text-black outline-none "
                                
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
                                className="w-full bg-gray-100 rounded px-4 py-3 text-black outline-none "
                                
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
                                className="w-full bg-gray-100 rounded px-4 py-3 text-black outline-none "
                                
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
                                className="w-full bg-gray-100 rounded px-4 py-3 text-black outline-none "
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
                            className="w-full bg-gray-100 rounded px-4 py-3 text-black outline-none"
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
                        className="w-full bg-gray-100 rounded px-4 py-3 text-black outline-none min-h-[90px]"
                        rows={4}
                        placeholder=""
                    />
                </div>
                {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    className="bg-gray-300 text-black font-semibold rounded px-6 py-2 mt-2 hover:bg-gray-400"
                    onClick={() => navigate('/time_logs')}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-orange-500 text-white font-semibold rounded px-6 py-2 mt-2 hover:bg-orange-600"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Create Time Log'}
                  </button>
                </div>
            </form>
        </div>
    );
};

export default TimeLogsCreate;
