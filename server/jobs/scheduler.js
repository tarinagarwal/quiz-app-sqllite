import cron from "node-cron";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { sendEmail, sendBulkEmails } from "./emailService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection
const db = new sqlite3.Database(join(__dirname, "../quiz.db"));

// Job logging
const logJob = (jobName, status, details = "") => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🤖 JOB: ${jobName} - ${status} ${details}`);

  // Log to database
  db.run(
    `INSERT OR IGNORE INTO job_logs (job_name, status, details, executed_at) 
          VALUES (?, ?, ?, ?)`,
    [jobName, status, details, timestamp]
  );
};

// Initialize job logs table
const initializeJobTables = () => {
  db.serialize(() => {
    // Job logs table
    db.run(`CREATE TABLE IF NOT EXISTS job_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_name TEXT NOT NULL,
      status TEXT NOT NULL,
      details TEXT,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // User preferences table
    db.run(`CREATE TABLE IF NOT EXISTS user_preferences (
      user_id INTEGER PRIMARY KEY,
      email_reminders BOOLEAN DEFAULT 1,
      reminder_time TEXT DEFAULT '09:00',
      weekly_reports BOOLEAN DEFAULT 1,
      last_reminder_sent DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // System metrics table
    db.run(`CREATE TABLE IF NOT EXISTS system_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric_date DATE NOT NULL,
      total_users INTEGER,
      total_quizzes INTEGER,
      total_attempts INTEGER,
      daily_attempts INTEGER,
      average_score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log("✅ Job system tables initialized");
  });
};

// Daily reminder job
const dailyReminderJob = async () => {
  try {
    logJob("DAILY_REMINDER", "STARTED");

    // Get users who haven't taken a quiz in the last 24 hours and have reminders enabled
    const query = `
      SELECT DISTINCT u.id, u.username, u.email, 
             COALESCE(up.email_reminders, 1) as email_reminders,
             COALESCE(up.last_reminder_sent, '1970-01-01') as last_reminder_sent
      FROM users u
      LEFT JOIN user_preferences up ON u.id = up.user_id
      LEFT JOIN quiz_attempts qa ON u.id = qa.user_id 
        AND qa.completed_at > datetime('now', '-24 hours')
      WHERE u.role = 'user' 
        AND qa.id IS NULL 
        AND COALESCE(up.email_reminders, 1) = 1
        AND datetime(COALESCE(up.last_reminder_sent, '1970-01-01')) < datetime('now', '-20 hours')
    `;

    return new Promise((resolve, reject) => {
      db.all(query, async (err, users) => {
        if (err) {
          logJob("DAILY_REMINDER", "ERROR", err.message);
          reject(err);
          return;
        }

        if (users.length === 0) {
          logJob("DAILY_REMINDER", "COMPLETED", "No users need reminders");
          resolve();
          return;
        }

        // Get total available quizzes
        db.get("SELECT COUNT(*) as count FROM quizzes", async (err, result) => {
          if (err) {
            logJob("DAILY_REMINDER", "ERROR", err.message);
            reject(err);
            return;
          }

          const availableQuizzes = result.count;

          try {
            // Send reminder emails
            const results = await sendBulkEmails(
              users,
              "dailyReminder",
              async (user) => {
                // Update last reminder sent
                db.run(
                  `INSERT OR REPLACE INTO user_preferences 
                      (user_id, email_reminders, last_reminder_sent) 
                      VALUES (?, 1, datetime('now'))`,
                  [user.id]
                );

                return {
                  username: user.username,
                  availableQuizzes: availableQuizzes,
                };
              }
            );

            const successCount = results.filter((r) => r.success).length;
            logJob(
              "DAILY_REMINDER",
              "COMPLETED",
              `Sent ${successCount}/${users.length} reminders`
            );
            resolve();
          } catch (error) {
            logJob("DAILY_REMINDER", "ERROR", error.message);
            reject(error);
          }
        });
      });
    });
  } catch (error) {
    logJob("DAILY_REMINDER", "ERROR", error.message);
    throw error;
  }
};

