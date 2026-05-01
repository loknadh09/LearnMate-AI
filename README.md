# LearnMate AI 🎓

An intelligent educational platform that leverages AI to enhance learning experiences through PDF processing, interactive chat, quiz generation, and progress tracking.

## 🚀 Features

### 📚 PDF Processing
- Upload and extract content from PDF documents
- Intelligent text extraction and processing
- Support for educational materials and textbooks

### 💬 AI-Powered Chat
- Interactive chat interface for asking questions
- Context-aware responses based on uploaded materials
- Real-time AI assistance for learning

### 📝 Quiz Generation
- Automatic quiz creation from uploaded content
- Multiple choice questions and answers
- Personalized learning assessments

### 📊 Progress Tracking
- Monitor learning progress over time
- Performance analytics and insights
- Personalized learning paths

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Python** - Core programming language
- **Firecrawl** - Web scraping service
- **Ollama** - LLM integration(phi-3 model)
- **RAG (Retrieval-Augmented Generation)** - Advanced AI responses
- FAISS-open-source library for efficient similarity search and clustering of dense vectors

### Frontend
- **React** - Modern JavaScript library
- **Vite** - Fast build tool and dev server
- **JavaScript/JSX** - Component-based development
- **CSS3** - Modern styling

### Data Storage
- **JSON** - Student memory and progress data
- **SQLite** - Database support (optional)

## 📦 Installation

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/loknadh09/LearnMate-AI.git
   cd LearnMate-AI
   ```

2. **Set up Python environment**
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configurations
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

## 🎯 Usage

### Starting the Application

1. **Start the backend server**
   ```bash
   # From the root directory
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start the frontend development server**
   ```bash
   # From the frontend directory
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Using the Features

1. **Upload PDFs**: Use the PDF tab to upload educational materials
2. **Chat with AI**: Ask questions about your uploaded content
3. **Generate Quizzes**: Create quizzes automatically from your materials
4. **Track Progress**: Monitor your learning journey with detailed analytics

## 🔧 Configuration

### Environment Variables (.env)
```env
# API Keys (add your own)
FIRECRAWL_API_KEY=your_firecrawl_api_key
LLM_API_KEY=your_llm_api_key

# Database
DATABASE_URL=sqlite:///./learnmate.db

# Application Settings
DEBUG=True
SECRET_KEY=your_secret_key_here
```

### Backend Configuration
- Configure API endpoints in `app/routes/`
- Adjust AI model settings in `app/services/llm_service.py`
- Modify database settings in `app/services/memory_service.py`

### Frontend Configuration
- API endpoint configuration in `frontend/src/api.js`
- Component customization in `frontend/src/components/`
- Styling adjustments in `frontend/src/index.css`

## 📁 Project Structure

```
LearnMate-AI/
├── app/                          # Backend application
│   ├── __init__.py
│   ├── main.py                   # FastAPI application entry point
│   ├── database/                 # Database files
│   ├── routes/                   # API endpoints
│   │   ├── __init__.py
│   │   ├── ask.py               # Chat API
│   │   ├── pdf.py               # PDF processing
│   │   ├── progress.py          # Progress tracking
│   │   └── quiz.py              # Quiz generation
│   └── services/                # Business logic
│       ├── __init__.py
│       ├── firecrawl_service.py # Web scraping
│       ├── llm_service.py       # AI/ML services
│       ├── memory_service.py    # Data management
│       └── rag_service.py       # RAG implementation
├── frontend/                     # React frontend
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ChatTab.jsx
│   │   │   ├── PdfTab.jsx
│   │   │   ├── QuizTab.jsx
│   │   │   ├── ProgressTab.jsx
│   │   │   └── SummaryTab.jsx
│   │   ├── App.jsx              # Main application component
│   │   ├── api.js               # API client
│   │   └── main.jsx             # React entry point
│   ├── package.json
│   └── vite.config.js
├── requirements.txt              # Python dependencies
├── .env.example                  # Environment variables template
├── .gitignore                   # Git ignore file
└── README.md                    # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Documentation

### Main Endpoints

- `POST /pdf/upload` - Upload and process PDF files
- `POST /ask` - Ask questions about uploaded content
- `POST /quiz/generate` - Generate quizzes from content
- `GET /progress` - Get learning progress data
- `GET /progress/{user_id}` - Get user-specific progress

### API Documentation
Visit `http://localhost:8000/docs` for interactive API documentation.

## 🔒 Security

- Environment variables for sensitive data
- Input validation and sanitization
- Secure file upload handling
- API key protection

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 8000 and 5173 are available
2. **Environment variables**: Make sure `.env` file is properly configured
3. **Dependencies**: Run `pip install -r requirements.txt` and `npm install`
4. **PDF processing**: Ensure uploaded PDFs are not password-protected

### Getting Help

- Check the console logs for error messages
- Verify all environment variables are set
- Ensure all dependencies are installed correctly

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- FastAPI team for the excellent web framework
- React community for the amazing frontend library
- OpenAI and other AI providers for powerful language models
- The open-source community for various tools and libraries

## 📞 Contact

For questions, suggestions, or contributions:
- GitHub: [@loknadh09](https://github.com/loknadh09)
- Project Repository: https://github.com/loknadh09/LearnMate-AI

---

**Happy Learning with LearnMate AI! 🎓✨**
