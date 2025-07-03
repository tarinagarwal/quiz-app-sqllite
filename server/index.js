import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database(join(__dirname, 'quiz.db'));

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
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO users (username, email, password, role) 
          VALUES ('admin', 'admin@quiz.com', ?, 'admin')`, [adminPassword]);

  // Create sample quiz
  db.run(`INSERT OR IGNORE INTO quizzes (id, title, description, category, difficulty, time_limit, created_by) 
          VALUES (1, 'JavaScript Fundamentals', 'Test your knowledge of JavaScript basics', 'Programming', 'Beginner', 600, 1)`);

  // Create sample questions
  const sampleQuestions = [
    {
      quiz_id: 1,
      question: 'What is the correct way to declare a variable in JavaScript?',
      option_a: 'variable x = 5;',
      option_b: 'var x = 5;',
      option_c: 'v x = 5;',
      option_d: 'declare x = 5;',
      correct_answer: 'b',
      points: 1
    },
    {
      quiz_id: 1,
      question: 'Which method is used to add an element to the end of an array?',
      option_a: 'push()',
      option_b: 'pop()',
      option_c: 'shift()',
      option_d: 'unshift()',
      correct_answer: 'a',
      points: 1
    },
    {
      quiz_id: 1,
      question: 'What does === operator do in JavaScript?',
      option_a: 'Assigns a value',
      option_b: 'Compares values only',
      option_c: 'Compares values and types',
      option_d: 'Compares types only',
      correct_answer: 'c',
      points: 1
    },
    {
      quiz_id: 1,
      question: 'Which of the following is NOT a JavaScript data type?',
      option_a: 'String',
      option_b: 'Number',
      option_c: 'Float',
      option_d: 'Boolean',
      correct_answer: 'c',
      points: 1
    },
    {
      quiz_id: 1,
      question: 'How do you create a function in JavaScript?',
      option_a: 'create function myFunction() {}',
      option_b: 'function myFunction() {}',
      option_c: 'def myFunction() {}',
      option_d: 'func myFunction() {}',
      correct_answer: 'b',
      points: 1
    }
  ];

  sampleQuestions.forEach(q => {
    db.run(`INSERT OR IGNORE INTO questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, points) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
           [q.quiz_id, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.points]);
  });
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Auth routes
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
           [username, email, hashedPassword], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      const token = jwt.sign(
        { id: this.lastID, username, email, role: 'user' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ 
        token, 
        user: { id: this.lastID, username, email, role: 'user' } 
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role 
        } 
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Quiz routes
app.get('/api/quizzes', authenticateToken, (req, res) => {
  db.all(`SELECT q.*, u.username as created_by_name,
          COUNT(qa.id) as attempts_count
          FROM quizzes q
          LEFT JOIN users u ON q.created_by = u.id
          LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
          GROUP BY q.id
          ORDER BY q.created_at DESC`, (err, quizzes) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(quizzes);
  });
});

app.get('/api/quizzes/:id', authenticateToken, (req, res) => {
  const quizId = req.params.id;
  
  db.get('SELECT * FROM quizzes WHERE id = ?', [quizId], (err, quiz) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    db.all('SELECT id, question, option_a, option_b, option_c, option_d, points FROM questions WHERE quiz_id = ?', 
           [quizId], (err, questions) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ ...quiz, questions });
    });
  });
});

app.post('/api/quizzes/:id/submit', authenticateToken, (req, res) => {
  const quizId = req.params.id;
  const { answers, timeTaken } = req.body;
  const userId = req.user.id;

  // Get quiz questions with correct answers
  db.all('SELECT id, correct_answer, points FROM questions WHERE quiz_id = ?', 
         [quizId], (err, questions) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    let score = 0;
    let correctAnswers = 0;

    questions.forEach(question => {
      if (answers[question.id] === question.correct_answer) {
        score += question.points;
        correctAnswers++;
      }
    });

    // Save quiz attempt
    db.run(`INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, time_taken) 
            VALUES (?, ?, ?, ?, ?)`, 
           [userId, quizId, score, questions.length, timeTaken], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        score,
        totalQuestions: questions.length,
        correctAnswers,
        percentage: Math.round((correctAnswers / questions.length) * 100),
        timeTaken,
        attemptId: this.lastID
      });
    });
  });
});

// Admin routes
app.post('/api/admin/quizzes', authenticateToken, requireAdmin, (req, res) => {
  const { title, description, category, difficulty, timeLimit, questions } = req.body;
  const createdBy = req.user.id;

  db.run(`INSERT INTO quizzes (title, description, category, difficulty, time_limit, created_by) 
          VALUES (?, ?, ?, ?, ?, ?)`, 
         [title, description, category, difficulty, timeLimit, createdBy], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const quizId = this.lastID;

    // Insert questions
    const stmt = db.prepare(`INSERT INTO questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, points) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    
    questions.forEach(q => {
      stmt.run([quizId, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.points || 1]);
    });
    
    stmt.finalize();

    res.json({ id: quizId, message: 'Quiz created successfully' });
  });
});

app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  const stats = {};

  // Get total users
  db.get('SELECT COUNT(*) as total FROM users', (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    stats.totalUsers = result.total;

    // Get total quizzes
    db.get('SELECT COUNT(*) as total FROM quizzes', (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      stats.totalQuizzes = result.total;

      // Get total attempts
      db.get('SELECT COUNT(*) as total FROM quiz_attempts', (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        stats.totalAttempts = result.total;

        // Get average score
        db.get('SELECT AVG(score) as avg FROM quiz_attempts', (err, result) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          stats.averageScore = Math.round(result.avg || 0);

          res.json(stats);
        });
      });
    });
  });
});

app.get('/api/admin/recent-attempts', authenticateToken, requireAdmin, (req, res) => {
  db.all(`SELECT qa.*, u.username, q.title as quiz_title
          FROM quiz_attempts qa
          JOIN users u ON qa.user_id = u.id
          JOIN quizzes q ON qa.quiz_id = q.id
          ORDER BY qa.completed_at DESC
          LIMIT 10`, (err, attempts) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(attempts);
  });
});

// User routes
app.get('/api/user/attempts', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  db.all(`SELECT qa.*, q.title as quiz_title
          FROM quiz_attempts qa
          JOIN quizzes q ON qa.quiz_id = q.id
          WHERE qa.user_id = ?
          ORDER BY qa.completed_at DESC`, [userId], (err, attempts) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(attempts);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});