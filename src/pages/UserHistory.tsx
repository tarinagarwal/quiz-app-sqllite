import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Trophy, Clock, Target, Calendar, TrendingUp } from 'lucide-react';

interface Attempt {
  id: number;
  quiz_title: string;
  score: number;
  total_questions: number;
  time_taken: number;
  completed_at: string;
}

const UserHistory = () => {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      const response = await api.get('/user/attempts');
      setAttempts(response.data);
    } catch (err) {
      setError('Failed to fetch quiz history');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateStats = () => {
    if (attempts.length === 0) return { avgScore: 0, totalQuizzes: 0, bestScore: 0 };

    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.total_questions, 0);
    const avgScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    const bestScore = Math.max(...attempts.map(a => Math.round((a.score / a.total_questions) * 100)));

    return {
      avgScore,
      totalQuizzes: attempts.length,
      bestScore
    };
  };

  const stats = calculateStats();

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Quiz History</h1>
        <p className="text-lg text-gray-600">Track your progress and performance</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center space-x-3 mb-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            <span className="text-sm font-medium text-gray-600">Total Quizzes</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalQuizzes}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center space-x-3 mb-2">
            <Target className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Average Score</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.avgScore}%</p>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Best Score</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.bestScore}%</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Attempts</h2>
        </div>
        
        {attempts.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No quiz attempts yet</h3>
            <p className="text-gray-600">Start taking quizzes to see your history here!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {attempts.map((attempt) => (
              <div key={attempt.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{attempt.quiz_title}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(attempt.completed_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">Score:</span>
                    <span className={`font-semibold ${getScoreColor(attempt.score, attempt.total_questions)}`}>
                      {attempt.score}/{attempt.total_questions}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Accuracy:</span>
                    <span className={`font-semibold ${getScoreColor(attempt.score, attempt.total_questions)}`}>
                      {Math.round((attempt.score / attempt.total_questions) * 100)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Time:</span>
                    <span className="font-semibold text-gray-900">{formatTime(attempt.time_taken)}</span>
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

export default UserHistory;