import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import {
  Plus,
  Users,
  BookOpen,
  TrendingUp,
  Clock,
  Trophy,
  BarChart3,
  PieChart,
} from "lucide-react";
import {
  ScoreDistributionChart,
  QuizPerformanceChart,
  GradeDistributionChart,
} from "../components/Charts";

interface Stats {
  totalUsers: number;
  totalQuizzes: number;
  totalAttempts: number;
  averageScore: number;
}

interface RecentAttempt {
  id: number;
  username: string;
  quiz_title: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

interface ChartData {
  scoreDistribution: { range: string; count: number }[];
  quizPerformance: { quiz: string; avgScore: number; attempts: number }[];
  gradeDistribution: { grade: string; count: number; color: string }[];
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalQuizzes: 0,
    totalAttempts: 0,
    averageScore: 0,
  });
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
  const [chartData, setChartData] = useState<ChartData>({
    scoreDistribution: [],
    quizPerformance: [],
    gradeDistribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsResponse, attemptsResponse, analyticsResponse] =
        await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/recent-attempts"),
          api.get("/admin/analytics"),
        ]);

      setStats(statsResponse.data);
      setRecentAttempts(attemptsResponse.data);
      setChartData(analyticsResponse.data);
    } catch (err) {
      setError("Failed to fetch admin data");
    } finally {
      setLoading(false);
    }
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-lg text-gray-600">
            Manage quizzes and monitor performance
          </p>
        </div>
        <Link
          to="/admin/create-quiz"
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          <Plus className="h-5 w-5" />
          <span>Create Quiz</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center space-x-3 mb-2">
            <Users className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">
              Total Users
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center space-x-3 mb-2">
            <BookOpen className="h-6 w-6 text-green-600" />
            <span className="text-sm font-medium text-gray-600">
              Total Quizzes
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalQuizzes}
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
            {stats.totalAttempts}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center space-x-3 mb-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            <span className="text-sm font-medium text-gray-600">
              Average Score
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.averageScore}%
          </p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Score Distribution
            </h3>
          </div>
          <ScoreDistributionChart data={chartData.scoreDistribution} />
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center space-x-2 mb-4">
            <PieChart className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Grade Distribution
            </h3>
          </div>
          <GradeDistributionChart data={chartData.gradeDistribution} />
        </div>
      </div>

      {/* Quiz Performance Chart */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Quiz Performance Overview
          </h3>
        </div>
        <QuizPerformanceChart data={chartData.quizPerformance} />
      </div>

      {/* Recent Attempts */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Quiz Attempts
          </h2>
        </div>

        {recentAttempts.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No recent attempts
            </h3>
            <p className="text-gray-600">
              Quiz attempts will appear here once users start taking quizzes.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {attempt.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {attempt.username}
                      </p>
                      <p className="text-sm text-gray-600">
                        {attempt.quiz_title}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {attempt.score}/{attempt.total_questions}
                    </p>
                    <p className="text-sm text-gray-500">
                      {Math.round(
                        (attempt.score / attempt.total_questions) * 100
                      )}
                      %
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(attempt.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      attempt.score / attempt.total_questions >= 0.8
                        ? "bg-green-100 text-green-800"
                        : attempt.score / attempt.total_questions >= 0.6
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {attempt.score / attempt.total_questions >= 0.8
                      ? "Excellent"
                      : attempt.score / attempt.total_questions >= 0.6
                      ? "Good"
                      : "Needs Improvement"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
