import React, { useEffect, useState } from 'react';
import ExecutiveBarChart from '../components/charts/bar/ExecutiveBarChart';
import RoundChartOne from '../components/charts/round/RoundChartOne';
import TimelineChart from '../components/charts/TimelineChart';
import { getMonth, getYear, parseISO, isAfter, isBefore, differenceInCalendarDays } from 'date-fns';
import api from '../services/api';

interface Task {
  id: number;
  task_title: string;
  team?: string;
  start_date: string;
  due_date: string;
  status: string;
}

const ExecutiveReport: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [barData, setBarData] = useState<[number, number, number]>([0, 0, 0]);
  const [roundData, setRoundData] = useState<[number, number, number]>([0, 0, 0]);
  const [timelineTasks, setTimelineTasks] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
  const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [percentComplete, setPercentComplete] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [milestoneRiskCount, setMilestoneRiskCount] = useState(0);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/api/projectmanagement/projects/');
        const projectsData = res.data.data || res.data.projects || res.data;
        setProjects(projectsData || []);
      } catch {
        setProjects([]);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!selectedProject) {
      setBarData([0, 0, 0]);
      setRoundData([0, 0, 0]);
      setTimelineTasks([]);
      setPercentComplete(0);
      setOverdueCount(0);
      setMilestoneRiskCount(0);
      return;
    }
    const fetchTasks = async () => {
      try {
        const res = await api.get('/api/projectmanagement/tasks/');
        const tasks = res.data.data || res.data;
        let high = 0, medium = 0, low = 0;
        let inProgress = 0, todo = 0, completed = 0;
        const filteredTasks: Task[] = [];
        let totalTasks = 0;
        let completedTasks = 0;
        let overdue = 0;
        let milestoneRisk = 0;
        const today = new Date();
        tasks.forEach((task: any) => {
          if (String(task.project_id) === String(selectedProject)) {
            // Priority for bar chart
            const priority = (task.priority || '').toLowerCase();
            if (priority === 'high') high++;
            else if (priority === 'medium') medium++;
            else if (priority === 'low') low++;
            // Status for round chart
            const status = (task.status || '').toLowerCase();
            if (status === 'in progress') inProgress++;
            else if (status === 'todo' || status === 'to do') todo++;
            else if (status === 'completed' || status === 'done') completed++;
            // For timeline chart
            filteredTasks.push({
              id: task.id,
              task_title: task.task_title,
              team: '', // You can update this if you have team info
              start_date: task.start_date,
              due_date: task.due_date,
              status: task.status,
            });
            // For percent complete
            totalTasks++;
            if (status === 'completed' || status === 'done') completedTasks++;
            // For overdue (ToDo) tasks
            if (status === 'todo' || status === 'to do') overdue++;
            // For milestone risk: high priority, in progress, due date was 3 or more days before today (overdue by at least 3 days)
            if (
              priority === 'high' &&
              status === 'in progress' &&
              task.due_date &&
              differenceInCalendarDays(today, parseISO(task.due_date)) >= 3
            ) {
              milestoneRisk++;
            }
          }
        });
        setBarData([high, medium, low]);
        setRoundData([inProgress, todo, completed]);
        setTimelineTasks(filteredTasks);
        setPercentComplete(totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);
        setOverdueCount(overdue);
        setMilestoneRiskCount(milestoneRisk);
      } catch {
        setBarData([0, 0, 0]);
        setRoundData([0, 0, 0]);
        setTimelineTasks([]);
        setPercentComplete(0);
        setOverdueCount(0);
        setMilestoneRiskCount(0);
      }
    };
    fetchTasks();
  }, [selectedProject]);

  useEffect(() => {
    // When timelineTasks change, compute available months and years
    if (!timelineTasks.length) {
      setAvailableMonths([]);
      setAvailableYears([]);
      return;
    }
    const monthYearSet = new Set<string>();
    timelineTasks.forEach(task => {
      if (!task.start_date || !task.due_date) return;
      const start = parseISO(task.start_date);
      const end = parseISO(task.due_date);
      let d = new Date(start.getFullYear(), start.getMonth(), 1);
      const last = new Date(end.getFullYear(), end.getMonth(), 1);
      while (!isAfter(d, last)) {
        monthYearSet.add(`${d.getFullYear()}-${d.getMonth()}`);
        d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      }
    });
    const months: number[] = [];
    const years: number[] = [];
    monthYearSet.forEach(str => {
      const [y, m] = str.split('-').map(Number);
      if (!months.includes(m)) months.push(m);
      if (!years.includes(y)) years.push(y);
    });
    months.sort((a, b) => a - b);
    years.sort((a, b) => a - b);
    setAvailableMonths(months);
    setAvailableYears(years);
    // Adjust selected month/year if not available
    if (!months.includes(selectedMonth) && months.length) setSelectedMonth(months[0]);
    if (!years.includes(selectedYear) && years.length) setSelectedYear(years[0]);
  }, [timelineTasks]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 mb-2">Home / Reports / Executive Reports</div>
      {/* Title */}
      <h1 className="text-2xl font-bold mb-2">Executive Reports</h1>
      {/* Project Overview */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <h2 className="text-lg font-semibold">Project Overview</h2>
        <select
          className="border rounded px-3 py-2 text-sm"
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
        >
          <option value="">Select Project</option>
          {projects.map((project: any) => (
            <option key={project.id} value={project.id}>
              {project.project_title || project.name}
            </option>
          ))}
        </select>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">% Complete</div>
          <div className="text-2xl font-bold">{percentComplete}%</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">Overdue Tasks</div>
          <div className="text-2xl font-bold text-red-500">{overdueCount} <span className="text-xs font-normal text-gray-700">ToDo</span></div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">Milestone Risk</div>
          <div className="text-2xl font-bold text-yellow-600">{milestoneRiskCount} <span className="text-xs font-normal text-gray-700">At Risk</span></div>
        </div>
      </div>
      {/* Visual Charts */}
      <div className="mb-8">
        <h3 className="text-base font-semibold mb-3">Visual Charts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm min-h-[340px] flex items-center justify-center">
            <div className="w-full">
              {selectedProject && !barData.every(v => v === 0) && (
                <div className="font-medium mb-2">Task Priority Distribution</div>
              )}
              {selectedProject ? (
                barData.every(v => v === 0) ? (
                  <div className="flex items-center justify-center h-[240px] text-gray-400 text-lg font-semibold">This project does not contain any data.</div>
                ) : (
                  <ExecutiveBarChart data={barData} />
                )
              ) : (
                <div className="flex items-center justify-center h-[240px] text-gray-400 text-lg font-semibold">No project selected</div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm flex flex-col items-center min-h-[340px] justify-center w-full">
            <div className="w-full">
              {selectedProject && !roundData.every(v => v === 0) && (
                <div className="font-medium mb-2 mt-0 pt-0">Project Status Distribution</div>
              )}
              {selectedProject ? (
                roundData.every(v => v === 0) ? (
                  <div className="flex items-center justify-center h-[240px] text-gray-400 text-lg font-semibold">This project does not contain any data.</div>
                ) : (
                  <RoundChartOne data={roundData} key={selectedProject + '-' + roundData.join('-')} />
                )
              ) : (
                <div className="flex items-center justify-center h-[240px] text-gray-400 text-lg font-semibold">No project selected</div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Timeline Section */}
      <div className="mb-4">
        <div className="text-xl font-bold text-center mb-4 mt-8">Project Task Summary</div>
        {selectedProject ? (
          timelineTasks.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-lg font-semibold">This project does not contain any data.</div>
          ) : (
            <>
              <div className="flex items-center mb-2 gap-4">
                <div className="font-semibold">
                  {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>{new Date(0, m).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <TimelineChart tasks={timelineTasks} month={selectedMonth} year={selectedYear} />
            </>
          )
        ) : (
          <div className="flex items-center justify-center h-[200px] text-gray-400 text-lg font-semibold">No project is selected.</div>
        )}
      </div>
    </div>
  );
};

export default ExecutiveReport; 