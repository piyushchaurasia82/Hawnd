import React, { useState } from 'react';
import { format, parseISO, isWithinInterval, eachDayOfInterval, getDate, getMonth, getYear, isAfter, isBefore } from 'date-fns';

interface Task {
  id: number;
  task_title: string;
  team?: string;
  start_date: string;
  due_date: string;
  status: string;
}

interface TimelineChartProps {
  tasks: Task[];
  month: number; // 0-based (0=Jan)
  year: number;
}

const statusColor = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'to do' || s === 'todo') return 'bg-blue-500';
  if (s === 'in progress') return 'bg-orange-400';
  if (s === 'done' || s === 'completed') return 'bg-green-500';
  return 'bg-gray-300';
};

const TimelineChart: React.FC<TimelineChartProps> = ({ tasks, month, year }) => {
  // Get all days in the month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = eachDayOfInterval({ start: firstDay, end: lastDay });

  // Filter tasks that overlap with the month
  const filteredTasks = tasks.filter(task => {
    if (!task.start_date || !task.due_date) return false;
    const start = parseISO(task.start_date);
    const end = parseISO(task.due_date);
    // Overlaps if start <= lastDay && end >= firstDay
    return !isAfter(start, lastDay) && !isBefore(end, firstDay);
  });

  const minHeight = Math.max(filteredTasks.length * 48, 200); // 48px per row, at least 200px

  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  return (
    <div className="overflow-x-auto" style={{ minHeight: minHeight, position: 'relative' }}>
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-orange-50">
            <th className="text-left font-medium pb-2 px-2">Project</th>
            {days.map(day => (
              <th key={day.toISOString()} className="text-center font-medium pb-2 px-2 text-orange-600">
                {getDate(day)} {format(day, 'EEE')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map(task => {
            const start = parseISO(task.start_date);
            const end = parseISO(task.due_date);
            // Clamp to month
            const barStart = isBefore(start, firstDay) ? firstDay : start;
            const barEnd = isAfter(end, lastDay) ? lastDay : end;
            const startIdx = days.findIndex(d => getDate(d) === getDate(barStart) && getMonth(d) === getMonth(barStart));
            const endIdx = days.findIndex(d => getDate(d) === getDate(barEnd) && getMonth(d) === getMonth(barEnd));
            const startStr = format(start, 'dd MMM yyyy');
            const endStr = format(end, 'dd MMM yyyy');
            return (
              <tr key={task.id}>
                <td className="py-4 font-medium px-2 whitespace-nowrap">
                  {task.task_title}<br />
                  <span className="text-gray-400 text-xs">{task.team || ''}</span>
                </td>
                {days.map((day, idx) => {
                  if (idx === startIdx) {
                    return (
                      <td
                        key={idx}
                        colSpan={endIdx - startIdx + 1}
                        className={
                          `${statusColor(task.status)} text-white rounded-l-full rounded-r-full text-center align-middle py-4 border-2 border-white relative cursor-pointer transition-all duration-150` +
                          (hoveredTaskId === task.id ? ' bg-opacity-70 ring-2 ring-white' : '')
                        }
                        onMouseEnter={e => {
                          setHoveredTaskId(task.id);
                        }}
                        onMouseLeave={() => setHoveredTaskId(null)}
                        onMouseMove={e => {
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                        }}
                      >
                        &nbsp;
                        {hoveredTaskId === task.id && (
                          <span
                            className="pointer-events-none absolute z-20 bg-black/60 backdrop-blur text-white text-xs rounded px-3 py-1 whitespace-nowrap shadow-lg transition-opacity duration-200 opacity-100 animate-fade-in"
                            style={{ left: mousePos.x, top: mousePos.y - 16 }}
                          >
                            Start: {startStr}<br />Due: {endStr}
                          </span>
                        )}
                      </td>
                    );
                  }
                  if (idx > startIdx && idx <= endIdx) return null;
                  return <td key={idx} className="py-4"></td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TimelineChart; 