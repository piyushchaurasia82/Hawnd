import React, { useEffect } from 'react';
import BarChartOne from './charts/bar/BarChartOne';
import { tokenManager } from '../services/api';
import { useNavigate } from 'react-router-dom';

const mockTeamPerformance = [
  { name: 'Jessica Wagner', role: 'UX/UI Designer', tasksCompleted: 32, tasksInProgress: 4, lastActive: 'Just now' },
  { name: 'Christina Bennett', role: 'Frontend Developer', tasksCompleted: 25, tasksInProgress: 3, lastActive: '2 hour ago' },
  { name: 'Liam Carter', role: 'Backend Developer', tasksCompleted: 19, tasksInProgress: 2, lastActive: '3 hour ago' },
  { name: 'John Parker', role: 'Project Manager', tasksCompleted: 12, tasksInProgress: 1, lastActive: '5 hour ago' },
  { name: 'Kara Pickler', role: 'Social Marketer', tasksCompleted: 26, tasksInProgress: 1, lastActive: '6 hour ago' },
];

const mockApprovalQueue = [
  { id: 'RQ0001', type: 'Expense Report', submitter: 'Dilan Carter', date: '2024-07-20', status: 'Pending', action: 'Approve/Reject' },
  { id: 'RQ0002', type: 'Travel Request', submitter: 'Christina Hardy', date: '2024-07-20', status: 'Pending', action: 'Approve/Reject' },
  { id: 'RQ0003', type: 'Purchase Order', submitter: 'Liam Harper', date: '2024-07-19', status: 'Approved', action: 'View' },
  { id: 'RQ0004', type: 'Contract Renewal', submitter: 'Kara Pickler', date: '2024-07-18', status: 'Pending', action: 'Approve/Reject' },
  { id: 'RQ0005', type: 'Contract Renewal', submitter: 'Kara Pickler', date: '2024-07-18', status: 'Pending', action: 'Approve/Reject' },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = tokenManager.getAccessToken();
    // Use the same isTokenExpired logic as in tokenManager
    function decodeJwt(token: string) {
      if (!token) return null;
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
      } catch (error) {
        return null;
      }
    }
    function isTokenExpired(token: string, thresholdMinutes: number = 0) {
      const decoded = decodeJwt(token);
      if (!decoded || !decoded.exp) return true;
      const expiryTime = decoded.exp * 1000;
      const currentTime = Date.now();
      return expiryTime <= currentTime;
    }
    if (!token || isTokenExpired(token, 0)) {
      tokenManager.clearTokens();
      navigate('/auth', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="p-8 bg-[#FAFAFA] min-h-screen">
      {/* Welcome Header */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700">Dashboard</h2>
        <h1 className="text-4xl font-bold mt-2 text-gray-900">
          Welcome back, <span className="text-orange-500">{tokenManager.getUsername() || 'User'}</span>
        </h1>
      </div>

      {/* Project Summary & Reminder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-semibold text-gray-800">Project Summary</span>
            <span className="flex-1 border-b-2 border-orange-400 ml-2"></span>
          </div>
          <BarChartOne />
          <div className="flex justify-between mt-4 text-sm font-medium">
            <div><span className="font-bold text-blue-600">192</span> Design Team</div>
            <div><span className="font-bold text-orange-600">137</span> Tech Team</div>
            <div><span className="font-bold text-red-600">240</span> Marketing Team</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-semibold text-gray-800">Reminder</span>
            <span className="flex-1 border-b-2 border-orange-400 ml-2"></span>
          </div>
          <ul className="text-sm space-y-2 mb-4">
            <li className="flex items-center gap-2"><span className="w-2 h-2 bg-orange-400 rounded-full"></span>Review documentation for new project</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 bg-orange-400 rounded-full"></span>Team presentation at 3:00 PM</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 bg-orange-400 rounded-full"></span>Update project status</li>
          </ul>
          <div className="mt-2 flex items-center">
            <input type="checkbox" id="reminder1" className="mr-2 accent-orange-500" />
            <label htmlFor="reminder1" className="text-xs text-gray-600">Show Overdue Tasks Only</label>
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base font-semibold text-gray-800">Team Performance</span>
          <span className="flex-1 border-b-2 border-orange-400 ml-2"></span>
          <span className="text-xs text-gray-400 ml-auto">Last 2 weeks</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-orange-50">
                <th className="py-2 px-4 font-semibold">Name</th>
                <th className="py-2 px-4 font-semibold">Role</th>
                <th className="py-2 px-4 font-semibold">Tasks Completed</th>
                <th className="py-2 px-4 font-semibold">Tasks In Progress</th>
                <th className="py-2 px-4 font-semibold">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {mockTeamPerformance.map((member, idx) => (
                <tr key={idx} className="border-t hover:bg-orange-50">
                  <td className="py-2 px-4 font-medium text-gray-800">{member.name}</td>
                  <td className="py-2 px-4 text-orange-600 font-semibold">{member.role}</td>
                  <td className="py-2 px-4">{member.tasksCompleted}</td>
                  <td className="py-2 px-4">{member.tasksInProgress}</td>
                  <td className="py-2 px-4">{member.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Requests Queue */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base font-semibold text-orange-600">Approval Requests Queue</span>
          <span className="flex-1 border-b-2 border-orange-400 ml-2"></span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-orange-50">
                <th className="py-2 px-4 font-semibold">Request ID</th>
                <th className="py-2 px-4 font-semibold">Request Type</th>
                <th className="py-2 px-4 font-semibold">Submitter</th>
                <th className="py-2 px-4 font-semibold">Submission Date</th>
                <th className="py-2 px-4 font-semibold">Status</th>
                <th className="py-2 px-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockApprovalQueue.map((req, idx) => (
                <tr key={idx} className="border-t hover:bg-orange-50">
                  <td className="py-2 px-4 font-medium text-gray-800">{req.id}</td>
                  <td className="py-2 px-4">{req.type}</td>
                  <td className="py-2 px-4">{req.submitter}</td>
                  <td className="py-2 px-4">{req.date}</td>
                  <td className="py-2 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${req.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>{req.status}</span>
                  </td>
                  <td className="py-2 px-4">
                    {req.action === 'Approve/Reject' ? (
                      <>
                        <button className="bg-green-500 text-white px-3 py-1 rounded mr-2 hover:bg-green-600 transition">Approve</button>
                        <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">Reject</button>
                      </>
                    ) : (
                      <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition">View</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 