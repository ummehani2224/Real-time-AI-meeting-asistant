# Real-time AI Meeting Assistant

An intelligent meeting assistant that provides real-time transcription, summarization, and analysis of meetings using AI.

## Features

- **Real-time Transcription**: Convert meeting audio to text in real-time
- **Live Summaries**: Generate summaries as the meeting progresses
- **Final Analysis**: Comprehensive analysis and insights after the meeting ends
- **WebSocket Support**: Live updates and streaming data
- **Responsive UI**: Modern React-based frontend with Tailwind CSS
- **Docker Support**: Easy deployment with Docker and Docker Compose

## Tech Stack

### Backend
- **Framework**: FastAPI
- **Server**: Uvicorn
- **Database**: SQLAlchemy with SQLite
- **Real-time**: WebSockets
- **AI**: OpenAI API
- **Audio Processing**: ReportLab for PDF generation

### Frontend
- **Framework**: React with Vite
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Real-time Communication**: WebSockets

## Project Structure

```
.
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── database.py             # Database configuration
│   ├── models.py               # SQLAlchemy models
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile             # Backend Docker configuration
│   ├── services/
│   │   ├── ai_service.py       # AI/OpenAI integration
│   │   ├── email_service.py    # Email functionality
│   │   └── routers/
│   │       └── meetings.py     # Meeting API routes
│   └── venv/                   # Python virtual environment
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main React component
│   │   ├── main.jsx           # Entry point
│   │   ├── index.css          # Global styles
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx  # Dashboard page
│   │   │   └── MeetingRoom.jsx # Meeting room component
│   │   ├── hooks/
│   │   │   └── useMeetingSocket.js # WebSocket hook
│   │   └── services/
│   │       └── api.js         # API client
│   ├── package.json           # Node dependencies
│   ├── vite.config.js        # Vite configuration
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   ├── nginx.conf            # Nginx configuration
│   └── Dockerfile            # Frontend Docker configuration
├── docker-compose.yml         # Docker Compose configuration
└── .env                       # Environment variables
```

## Installation

### Prerequisites
- Python 3.13+
- Node.js 18+
- Docker (optional, for containerized deployment)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration (especially OpenAI API key)
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Project

### Local Development

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The backend will be available at `http://localhost:8000`
The frontend will be available at `http://localhost:5173`

### Docker Deployment

1. Build and run using Docker Compose:
```bash
docker-compose up --build
```

This will start both the backend (port 8000) and frontend (port 80).

## API Endpoints

### Meetings
- `GET /meetings` - List all meetings
- `POST /meetings` - Create a new meeting
- `GET /meetings/{meeting_id}` - Get meeting details
- `GET /meetings/{meeting_id}/transcript` - Get meeting transcript
- `GET /meetings/{meeting_id}/summary` - Get meeting summary

### WebSocket
- `WS /ws/meeting/{meeting_id}` - Real-time meeting updates and transcription

## Environment Variables

Create a `.env` file in the backend directory with:

```env
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=sqlite:///./sql_app.db
DEBUG=True
```

## Development Notes

- The backend uses SQLAlchemy ORM for database operations
- WebSockets provide real-time communication between frontend and backend
- Transcription and summarization are handled by OpenAI API
- The frontend uses React hooks for state management
- Tailwind CSS is used for styling

## Building for Production

### Backend
```bash
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
npm install
npm run build
```

## Troubleshooting

### Backend fails to start
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check that the Python version is 3.13 or higher
- Verify environment variables are set correctly

### Frontend won't load
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Ensure Node.js version is 18 or higher
- Check that the backend is running on port 8000

## License

MIT

## Contact

For issues and questions, please visit the [GitHub repository](https://github.com/ummehani2224/Real-time-AI-meeting-asistant)
