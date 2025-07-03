import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { ArrowLeft, Trophy, Clock, User, Calendar, Target } from "lucide-react";
import SearchFilters from "../components/SearchFilters";
import { useSearch } from "../hooks/useSearch";

interface AttemptData {
  id: number;
  username: string;
  quiz_title: string;
  category: string;
  difficulty: string;
  score: number;
  total_questions: number;
  time_taken: number;
  completed_at: string;
  user_id: number;
}

interface UserData {
  id: number;
  username: string;
  email: string;
}

const AdminAttempts = () => {
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [attemptsResponse, usersResponse] = await Promise.all([
        api.get("/admin/attempts"),
        api.get("/admin/users"),
      ]);

      setAttempts(attemptsResponse.data);
      setUsers(usersResponse.data);
    } catch (err) {
      setError("Failed to fetch attempts data");
    } finally {
      setLoading(false);
    }
  };

  const {
    filteredData: filteredAttempts,
    handleSearch,
    handleFilter,
    handleSort,
    hasActiveFilters,
  } = useSearch({
    data: attempts,
    searchFields: ["username", "quiz_title", "category"],
    defaultSort: { field: "completed_at", order: "desc" },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
      <div className="flex items-center space-x-4">
        <Link
          to="/admin"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Dashboard</span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quiz Attempts</h1>
          <p className="text-lg text-gray-600">
            Monitor all user quiz attempts and performance
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Search and Filters */}
      <SearchFilters
        onSearch={handleSearch}
        onFilter={handleFilter}
        onSort={handleSort}
        searchPlaceholder="Search by username, quiz title, or category..."
        showUserFilter={true}
        showDateFilter={true}
        showScoreFilter={true}
        users={users}
      />

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700">
            Showing {filteredAttempts.length} of {attempts.length} quiz attempts
          </p>
        </div>
      )}

      {/* Attempts List */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            All Quiz Attempts
          </h2>
        </div>

        {filteredAttempts.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {hasActiveFilters
                ? "No attempts match your search"
                : "No quiz attempts found"}
            </h3>
            <p className="text-gray-600">
              {hasActiveFilters
                ? "Try adjusting your search criteria or filters"
                : "Quiz attempts will appear here once users start taking quizzes."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {attempt.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {attempt.quiz_title}
                      </h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {attempt.username}
                          </span>
                        </div>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">
                          {attempt.category}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                            attempt.difficulty
                          )}`}
                        >
                          {attempt.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(attempt.completed_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(attempt.completed_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">Score:</span>
                    <span
                      className={`font-semibold ${getScoreColor(
                        attempt.score,
                        attempt.total_questions
                      )}`}
                    >
                      {attempt.score}/{attempt.total_questions}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Accuracy:</span>
                    <span
                      className={`font-semibold ${getScoreColor(
                        attempt.score,
                        attempt.total_questions
                      )}`}
                    >
                      {Math.round(
                        (attempt.score / attempt.total_questions) * 100
                      )}
                      %
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Time:</span>
                    <span className="font-semibold text-gray-900">
                      {formatTime(attempt.time_taken)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
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

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Performance</span>
                    <span>
                      {Math.round(
                        (attempt.score / attempt.total_questions) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        attempt.score / attempt.total_questions >= 0.8
                          ? "bg-gradient-to-r from-green-500 to-green-600"
                          : attempt.score / attempt.total_questions >= 0.6
                          ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                          : "bg-gradient-to-r from-red-500 to-red-600"
                      }`}
                      style={{
                        width: `${
                          (attempt.score / attempt.total_questions) * 100
                        }%`,
                      }}
                    ></div>
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

export default AdminAttempts;
