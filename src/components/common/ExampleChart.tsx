import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import type { ChartOptions, ChartData } from 'chart.js';

// Register required chart components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ExampleChartProps {
  title?: string;
}

const ExampleChart: React.FC<ExampleChartProps> = ({ title = 'Monthly Sales' }) => {
  // Chart data with proper typing
  const data: ChartData<'bar'> = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Sales',
        data: [150, 200, 180, 220, 170],
        backgroundColor: 'rgba(75,192,192,0.6)',
        borderRadius: 6,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="chart-container w-full p-2 sm:p-0 overflow-x-auto text-sm sm:text-base">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default ExampleChart;
