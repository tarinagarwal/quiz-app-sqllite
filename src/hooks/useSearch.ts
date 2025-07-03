import { useState, useMemo } from "react";
import { FilterOptions } from "../components/SearchFilters";

interface UseSearchProps<T> {
  data: T[];
  searchFields: (keyof T)[];
  defaultSort?: {
    field: keyof T;
    order: "asc" | "desc";
  };
}

export const useSearch = <T extends Record<string, any>>({
  data,
  searchFields,
  defaultSort,
}: UseSearchProps<T>) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sortBy, setSortBy] = useState(defaultSort?.field || "");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    defaultSort?.order || "desc"
  );

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchTerm) {
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          return (
            value &&
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
          );
        })
      );
    }

    // Apply category filter
    if (filters.category) {
      result = result.filter(
        (item) =>
          item.category &&
          item.category.toLowerCase() === filters.category!.toLowerCase()
      );
    }

    // Apply difficulty filter
    if (filters.difficulty) {
      result = result.filter(
        (item) =>
          item.difficulty &&
          item.difficulty.toLowerCase() === filters.difficulty!.toLowerCase()
      );
    }

    // Apply user filter
    if (filters.userId) {
      result = result.filter(
        (item) =>
          item.user_id === filters.userId || item.userId === filters.userId
      );
    }

    // Apply date range filter
    if (filters.dateRange?.start || filters.dateRange?.end) {
      result = result.filter((item) => {
        const itemDate = new Date(
          item.completed_at || item.created_at || item.date
        );
        const startDate = filters.dateRange?.start
          ? new Date(filters.dateRange.start)
          : null;
        const endDate = filters.dateRange?.end
          ? new Date(filters.dateRange.end)
          : null;

        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
      });
    }

    // Apply score range filter
    if (
      filters.scoreRange?.min !== undefined ||
      filters.scoreRange?.max !== undefined
    ) {
      result = result.filter((item) => {
        let percentage = 0;

        if (item.score !== undefined && item.total_questions !== undefined) {
          percentage = Math.round((item.score / item.total_questions) * 100);
        } else if (item.percentage !== undefined) {
          percentage = item.percentage;
        } else if (item.avgScore !== undefined) {
          percentage = item.avgScore;
        }

        if (
          filters.scoreRange?.min !== undefined &&
          percentage < filters.scoreRange.min
        )
          return false;
        if (
          filters.scoreRange?.max !== undefined &&
          percentage > filters.scoreRange.max
        )
          return false;
        return true;
      });
    }

    // Apply sorting
    if (sortBy) {
      result.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        // Handle special sort cases
        if (sortBy === "date") {
          //@ts-ignore
          aValue = new Date(a.completed_at || a.created_at || a.date);
          //@ts-ignore
          bValue = new Date(b.completed_at || b.created_at || b.date);
        } else if (sortBy === "score") {
          if (a.score !== undefined && a.total_questions !== undefined) {
            //@ts-ignore
            aValue = (a.score / a.total_questions) * 100;
          } else if (a.percentage !== undefined) {
            aValue = a.percentage;
          } else if (a.avgScore !== undefined) {
            aValue = a.avgScore;
          }

          if (b.score !== undefined && b.total_questions !== undefined) {
            //@ts-ignore
            bValue = (b.score / b.total_questions) * 100;
          } else if (b.percentage !== undefined) {
            bValue = b.percentage;
          } else if (b.avgScore !== undefined) {
            bValue = b.avgScore;
          }
        } else if (sortBy === "name") {
          aValue = a.title || a.quiz_title || a.username || a.name;
          bValue = b.title || b.quiz_title || b.username || b.name;
        }

        // Handle different data types
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortOrder === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        //@ts-ignore
        if (aValue instanceof Date && bValue instanceof Date) {
          return sortOrder === "asc"
            ? //@ts-ignore
              aValue.getTime() - bValue.getTime()
            : //@ts-ignore
              bValue.getTime() - aValue.getTime();
        }

        // Numeric comparison
        const numA = Number(aValue) || 0;
        const numB = Number(bValue) || 0;
        return sortOrder === "asc" ? numA - numB : numB - numA;
      });
    }

    return result;
  }, [data, searchTerm, filters, sortBy, sortOrder, searchFields]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilter = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleSort = (field: string, order: "asc" | "desc") => {
    setSortBy(field);
    setSortOrder(order);
  };

  const resetSearch = () => {
    setSearchTerm("");
    setFilters({});
    setSortBy(defaultSort?.field || "");
    setSortOrder(defaultSort?.order || "desc");
  };

  return {
    filteredData: filteredAndSortedData,
    searchTerm,
    filters,
    sortBy,
    sortOrder,
    handleSearch,
    handleFilter,
    handleSort,
    resetSearch,
    hasActiveFilters:
      Object.values(filters).some(
        (value) =>
          value !== undefined &&
          value !== "" &&
          (typeof value === "object"
            ? Object.values(value).some((v) => v !== undefined && v !== "")
            : true)
      ) || searchTerm !== "",
  };
};
