import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sqlite3 from "sqlite3";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { initializeJobs, runJob } from "./jobs/scheduler.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database(join(__dirname, "quiz.db"));

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Quizzes table
  db.run(`CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    difficulty TEXT,
    time_limit INTEGER,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
  )`);

  // Questions table
  db.run(`CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    points INTEGER DEFAULT 1,
    FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
  )`);

  // Quiz attempts table
  db.run(`CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    quiz_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_taken INTEGER,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
  )`);

  // Create admin user if not exists
  const adminPassword = bcrypt.hashSync("admin123", 10);
  db.run(
    `INSERT OR IGNORE INTO users (username, email, password, role) 
          VALUES ('admin', 'admin@quiz.com', ?, 'admin')`,
    [adminPassword]
  );

  // Create sample quiz
  db.run(`INSERT OR IGNORE INTO quizzes (id, title, description, category, difficulty, time_limit, created_by) 
          VALUES (1, 'JavaScript Fundamentals', 'Test your knowledge of JavaScript basics', 'Programming', 'Beginner', 600, 1)`);

  // Create sample questions
  const sampleQuestions = [
    {
      quiz_id: 1,
      question: "What is the correct way to declare a variable in JavaScript?",
      option_a: "variable x = 5;",
      option_b: "var x = 5;",
      option_c: "v x = 5;",
      option_d: "declare x = 5;",
      correct_answer: "b",
      points: 1,
    },
    {
      quiz_id: 1,
      question:
        "Which method is used to add an element to the end of an array?",
      option_a: "push()",
      option_b: "pop()",
      option_c: "shift()",
      option_d: "unshift()",
      correct_answer: "a",
      points: 1,
    },
    {
      quiz_id: 1,
      question: "What does === operator do in JavaScript?",
      option_a: "Assigns a value",
      option_b: "Compares values only",
      option_c: "Compares values and types",
      option_d: "Compares types only",
      correct_answer: "c",
      points: 1,
    },
    {
      quiz_id: 1,
      question: "Which of the following is NOT a JavaScript data type?",
      option_a: "String",
      option_b: "Number",
      option_c: "Float",
      option_d: "Boolean",
      correct_answer: "c",
      points: 1,
    },
    {
      quiz_id: 1,
      question: "How do you create a function in JavaScript?",
      option_a: "create function myFunction() {}",
      option_b: "function myFunction() {}",
      option_c: "def myFunction() {}",
      option_d: "func myFunction() {}",
      correct_answer: "b",
      points: 1,
    },
  ];

  sampleQuestions.forEach((q) => {
    db.run(
      `INSERT OR IGNORE INTO questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, points) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        q.quiz_id,
        q.question,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer,
        q.points,
      ]
    );
  });
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Auth routes
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE constraint failed")) {
            return res
              .status(400)
              .json({ error: "Username or email already exists" });
          }
          return res.status(500).json({ error: "Database error" });
        }

        const token = jwt.sign(
          { id: this.lastID, username, email, role: "user" },
          JWT_SECRET,
          { expiresIn: "24h" }
        );

        res.json({
          token,
          user: { id: this.lastID, username, email, role: "user" },
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      try {
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
          {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
          JWT_SECRET,
          { expiresIn: "24h" }
        );

        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        });
      } catch (error) {
        res.status(500).json({ error: "Server error" });
      }
    }
  );
});

// Quiz routes
app.get("/api/quizzes", authenticateToken, (req, res) => {
  db.all(
    `SELECT q.*, u.username as created_by_name,
          COUNT(qa.id) as attempts_count
          FROM quizzes q
          LEFT JOIN users u ON q.created_by = u.id
          LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
          GROUP BY q.id
          ORDER BY q.created_at DESC`,
    (err, quizzes) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(quizzes);
    }
  );
});

app.get("/api/quizzes/:id", authenticateToken, (req, res) => {
  const quizId = req.params.id;

  db.get("SELECT * FROM quizzes WHERE id = ?", [quizId], (err, quiz) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    db.all(
      "SELECT id, question, option_a, option_b, option_c, option_d, points FROM questions WHERE quiz_id = ?",
      [quizId],
      (err, questions) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }

        res.json({ ...quiz, questions });
      }
    );
  });
});

app.post("/api/quizzes/:id/submit", authenticateToken, (req, res) => {
  const quizId = req.params.id;
  const { answers, timeTaken } = req.body;
  const userId = req.user.id;

  // Get quiz questions with correct answers
  db.all(
    "SELECT id, correct_answer, points FROM questions WHERE quiz_id = ?",
    [quizId],
    (err, questions) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      let score = 0;
      let correctAnswers = 0;

      questions.forEach((question) => {
        if (answers[question.id] === question.correct_answer) {
          score += question.points;
          correctAnswers++;
        }
      });

      // Save quiz attempt
      db.run(
        `INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, time_taken) 
            VALUES (?, ?, ?, ?, ?)`,
        [userId, quizId, score, questions.length, timeTaken],
        function (err) {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }

          res.json({
            score,
            totalQuestions: questions.length,
            correctAnswers,
            percentage: Math.round((correctAnswers / questions.length) * 100),
            timeTaken,
            attemptId: this.lastID,
          });
        }
      );
    }
  );
});

// Admin routes
app.post("/api/admin/quizzes", authenticateToken, requireAdmin, (req, res) => {
  const { title, description, category, difficulty, timeLimit, questions } =
    req.body;
  const createdBy = req.user.id;

  db.run(
    `INSERT INTO quizzes (title, description, category, difficulty, time_limit, created_by) 
          VALUES (?, ?, ?, ?, ?, ?)`,
    [title, description, category, difficulty, timeLimit, createdBy],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      const quizId = this.lastID;

      // Insert questions
      const stmt =
        db.prepare(`INSERT INTO questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, points) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

      questions.forEach((q) => {
        stmt.run([
          quizId,
          q.question,
          q.option_a,
          q.option_b,
          q.option_c,
          q.option_d,
          q.correct_answer,
          q.points || 1,
        ]);
      });

      stmt.finalize();

      res.json({ id: quizId, message: "Quiz created successfully" });
    }
  );
});

