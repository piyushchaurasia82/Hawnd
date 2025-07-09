import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/button/Button';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const formatTimestamp = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const AuditLogsList: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const logsPerPage = 10;
  const totalPages = Math.ceil(logs.length / logsPerPage);
  const paginatedLogs = logs.slice((page - 1) * logsPerPage, page * logsPerPage);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [logsRes, usersRes] = await Promise.all([
          api.get('/api/projectmanagement/audit-logs/'),
          api.get('/api/projectmanagement/users/'),
        ]);
        const logsData = logsRes.data.data || [];
        const usersData = usersRes.data.data || usersRes.data || [];
        setLogs(logsData);
        setUsers(usersData);
      } catch (e) {
        setLogs([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper to get user name by ID
  const getUserName = (id: string | number, fallback?: string) => {
    if (!id) return '';
    const user = users.find((u: any) => String(u.id) === String(id));
    if (user) return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.email || String(id);
    return fallback || String(id);
  };

  return (
    <div className="p-8">
      <nav className="text-[16px] text-black mb-4 flex items-center gap-1">
        <span className="hover:underline cursor-pointer text-orange-500" onClick={() => navigate('/')}>Dashboard</span>
        <span className="mx-1">/</span>
        <span className="font-semibold">Audit Logs</span>
      </nav>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <Button
          variant="primary"
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded shadow"
          onClick={() => { /* TODO: implement export */ }}
        >
          Export Logs
        </Button>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left font-medium">Timestamp</th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
              <th className="px-4 py-3 text-left font-medium">Affected User</th>
              <th className="px-4 py-3 text-left font-medium">Performer</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
            ) : paginatedLogs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8">No audit logs found.</td></tr>
            ) : (
              paginatedLogs.map((log, idx) => (
                <tr key={log.id || idx} className="border-b last:border-b-0">
                  <td className="px-4 py-3 whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{log.action}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{log.affected_user_name && log.affected_user_name !== log.affected_user ? log.affected_user_name : getUserName(log.affected_user)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{log.performer_name && log.performer_name !== log.performer ? log.performer_name : getUserName(log.performer)}</td>
                  <td className="px-4 py-3">{log.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-2 py-1 text-lg disabled:text-gray-300">{'<'}</button>
          <span className="px-2 py-1 rounded-full bg-gray-100 font-semibold">{page}</span>
          <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-2 py-1 text-lg disabled:text-gray-300">{'>'}</button>
          <span className="ml-2 text-gray-500">... {totalPages}</span>
          {/* Jump to page input */}
          <span className="ml-4 text-gray-700">Jump to page:</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={page}
            onChange={e => {
              let val = parseInt(e.target.value, 10);
              if (isNaN(val)) val = 1;
              if (val < 1) val = 1;
              if (val > totalPages) val = totalPages;
              setPage(val);
            }}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-center ml-2"
          />
        </div>
      )}
    </div>
  );
};

export default AuditLogsList; 