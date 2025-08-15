# Electronic Industry Agent

A comprehensive business intelligence and data analysis platform with AI-powered SQL generation capabilities. This project features a **Python FastAPI backend** and a **Next.js frontend** for seamless data visualization and natural language to SQL conversion.

## 🏗️ Architecture

- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, and shadcn/ui components
- **Backend**: Python 3.12+ with FastAPI for high-performance API endpoints
- **Database**: PostgreSQL with complex schema for enterprise-level data
- **AI Integration**: OpenAI GPT and Google Gemini for natural language SQL generation
- **Charts**: Recharts for interactive data visualizations

## 🚀 Quick Start

### Prerequisites

- **Python 3.12+** (required)
- **Node.js 18+** and **pnpm**
- **PostgreSQL** database

### Automated Startup (Recommended)

The easiest way to start both frontend and backend services:

```bash
# Using Python script (recommended)
python3 start.py

# Or using shell script
./start.sh

# Or using npm/pnpm
pnpm start:all
```

This will:

- ✅ Check all prerequisites
- 📦 Install dependencies automatically
- 🔧 Create `.env` file template
- 🚀 Start both backend (port 8000) and frontend (port 3000)
- 📊 Provide real-time monitoring

### Manual Setup

If you prefer manual setup:

#### 1. Clone and Setup Environment

```bash
git clone <repository-url>
cd 08-09-Electronic-Industry-agent-2

# Create and configure .env file
cp .env.example .env
# Edit .env with your actual configuration
```

#### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### 3. Install Node.js Dependencies

```bash
pnpm install
```

#### 4. Start Backend

```bash
# Development mode with auto-reload
pnpm backend:dev

# Or production mode
pnpm backend:start
```

#### 5. Start Frontend

```bash
# In a new terminal
pnpm dev
```

## 📋 Environment Configuration

Create a `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/dbname

# LLM Configuration
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_ENDPOINT=https://api.openai.com/v1/chat/completions
OPENAI_MODEL=gpt-3.5-turbo

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent

# Frontend Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## 🌐 API Endpoints

The Python backend provides the following REST API endpoints:

### Core APIs

- `POST /api/call-llm` - Generate SQL from natural language
- `POST /api/call-llm-stream` - Streaming SQL generation with thinking process
- `POST /api/sql-query` - Execute SQL queries safely
- `GET /health` - Health check endpoint

### OpenAPI Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🎯 Key Features

### 🤖 AI-Powered SQL Generation

- Natural language to SQL conversion
- Support for OpenAI GPT and Google Gemini
- Real-time streaming responses with thinking process
- SQL validation and safety checks

### 📊 Advanced Data Visualization

- Interactive charts (line, bar, pie, area)
- Dynamic chart configuration
- Real-time data updates
- Export capabilities

### 🔒 Enterprise Security

- SQL injection prevention
- Read-only query enforcement
- Input validation and sanitization
- CORS protection

### 🎨 Modern UI/UX

- Responsive design with shadcn/ui
- Dark/light theme support
- Interactive dashboard
- Real-time chat interface

## 🛠️ Development

### Project Structure

```
📁 project-root/
├── 📁 backend/              # Python FastAPI backend
│   └── main.py             # Main application file
├── 📁 app/                 # Next.js pages (App Router)
├── 📁 components/          # Reusable React components
├── 📁 api-clients/         # Frontend API clients
├── 📁 hooks/               # Custom React hooks
├── 📁 lib/                 # Utility libraries
├── 📁 types/               # TypeScript type definitions
├── requirements.txt        # Python dependencies
├── package.json           # Node.js dependencies
├── start.py               # Python startup script
└── start.sh               # Shell startup script
```

### Available Scripts

```bash
# Start everything (recommended)
pnpm start:all              # Python startup script
pnpm start:all:shell        # Shell startup script

# Individual services
pnpm dev                    # Frontend only
pnpm backend:dev            # Backend only (development)
pnpm backend:start          # Backend only (production)

# Build and deployment
pnpm build                  # Build frontend
pnpm start                  # Start production frontend
pnpm lint                   # Run ESLint
```

### Development Tips

1. **Backend Development**: The FastAPI backend supports hot-reload in development mode
2. **Frontend Development**: Next.js provides fast refresh for React components
3. **API Testing**: Use the Swagger UI at http://localhost:8000/docs
4. **Database**: Ensure PostgreSQL is running and accessible
5. **Environment**: Keep `.env` file updated with valid API keys

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**

- ✅ Check Python version (3.12+ required)
- ✅ Verify PostgreSQL connection in `DATABASE_URL`
- ✅ Ensure all dependencies are installed: `pip install -r requirements.txt`

**Frontend won't start:**

- ✅ Check Node.js version (18+ required)
- ✅ Install dependencies: `pnpm install`
- ✅ Verify backend URL in `.env`: `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000`

**API calls failing:**

- ✅ Check if backend is running on port 8000
- ✅ Verify CORS settings in backend
- ✅ Check browser console for specific error messages

**SQL queries failing:**

- ✅ Verify database connection and credentials
- ✅ Check SQL query syntax (PostgreSQL compatible)
- ✅ Ensure queries are read-only (SELECT statements)

### Log Files

When using the startup scripts, logs are saved to:

- `backend.log` - Python FastAPI backend logs
- `frontend.log` - Next.js frontend logs

Monitor logs in real-time:

```bash
tail -f backend.log
tail -f frontend.log
```

## 🚀 Deployment

### Production Deployment

1. **Build Frontend:**

   ```bash
   pnpm build
   ```

2. **Start Services:**

   ```bash
   # Backend
   python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000

   # Frontend
   pnpm start
   ```

3. **Environment Variables:**
   - Set production database URL
   - Configure LLM API keys
   - Update `NEXT_PUBLIC_BACKEND_URL` for production backend

### Docker Deployment (Optional)

A Docker setup can be configured for containerized deployment. The application is designed to be cloud-native and scalable.

## 📖 Documentation

- [Chart Components Usage](./docs/chart-components-usage.md)
- [Chat Interface](./docs/chat-interface.md)
- [Implementation Summary](./docs/implementation-summary.md)
- [LLM Configuration](./docs/llm-config.md)
- [SQL Query Improvements](./docs/sql-query-improvements.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the logs (`backend.log`, `frontend.log`)
3. Open an issue on GitHub with:
   - Error messages
   - Steps to reproduce
   - Environment details (OS, Python/Node versions)

---

**Happy coding! 🎉**
