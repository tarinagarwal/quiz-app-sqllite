import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";
import { BookOpen, Clock, Users, Trophy, Play, Star } from "lucide-react";
import SearchFilters from "../components/SearchFilters";
import { useSearch } from "../hooks/useSearch";

interface Quiz {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  time_limit: number;
  created_by_name: string;
  attempts_count: number;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await api.get("/quizzes");
      setQuizzes(response.data);
    } catch (err) {
      setError("Failed to fetch quizzes");
    } finally {
      setLoading(false);
    }
  };

  const {
    filteredData: filteredQuizzes,
    handleSearch,
    handleFilter,
    handleSort,
    hasActiveFilters,
  } = useSearch({
    data: quizzes,
    searchFields: ["title", "description", "category", "created_by_name"],
    defaultSort: { field: "created_at", order: "desc" },
  });

  const categories = [...new Set(quizzes.map((quiz) => quiz.category))];

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
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-xl text-gray-600">
          Choose a quiz to test your knowledge
        </p>
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
        searchPlaceholder="Search quizzes by title, description, category, or creator..."
        showCategoryFilter={true}
        showDifficultyFilter={true}
        categories={categories}
      />

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700">
            Showing {filteredQuizzes.length} of {quizzes.length} quizzes
          </p>
        </div>
      )}

      {/* Quiz Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">
                  {quiz.category}
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                  quiz.difficulty
                )}`}
              >
                {quiz.difficulty}
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {quiz.title}
            </h3>
            <p className="text-gray-600 mb-4 line-clamp-3">
              {quiz.description}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{quiz.time_limit} min</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{quiz.attempts_count} attempts</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Star className="h-4 w-4" />
                <span>By {quiz.created_by_name}</span>
              </div>
              <Link
                to={`/quiz/${quiz.id}`}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                <Play className="h-4 w-4" />
                <span>Start Quiz</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredQuizzes.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="h-24 w-24 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {hasActiveFilters
              ? "No quizzes match your search"
              : "No quizzes available"}
          </h3>
          <p className="text-gray-600">
            {hasActiveFilters
              ? "Try adjusting your search criteria or filters"
              : "Check back later for new quizzes!"}
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