// Weekly report job
const weeklyReportJob = async () => {
  try {
    logJob("WEEKLY_REPORT", "STARTED");

    // Get users with weekly reports enabled
    const query = `
      SELECT u.id, u.username, u.email
      FROM users u
      LEFT JOIN user_preferences up ON u.id = up.user_id
      WHERE u.role = 'user' 
        AND COALESCE(up.weekly_reports, 1) = 1
    `;

    return new Promise((resolve, reject) => {
      db.all(query, async (err, users) => {
        if (err) {
          logJob("WEEKLY_REPORT", "ERROR", err.message);
          reject(err);
          return;
        }

        try {
          // Send weekly reports
          const results = await sendBulkEmails(
            users,
            "weeklyReport",
            async (user) => {
              return new Promise((resolve) => {
                // Get user's weekly stats
                const statsQuery = `
                SELECT 
                  COUNT(*) as quizzesCompleted,
                  AVG(score * 100.0 / total_questions) as averageScore
                FROM quiz_attempts 
                WHERE user_id = ? 
                  AND completed_at > datetime('now', '-7 days')
              `;

                db.get(statsQuery, [user.id], (err, stats) => {
                  const userData = {
                    username: user.username,
                    stats: {
                      quizzesCompleted: stats?.quizzesCompleted || 0,
                      averageScore: Math.round(stats?.averageScore || 0),
                    },
                  };
                  resolve(userData);
                });
              });
            }
          );

          const successCount = results.filter((r) => r.success).length;
          logJob(
            "WEEKLY_REPORT",
            "COMPLETED",
            `Sent ${successCount}/${users.length} reports`
          );
          resolve();
        } catch (error) {
          logJob("WEEKLY_REPORT", "ERROR", error.message);
          reject(error);
        }
      });
    });
  } catch (error) {
    logJob("WEEKLY_REPORT", "ERROR", error.message);
    throw error;
  }
};

