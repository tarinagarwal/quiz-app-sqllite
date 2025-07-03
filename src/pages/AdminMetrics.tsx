import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import {
  ArrowLeft,
  TrendingUp,
  Users,
  BookOpen,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Database,
} from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SystemMetric {
  id: number;
  metric_date: string;
  total_users: number;
  total_quizzes: number;
  total_attempts: number;
  daily_attempts: number;
  average_score: number;
  created_at: string;
}

interface MetricsSummary {
  totalUsers: number;
  totalQuizzes: number;
  totalAttempts: number;
  averageScore: number;
  todayAttempts: number;
  weeklyGrowth: {
    users: number;
    attempts: number;
  };
}

const AdminMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState("30"); // days

  useEffect(() => {
    fetchMetrics();
    fetchSummary();
  }, [dateRange]);

  const fetchMetrics = async () => {
    try {
      const response = await api.get(`/admin/metrics?days=${dateRange}`);
      setMetrics(response.data);
    } catch (err) {
      setError("Failed to fetch metrics");
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get("/admin/metrics/summary");
      setSummary(response.data);
    } catch (err) {
      setError("Failed to fetch metrics summary");
    } finally {
      setLoading(false);
    }
  };

  const refreshMetrics = async () => {
    setLoading(true);
    await Promise.all([fetchMetrics(), fetchSummary()]);
    setLoading(false);
  };

  const exportMetrics = () => {
    const csvContent = [
      [
        "Date",
        "Total Users",
        "Total Quizzes",
        "Total Attempts",
        "Daily Attempts",
        "Average Score",
      ].join(","),
      ...metrics.map((metric) =>
        [
          metric.metric_date,
          metric.total_users,
          metric.total_quizzes,
          metric.total_attempts,
          metric.daily_attempts,
          metric.average_score.toFixed(2),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system_metrics_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Chart data preparation
  const chartData = {
    labels: metrics.map((m) => new Date(m.metric_date).toLocaleDateString()),
    datasets: [
      {
        label: "Total Users",
        data: metrics.map((m) => m.total_users),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
      {
        label: "Daily Attempts",
        data: metrics.map((m) => m.daily_attempts),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const scoreChartData = {
    labels: metrics.map((m) => new Date(m.metric_date).toLocaleDateString()),
    datasets: [
      {
        label: "Average Score (%)",
        data: metrics.map((m) => m.average_score),
        backgroundColor: "rgba(139, 92, 246, 0.8)",
        borderColor: "rgb(139, 92, 246)",
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Metrics</h1>
            <p className="text-lg text-gray-600">
              Monitor system performance and growth
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>

          <button
            onClick={refreshMetrics}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportMetrics}
            disabled={metrics.length === 0}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">
                Total Users
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {summary.totalUsers}
            </p>
            {summary.weeklyGrowth.users > 0 && (
              <p className="text-sm text-green-600 mt-1">
                +{summary.weeklyGrowth.users} this week
              </p>
            )}
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-2">
              <BookOpen className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium text-gray-600">
                Total Quizzes
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {summary.totalQuizzes}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">
                Total Attempts
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {summary.totalAttempts}
            </p>
            {summary.weeklyGrowth.attempts > 0 && (
              <p className="text-sm text-green-600 mt-1">
                +{summary.weeklyGrowth.attempts} this week
              </p>
            )}
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-2">
              <Activity className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">
                Today's Attempts
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {summary.todayAttempts}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-2">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
              <span className="text-sm font-medium text-gray-600">
                Avg Score
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {summary.averageScore}%
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center space-x-2 mb-4">
            <LineChart className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              User Growth & Activity
            </h3>
          </div>
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Average Score Trends
            </h3>
          </div>
          <div className="h-64">
            <Bar data={scoreChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Database className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Historical Metrics
            </h2>
          </div>
        </div>

        {metrics.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No metrics data available
            </h3>
            <p className="text-gray-600">
              Metrics will be collected automatically by the system jobs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Quizzes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Attempts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daily Attempts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.map((metric) => (
                  <tr key={metric.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(metric.metric_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.total_users}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.total_quizzes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.total_attempts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          metric.daily_attempts > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {metric.daily_attempts}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          metric.average_score >= 80
                            ? "bg-green-100 text-green-800"
                            : metric.average_score >= 60
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {metric.average_score.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMetrics;
