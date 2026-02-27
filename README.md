# TrunalOps

A personal operations dashboard for task management, built with React and Node.js.

## Features

- **Task Management** - Create, edit, and delete tasks with status, priority, and deadlines
- **Multiple Views** - Dashboard, Kanban board, Timeline, and List views
- **Inline Status Change** - Quick status updates directly from the task list
- **Task Detail Modal** - Click any task to view/edit all details
- **Deadline System** - Set start dates and deadlines with overdue detection
- **Notification Bell** - Get alerts for overdue and due-today tasks
- **AI Chatbot** - Query tasks using natural language ("show pending tasks", "what's overdue?")
- **Date Filtering** - Filter by Today, This Week, This Month, or custom range
- **Personal Tasks** - Dedicated view for personal task management
- **Daily Dump** - Quick notes for daily logging
- **Search** - Global search across all tasks and notes
- **Analytics** - Charts and stats on the dashboard

## Tech Stack

**Frontend:**
- React 18
- Vite
- TailwindCSS
- Chart.js
- react-icons

**Backend:**
- Node.js
- Express
- sql.js (SQLite in JavaScript)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/trun123424/trunal-ops.git
cd trunal-ops
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the App

1. Start the backend server:
```bash
cd backend
node src/index.js
```
The API will be available at `http://localhost:3001`

2. Start the frontend dev server:
```bash
cd frontend
npm run dev
```
The app will be available at `http://localhost:5173`

## Project Structure

```
trunal-ops/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   └── database.js    # SQLite database module
│   │   ├── routes/
│   │   │   ├── tasks.js       # Task CRUD endpoints
│   │   │   ├── notes.js       # Notes endpoints
│   │   │   ├── projects.js    # Projects endpoints
│   │   │   ├── search.js      # Search endpoint
│   │   │   └── analytics.js   # Analytics endpoint
│   │   └── index.js           # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIChatbot.jsx
│   │   │   ├── DateFilter.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── TaskDetailModal.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── PersonalTasks.jsx
│   │   │   ├── Kanban.jsx
│   │   │   ├── Timeline.jsx
│   │   │   ├── DailyDump.jsx
│   │   │   └── Reports.jsx
│   │   ├── services/
│   │   │   └── api.js         # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/notes` | Get all notes |
| POST | `/api/notes` | Create a note |
| DELETE | `/api/notes/:id` | Delete a note |
| GET | `/api/projects` | Get all projects |
| GET | `/api/search?q=` | Search tasks and notes |
| GET | `/api/analytics` | Get analytics data |

## License

MIT
