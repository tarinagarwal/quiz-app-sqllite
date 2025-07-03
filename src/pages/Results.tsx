import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Trophy, Clock, Target, Award, Home, RotateCcw } from 'lucide-react';

interface ResultData {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  timeTaken: number;
  attemptId: number;
}

const Results = () => {
  const location = useLocation();
  const { result, quizTitle } = location.state as { result: ResultData; quizTitle: string };

  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No results to display</p>
        <Link to="/dashboard" className="text-blue-600 hover:text-blue-700">
          Go back to dashboard
        </Link>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (percentage >= 50) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const gradeInfo = getGrade(result.percentage);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${gradeInfo.bg}`}>
              <Trophy className={`h-12 w-12 ${gradeInfo.color}`} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
          <p className="text-xl text-gray-600">{quizTitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center space-x-3 mb-2">
              <Award className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Final Score</span>
            </div>
            <p className="text-3xl font-bold text-blue-900">{result.score} pts</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center space-x-3 mb-2">
              <Target className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Accuracy</span>
            </div>
            <p className="text-3xl font-bold text-purple-900">{result.percentage}%</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center space-x-3 mb-2">
              <Trophy className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium text-green-600">Grade</span>
            </div>
            <p className={`text-3xl font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center space-x-3 mb-2">
              <Clock className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">Time Taken</span>
            </div>
            <p className="text-3xl font-bold text-orange-900">{formatTime(result.timeTaken)}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Correct Answers:</span>
              <span className="font-medium text-gray-900">{result.correctAnswers} / {result.totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Incorrect Answers:</span>
              <span className="font-medium text-gray-900">{result.totalQuestions - result.correctAnswers} / {result.totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Success Rate:</span>
              <span className="font-medium text-gray-900">{result.percentage}%</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/dashboard"
            className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Home className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Link>
          <Link
            to="/history"
            className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            <span>View History</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Results;