import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/button/Button';
import api from '../../services/api';
import { useCurrentUser } from '../../context/CurrentUserContext';

const AuditLogsList: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const logsPerPage = 10;
  const totalPages = Math.ceil(logs.length / logsPerPage);
  const paginatedLogs = logs.slice().reverse().slice((page - 1) * logsPerPage, page * logsPerPage);

  const { user: currentUser } = useCurrentUser();

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        // Load previous logs from localStorage
        const prevLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
        const [usersRes, userRolesRes, rolesRes] = await Promise.all([
          api.get('/api/projectmanagement/users/'),
          api.get('/api/projectmanagement/user_roles/'),
          api.get('/api/projectmanagement/roles/'),
        ]);
        const users = usersRes.data.data || usersRes.data;
        const userRoles = userRolesRes.data.data || userRolesRes.data.user_roles || userRolesRes.data;
        const roles = rolesRes.data.data || rolesRes.data.roles || rolesRes.data;
        const logsArr: any[] = [];
        users.forEach((user: any) => {
          const fullName = `${user.first_name} ${user.last_name}`.trim();
          const performerName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : 'System';
          // Only log 'User Created' if created_at is present and there is no update
          if (user.created_at && (!user.updated_at || user.updated_at === user.created_at)) {
            logsArr.push({
              timestamp: new Date(user.created_at).toLocaleString(),
              action: 'User Created',
              affectedUser: fullName,
              performer: performerName,
              description: `User account for ${fullName} was created.`
            });
          }
          // Only log 'User Edited' if updated_at is present and different from created_at
          if (user.updated_at && user.updated_at !== user.created_at) {
            logsArr.push({
              timestamp: new Date(user.updated_at).toLocaleString(),
              action: 'User Edited',
              affectedUser: fullName,
              performer: performerName,
              description: `User details for ${fullName} were updated.`
            });
            // Only log status change if is_active changed (simulate by always logging on update)
            const isActive = user.is_active === 'True' || user.is_active === 'true' || user.is_active === true;
            logsArr.push({
              timestamp: new Date(user.updated_at).toLocaleString(),
              action: isActive ? 'User Activated' : 'User Deactivated',
              affectedUser: fullName,
              performer: performerName,
              description: `User status set to ${isActive ? 'Active' : 'Inactive'}.`
            });
            // Only log role change if user has roles and the roles have changed (best effort)
            const assignedRoleIds = userRoles.filter((ur: any) => ur.user_id === user.id).map((ur: any) => ur.role_id);
            // Try to infer if roles changed: if updated_at !== created_at and roles are not empty, log only if roles changed in count (best effort)
            // Since we don't have previous roles, only log if roles are not empty and user.updated_at !== user.created_at and user.roles_updated_at === user.updated_at (if such a field exists)
            // Otherwise, do not log 'User Role Changed' on every update
            if (assignedRoleIds.length > 0 && user.roles_updated_at && user.roles_updated_at === user.updated_at) {
              const assignedRoles = roles.filter((r: any) => assignedRoleIds.includes(r.id)).map((r: any) => r.name);
              logsArr.push({
                timestamp: new Date(user.updated_at).toLocaleString(),
                action: 'User Role Changed',
                affectedUser: fullName,
                performer: performerName,
                description: `Roles assigned: ${assignedRoles.join(', ')}`
              });
            }
          }
        });
        // Merge previous logs and new logs, avoiding duplicates (by timestamp+action+user)
        const mergedLogs = [...prevLogs];
        logsArr.forEach(newLog => {
          const exists = mergedLogs.some(
            l => l.timestamp === newLog.timestamp && l.action === newLog.action && l.affectedUser === newLog.affectedUser
          );
          if (!exists) mergedLogs.push(newLog);
        });
        // Save merged logs to localStorage
        localStorage.setItem('auditLogs', JSON.stringify(mergedLogs));
        setLogs(mergedLogs);
        setUsers(users);
      } catch (e) {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-8">
      <nav className="text-sm text-black mb-4">
        Home / Users / <span className="font-semibold">Audit Logs</span>
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
                <tr key={idx} className="border-b last:border-b-0">
                  <td className="px-4 py-3 whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{log.action}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{log.affectedUser}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.performer === 'System' && currentUser
                      ? (() => {
                          const userObj = users.find((u: any) => String(u.id) === String(currentUser.id));
                          return userObj
                            ? `${userObj.first_name} ${userObj.last_name}`.trim()
                            : `${currentUser.firstName} ${currentUser.lastName}`.trim();
                        })()
                      : log.performer}
                  </td>
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