# InterviewAI — AI Mock Interview Platform

A comprehensive, full-stack AI Mock Interview Platform designed for college students, freshers, and job seekers to prepare for campus placements, technical interviews, and behavioral HR rounds.

Built with **HTML5, CSS3, JavaScript (ES6+), React.js, Node.js, Express.js, MongoDB (Mongoose), and Google Gemini API**.

---

## 🌟 Key Features

1. **Role-Specific AI Questions**: Gemini dynamically generates interview questions tailored to the candidate's exact target role (e.g., Software Developer, Frontend Developer, Backend Developer, Java Developer, Data Analyst), experience level (Fresher to Experienced), interview type (Technical, HR, Behavioral, Mixed), and selected skills.
2. **Interactive AI Interview Room**:
   - Sequential question delivery with question counter (e.g. *Question 2 of 5*).
   - Real-time countdown timer for each question with visual urgency warnings.
   - Word counter and structured response drafting.
   - Dynamic follow-up probing when the AI identifies nuances in the candidate's answer.
   - Idempotency and duplicate submission prevention.
3. **Multi-Dimensional AI Evaluation Report**:
   - Overall score calculated out of 100.
   - 4-category score breakdown: Technical Knowledge, Problem Solving, Communication, and Answer Relevance.
   - Observed strengths and areas for growth.
   - Question-by-question breakdown with specific AI critique and ideal model answers.
   - Actionable 5-step placement preparation roadmap.
   - Recommended study topics to revise before real interviews.
4. **Student Dashboard & Analytics**:
   - Live metrics: Total interviews completed, placement readiness status, questions answered, average score.
   - Visual score progress bars for all core dimensions.
   - Quick launch for new interview sessions.
5. **Interview History & Ownership**:
   - Complete history with role, difficulty, score pills, and date.
   - Protected data isolation—users only access and manage their own sessions.
   - One-click deletion with confirmation dialog.
6. **Candidate Profile Management**:
   - Manage target roles, experience tier, bio, and technical skills.
7. **Production Security**:
   - Passwords hashed using `bcryptjs` with salt rounds.
   - Stateless JWT authentication in `Authorization` Bearer headers and HttpOnly cookies.
   - Secure server-side Gemini API calls via official `@google/genai` SDK (API keys never exposed to frontend).

---

## 🏗️ Technology Stack

- **Frontend**: HTML5, CSS3 (plain CSS with custom design system, no CSS frameworks), JavaScript (ES6+), React.js (Hooks, Context API), React Router 6, Fetch API.
- **Backend**: Node.js, Express.js, REST API architecture, JWT authentication, cookie-parser, CORS.
- **Database**: MongoDB Atlas or local MongoDB server via Mongoose ODM (with automatic fallback store for instant preview).
- **Artificial Intelligence**: Google Gemini API via official `@google/genai` SDK (`gemini-3.8-flash`).

---

## 📁 Project Structure

```
interview-ai/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & persistent storage
│   ├── controllers/
│   │   ├── authController.js      # Register, login, getMe, logout
│   │   ├── interviewController.js # Create session, progression, evaluation
│   │   ├── dashboardController.js # Statistics & category averages
│   │   └── profileController.js   # Candidate profile management
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT authentication guard
│   │   └── errorMiddleware.js     # 404 and global error handlers
│   ├── models/
│   │   ├── User.js                # Mongoose schema for candidate users
│   │   └── Interview.js           # Mongoose schema for interview sessions
│   ├── routes/
│   │   ├── authRoutes.js          # /api/auth endpoints
│   │   ├── interviewRoutes.js     # /api/interviews endpoints
│   │   ├── dashboardRoutes.js     # /api/dashboard endpoints
│   │   └── profileRoutes.js       # /api/profile endpoints
│   ├── services/
│   │   └── geminiService.js       # Google Gemini SDK integration
│   ├── server.js                  # Standalone backend server entry
│   ├── package.json               # Backend dependencies
│   └── .env.example               # Backend environment template
├── src/
│   ├── components/
│   │   ├── Navbar.jsx             # Top navigation & user session badge
│   │   ├── Footer.jsx             # Footer with placement tracks
│   │   └── ProtectedRoute.jsx     # Route authentication guard
│   ├── context/
│   │   └── AuthContext.jsx        # Global authentication state
│   ├── pages/
│   │   ├── HomePage.jsx           # Landing page with features & hero
│   │   ├── LoginPage.jsx          # Candidate login with validation
│   │   ├── RegisterPage.jsx       # Candidate registration
│   │   ├── DashboardPage.jsx      # Metrics, progress bars & recent tests
│   │   ├── InterviewSetupPage.jsx # Role, difficulty & skill selectors
│   │   ├── InterviewRoomPage.jsx  # Live timer, question progression
│   │   ├── ResultsPage.jsx        # Final report, score circle & model answers
│   │   ├── HistoryPage.jsx        # Past interviews table & deletion
│   │   └── ProfilePage.jsx        # Candidate profile & skills editor
│   ├── services/
│   │   └── api.js                 # Frontend REST API client
│   ├── App.tsx                    # Root routing component
│   ├── index.css                  # Custom plain CSS design system
│   └── main.tsx                   # React root entry point
├── server.ts                      # Unified full-stack dev/production server
├── metadata.json
├── package.json
└── README.md
```

