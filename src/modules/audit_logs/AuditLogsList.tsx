import React, { useState } from 'react';
import Button from '../../components/ui/button/Button';

const mockLogs = [
  { timestamp: '2024-01-15 10:00 AM', action: 'User Created', affectedUser: 'Emily Carter', performer: 'System', description: 'User account created' },
  { timestamp: '2024-01-15 10:30 AM', action: 'User Role Changed', affectedUser: 'Emily Carter', performer: 'Admin User', description: 'Role changed to Project Manager' },
  { timestamp: '2024-01-16 02:00 PM', action: 'User Edited', affectedUser: 'David Lee', performer: 'Admin User', description: 'User details updated' },
  { timestamp: '2024-01-17 09:00 AM', action: 'User Deactivated', affectedUser: 'Sarah Johnson', performer: 'Admin User', description: 'User account deactivated' },
  { timestamp: '2024-01-18 11:00 AM', action: 'User Created', affectedUser: 'Michael Brown', performer: 'System', description: 'User account created' },
  { timestamp: '2024-01-18 11:30 AM', action: 'User Role Changed', affectedUser: 'Michael Brown', performer: 'Admin User', description: 'Role changed to Team Member' },
  { timestamp: '2024-01-19 03:00 PM', action: 'User Edited', affectedUser: 'Olivia Wilson', performer: 'Admin User', description: 'User details updated' },
  { timestamp: '2024-01-20 08:00 AM', action: 'User Reactivated', affectedUser: 'Sarah Johnson', performer: 'Admin User', description: 'User account reactivated' },
  { timestamp: '2024-01-21 12:00 PM', action: 'User Created', affectedUser: 'Ethan Davis', performer: 'System', description: 'User account created' },
  { timestamp: '2024-01-21 12:30 PM', action: 'User Role Changed', affectedUser: 'Ethan Davis', performer: 'Admin User', description: 'Role changed to Project Manager' },
];

const AuditLogsList: React.FC = () => {
  const [page, setPage] = useState(1);
  const totalPages = 10;

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
            {mockLogs.map((log, idx) => (
              <tr key={idx} className="border-b last:border-b-0">
                <td className="px-4 py-3 whitespace-nowrap">{log.timestamp}</td>
                <td className="px-4 py-3 whitespace-nowrap">{log.action}</td>
                <td className="px-4 py-3 whitespace-nowrap">{log.affectedUser}</td>
                <td className="px-4 py-3 whitespace-nowrap">{log.performer}</td>
                <td className="px-4 py-3">{log.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-center gap-2 mt-8">
        <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-2 py-1 text-lg disabled:text-gray-300">{'<'}</button>
        <span className="px-2 py-1 rounded-full bg-gray-100 font-semibold">{page}</span>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-2 py-1 text-lg disabled:text-gray-300">{'>'}</button>
        <span className="ml-2 text-gray-500">... {totalPages}</span>
      </div>
    </div>
  );
};

export default AuditLogsList; 