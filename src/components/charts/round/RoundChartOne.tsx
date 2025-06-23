import React from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts"; // ✅ Add this

interface RoundChartProps {
  title: string;
  value: number;
  max: number;
}

const RoundChart: React.FC<RoundChartProps> = ({ title, value, max }) => {
  const remaining = max - value;

  const options: ApexOptions = {
    chart: {
      type: "donut", // ✅ Now TypeScript knows it's a valid type
    },
    labels: ["Present", "Remaining"],
    legend: { show: false },
    stroke: { width: 0 },
    dataLabels: {
      enabled: false,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: {
            show: true,
            name: { show: false },
            value: {
              show: true,
              fontSize: "20px",
              fontWeight: 600,
              color: "#111",
              offsetY: 4,
              formatter: () => `${value}`,
            },
            total: {
              show: true,
            },
          },
        },
      },
    },
    tooltip: {
      style: {
        fontSize: "14px",
        // fontWeight: 500,
        // colors: ["#000000"], // Will not work for text color, use CSS
      },
      y: {
        formatter: (val: number) => `${val} days`,
      },
    },
    colors: ["#3b82f6", "#e5e7eb"],
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
      <h4 className="mb-2 font-medium text-gray-700 dark:text-gray-100">{title}</h4>
      <Chart options={options} series={[value, remaining]} type="donut" height={280} />
    </div>
  );
};

export default RoundChart;