app.get("/api/admin/stats", authenticateToken, requireAdmin, (req, res) => {
  const stats = {};

  // Get total users
  db.get("SELECT COUNT(*) as total FROM users", (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    stats.totalUsers = result.total;

    // Get total quizzes
    db.get("SELECT COUNT(*) as total FROM quizzes", (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });
      stats.totalQuizzes = result.total;

      // Get total attempts
      db.get("SELECT COUNT(*) as total FROM quiz_attempts", (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        stats.totalAttempts = result.total;

        // Get average score
        db.get("SELECT AVG(score) as avg FROM quiz_attempts", (err, result) => {
          if (err) return res.status(500).json({ error: "Database error" });
          stats.averageScore = Math.round(result.avg || 0);

          res.json(stats);
        });
      });
    });
  });
});

app.get("/api/admin/analytics", authenticateToken, requireAdmin, (req, res) => {
  const analytics = {
    scoreDistribution: [],
    quizPerformance: [],
    gradeDistribution: [],
  };

  // Score Distribution
  db.all(
    `SELECT 
    CASE 
      WHEN (score * 100.0 / total_questions) < 40 THEN '0-40%'
      WHEN (score * 100.0 / total_questions) < 60 THEN '41-60%'
      WHEN (score * 100.0 / total_questions) < 80 THEN '61-80%'
      ELSE '81-100%'
    END as range,
    COUNT(*) as count
    FROM quiz_attempts 
    GROUP BY range
    ORDER BY range`,
    (err, scoreDistribution) => {
      if (err) return res.status(500).json({ error: "Database error" });

      analytics.scoreDistribution = scoreDistribution || [];

      // Quiz Performance
      db.all(
        `SELECT 
      q.title as quiz,
      AVG(qa.score * 100.0 / qa.total_questions) as avgScore,
      COUNT(qa.id) as attempts
      FROM quizzes q
      LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
      GROUP BY q.id, q.title
      HAVING COUNT(qa.id) > 0
      ORDER BY avgScore DESC`,
        (err, quizPerformance) => {
          if (err) return res.status(500).json({ error: "Database error" });

          analytics.quizPerformance = (quizPerformance || []).map((item) => ({
            ...item,
            avgScore: Math.round(item.avgScore || 0),
          }));

          // Grade Distribution
          db.all(
            `SELECT 
        CASE 
          WHEN (score * 100.0 / total_questions) >= 90 THEN 'A+'
          WHEN (score * 100.0 / total_questions) >= 80 THEN 'A'
          WHEN (score * 100.0 / total_questions) >= 70 THEN 'B'
          WHEN (score * 100.0 / total_questions) >= 60 THEN 'C'
          WHEN (score * 100.0 / total_questions) >= 50 THEN 'D'
          ELSE 'F'
        END as grade,
        COUNT(*) as count
        FROM quiz_attempts 
        GROUP BY grade
        ORDER BY 
          CASE grade
            WHEN 'A+' THEN 1
            WHEN 'A' THEN 2
            WHEN 'B' THEN 3
            WHEN 'C' THEN 4
            WHEN 'D' THEN 5
            WHEN 'F' THEN 6
          END`,
            (err, gradeDistribution) => {
              if (err) return res.status(500).json({ error: "Database error" });

              const gradeColors = {
                "A+": "rgba(16, 185, 129, 0.8)",
                A: "rgba(34, 197, 94, 0.8)",
                B: "rgba(59, 130, 246, 0.8)",
                C: "rgba(245, 158, 11, 0.8)",
                D: "rgba(249, 115, 22, 0.8)",
                F: "rgba(239, 68, 68, 0.8)",
              };

              analytics.gradeDistribution = (gradeDistribution || []).map(
                (item) => ({
                  ...item,
                  color: gradeColors[item.grade] || "rgba(156, 163, 175, 0.8)",
                })
              );

              res.json(analytics);
            }
          );
        }
      );
    }
  );
});

