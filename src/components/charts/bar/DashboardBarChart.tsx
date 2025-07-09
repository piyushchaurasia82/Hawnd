import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DashboardBarChartProps {
  tasks: any[];
  range?: 'Week' | 'Month' | 'Year';
}

const DashboardBarChart: React.FC<DashboardBarChartProps> = ({ tasks, range = 'Month' }) => {
  // Prepare data for each range
  let labels: string[] = [];
  let inProgressCounts: number[] = [];
  let todoCounts: number[] = [];
  let completedCounts: number[] = [];
  let createdCounts: number[] = [];

  if (range === 'Week') {
    // Last 7 days
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    labels = days.map(d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    inProgressCounts = Array(7).fill(0);
    todoCounts = Array(7).fill(0);
    completedCounts = Array(7).fill(0);
    createdCounts = Array(7).fill(0);
    tasks.forEach(task => {
      if (task.created_at && task.status) {
        const date = new Date(task.created_at);
        const status = (task.status || '').toLowerCase();
        days.forEach((d, i) => {
          if (date.toDateString() === d.toDateString()) {
            if (status === 'in progress') inProgressCounts[i]++;
            else if (status === 'todo' || status === 'to do') todoCounts[i]++;
            else if (status === 'done' || status === 'completed') completedCounts[i]++;
            createdCounts[i]++;
          }
        });
      }
    });
  } else if (range === 'Year') {
    // Group by year
    const yearsSet = new Set<number>();
    tasks.forEach(task => {
      if (task.created_at) {
        yearsSet.add(new Date(task.created_at).getFullYear());
      }
    });
    const years = Array.from(yearsSet).sort((a, b) => a - b);
    labels = years.map(y => y.toString());
    inProgressCounts = Array(years.length).fill(0);
    todoCounts = Array(years.length).fill(0);
    completedCounts = Array(years.length).fill(0);
    createdCounts = Array(years.length).fill(0);
    tasks.forEach(task => {
      if (task.created_at && task.status) {
        const year = new Date(task.created_at).getFullYear();
        const idx = years.indexOf(year);
        const status = (task.status || '').toLowerCase();
        if (idx !== -1) {
          if (status === 'in progress') inProgressCounts[idx]++;
          else if (status === 'todo' || status === 'to do') todoCounts[idx]++;
          else if (status === 'done' || status === 'completed') completedCounts[idx]++;
          createdCounts[idx]++;
        }
      }
    });
  } else {
    // Default: Month (current year, by month)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    labels = months;
    inProgressCounts = Array(12).fill(0);
    todoCounts = Array(12).fill(0);
    completedCounts = Array(12).fill(0);
    createdCounts = Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    tasks.forEach(task => {
      if (task.created_at && task.status) {
        const date = new Date(task.created_at);
        if (date.getFullYear() !== currentYear) return;
        const month = date.getMonth();
        const status = (task.status || '').toLowerCase();
        if (status === 'in progress') inProgressCounts[month]++;
        else if (status === 'todo' || status === 'to do') todoCounts[month]++;
        else if (status === 'done' || status === 'completed') completedCounts[month]++;
        createdCounts[month]++;
      }
    });
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'Task Created',
        backgroundColor: '#DC143C',
        data: createdCounts,
      },
      {
        label: 'Task In Progress',
        backgroundColor: '#FFA726',
        data: inProgressCounts,
      },
      {
        label: 'Task ToDo',
        backgroundColor: '#42A5F5',
        data: todoCounts,
      },
      {
        label: 'Task Completed',
        backgroundColor: '#66BB6A',
        data: completedCounts,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: false, text: 'Tasks Created vs Completed' },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Number of Tasks' } },
    },
  };

  return <Bar data={data} options={options} />;
};

export default DashboardBarChart; 