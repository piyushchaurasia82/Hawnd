import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { format } from 'date-fns';
import { useToast } from '../../components/ui/alert/ToastContext';
import api from '../../services/api';
import MultiSelect from '../../components/form/MultiSelect';
import { useCurrentUser } from '../../context/CurrentUserContext';

const priorities = ['Low', 'Medium', 'High'];
const statuses = ['To Do', 'In Progress', 'Done'];

interface TaskEditForm {
  title: string;
  task_assignees: string[];
  start_date: string;
  due_date: string;
  estimated: string;
  description: string;
  priority: string;
  status: string;
  reviewer: string;
  startAfter: string;
  blockedBy: string;
  overrideNotifications: boolean;
  notifyStatus: boolean;
  notifyComment: boolean;
  notifySubmission: boolean;
  project_id: string;
}

const TasksEdit: React.FC = () => {
  const { id, projectId } = useParams<{ id: string; projectId: string }>();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { userRole } = useCurrentUser();

  const [form, setForm] = useState<TaskEditForm>({
    title: '',
    task_assignees: [],
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
  type DateRangeType = { startDate?: Date; endDate?: Date; key: string };
  const [dateRange, setDateRange] = useState<DateRangeType[]>([
    {
      startDate: undefined,
      endDate: undefined,
      key: 'selection',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [users, setUsers] = useState<{ id: number; first_name: string; last_name: string }[]>([]);
  const [projectOwner, setProjectOwner] = useState<string>('');

  useEffect(() => {
    // Fetch users
    api.get(`/api/projectmanagement/users/`)
      .then(res => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setUsers([]));

    // Fetch task data
    if (id) {
      api.get(`/api/projectmanagement/tasks/${id}/`)
        .then(res => {
          const taskData = res.data.data;
          setForm({
            title: taskData.task_title || '',
            task_assignees: Array.isArray(taskData.task_assignees)
              ? taskData.task_assignees
                  .map((u: any) =>
                    typeof u === 'object' && u !== null && u.user_id !== undefined
                      ? String(u.user_id)
                      : typeof u === 'string' || typeof u === 'number'
                        ? String(u)
                        : null
                  )
                  .filter(Boolean)
              : [],
            start_date: taskData.start_date ? format(new Date(taskData.start_date), 'yyyy-MM-dd') : '',
            due_date: taskData.due_date ? format(new Date(taskData.due_date), 'yyyy-MM-dd') : '',
            estimated: taskData.estimated_time !== undefined && taskData.estimated_time !== null ? String(taskData.estimated_time) : '',
            description: taskData.description || '',
            priority: taskData.priority || '',
            status: taskData.status || '',
            reviewer: taskData.reviewer_id ? String(taskData.reviewer_id) : '',
            startAfter: taskData.start_after_id ? String(taskData.start_after_id) : '',
            blockedBy: taskData.blocked_by ? String(taskData.blocked_by) : '',
            overrideNotifications: taskData.status_change_notification === 'YES',
            notifyStatus: taskData.status_change_notification === 'YES',
            notifyComment: taskData.on_comment_notification === 'YES',
            notifySubmission: taskData.reviewer_on_submission_notification === 'YES',
            project_id: taskData.project_id ? String(taskData.project_id) : '',
          });
          setDateRange([
            {
            startDate: taskData.start_date ? new Date(taskData.start_date) : undefined,
            endDate: taskData.due_date ? new Date(taskData.due_date) : undefined,
            key: 'selection',
            },
          ]);
          // Fetch project owner for the project
          const pid = taskData.project_id || projectId;
          if (pid) {
            api.get(`/api/projectmanagement/projects/${pid}/`).then(res2 => {
              const project = res2.data.data || res2.data;
              setProjectOwner(project.project_owner || project.owner || '');
            }).catch(() => setProjectOwner(''));
          }
        })
        .catch(() => {
          // handle error if needed
        });
    }
  }, [id, projectId, showToast]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;

    setForm(prev => ({
      ...prev,
      [name]: isCheckbox ? checked : value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const errors: { [key: string]: string } = {};
    if (!form.title) errors.title = 'Task Title is required';
    if (!form.task_assignees || form.task_assignees.length === 0) errors.task_assignees = 'At least one assignee is required';
    if (!form.project_id) errors.project_id = 'Project is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast({ type: 'error', title: 'Validation Error', message: 'Please fill all required fields.' });
      return;
    }

    setLoading(true);
    try {
      let payload: any = {
        project_id: projectId ? Number(projectId) : form.project_id ? Number(form.project_id) : undefined,
        task_title: form.title,
        assignees: form.task_assignees.map((id: string) => Number(id)),
        start_date: form.start_date ? new Date(form.start_date).toISOString() : undefined,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
        estimated_time: form.estimated ? parseFloat(form.estimated) : undefined,
        description: form.description,
        priority: form.priority,
        status: form.status,
        reviewer_id: form.reviewer ? Number(form.reviewer) : undefined,
        start_after_id: form.startAfter ? Number(form.startAfter) : undefined,
        blocked_by: form.blockedBy,
        status_change_notification: form.notifyStatus ? 'YES' : 'NO',
        on_comment_notification: form.notifyComment ? 'YES' : 'NO',
        reviewer_on_submission_notification: form.notifySubmission ? 'YES' : 'NO',
      };
      payload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== '' && v !== undefined && v !== null));
      
      await api.put(`/api/projectmanagement/tasks/${id}/`, payload);
      showToast({ type: 'success', title: 'Success', message: 'Task updated successfully!' });
      navigate(`/projects/${form.project_id}/tasks?updated=${Date.now()}`);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: err.message || 'Error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="text-[15px] text-black mb-2">
        <span className="cursor-pointer text-orange-600 hover:underline" onClick={() => navigate('/')}>Dashboard</span> /
        <span className="cursor-pointer text-orange-600 hover:underline" onClick={() => navigate('/projects')}> Project Management</span> /
        <span className="text-black"> Edit Task</span>
      </div>
      <div className="flex border-b mb-6">
        <button
          className="pr-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150 border-orange-500 text-black"
        >
          Edit Task
        </button>
      </div>
      <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div>
            <div className="font-bold text-[17px] mb-4">Basic Information</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block mb-2 font-medium text-[15px]">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black placeholder:text-gray-500 outline-none text-[15px]"
                  placeholder="Enter task title"
                  value={form.title}
                  onChange={handleChange}
                />
                {fieldErrors.title && <div className="text-red-500 text-sm mt-1">{fieldErrors.title}</div>}
              </div>
              <div>
                <label className="block mb-2 font-medium text-[15px]">
                  Assignees <span className="text-red-500">*</span>
                </label>
                <MultiSelect
                  label=""
                  options={users.map(user => ({ value: String(user.id), text: `${user.first_name} ${user.last_name}`.trim() }))}
                  value={form.task_assignees.filter(Boolean)}
                  onChange={selected => setForm(prev => ({ ...prev, task_assignees: selected }))}
                  disabled={!!(userRole && userRole.trim().toLowerCase().includes('developer'))}
                />
                {fieldErrors.task_assignees && <div className="text-red-500 text-sm mt-1">{fieldErrors.task_assignees}</div>}
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
                      onChange={(item: { selection: DateRangeType }) => {
                        const newRange = item.selection;
                        setDateRange([newRange]);
                        setForm(f => ({
                          ...f,
                          start_date: newRange.startDate ? format(newRange.startDate, 'yyyy-MM-dd') : '',
                          due_date: newRange.endDate ? format(newRange.endDate, 'yyyy-MM-dd') : '',
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
                onChange={handleChange}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                  value={projectOwner}
                  disabled={!!(userRole && userRole.trim().toLowerCase().includes('developer'))}
                >
                  <option value="">{projectOwner ? projectOwner : 'No owner found'}</option>
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
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block mb-2 font-medium text-[15px]">Blocked By</label>
                <input
                  name="blockedBy"
                  className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none text-[15px]"
                  placeholder="Select Blocked By"
                  value={form.blockedBy}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          {/* Notification Control */}
          {/*
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
                  onChange={handleChange}
                />
                Notify on status change
              </label>
              <label className="flex items-center gap-2 text-[15px]">
                <input
                  type="checkbox"
                  name="notifyComment"
                  className="accent-orange-500 w-4 h-4"
                  checked={form.notifyComment}
                  onChange={handleChange}
                />
                Notify on comment
              </label>
              <label className="flex items-center gap-2 text-[15px]">
                <input
                  type="checkbox"
                  name="notifySubmission"
                  className="accent-orange-500 w-4 h-4"
                  checked={form.notifySubmission}
                  onChange={handleChange}
                />
                Notify on submission
              </label>
            </div>
          </div>
          */}
          {/* Actions */}
          <div className="flex justify-end items-center mt-4 gap-2">
            <button type="submit" className="bg-orange-500 text-white font-semibold rounded px-6 py-2 hover:bg-orange-600 text-[15px]" disabled={loading}>
              {loading ? 'Updating...' : 'Update Task'}
            </button>
            <button type="button" className="bg-gray-300 text-black font-semibold rounded px-6 py-2 hover:bg-gray-400 text-[15px]" onClick={() => navigate(`/projects/${form.project_id}/tasks`)}>
              Cancel
            </button>
          </div>
        </form>
    </div>
  );
};

export default TasksEdit;