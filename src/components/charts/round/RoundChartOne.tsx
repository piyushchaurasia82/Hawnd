import React from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

interface RoundChartOneProps {
  data?: [number, number, number]; // [In Progress, Todo, Completed]
}

const RoundChartOne: React.FC<RoundChartOneProps> = ({ data = [0, 0, 0] }) => {
  const options: ApexOptions = {
    chart: {
      type: "donut" as const,
    },
    labels: ["In Progress", "Todo", "Completed"],
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
            show: false,
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
    colors: ["#FF9100", "#2176FF", "#1FAA59"],
  };
  return (
    <div className="flex flex-col items-center">
      <Chart options={options} series={data} type="donut" height={260} />
      <div className="flex justify-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-[#FF9100]"></span> In Progress: {data[0]}</div>
        <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-[#2176FF]"></span> Todo: {data[1]}</div>
        <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-[#1FAA59]"></span> Completed: {data[2]}</div>
      </div>
    </div>
  );
};

export default RoundChartOne;
