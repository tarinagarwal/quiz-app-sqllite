# QuizMaster - Production Quiz Application

A comprehensive quiz platform built with React, TypeScript, Node.js, Express, and SQLite featuring JWT authentication, admin panel, and detailed analytics.

## Features

### User Features
- **Authentication**: Secure JWT-based login/register system
- **Quiz Taking**: Interactive quiz interface with timer and progress tracking
- **Results**: Detailed results with scoring, grading, and performance analytics
- **History**: Complete quiz attempt history with statistics
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

### Admin Features
- **Admin Dashboard**: Comprehensive analytics and statistics
- **Quiz Management**: Create, edit, and manage quizzes
- **User Analytics**: Monitor user performance and engagement
- **Real-time Reports**: Recent attempts and system statistics

### Technical Features
- **JWT Authentication**: Secure token-based authentication
- **SQLite Database**: Lightweight, efficient database storage
- **Role-based Access**: Admin and user roles with proper authorization
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Production Ready**: Optimized for production deployment

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository** (or extract the files)

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Install server dependencies**:
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Set up environment variables**:
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

### Running the Application

1. **Start the backend server**:
   ```bash
   cd server
   npm start
   ```
   The server will run on `http://localhost:3001`

2. **Start the frontend development server** (in a new terminal):
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

### Demo Credentials

- **Admin**: username: `admin`, password: `admin123`
- **User**: Register a new account or use any existing user

## Project Structure

```
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── contexts/          # React contexts (Auth)
│   ├── pages/             # Page components
│   ├── utils/             # Utility functions
│   └── App.tsx            # Main app component
├── server/                # Backend Node.js application
│   ├── index.js           # Main server file
│   ├── quiz.db            # SQLite database (created automatically)
│   └── package.json       # Server dependencies
└── README.md              # This file
```

## Database Schema

The application uses SQLite with the following tables:

- **users**: User accounts with authentication
- **quizzes**: Quiz metadata and configuration
- **questions**: Individual quiz questions and answers
- **quiz_attempts**: User quiz attempts and scores

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login

### Quizzes
- `GET /api/quizzes` - Get all quizzes
- `GET /api/quizzes/:id` - Get specific quiz
- `POST /api/quizzes/:id/submit` - Submit quiz answers

### User
- `GET /api/user/attempts` - Get user's quiz history

### Admin
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/recent-attempts` - Get recent quiz attempts
- `POST /api/admin/quizzes` - Create new quiz

## Features in Detail

### Authentication System
- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control
- Automatic token refresh handling

### Quiz System
- Timed quizzes with countdown
- Multiple choice questions
- Real-time progress tracking
- Automatic submission on timeout
- Detailed scoring and grading

### Admin Panel
- User management and analytics
- Quiz creation and management
- System statistics and reporting
- Recent activity monitoring

### Reporting & Analytics
- User performance tracking
- Quiz completion statistics
- Grade distribution analysis
- Time-based performance metrics

## Security Features
- Password hashing with bcrypt
- JWT token authentication
- SQL injection protection
- Input validation and sanitization
- Role-based access control

## Production Deployment

### Frontend
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service

### Backend
1. Set environment variables in production
2. Use a process manager like PM2
3. Set up reverse proxy with Nginx
4. Configure HTTPS/SSL certificates

## Technologies Used

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Axios for API calls
- Lucide React for icons

### Backend
- Node.js with Express
- SQLite for database
- JWT for authentication
- bcrypt for password hashing
- CORS for cross-origin requests

## License

This project is licensed under the MIT License.