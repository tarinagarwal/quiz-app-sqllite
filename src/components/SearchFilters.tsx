import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Trophy,
  Clock,
  User,
} from "lucide-react";

interface SearchFiltersProps {
  onSearch: (searchTerm: string) => void;
  onFilter: (filters: FilterOptions) => void;
  onSort: (sortBy: string, sortOrder: "asc" | "desc") => void;
  searchPlaceholder?: string;
  showUserFilter?: boolean;
  showDateFilter?: boolean;
  showScoreFilter?: boolean;
  showDifficultyFilter?: boolean;
  showCategoryFilter?: boolean;
  categories?: string[];
  users?: { id: number; username: string }[];
}

export interface FilterOptions {
  category?: string;
  difficulty?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  scoreRange?: {
    min: number;
    max: number;
  };
  userId?: number;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  onSearch,
  onFilter,
  onSort,
  searchPlaceholder = "Search...",
  showUserFilter = false,
  showDateFilter = false,
  showScoreFilter = false,
  showDifficultyFilter = false,
  showCategoryFilter = false,
  categories = [],
  users = [],
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<FilterOptions>({});

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, onSearch]);

  useEffect(() => {
    onFilter(filters);
  }, [filters, onFilter]);

  const handleSortChange = (newSortBy: string) => {
    const newSortOrder =
      sortBy === newSortBy && sortOrder === "desc" ? "asc" : "desc";
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    onSort(newSortBy, newSortOrder);
  };

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
    setSortBy("");
    setSortOrder("desc");
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) =>
      value !== undefined &&
      value !== "" &&
      (typeof value === "object"
        ? Object.values(value).some((v) => v !== undefined && v !== "")
        : true)
  );

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filter Toggle and Sort Options */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                Active
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleSortChange("date")}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                sortBy === "date"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Date</span>
              {sortBy === "date" &&
                (sortOrder === "desc" ? (
                  <SortDesc className="h-4 w-4" />
                ) : (
                  <SortAsc className="h-4 w-4" />
                ))}
            </button>

            {showScoreFilter && (
              <button
                onClick={() => handleSortChange("score")}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  sortBy === "score"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Trophy className="h-4 w-4" />
                <span>Score</span>
                {sortBy === "score" &&
                  (sortOrder === "desc" ? (
                    <SortDesc className="h-4 w-4" />
                  ) : (
                    <SortAsc className="h-4 w-4" />
                  ))}
              </button>
            )}

            <button
              onClick={() => handleSortChange("name")}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                sortBy === "name"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span>Name</span>
              {sortBy === "name" &&
                (sortOrder === "desc" ? (
                  <SortDesc className="h-4 w-4" />
                ) : (
                  <SortAsc className="h-4 w-4" />
                ))}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          {showCategoryFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category || ""}
                onChange={(e) =>
                  updateFilter("category", e.target.value || undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showDifficultyFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={filters.difficulty || ""}
                onChange={(e) =>
                  updateFilter("difficulty", e.target.value || undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Difficulties</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          )}

          {showUserFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User
              </label>
              <select
                value={filters.userId || ""}
                onChange={(e) =>
                  updateFilter(
                    "userId",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showDateFilter && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={filters.dateRange?.start || ""}
                  onChange={(e) =>
                    updateFilter("dateRange", {
                      ...filters.dateRange,
                      start: e.target.value,
                    })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={filters.dateRange?.end || ""}
                  onChange={(e) =>
                    updateFilter("dateRange", {
                      ...filters.dateRange,
                      end: e.target.value,
                    })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {showScoreFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Score Range (%)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.scoreRange?.min || ""}
                  onChange={(e) =>
                    updateFilter("scoreRange", {
                      ...filters.scoreRange,
                      min: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Min"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.scoreRange?.max || ""}
                  onChange={(e) =>
                    updateFilter("scoreRange", {
                      ...filters.scoreRange,
                      max: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Max"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
