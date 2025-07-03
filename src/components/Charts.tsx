import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface ScoreDistributionChartProps {
  data: { range: string; count: number }[];
}

export const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({
  data,
}) => {
  const chartData = {
    labels: data.map((item) => item.range),
    datasets: [
      {
        label: "Number of Students",
        data: data.map((item) => item.count),
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)", // Red for 0-40%
          "rgba(245, 158, 11, 0.8)", // Orange for 41-60%
          "rgba(59, 130, 246, 0.8)", // Blue for 61-80%
          "rgba(16, 185, 129, 0.8)", // Green for 81-100%
        ],
        borderColor: [
          "rgba(239, 68, 68, 1)",
          "rgba(245, 158, 11, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(16, 185, 129, 1)",
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Score Distribution",
        font: {
          size: 16,
          weight: "bold" as const,
        },
        color: "#1F2937",
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: "#6B7280",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#6B7280",
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
};

interface QuizPerformanceChartProps {
  data: { quiz: string; avgScore: number; attempts: number }[];
}

export const QuizPerformanceChart: React.FC<QuizPerformanceChartProps> = ({
  data,
}) => {
  const chartData = {
    labels: data.map((item) =>
      item.quiz.length > 20 ? item.quiz.substring(0, 20) + "..." : item.quiz
    ),
    datasets: [
      {
        label: "Average Score (%)",
        data: data.map((item) => item.avgScore),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Quiz Performance Overview",
        font: {
          size: 16,
          weight: "bold" as const,
        },
        color: "#1F2937",
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          afterBody: function (context: any) {
            const index = context[0].dataIndex;
            return `Attempts: ${data[index].attempts}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: "#6B7280",
          callback: function (value: any) {
            return value + "%";
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#6B7280",
          maxRotation: 45,
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
};

interface UserProgressChartProps {
  data: { date: string; score: number; quiz: string }[];
}

export const UserProgressChart: React.FC<UserProgressChartProps> = ({
  data,
}) => {
  const chartData = {
    labels: data.map((item) => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: "Score (%)",
        data: data.map((item) => item.score),
        borderColor: "rgba(16, 185, 129, 1)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgba(16, 185, 129, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Your Progress Over Time",
        font: {
          size: 16,
          weight: "bold" as const,
        },
        color: "#1F2937",
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          afterBody: function (context: any) {
            const index = context[0].dataIndex;
            return `Quiz: ${data[index].quiz}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: "#6B7280",
          callback: function (value: any) {
            return value + "%";
          },
        },
      },
      x: {
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: "#6B7280",
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
};

interface GradeDistributionChartProps {
  data: { grade: string; count: number; color: string }[];
}

export const GradeDistributionChart: React.FC<GradeDistributionChartProps> = ({
  data,
}) => {
  const chartData = {
    labels: data.map((item) => `Grade ${item.grade}`),
    datasets: [
      {
        data: data.map((item) => item.count),
        backgroundColor: data.map((item) => item.color),
        borderColor: data.map((item) => item.color.replace("0.8", "1")),
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
          color: "#6B7280",
        },
      },
      title: {
        display: true,
        text: "Grade Distribution",
        font: {
          size: 16,
          weight: "bold" as const,
        },
        color: "#1F2937",
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function (context: any) {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
    cutout: "50%",
  };

  return (
    <div className="h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};
