import React, { useState } from 'react';
import { FiCalendar, FiClock } from 'react-icons/fi';

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

const TasksCreate: React.FC = () => {
  const [tab, setTab] = useState<'quick' | 'detailed'>('quick');
  const [quickForm, setQuickForm] = useState({
    title: '',
    assignee: '',
  });
  const [form, setForm] = useState({
    title: '',
    assignee: '',
    date: '',
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
  });

  return (
    <div className="p-4">
      {/* Breadcrumb */}
      <div className="text-[15px] text-black mb-2">
        Dashboard / Project Management / Create Task
      </div>
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150 ${tab === 'quick' ? 'border-orange-500 text-black' : 'border-transparent text-gray-500'}`}
          onClick={() => setTab('quick')}
        >
          Quick Create
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150 ${tab === 'detailed' ? 'border-orange-500 text-black' : 'border-transparent text-gray-500'}`}
          onClick={() => setTab('detailed')}
        >
          Detailed Create
        </button>
      </div>
      {/* Tab Content */}
      {tab === 'quick' && (
        <form className="space-y-6 md:w-[50%]">
          <div>
            <label className="block mb-2 font-medium">Task Title</label>
            <input
              className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black placeholder:text-gray-500 outline-none"
              placeholder="Enter task title"
              value={quickForm.title}
              onChange={e => setQuickForm({ ...quickForm, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">Assignee</label>
            <select
              className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none"
              value={quickForm.assignee}
              onChange={e => setQuickForm({ ...quickForm, assignee: e.target.value })}
            >
              <option value="">Select assignee</option>
              {assignees.map(a => (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>
          <button className="bg-orange-500 text-white font-semibold rounded px-6 py-2 mt-2 hover:bg-orange-600">Add Task</button>
        </form>
      )}
      {tab === 'detailed' && (
        <form className="space-y-8">
          {/* Basic Information */}
          <div>
            <div className="font-bold text-[17px] mb-4">Basic Information</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block mb-2 font-medium text-[15px]">Task Title</label>
                <input className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black placeholder:text-gray-500 outline-none text-[15px]" placeholder="Enter task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="block mb-2 font-medium text-[15px]">Assignees</label>
                <select className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none text-[15px]" value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })}>
                  <option value="">Select assignee</option>
                  {assignees.map(a => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium text-[15px]">Date</label>
                <div className="relative">
                  <input type="date" className="w-full bg-[#F3F3F3] rounded px-4 py-3 pr-10 text-black outline-none text-[15px]" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
              <div>
                <label className="block mb-2 font-medium text-[15px]">Estimated Time</label>
                <div className="relative">
                  <input type="text" className="w-full bg-[#F3F3F3] rounded px-4 py-3 pr-10 text-black outline-none text-[15px]" placeholder="Enter estimated time" value={form.estimated} onChange={e => setForm({ ...form, estimated: e.target.value })} />
                  <FiClock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>
            <div>
              <label className="block mb-2 font-medium text-[15px]">Description</label>
              <textarea className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none text-[15px] min-h-[90px]" rows={4} placeholder="" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <div className="text-right text-xs text-gray-400 mt-1 font-semibold">Upload Files</div>
            </div>
          </div>
          {/* Schedule & Task Status */}
          <div>
            <div className="font-bold text-[17px] mb-4">Schedule & Task Status</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block mb-2 font-medium text-[15px]">Priority</label>
                <select className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none text-[15px]" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="">Select priority</option>
                  {priorities.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium text-[15px]">Status</label>
                <select className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none text-[15px]" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="">Select status</option>
                  {statuses.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium text-[15px]">Reviewer/Approver</label>
                <select className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none text-[15px]" value={form.reviewer} onChange={e => setForm({ ...form, reviewer: e.target.value })}>
                  <option value="">Select Reviewer/Approver</option>
                  {reviewers.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
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
                <input className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none text-[15px]" placeholder="Select Start After" value={form.startAfter} onChange={e => setForm({ ...form, startAfter: e.target.value })} />
              </div>
              <div>
                <label className="block mb-2 font-medium text-[15px]">Blocked By</label>
                <input className="w-full bg-[#F3F3F3] rounded px-4 py-3 text-black outline-none text-[15px]" placeholder="Select Blocked By" value={form.blockedBy} onChange={e => setForm({ ...form, blockedBy: e.target.value })} />
              </div>
            </div>
          </div>
          {/* Notification Control */}
          <div>
            <div className="font-bold text-[17px] mb-4">Notification Control</div>
            <div className="flex items-center bg-[#F3F3F3] rounded px-4 py-3 mb-2 justify-between">
              <span className="mr-2 font-medium text-[15px]">Override Notification Settings</span>
              <button
                type="button"
                className={`w-10 h-5 flex items-center rounded-full p-1 duration-300 ease-in-out ${form.overrideNotifications ? 'bg-orange-500' : 'bg-gray-300'}`}
                onClick={() => setForm({ ...form, overrideNotifications: !form.overrideNotifications })}
              >
                <span className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${form.overrideNotifications ? 'translate-x-5' : ''}`}></span>
              </button>
            </div>
            <div className="ml-2 space-y-2">
              <label className="flex items-center gap-2 text-[15px]">
                <input type="checkbox" className="accent-orange-500 w-4 h-4" checked={form.notifyStatus} onChange={e => setForm({ ...form, notifyStatus: e.target.checked })} />
                Notify on status change
              </label>
              <label className="flex items-center gap-2 text-[15px]">
                <input type="checkbox" className="accent-orange-500 w-4 h-4" checked={form.notifyComment} onChange={e => setForm({ ...form, notifyComment: e.target.checked })} />
                Notify on comment
              </label>
              <label className="flex items-center gap-2 text-[15px]">
                <input type="checkbox" className="accent-orange-500 w-4 h-4" checked={form.notifySubmission} onChange={e => setForm({ ...form, notifySubmission: e.target.checked })} />
                Notify reviewer on submission
              </label>
            </div>
          </div>
          {/* Activity & Edit History */}
          <div>
            <div className="font-bold text-[17px] mb-4">Activity & Edit History</div>
            <div className="bg-[#F3F3F3] rounded px-4 py-3 text-black text-sm">
              Created by Alex on July 20, 2024<br />
              Edited 'Status' from In Progress to Done
            </div>
          </div>
          {/* Actions */}
          <div className="flex justify-between items-center mt-4">
            <button type="button" className="text-black font-semibold underline text-[15px]">Save as Draft</button>
            <button type="submit" className="bg-orange-500 text-white font-semibold rounded px-6 py-2 hover:bg-orange-600 text-[15px]">Submit</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TasksCreate;
