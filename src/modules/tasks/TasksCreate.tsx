import React, { useState, useEffect } from 'react';
import { FiCalendar, FiClock } from 'react-icons/fi';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { DateRange, Range, RangeKeyDict } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { format } from 'date-fns';
import { useToast } from '../../components/ui/alert/ToastContext';
import api from '../../services/api';

const assignees = [
  { id: 1, name: 'Alex' },
  { id: 2, name: 'Sam' },
  { id: 3, name: 'Jordan' },
];
const reviewers = [
  { id: 1, name: 'Reviewer 1' },
  { id: 2, name: 'Reviewer 2' },
];
const priorities = ['Low', 'Medium', 'High'];
const statuses = ['To Do', 'In Progress', 'Done'];

// Local type for date range selection
interface DateRangeSelection {
  startDate?: Date;
  endDate?: Date;
  key: string;
}

const TasksCreate: React.FC = () => {
  const location = useLocation();
  const { id: projectId } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'quick' | 'detailed'>('quick');
  const [quickForm, setQuickForm] = useState({
    title: '',
    assignee: '',
    project_id: projectId || '',
  });

  const [form, setForm] = useState({
    title: '',
    assignee: '',
    start_date: '',
    due_date: '',
    estimated: '',
    description: '',
    priority: '',
    status: '',
    reviewer: '',
    startAfter: '',
    blockedBy: '',
    overrideNotifications: false,
    notifyStatus: false,
    notifyComment: false,
    notifySubmission: false,
    project_id: projectId || '',
  });
  const [showRange, setShowRange] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeSelection[]>([
    {
      startDate: form.start_date ? new Date(form.start_date) : undefined,
      endDate: form.due_date ? new Date(form.due_date) : undefined,
      key: 'selection',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [users, setUsers] = useState<{ id: number; first_name: string; last_name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: number; project_title: string }[]>([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Read startDate and endDate from query params
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const startDate = params.get('startDate') || '';
    const endDate = params.get('endDate') || '';
    setForm(f => ({ ...f, start_date: startDate, due_date: endDate }));
    setDateRange([
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        key: 'selection',
      },
    ]);
  }, [location.search]);

  useEffect(() => {
    // Fetch users and projects using api instance
    api.get(`${API_BASE_URL}/api/projectmanagement/users/`)
      .then(res => {
        const data = res.data.data || res.data.users || res.data;
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => setUsers([]));
    if (!projectId) {
      api.get(`${API_BASE_URL}/api/projectmanagement/projects/`)
        .then(res => {
          const data = res.data.data || res.data.projects || res.data;
          setProjects(Array.isArray(data) ? data : []);
        })
        .catch(() => setProjects([]));
    }
  }, [projectId]);

  // Detailed form submit handler
  const handleDetailedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const data = mapDetailedToApi();
    const errors: { [key: string]: string } = {};
    if (!data.task_title) errors.task_title = 'Task Title is required';
    if (!data.project_id) errors.project_id = 'Project is required';
    if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        showToast({ type: 'error', title: 'Validation Error', message: 'Please fill all required fields.' });
        return;
    }
    setLoading(true);
    try {
        // Only send keys with data
        let payload = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== '' && v !== undefined && v !== null));
        await api.post(`${API_BASE_URL}/api/projectmanagement/tasks/`, payload);
        showToast({ type: 'success', title: 'Success', message: 'Task created successfully!' });
        navigate(-1);
    } catch (err: any) {
        showToast({ type: 'error', title: 'Error', message: err.message || 'Error occurred' });
    } finally {
        setLoading(false);
    }
  };

  // Quick Create submit handler
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    // Validation
    const errors: { [key: string]: string } = {};
    if (!quickForm.title) errors.title = 'Task Title is required';
    if (!quickForm.assignee) errors.assignee = 'Assignee is required';
    if (!quickForm.project_id) errors.project_id = 'Project is required';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast({ type: 'error', title: 'Validation Error', message: 'Please fill all required fields.' });
      return;
    }
    setLoading(true);
    try {
      let payload: any = {
        project_id: projectId ? Number(projectId) : quickForm.project_id ? Number(quickForm.project_id) : undefined,
        task_title: quickForm.title,
        assignees: quickForm.assignee,
      };
      payload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== '' && v !== undefined && v !== null));
      await api.post(`${API_BASE_URL}/api/projectmanagement/tasks/`, payload);
      showToast({ type: 'success', title: 'Success', message: 'Task created successfully!' });
      if(projectId || quickForm.project_id){
        navigate(`/projects/${projectId || quickForm.project_id}/tasks`);
      }
      else{
        navigate(`/projects`);
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: err.message || 'Error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    formType: 'quick' | 'detailed'
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;

    if (formType === 'quick') {
      setQuickForm(prev => ({
        ...prev,
        [name]: isCheckbox ? checked : value,
      }));
    } else {
      // console.log('Detailed form change:', { name, value, type, isCheckbox, checked });
      setForm(prev => {
        const newState = {
          ...prev,
          [name]: isCheckbox ? checked : value,
        };
        // console.log('New detailed form state:', newState);
        return newState;
      });
    }

    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Map detailed form to API payload
  function mapDetailedToApi() {
    return {
      project_id: projectId ? Number(projectId) : form.project_id ? Number(form.project_id) : undefined,
      task_title: form.title,
      assignees: form.assignee,
      start_date: form.start_date,
      due_date: form.due_date,
      estimated: form.estimated,
      description: form.description,
      priority: form.priority,
      status: form.status,
      reviewer: form.reviewer,
      start_after: form.startAfter,
      blocked_by: form.blockedBy,
      override_notifications: form.overrideNotifications,
      notify_status: form.notifyStatus,
      notify_comment: form.notifyComment,
      notify_submission: form.notifySubmission,
    };
  }

  return (
    <div className="p-4">
      {/* Breadcrumb */}
      <div className="text-[15px] text-black mb-2">
        Dashboard / Project Management / Create Task
      </div>
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`pr-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150 ${tab === 'quick' ? 'border-orange-500 text-black' : 'border-transparent text-gray-500'}`}
          onClick={() => setTab('quick')}
        >
          Quick Create
        </button>
        <button
          className={`pr-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150 ${tab === 'detailed' ? 'border-orange-500 text-black' : 'border-transparent text-gray-500'}`}
          onClick={() => setTab('detailed')}
        >
          Detailed Create
        </button>
      </div>
      {/* Tab Content */}
      {tab === 'quick' && (
        <form className="space-y-6 md:w-[50%]" onSubmit={handleQuickSubmit}>
          {!projectId && (
            <div>
              <label className="block mb-2 font-medium">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                name="project_id"
                className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none"
                value={quickForm.project_id || ''}
                onChange={(e) => handleChange(e, 'quick')}
              >
                <option value="">Select project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.project_title}</option>
                ))}
              </select>
              {fieldErrors.project_id && <div className="text-red-500 text-sm mt-1">{fieldErrors.project_id}</div>}
            </div>
          )}
          <div>
            <label className="block mb-2 font-medium">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black placeholder:text-gray-500 outline-none"
              placeholder="Enter task title"
              value={quickForm.title}
              onChange={(e) => handleChange(e, 'quick')}
            />
            {fieldErrors.title && <div className="text-red-500 text-sm mt-1">{fieldErrors.title}</div>}
          </div>
          <div>
            <label className="block mb-2 font-medium">
              Assignee <span className="text-red-500">*</span>
            </label>
            <select
              name="assignee"
              className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none"
              value={quickForm.assignee}
              onChange={(e) => handleChange(e, 'quick')}
            >
              <option value="">Select assignee</option>
              {users.map(user => {
                const fullName = `${user.first_name} ${user.last_name}`.trim();
                return (
                  <option key={user.id} value={user.id}>{fullName}</option>
                );
              })}
            </select>
            {fieldErrors.assignee && <div className="text-red-500 text-sm mt-1">{fieldErrors.assignee}</div>}
          </div>
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              className="bg-gray-300 text-black font-semibold rounded px-6 py-2 hover:bg-gray-400"
              onClick={() => {
                if (projectId || quickForm.project_id) {
                  navigate(`/projects/${projectId || quickForm.project_id}/tasks`);
                } else {
                  navigate('/projects');
                }
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button className="bg-orange-500 text-white font-semibold rounded px-6 py-2 hover:bg-orange-600" type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Add Task'}
            </button>
          </div>
        </form>
      )}
      {tab === 'detailed' && (
        <form className="space-y-8" onSubmit={handleDetailedSubmit}>
          {/* Basic Information */}
          <div>
            <div className="font-bold text-[17px] mb-4">Basic Information</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {!projectId && (
                <div>
                  <label className="block mb-2 font-medium text-[15px]">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="project_id"
                    className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none text-[15px]"
                    value={form.project_id || ''}
                    onChange={(e) => handleChange(e, 'detailed')}
                  >
                    <option value="">Select project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.project_title}</option>
                    ))}
                  </select>
                  {fieldErrors.project_id && <div className="text-red-500 text-sm mt-1">{fieldErrors.project_id}</div>}
                </div>
              )}
              <div>
                <label className="block mb-2 font-medium text-[15px]">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black placeholder:text-gray-500 outline-none text-[15px]"
                  placeholder="Enter task title"
                  value={form.title}
                  onChange={(e) => handleChange(e, 'detailed')}
                />
                {fieldErrors.title && <div className="text-red-500 text-sm mt-1">{fieldErrors.title}</div>}
              </div>
              <div>
                <label className="block mb-2 font-medium text-[15px]">
                  Assignees <span className="text-red-500">*</span>
                </label>
                <select
                  name="assignee"
                  className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none text-[15px]"
                  value={form.assignee}
                  onChange={(e) => handleChange(e, 'detailed')}
                >
                  <option value="">Select assignee</option>
                  {users.map(user => {
                    const fullName = `${user.first_name} ${user.last_name}`.trim();
                    return (
                      <option key={user.id} value={user.id}>{fullName}</option>
                    );
                  })}
                </select>
                {fieldErrors.assignee && <div className="text-red-500 text-sm mt-1">{fieldErrors.assignee}</div>}
              </div>
              <div className="">
                <label className="block mb-2 font-medium text-[15px]">Date</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black placeholder:text-gray-500 outline-none text-[15px] cursor-pointer"
                    placeholder="Start date - Due date"
                    value={
                      form.start_date && form.due_date
                        ? `${format(new Date(form.start_date), 'yyyy-MM-dd')} → ${format(new Date(form.due_date), 'yyyy-MM-dd')}`
                        : ''
                    }
                    onClick={() => setShowRange(true)}
                  />
                </div>
                {showRange && (
                  <div className="absolute z-50 mt-2">
                    <DateRange
                      editableDateInputs={true}
                      onChange={(ranges: any) => {
                        const selection = ranges.selection as DateRangeSelection;
                        setDateRange([selection]);
                        setForm(f => ({
                          ...f,
                          start_date: selection.startDate ? format(selection.startDate, 'yyyy-MM-dd') : '',
                          due_date: selection.endDate ? format(selection.endDate, 'yyyy-MM-dd') : '',
                        }));
                      }}
                      moveRangeOnFirstSelection={false}
                      ranges={dateRange}
                      onRangeFocusChange={() => {}}
                      showMonthAndYearPickers={true}
                    />
                    <div className="flex justify-end mt-2">
                      <button type="button" className="px-4 py-2 rounded bg-orange-500 text-white" onClick={() => setShowRange(false)}>Done</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block mb-2 font-medium text-[15px]">Description</label>
              <textarea
                name="description"
                className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none text-[15px] min-h-[90px]"
                rows={4}
                placeholder=""
                value={form.description}
                onChange={(e) => handleChange(e, 'detailed')}
              />
              <div className="text-right text-xs text-gray-400 mt-1 font-semibold">Upload Files</div>
            </div>
          </div>
          {/* Schedule & Task Status */}
          <div>
            <div className="font-bold text-[17px] mb-4">Schedule & Task Status</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block mb-2 font-medium text-[15px]">Priority</label>
                <select
                  name="priority"
                  className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none text-[15px]"
                  value={form.priority}
                  onChange={(e) => handleChange(e, 'detailed')}
                >
                  <option value="">Select priority</option>
                  {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium text-[15px]">Status</label>
                <select
                  name="status"
                  className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none text-[15px]"
                  value={form.status}
                  onChange={(e) => handleChange(e, 'detailed')}
                >
                  <option value="">Select status</option>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium text-[15px]">Reviewer/Approver</label>
                <select
                  name="reviewer"
                  className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none text-[15px]"
                  value={form.reviewer}
                  onChange={(e) => handleChange(e, 'detailed')}
                >
                  <option value="">Select Reviewer/Approver</option>
                  {reviewers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          {/* Task Dependencies */}
          <div>
            <div className="font-bold text-[17px] mb-4">Task Dependencies</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block mb-2 font-medium text-[15px]">Start After</label>
                <input
                  name="startAfter"
                  className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none text-[15px]"
                  placeholder="Select Start After"
                  value={form.startAfter}
                  onChange={(e) => handleChange(e, 'detailed')}
                />
              </div>
              <div>
                <label className="block mb-2 font-medium text-[15px]">Blocked By</label>
                <input
                  name="blockedBy"
                  className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none text-[15px]"
                  placeholder="Select Blocked By"
                  value={form.blockedBy}
                  onChange={(e) => handleChange(e, 'detailed')}
                />
              </div>
            </div>
          </div>
          {/* Notification Control */}
          {false && (
          <div>
            <div className="font-bold text-[17px] mb-4">Notification Control</div>
            <div className="flex items-center bg-[#F3F3F3] rounded px-4 py-3 mb-2 justify-between">
              <span className="mr-2 font-medium text-[15px]">Override Notification Settings</span>
              <button
                type="button"
                className={`w-10 h-5 flex items-center rounded-full p-1 duration-300 ease-in-out ${form.overrideNotifications ? 'bg-orange-500' : 'bg-gray-300'}`}
                onClick={() => setForm(prev => ({ ...prev, overrideNotifications: !prev.overrideNotifications }))}
              >
                <span className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${form.overrideNotifications ? 'translate-x-5' : ''}`}></span>
              </button>
            </div>
            <div className="ml-2 space-y-2">
              <label className="flex items-center gap-2 text-[15px]">
                <input
                  type="checkbox"
                  name="notifyStatus"
                  className="accent-orange-500 w-4 h-4"
                  checked={form.notifyStatus}
                  onChange={(e) => handleChange(e, 'detailed')}
                />
                Notify on status change
              </label>
              <label className="flex items-center gap-2 text-[15px]">
                <input
                  type="checkbox"
                  name="notifyComment"
                  className="accent-orange-500 w-4 h-4"
                  checked={form.notifyComment}
                  onChange={(e) => handleChange(e, 'detailed')}
                />
                Notify on comment
              </label>
              <label className="flex items-center gap-2 text-[15px]">
                <input
                  type="checkbox"
                  name="notifySubmission"
                  className="accent-orange-500 w-4 h-4"
                  checked={form.notifySubmission}
                  onChange={(e) => handleChange(e, 'detailed')}
                />
                Notify reviewer on submission
              </label>
            </div>
          </div>
          )}
          {/* Activity & Edit History */}
          <div>
            <div className="font-bold text-[17px] mb-4">Activity & Edit History</div>
            <div className="bg-[#F3F3F3] rounded px-4 py-3 text-black text-sm">
              Created by Alex on July 20, 2024<br />
              Edited 'Status' from In Progress to Done
            </div>
          </div>
          {/* Actions */}
          <div className="flex justify-between items-center mt-4 gap-4">
            <button type="button" className="text-black font-semibold underline text-[15px]">Save as Draft</button>
            <div className="flex gap-4">
              <button
                type="button"
                className="bg-gray-300 text-black font-semibold rounded px-6 py-2 hover:bg-gray-400"
                onClick={() => {
                  if (projectId || form.project_id) {
                    navigate(`/projects/${projectId || form.project_id}/tasks`);
                  } else {
                    navigate('/projects');
                  }
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="bg-orange-500 text-white font-semibold rounded px-6 py-2 hover:bg-orange-600 text-[15px]" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default TasksCreate;
