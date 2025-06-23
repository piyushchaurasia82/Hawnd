import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ExpenseVsCollection: React.FC = () => {
  const data = {
    labels: ['14-01-2025', '15-01-2025', '16-01-2025', '18-01-2025', '20-01-2025', '21-01-2025'],
    datasets: [
      {
        label: 'Collection',
        data: [50000, 470000, 110000, 90000, 100000, 170000],
        borderColor: '#fbbf24', // Tailwind Yellow-400
        backgroundColor: '#fbbf24',
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Expense',
        data: [0, 0, 0, 0, 0, 0], // You can change as needed
        borderColor: '#ec4899', // Tailwind Pink-500
        backgroundColor: '#ec4899',
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: false,
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-blue-700">Expense V/S Collection</h2>
        <div className="flex gap-2">
          <select className="bg-blue-500 text-white px-3 py-1 rounded-md">
            <option>All Branches</option>
          </select>
          <select className="bg-blue-500 text-white px-3 py-1 rounded-md">
            <option>Month</option>
          </select>
          <input
            type="date"
            className="border px-3 py-1 rounded-md"
            placeholder="DD-MM-YYYY"
          />
        </div>
      </div>

      <div className="chart-container w-full p-2 sm:p-0 overflow-x-auto text-sm sm:text-base">
        <Line data={data} options={options} />
      </div>

      <div className="text-center mt-6">
        <p className="font-semibold">
          Fee Collection (): <span className="text-black font-normal">0</span>
        </p>
        <p className="font-semibold">
          Today's Collection: <span className="text-black font-normal">0</span>
        </p>
      </div>
    </div>
  );
};

export default ExpenseVsCollection;