app.get("/api/admin/users", authenticateToken, requireAdmin, (req, res) => {
  db.all(
    'SELECT id, username, email FROM users WHERE role = "user" ORDER BY username',
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(users);
    }
  );
});

app.get(
  "/api/admin/export-data",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    // Get overall stats
    db.get("SELECT COUNT(*) as totalUsers FROM users", (err, userCount) => {
      if (err) return res.status(500).json({ error: "Database error" });

      db.get(
        "SELECT COUNT(*) as totalQuizzes FROM quizzes",
        (err, quizCount) => {
          if (err) return res.status(500).json({ error: "Database error" });

          db.get(
            "SELECT COUNT(*) as totalAttempts FROM quiz_attempts",
            (err, attemptCount) => {
              if (err) return res.status(500).json({ error: "Database error" });

              db.get(
                "SELECT AVG(score * 100.0 / total_questions) as avgScore FROM quiz_attempts",
                (err, avgScore) => {
                  if (err)
                    return res.status(500).json({ error: "Database error" });

                  const overallStats = {
                    totalUsers: userCount.totalUsers,
                    totalQuizzes: quizCount.totalQuizzes,
                    totalAttempts: attemptCount.totalAttempts,
                    averageScore: Math.round(avgScore.avgScore || 0),
                  };

                  // Get all users with their attempts
                  db.all(
                    `SELECT u.id, u.username, u.email,
                  qa.id as attempt_id, qa.quiz_id, qa.score, qa.total_questions, 
                  qa.time_taken, qa.completed_at, q.title as quiz_title
                  FROM users u
                  LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
                  LEFT JOIN quizzes q ON qa.quiz_id = q.id
                  WHERE u.role = 'user'
                  ORDER BY u.username, qa.completed_at DESC`,
                    (err, userAttempts) => {
                      if (err)
                        return res
                          .status(500)
                          .json({ error: "Database error" });

                      // Group attempts by user
                      const usersMap = new Map();

                      userAttempts.forEach((row) => {
                        if (!usersMap.has(row.id)) {
                          usersMap.set(row.id, {
                            id: row.id,
                            username: row.username,
                            email: row.email,
                            attempts: [],
                            stats: {
                              totalQuizzes: 0,
                              avgScore: 0,
                              bestScore: 0,
                              totalTimeSpent: 0,
                            },
                          });
                        }

                        const user = usersMap.get(row.id);

                        if (row.attempt_id) {
                          user.attempts.push({
                            id: row.attempt_id,
                            quiz_title: row.quiz_title,
                            score: row.score,
                            total_questions: row.total_questions,
                            time_taken: row.time_taken,
                            completed_at: row.completed_at,
                          });
                        }
                      });

                      // Calculate user stats
                      const users = Array.from(usersMap.values()).map(
                        (user) => {
                          if (user.attempts.length > 0) {
                            const totalScore = user.attempts.reduce(
                              (sum, attempt) => sum + attempt.score,
                              0
                            );
                            const totalQuestions = user.attempts.reduce(
                              (sum, attempt) => sum + attempt.total_questions,
                              0
                            );
                            const avgScore =
                              totalQuestions > 0
                                ? Math.round(
                                    (totalScore / totalQuestions) * 100
                                  )
                                : 0;
                            const bestScore = Math.max(
                              ...user.attempts.map((a) =>
                                Math.round((a.score / a.total_questions) * 100)
                              )
                            );
                            const totalTimeSpent = user.attempts.reduce(
                              (sum, attempt) => sum + attempt.time_taken,
                              0
                            );

                            user.stats = {
                              totalQuizzes: user.attempts.length,
                              avgScore,
                              bestScore,
                              totalTimeSpent,
                            };
                          }
                          return user;
                        }
                      );

                      res.json({
                        users,
                        overallStats,
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  }
);

// Enhanced admin route for searching quiz attempts
app.get("/api/admin/attempts", authenticateToken, requireAdmin, (req, res) => {
  const {
    search,
    userId,
    startDate,
    endDate,
    minScore,
    maxScore,
    sortBy = "completed_at",
    sortOrder = "desc",
  } = req.query;

  let query = `
    SELECT qa.*, u.username, q.title as quiz_title, q.category, q.difficulty
    FROM quiz_attempts qa
    JOIN users u ON qa.user_id = u.id
    JOIN quizzes q ON qa.quiz_id = q.id
    WHERE 1=1
  `;

  const params = [];

  // Add search filter
  if (search) {
    query += ` AND (u.username LIKE ? OR q.title LIKE ? OR q.category LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  // Add user filter
  if (userId) {
    query += ` AND qa.user_id = ?`;
    params.push(userId);
  }

  // Add date range filter
  if (startDate) {
    query += ` AND DATE(qa.completed_at) >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND DATE(qa.completed_at) <= ?`;
    params.push(endDate);
  }

  // Add score range filter
  if (minScore !== undefined) {
    query += ` AND (qa.score * 100.0 / qa.total_questions) >= ?`;
    params.push(minScore);
  }

  if (maxScore !== undefined) {
    query += ` AND (qa.score * 100.0 / qa.total_questions) <= ?`;
    params.push(maxScore);
  }

  // Add sorting
  const validSortFields = ["completed_at", "score", "username", "quiz_title"];
  const sortField = validSortFields.includes(sortBy) ? sortBy : "completed_at";
  const order = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

  if (sortField === "score") {
    query += ` ORDER BY (qa.score * 100.0 / qa.total_questions) ${order}`;
  } else if (sortField === "username") {
    query += ` ORDER BY u.username ${order}`;
  } else if (sortField === "quiz_title") {
    query += ` ORDER BY q.title ${order}`;
  } else {
    query += ` ORDER BY qa.${sortField} ${order}`;
  }

  db.all(query, params, (err, attempts) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(attempts);
  });
});

app.get(
  "/api/admin/recent-attempts",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    db.all(
      `SELECT qa.*, u.username, q.title as quiz_title
          FROM quiz_attempts qa
          JOIN users u ON qa.user_id = u.id
          JOIN quizzes q ON qa.quiz_id = q.id
          ORDER BY qa.completed_at DESC
          LIMIT 10`,
      (err, attempts) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }
        res.json(attempts);
      }
    );
  }
);

// Job management routes
app.get("/api/admin/jobs", authenticateToken, requireAdmin, (req, res) => {
  db.all(
    `SELECT * FROM job_logs ORDER BY executed_at DESC LIMIT 50`,
    (err, logs) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(logs);
    }
  );
});

app.post(
  "/api/admin/jobs/:jobName/run",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { jobName } = req.params;

    try {
      await runJob(jobName);
      res.json({ message: `Job ${jobName} executed successfully` });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// User preferences routes
app.get("/api/user/preferences", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.get(
    `SELECT * FROM user_preferences WHERE user_id = ?`,
    [userId],
    (err, preferences) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      // Return default preferences if none exist
      const defaultPreferences = {
        email_reminders: true,
        reminder_time: "09:00",
        weekly_reports: true,
      };

      res.json(preferences || defaultPreferences);
    }
  );
});

app.put("/api/user/preferences", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { email_reminders, reminder_time, weekly_reports } = req.body;

  db.run(
    `INSERT OR REPLACE INTO user_preferences 
          (user_id, email_reminders, reminder_time, weekly_reports) 
          VALUES (?, ?, ?, ?)`,
    [userId, email_reminders, reminder_time, weekly_reports],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Preferences updated successfully" });
    }
  );
});

// User routes
app.get("/api/user/attempts", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT qa.*, q.title as quiz_title
          FROM quiz_attempts qa
          JOIN quizzes q ON qa.quiz_id = q.id
          WHERE qa.user_id = ?
          ORDER BY qa.completed_at DESC`,
    [userId],
    (err, attempts) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(attempts);
    }
  );
});

// Initialize job scheduler
if (process.env.ENABLE_JOBS !== "false") {
  initializeJobs();
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `📧 Job system ${
      process.env.ENABLE_JOBS !== "false" ? "enabled" : "disabled"
    }`
  );
});