// Admin daily report job
const adminDailyReportJob = async () => {
  try {
    logJob("ADMIN_DAILY_REPORT", "STARTED");

    return new Promise((resolve, reject) => {
      // Get admin users
      db.all(
        'SELECT email, username FROM users WHERE role = "admin"',
        async (err, admins) => {
          if (err) {
            logJob("ADMIN_DAILY_REPORT", "ERROR", err.message);
            reject(err);
            return;
          }

          try {
            // Get system stats
            const statsPromises = [
              new Promise((resolve) =>
                db.get(
                  'SELECT COUNT(*) as count FROM users WHERE role = "user"',
                  (err, result) => resolve(result?.count || 0)
                )
              ),
              new Promise((resolve) =>
                db.get(
                  "SELECT COUNT(*) as count FROM quiz_attempts",
                  (err, result) => resolve(result?.count || 0)
                )
              ),
              new Promise((resolve) =>
                db.get(
                  'SELECT COUNT(*) as count FROM quiz_attempts WHERE DATE(completed_at) = DATE("now")',
                  (err, result) => resolve(result?.count || 0)
                )
              ),
              new Promise((resolve) =>
                db.get(
                  "SELECT AVG(score * 100.0 / total_questions) as avg FROM quiz_attempts",
                  (err, result) => resolve(Math.round(result?.avg || 0))
                )
              ),
            ];

            const [totalUsers, totalAttempts, todayAttempts, averageScore] =
              await Promise.all(statsPromises);

            const statsData = {
              username: "Admin", // Default username for admin emails
              totalUsers: totalUsers,
              totalAttempts: totalAttempts,
              todayAttempts: todayAttempts,
              averageScore: averageScore,
            };

            // Send reports to all admins
            for (const admin of admins) {
              await sendEmail(admin.email, "adminDailyReport", statsData);
            }

            logJob(
              "ADMIN_DAILY_REPORT",
              "COMPLETED",
              `Sent to ${admins.length} admins`
            );
            resolve();
          } catch (error) {
            logJob("ADMIN_DAILY_REPORT", "ERROR", error.message);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    logJob("ADMIN_DAILY_REPORT", "ERROR", error.message);
    throw error;
  }
};

// System metrics collection job
const collectSystemMetricsJob = async () => {
  try {
    logJob("COLLECT_METRICS", "STARTED");

    const today = new Date().toISOString().split("T")[0];

    return new Promise((resolve, reject) => {
      // Check if metrics already collected for today
      db.get(
        "SELECT id FROM system_metrics WHERE metric_date = ?",
        [today],
        (err, existing) => {
          if (err) {
            logJob("COLLECT_METRICS", "ERROR", err.message);
            reject(err);
            return;
          }

          if (existing) {
            logJob("COLLECT_METRICS", "SKIPPED", "Already collected today");
            resolve();
            return;
          }

          // Collect metrics
          const metricsPromises = [
            new Promise((resolve) =>
              db.get(
                'SELECT COUNT(*) as count FROM users WHERE role = "user"',
                (err, result) => resolve(result?.count || 0)
              )
            ),
            new Promise((resolve) =>
              db.get("SELECT COUNT(*) as count FROM quizzes", (err, result) =>
                resolve(result?.count || 0)
              )
            ),
            new Promise((resolve) =>
              db.get(
                "SELECT COUNT(*) as count FROM quiz_attempts",
                (err, result) => resolve(result?.count || 0)
              )
            ),
            new Promise((resolve) =>
              db.get(
                'SELECT COUNT(*) as count FROM quiz_attempts WHERE DATE(completed_at) = DATE("now")',
                (err, result) => resolve(result?.count || 0)
              )
            ),
            new Promise((resolve) =>
              db.get(
                "SELECT AVG(score * 100.0 / total_questions) as avg FROM quiz_attempts",
                (err, result) => resolve(result?.avg || 0)
              )
            ),
          ];

          Promise.all(metricsPromises)
            .then(
              ([
                totalUsers,
                totalQuizzes,
                totalAttempts,
                dailyAttempts,
                averageScore,
              ]) => {
                db.run(
                  `INSERT INTO system_metrics 
                  (metric_date, total_users, total_quizzes, total_attempts, daily_attempts, average_score) 
                  VALUES (?, ?, ?, ?, ?, ?)`,
                  [
                    today,
                    totalUsers,
                    totalQuizzes,
                    totalAttempts,
                    dailyAttempts,
                    averageScore,
                  ],
                  (err) => {
                    if (err) {
                      logJob("COLLECT_METRICS", "ERROR", err.message);
                      reject(err);
                    } else {
                      logJob(
                        "COLLECT_METRICS",
                        "COMPLETED",
                        `Metrics saved for ${today}`
                      );
                      resolve();
                    }
                  }
                );
              }
            )
            .catch(reject);
        }
      );
    });
  } catch (error) {
    logJob("COLLECT_METRICS", "ERROR", error.message);
    throw error;
  }
};

// Database cleanup job
const databaseCleanupJob = async () => {
  try {
    logJob("DATABASE_CLEANUP", "STARTED");

    return new Promise((resolve, reject) => {
      // Clean old job logs (keep last 30 days)
      db.run(
        'DELETE FROM job_logs WHERE executed_at < datetime("now", "-30 days")',
        (err) => {
          if (err) {
            logJob("DATABASE_CLEANUP", "ERROR", err.message);
            reject(err);
            return;
          }

          // Vacuum database to reclaim space
          db.run("VACUUM", (err) => {
            if (err) {
              console.error("Database vacuum error:", err);
              reject(err);
            } else {
              logJob(
                "DATABASE_CLEANUP",
                "COMPLETED",
                "Old logs cleaned and database vacuumed"
              );
              resolve();
            }
          });
        }
      );
    });
  } catch (error) {
    logJob("DATABASE_CLEANUP", "ERROR", error.message);
    throw error;
  }
};

// Initialize and start all jobs
export const initializeJobs = () => {
  console.log("🚀 Initializing job scheduler...");

  // Initialize database tables
  initializeJobTables();

  // Schedule jobs using cron expressions

  // Daily reminder at 9:00 AM
  cron.schedule("0 9 * * *", dailyReminderJob, {
    name: "daily-reminder",
    timezone: "UTC",
  });

  // Weekly report every Sunday at 10:00 AM
  cron.schedule("0 10 * * 0", weeklyReportJob, {
    name: "weekly-report",
    timezone: "UTC",
  });

  // Admin daily report at 8:00 AM
  cron.schedule("0 8 * * *", adminDailyReportJob, {
    name: "admin-daily-report",
    timezone: "UTC",
  });

  // Collect system metrics every day at midnight
  cron.schedule("0 0 * * *", collectSystemMetricsJob, {
    name: "collect-metrics",
    timezone: "UTC",
  });

  // Database cleanup every Sunday at 2:00 AM
  cron.schedule("0 2 * * 0", databaseCleanupJob, {
    name: "database-cleanup",
    timezone: "UTC",
  });

  // Health check every hour
  cron.schedule(
    "0 * * * *",
    () => {
      logJob(
        "HEALTH_CHECK",
        "COMPLETED",
        `System running at ${new Date().toISOString()}`
      );
    },
    {
      name: "health-check",
      timezone: "UTC",
    }
  );

  console.log("✅ Job scheduler initialized with the following jobs:");
  console.log("   📧 Daily Reminder: 9:00 AM UTC");
  console.log("   📊 Weekly Report: Sunday 10:00 AM UTC");
  console.log("   🔧 Admin Report: 8:00 AM UTC");
  console.log("   📈 Metrics Collection: Midnight UTC");
  console.log("   🧹 Database Cleanup: Sunday 2:00 AM UTC");
  console.log("   ❤️ Health Check: Every hour");

  // Run initial metrics collection
  setTimeout(collectSystemMetricsJob, 5000);
};

// Manual job triggers for testing
export const runJob = async (jobName) => {
  console.log(`🎯 Executing job: ${jobName}`);

  switch (jobName) {
    case "daily-reminder":
      await dailyReminderJob();
      break;
    case "weekly-report":
      await weeklyReportJob();
      break;
    case "admin-daily-report":
      await adminDailyReportJob();
      break;
    case "collect-metrics":
      await collectSystemMetricsJob();
      break;
    case "database-cleanup":
      await databaseCleanupJob();
      break;
    default:
      throw new Error(`Unknown job: ${jobName}`);
  }

  console.log(`✨ Job ${jobName} execution completed`);
};
