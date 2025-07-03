import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import {
  ArrowLeft,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Trash2,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Server,
  Database,
  Mail,
  BarChart3,
  Settings,
} from "lucide-react";
import SearchFilters from "../components/SearchFilters";
import { useSearch } from "../hooks/useSearch";

interface JobLog {
  id: number;
  job_name: string;
  status: string;
  details: string;
  executed_at: string;
}

interface JobInfo {
  name: string;
  displayName: string;
  description: string;
  schedule: string;
  icon: React.ReactNode;
  category: "email" | "metrics" | "maintenance";
}

const AdminLogs = () => {
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const jobsInfo: JobInfo[] = [
    {
      name: "daily-reminder",
      displayName: "Daily Reminder",
      description: "Send daily quiz reminders to inactive users",
      schedule: "Daily at 9:00 AM UTC",
      icon: <Mail className="h-5 w-5" />,
      category: "email",
    },
    {
      name: "weekly-report",
      displayName: "Weekly Report",
      description: "Send weekly performance reports to users",
      schedule: "Sunday at 10:00 AM UTC",
      icon: <BarChart3 className="h-5 w-5" />,
      category: "email",
    },
    {
      name: "admin-daily-report",
      displayName: "Admin Daily Report",
      description: "Send daily system overview to administrators",
      schedule: "Daily at 8:00 AM UTC",
      icon: <Settings className="h-5 w-5" />,
      category: "email",
    },
    {
      name: "collect-metrics",
      displayName: "Collect Metrics",
      description: "Collect and store daily system metrics",
      schedule: "Daily at midnight UTC",
      icon: <Activity className="h-5 w-5" />,
      category: "metrics",
    },
    {
      name: "database-cleanup",
      displayName: "Database Cleanup",
      description: "Clean old logs and optimize database",
      schedule: "Sunday at 2:00 AM UTC",
      icon: <Database className="h-5 w-5" />,
      category: "maintenance",
    },
  ];

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get("/admin/jobs");
      setLogs(response.data);
    } catch (err) {
      setError("Failed to fetch job logs");
    } finally {
      setLoading(false);
    }
  };

  const {
    filteredData: filteredLogs,
    handleSearch,
    handleFilter,
    handleSort,
    hasActiveFilters,
  } = useSearch({
    data: logs,
    searchFields: ["job_name", "status", "details"],
    defaultSort: { field: "executed_at", order: "desc" },
  });

  const runJob = async (jobName: string) => {
    setRunningJobs((prev) => new Set(prev).add(jobName));
    try {
      await api.post(`/admin/jobs/${jobName}/run`);
      await fetchLogs(); // Refresh logs after job completion
    } catch (err) {
      setError(`Failed to run job: ${jobName}`);
    } finally {
      setRunningJobs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(jobName);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "STARTED":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "ERROR":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "SKIPPED":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "STARTED":
        return "bg-blue-100 text-blue-800";
      case "ERROR":
        return "bg-red-100 text-red-800";
      case "SKIPPED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "email":
        return "bg-blue-100 text-blue-800";
      case "metrics":
        return "bg-green-100 text-green-800";
      case "maintenance":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ["Job Name", "Status", "Details", "Executed At"].join(","),
      ...filteredLogs.map((log) =>
        [
          log.job_name,
          log.status,
          `"${log.details.replace(/"/g, '""')}"`,
          log.executed_at,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job_logs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
            <h1 className="text-3xl font-bold text-gray-900">
              System Logs & Jobs
            </h1>
            <p className="text-lg text-gray-600">
              Monitor and manage background jobs
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={fetchLogs}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
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

      {/* Job Management Section */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
        <div className="flex items-center space-x-2 mb-6">
          <Server className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Job Management
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobsInfo.map((job) => (
            <div
              key={job.name}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${getCategoryColor(
                      job.category
                    )}`}
                  >
                    {job.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {job.displayName}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(
                        job.category
                      )}`}
                    >
                      {job.category}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">{job.description}</p>

              <div className="flex items-center space-x-2 text-xs text-gray-500 mb-4">
                <Clock className="h-3 w-3" />
                <span>{job.schedule}</span>
              </div>

              <button
                onClick={() => runJob(job.name)}
                disabled={runningJobs.has(job.name)}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {runningJobs.has(job.name) ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span>
                  {runningJobs.has(job.name) ? "Running..." : "Run Now"}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <SearchFilters
        onSearch={handleSearch}
        onFilter={handleFilter}
        onSort={handleSort}
        searchPlaceholder="Search logs by job name, status, or details..."
        showDateFilter={true}
      />

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700">
            Showing {filteredLogs.length} of {logs.length} log entries
          </p>
        </div>
      )}

      {/* Job Logs */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Job Execution Logs
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span>Error</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span>Skipped</span>
              </div>
            </div>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {hasActiveFilters
                ? "No logs match your search"
                : "No job logs found"}
            </h3>
            <p className="text-gray-600">
              {hasActiveFilters
                ? "Try adjusting your search criteria or filters"
                : "Job execution logs will appear here once jobs start running."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => {
              const jobInfo = jobsInfo.find((j) => j.name === log.job_name);
              return (
                <div
                  key={log.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(log.status)}
                        <div>
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-gray-900">
                              {jobInfo?.displayName || log.job_name}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                log.status
                              )}`}
                            >
                              {log.status}
                            </span>
                            {jobInfo && (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                                  jobInfo.category
                                )}`}
                              >
                                {jobInfo.category}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {jobInfo?.description || `Job: ${log.job_name}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(log.executed_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(log.executed_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {log.details && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 font-mono">
                        {log.details}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>Job ID: {log.job_name}</span>
                    <span>Log ID: #{log.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
