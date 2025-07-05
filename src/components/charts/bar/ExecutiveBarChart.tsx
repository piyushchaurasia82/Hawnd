import Chart from "react-apexcharts";

interface ExecutiveBarChartProps {
  data?: [number, number, number]; // [High, Medium, Low]
}

export default function ExecutiveBarChart({ data = [0, 0, 0] }: ExecutiveBarChartProps) {
  const options = {
    colors: ["#FF2D2D", "#FF9100", "#00c950"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: 'bar',
      height: 340,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "40%",
        borderRadius: 5,
        borderRadiusApplication: "end",
        distributed: true,
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '16px',
        fontWeight: 600,
      },
    },
    stroke: {
      show: false,
    },
    xaxis: {
      categories: ["High", "Medium", "Low"],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          fontSize: '16px',
          fontWeight: 500,
        },
      },
    },
    legend: {
      show: false,
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      labels: {
        style: {
          fontSize: '14px',
        },
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
  } as any;
  const series = [
    {
      name: "Tasks",
      data: data,
    },
  ];
  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <div id="executiveBarChart" className="min-w-[350px]">
        <Chart options={options} series={series} type="bar" height={340} />
      </div>
    </div>
  );
} 