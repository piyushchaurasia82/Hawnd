import React, { useEffect, useState } from 'react';
import { FiEdit2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { format, parse } from 'date-fns';

interface TimeLog {
  id: number;
  task_name: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  total_hours: string;
  description: string;
}

function formatTime(timeStr: string | null | undefined) {
  if (!timeStr) return '';
  let parsed;
  try {
    // If it's an ISO string, parse as date
    parsed = new Date(timeStr);
    if (isNaN(parsed.getTime())) return timeStr;
    const formatted = format(parsed, 'hh:mm:aa').toUpperCase(); // e.g., 05:00:PM
    return formatted;
  } catch {
    return timeStr;
  }
}

const TimeLogsList: React.FC = () => {
  const navigate = useNavigate();
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/projectmanagement/time_logs/')
      .then(res => {
        setTimeLogs(res.data.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load time logs.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600 mb-2">
        Home / Time Logs / List Time Logs
      </div>
      {/* Title */}
      <h1 className="text-2xl font-bold mb-6">Time Logs</h1>
      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <button className="bg-[#F6F2ED] border border-[#E5E1DC] rounded px-4 py-2 text-sm flex items-center gap-2">
          Date Range <span className="ml-1">&#9662;</span>
        </button>
        <button className="bg-[#F6F2ED] border border-[#E5E1DC] rounded px-4 py-2 text-sm flex items-center gap-2">
          Search by Task or Description <span className="ml-1">&#9662;</span>
        </button>
      </div>
      {/* Table */}
      <div className="bg-white rounded shadow-sm">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left px-4 py-3 font-semibold">Task Name</th>
                <th className="text-left px-4 py-3 font-semibold">Start Date</th>
                <th className="text-left px-4 py-3 font-semibold">End Date</th>
                <th className="text-left px-4 py-3 font-semibold">Start Time</th>
                <th className="text-left px-4 py-3 font-semibold">End Time</th>
                <th className="text-left px-4 py-3 font-semibold">Total Hours</th>
                {/* <th className="text-left px-4 py-3 font-semibold">Description</th> */}
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {timeLogs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-[#F6F2ED]">
                  <td className="px-4 py-3">{log.task_name}</td>
                  <td className="px-4 py-3">{log.start_date ? format(new Date(log.start_date), 'dd-MM-yyyy') : ''}</td>
                  <td className="px-4 py-3">{log.end_date ? format(new Date(log.end_date), 'dd-MM-yyyy') : ''}</td>
                  <td className="px-4 py-3">{formatTime(log.start_time)}</td>
                  <td className="px-4 py-3">{formatTime(log.end_time)}</td>
                  <td className="px-4 py-3">{log.total_hours}</td>
                  {/* <td className="px-4 py-3">{log.description}</td> */}
                  <td className="px-4 py-3">
                    <button className="text-gray-700 hover:text-orange-500" onClick={() => navigate(`/time_logs/edit/${log.id}`)}>
                      <FiEdit2 />
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

export default TimeLogsList;
