# Sirius 0.2 - AI Intelligence Platform

A comprehensive AI-powered platform built with modern technologies for intelligent conversations, document processing, and data analysis.

## 🚀 Features

- **AI-Powered Chat**: GPT-4o integration for intelligent conversations
- **Document Processing**: Upload, process, and search documents with vector embeddings
- **Audio Transcription**: Whisper integration for speech-to-text
- **Vector Search**: Pinecone/Weaviate integration for semantic search
- **Real-time Processing**: Fast and responsive AI interactions
- **Modern UI**: Beautiful React interface with Tailwind CSS
- **Scalable Architecture**: Microservices with Docker support

## 🛠️ Tech Stack

### Backend
- **Node.js/Express**: RESTful API server
- **Redis**: Caching and session storage
- **PostgreSQL**: Primary database
- **OpenAI GPT-4o**: Language model
- **Whisper**: Speech-to-text
- **LangChain/LangGraph**: AI orchestration

### Frontend
- **React 18**: Modern UI framework
- **Tailwind CSS**: Utility-first styling
- **Zustand**: State management
- **React Router**: Navigation
- **Axios**: HTTP client

### Data Processing
- **Python**: Data processing and NLP
- **NLTK**: Natural language processing
- **Pandas**: Data manipulation
- **spaCy**: Advanced NLP
- **Sentence Transformers**: Embeddings

### Vector Databases
- **Pinecone**: Vector similarity search
- **Weaviate**: Alternative vector database

## 📋 Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd avinci
```

### 2. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit environment variables
nano .env
```

### 3. Using Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Manual Setup

#### Backend Setup
```bash
cd backend
npm install
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

#### Data Processing Setup
```bash
cd data-processing
pip install -r requirements.txt
python main.py
```

## 🔧 Configuration

### Environment Variables

Key environment variables to configure:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/avinci
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key

# Security
JWT_SECRET=your_jwt_secret
```

### Vector Database Setup

#### Pinecone
1. Create a Pinecone account
2. Create an index with dimension 3072
3. Add your API key to environment variables

#### Weaviate
1. Set up Weaviate instance
2. Configure URL and API key
3. Update vector provider in settings

## 📁 Project Structure

```
avinci/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Database and AI configurations
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── utils/          # Utility functions
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand stores
│   │   └── services/       # API services
│   └── package.json
├── data-processing/        # Python data processing
│   ├── services/           # Processing services
│   ├── config/             # Configuration
│   └── requirements.txt
├── docker-compose.yml      # Docker orchestration
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### AI Services
- `POST /api/ai/generate` - Generate text
- `POST /api/ai/embeddings` - Generate embeddings
- `POST /api/ai/transcribe` - Transcribe audio

### Vector Operations
- `POST /api/vector/documents` - Add document
- `POST /api/vector/search` - Search documents
- `POST /api/vector/documents/batch` - Batch upload

### Data Management
- `GET /api/data/user` - Get user data
- `PUT /api/data/user` - Update user data
- `POST /api/data/conversation` - Store conversation

## 🧪 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Code Quality
```bash
# Lint backend
cd backend
npm run lint

# Lint frontend
cd frontend
npm run lint
```

### Database Migrations
```bash
# Run migrations
cd backend
npm run migrate

# Seed database
npm run seed
```

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd backend
npm run build
```

### Docker Production
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring

- Health checks available at `/health`
- Logs stored in `logs/` directory
- Redis monitoring via Redis CLI
- Database monitoring via PostgreSQL tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API documentation

## 🔄 Updates

- **v0.1.0**: Initial release with core features
  - Complete development environment setup
  - Backend API with authentication and AI services
  - React frontend with modern UI
  - Python data processing pipeline
  - Docker containerization
  - Vector database integration

---

Built with ❤️ using modern AI technologies
