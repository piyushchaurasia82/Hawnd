import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../components/ui/table';

const AdminReports: React.FC = () => {
  // State for summary cards
  const [summary, setSummary] = useState({
    totalProjects: 0,
    avgCompletion: 0,
    avgOverdue: 0,
    milestones: 0,
  });
  // State for project health table
  const [projects, setProjects] = useState<any[]>([]);
  // State for filter and project selector
  const [filter, setFilter] = useState<'All' | 'Internal' | 'External'>('All');
  const [selectedProject, setSelectedProject] = useState('');
  // State for all tasks
  const [allTasks, setAllTasks] = useState<any[]>([]);

  useEffect(() => {
    // Fetch summary data
    const fetchSummary = async () => {
      try {
        // Example endpoints, adjust as needed
        const projectsRes = await api.get('/api/projectmanagement/projects/');
        const projectsData = projectsRes.data.data || projectsRes.data.projects || projectsRes.data;
        const totalProjects = projectsData.length;
        // Calculate summary stats from projects/tasks
        let totalCompletion = 0, totalOverdue = 0, totalMilestones = 0, totalTasks = 0;
        projectsData.forEach((project: any) => {
          totalCompletion += project.completion_rate || 0;
          totalOverdue += project.overdue_rate || 0;
          totalMilestones += project.milestones_achieved || 0;
          totalTasks++;
        });
        setSummary({
          totalProjects,
          avgCompletion: totalProjects ? Math.round(totalCompletion / totalProjects) : 0,
          avgOverdue: totalProjects ? Math.round(totalOverdue / totalProjects) : 0,
          milestones: totalMilestones,
        });
      } catch {
        setSummary({ totalProjects: 0, avgCompletion: 0, avgOverdue: 0, milestones: 0 });
      }
    };
    fetchSummary();
  }, []);

  useEffect(() => {
    // Fetch project health data
    const fetchProjects = async () => {
      try {
        const res = await api.get('/api/projectmanagement/projects/');
        let projectsData = res.data.data || res.data.projects || res.data;
        // Filter by type if needed
        if (filter !== 'All') {
          projectsData = projectsData.filter((p: any) => (p.type || p.internal_external) === filter);
        }
        setProjects(projectsData);
      } catch {
        setProjects([]);
      }
    };
    fetchProjects();
  }, [filter]);

  useEffect(() => {
    // Fetch all tasks for all projects
    const fetchTasks = async () => {
      try {
        const res = await api.get('/api/projectmanagement/tasks/');
        const tasksData = res.data.data || res.data.tasks || res.data;
        setAllTasks(tasksData);
      } catch {
        setAllTasks([]);
      }
    };
    fetchTasks();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 mb-2">Home / Reports / Admin Reports</div>
      {/* Title & Subtitle */}
      <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
      <div className="text-sm text-gray-600 mb-6">Here's a summary of your project health and completion across all active projects.</div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">Total Projects</div>
          <div className="text-2xl font-bold">{summary.totalProjects}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">Average Completion Rate</div>
          <div className="text-2xl font-bold">{summary.avgCompletion}%</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">Average Overdue Rate</div>
          <div className="text-2xl font-bold">{summary.avgOverdue}%</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">Milestones Achieved</div>
          <div className="text-2xl font-bold">{summary.milestones}</div>
        </div>
      </div>
      {/* Project Health Section */}
      <div className="mb-4">
        <div className="text-xl font-bold mb-4">Project Health</div>
        <div className="flex gap-2 mb-6">
          {['All', 'Internal', 'External'].map((type) => (
            <button
              key={type}
              className={`px-4 py-2 rounded-md font-semibold text-base transition border-none focus:outline-none focus:ring-2 focus:ring-orange-200 ${filter === type ? 'bg-gray-200 text-black' : 'bg-[#F6F5F3] text-gray-700'}`}
              onClick={() => setFilter(type as 'All' | 'Internal' | 'External')}
            >
              {type}
            </button>
          ))}
        </div>
        <div className="mb-6">
          <select
            className="bg-[#FCFAF7] border-0 rounded px-4 py-3 text-base w-full font-medium text-gray-800 focus:ring-2 focus:ring-orange-200"
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
          >
            <option value="">Select Project</option>
            {projects.map((project: any) => (
              <option key={project.id} value={project.id}>{project.project_title || project.name}</option>
            ))}
          </select>
        </div>
        {/* Project Health Table */}
        <div className="overflow-x-auto rounded-xl bg-white">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-b border-gray-200">
                <TableCell isHeader className="py-4 px-6 text-left text-base font-semibold text-gray-900">Project</TableCell>
                <TableCell isHeader className="py-4 px-6 text-left text-base font-semibold text-gray-900">Tasks</TableCell>
                <TableCell isHeader className="py-4 px-6 text-left text-base font-semibold text-gray-900">Completion</TableCell>
                <TableCell isHeader className="py-4 px-6 text-left text-base font-semibold text-gray-900">Overdue</TableCell>
                <TableCell isHeader className="py-4 px-6 text-left text-base font-semibold text-gray-900">ACR %</TableCell>
                <TableCell isHeader className="py-4 px-6 text-left text-base font-semibold text-gray-900">Milestones</TableCell>
                <TableCell isHeader className="py-4 px-6 text-left text-base font-semibold text-gray-900">Health</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100">
              {projects.map((project: any) => {
                const projectTasks = allTasks.filter((task: any) => String(task.project_id) === String(project.id));
                const completedTasks = projectTasks.filter((task: any) => {
                  const status = (task.status || '').toLowerCase();
                  return status === 'completed' || status === 'done';
                });
                const completionRate = projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;
                const overdueTasks = projectTasks.filter((task: any) => {
                  const status = (task.status || '').toLowerCase();
                  return status === 'todo' || status === 'to do';
                });
                return (
                  <TableRow key={project.id} className="bg-white">
                    <TableCell className="py-5 px-6 text-base font-medium text-gray-900 whitespace-nowrap">{project.project_title || project.name}</TableCell>
                    <TableCell className="py-5 px-6 text-base text-gray-900">{projectTasks.length}</TableCell>
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-28 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-1.5 bg-orange-500 rounded-full"
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-base font-semibold text-gray-900">{completionRate}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6 text-base text-gray-900">{overdueTasks.length}</TableCell>
                    <TableCell className="py-5 px-6 text-base text-gray-900">{project.acr || project.acr_percent || '—'}%</TableCell>
                    <TableCell className="py-5 px-6 text-base text-gray-900">{project.milestones_achieved || project.milestones || 0}</TableCell>
                    <TableCell className="py-5 px-6">
                      <span className={`px-5 py-2 rounded-full font-bold text-base ${project.health === 'At Risk' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'}`}>
                        {project.health || (project.completion_rate > 70 ? 'On Track' : 'At Risk')}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminReports; 