---

## ⚙️ Environment Variables

Create a `.env` file (or set via hosting provider) with:

```env
# Port for the server (default: 3000 in AI Studio / 5000 for standalone backend)
PORT=3000

# MongoDB URI (MongoDB Atlas or local MongoDB instance)
# Local: mongodb://localhost:27017/interview_ai
# Atlas: mongodb+srv://<username>:<password>@cluster0.mongodb.net/interview_ai?retryWrites=true&w=majority
MONGODB_URI=mongodb://localhost:27017/interview_ai

# JWT Secret for candidate session authentication
JWT_SECRET=your_super_secret_jwt_key_here_at_least_32_characters

# Google Gemini API Key (Automatically injected in AI Studio)
GEMINI_API_KEY=your_gemini_api_key_from_ai_studio

# Frontend client URL (used for CORS in standalone mode)
CLIENT_URL=http://localhost:5173
```

---

## 🚀 How to Run Locally

### Option A: Unified Full-Stack Runner (Recommended)

Run both the Express backend API and React frontend together:

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev
```

Open your browser at `http://localhost:3000`.

---

### Option B: Separate Frontend and Backend Servers

If you prefer running two separate terminals:

#### Terminal 1 — Backend:
```bash
cd backend
npm install
npm run dev
# Backend runs on http://localhost:5000
```

#### Terminal 2 — Frontend:
```bash
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new student account (`name`, `email`, `password`, `targetRole`, `experienceLevel`).
- `POST /api/auth/login` — Authenticate student and issue JWT cookie/token (`email`, `password`).
- `GET /api/auth/me` — Retrieve currently logged-in candidate profile (Protected).
- `POST /api/auth/logout` — Invalidate session and clear authentication cookie.

### Interviews (`/api/interviews`)
- `POST /api/interviews` — Create a new interview session and prompt Gemini to generate role-specific questions.
- `GET /api/interviews` — Retrieve all past interview sessions belonging to the authenticated user.
- `GET /api/interviews/:id` — Retrieve an interview session and its evaluation report.
- `POST /api/interviews/:id/next-question` — Fetch the current or next question in the sequence.
- `POST /api/interviews/:id/answers` — Submit an answer for the current question; runs Gemini evaluation, saves score, and generates follow-up question if appropriate.
- `POST /api/interviews/:id/finish` — Complete session and generate the final comprehensive evaluation report.
- `DELETE /api/interviews/:id` — Delete an interview session owned by the authenticated student.

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats` — Retrieve aggregated placement readiness metrics, average score, category averages, and recent sessions.

### Profile (`/api/profile`)
- `GET /api/profile` — Fetch profile details, skills, and cumulative statistics.
- `PATCH /api/profile` — Update candidate profile (`name`, `targetRole`, `experienceLevel`, `bio`, `skills`).

---

## 🎓 College Placement Preparation Tips

1. **Answer Structure**: State the core definition in 1-2 clear sentences, explain the internal mechanism (e.g. how the event loop or reconciliation operates), and cite a real-world scenario.
2. **Handle Follow-Ups**: When the AI poses a follow-up question, it indicates an interesting hook was detected in your response—elaborate with concrete code or architectural considerations.
3. **Review Model Answers**: After completing a session, inspect the suggested model answer in the Results page to compare your thought structure with industry benchmarks.
