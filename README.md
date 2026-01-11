# Therapy Session Processor

A full-stack web application for therapists to upload, process, and analyze therapy session recordings. The system provides transcription, speaker identification, summarization, and vector embeddings for semantic search capabilities.

## 🏗️ High-Level Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │───▶│   NestJS        │───▶│   Supabase      │
│   Frontend      │    │   Backend       │    │   PostgreSQL    │
│                 │    │                 │    │   (pgvector)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   OpenAI API    │
                       │   - Whisper     │
                       │   - GPT-3.5     │
                       │   - Embeddings  │
                       └─────────────────┘
```

### Tech Stack
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: NestJS + TypeScript
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **AI Services**: OpenAI (Whisper, GPT-3.5-turbo, text-embedding-3-small)
- **File Handling**: Multer for audio uploads

### Data Flow
1. **Upload**: Therapist uploads audio file via drag-and-drop interface
2. **Storage**: File metadata stored in database, processing status set to "processing"
3. **Transcription**: Audio sent to OpenAI Whisper API for speech-to-text
4. **Speaker Identification**: Basic speaker separation using segment analysis
5. **Summarization**: Full transcript processed by GPT-3.5-turbo for session summary
6. **Vectorization**: Transcript and summary converted to embeddings using OpenAI
7. **Storage**: All results stored in Supabase with vector data for semantic search
8. **Display**: Frontend shows processed results in real-time

## 📊 Data Model

### Core Tables

#### `sessions`
```sql
- id (UUID, primary key)
- created_at (timestamp)
- updated_at (timestamp) 
- filename (varchar)
- file_size (integer)
- duration_seconds (integer)
- status (enum: processing, completed, failed)
- transcript (text)
- summary (text)
- speaker_count (integer)
- vector_status (enum: pending, processing, completed, failed)
```

#### `speakers`
```sql
- id (UUID, primary key)
- session_id (UUID, foreign key)
- speaker_label (varchar)
- total_speaking_time (integer) -- seconds
- created_at (timestamp)
```

#### `transcript_segments`
```sql
- id (UUID, primary key)
- session_id (UUID, foreign key)
- speaker_id (UUID, foreign key)
- start_time (decimal) -- seconds
- end_time (decimal) -- seconds  
- text (text)
- confidence (decimal) -- transcription confidence
- created_at (timestamp)
```

#### `session_vectors`
```sql
- id (UUID, primary key)
- session_id (UUID, foreign key)
- content_type (enum: transcript, summary, segment)
- segment_id (UUID, foreign key, nullable)
- vector (vector[1536]) -- OpenAI embedding dimensions
- metadata (jsonb)
- created_at (timestamp)
```

### Relationships
- One session has many speakers (1:N)
- One session has many transcript segments (1:N) 
- One speaker has many transcript segments (1:N)
- One session has many vectors (1:N)
- Vectors can reference specific segments (N:1, optional)

## 🔧 Processing Pipeline

### 1. Audio Transcription
- **Service**: OpenAI Whisper API
- **Input**: Audio buffer + filename
- **Output**: Full transcript + timestamped segments
- **Features**: 
  - Supports multiple audio formats (MP3, WAV, M4A, OGG, WebM)
  - Returns segment-level timestamps
  - Provides transcription confidence scores

### 2. Speaker Identification
- **Method**: Simple alternating speaker detection
- **Logic**: Assigns speakers based on segment patterns
- **Improvement Opportunity**: Could integrate with speaker diarization services
- **Output**: Speaker labels + speaking time calculations

### 3. Session Summarization  
- **Service**: OpenAI GPT-3.5-turbo
- **Prompt Engineering**: 
  - System role focused on therapeutic context
  - Extracts key topics, insights, emotional states
  - Identifies therapeutic techniques and action items
- **Output**: Structured summary for therapist review

### 4. Vector Embeddings
- **Service**: OpenAI text-embedding-3-small (1536 dimensions)
- **Content Types**:
  - Full transcript embedding
  - Summary embedding  
  - Individual segment embeddings (future enhancement)
- **Storage**: PostgreSQL with pgvector extension
- **Use Case**: Enables semantic search across sessions

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- OpenAI API key

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd therapy-session-processor

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### 2. Database Setup

1. Create a new Supabase project at https://supabase.com
2. In your Supabase SQL editor, run the schema from `supabase-schema.sql`
3. Enable the `vector` extension in your database:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

### 3. Environment Configuration

#### Backend (.env)
```env
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration  
OPENAI_API_KEY=your_openai_api_key

# File Upload Configuration
MAX_FILE_SIZE=50MB
ALLOWED_AUDIO_FORMATS=mp3,wav,m4a,ogg,webm
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Application

```bash
# Terminal 1: Start backend
cd backend
npm run start:dev

# Terminal 2: Start frontend  
cd frontend
npm run dev
```

### 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/health

## 🎯 Core Features

### ✅ Implemented Features

1. **Audio Upload**
   - Drag and drop interface
   - File type validation (MP3, WAV, M4A, OGG, WebM)  
   - File size limit (50MB)
   - Real-time upload progress

2. **Session Processing**
   - Automatic transcription via OpenAI Whisper
   - Basic speaker identification and labeling
   - AI-powered session summarization
   - Background processing with status updates

3. **Vector Embeddings**
   - Full transcript vectorization
   - Summary vectorization
   - Storage in Supabase with pgvector
   - Foundation for semantic search

4. **Data Persistence**
   - Comprehensive session metadata
   - Speaker information and speaking times
   - Timestamped transcript segments
   - Vector embeddings with metadata

5. **Frontend Interface**
   - Session upload interface
   - Real-time sessions list with status indicators
   - Detailed session view with tabs
   - Processing status indicators
   - Responsive design with Tailwind CSS

### 🎁 Nice-to-Have Features (Future Enhancements)

1. **Semantic Search**
   - Cross-session search interface
   - Vector similarity matching
   - Relevant segment highlighting

2. **Advanced Speaker Features**
   - More sophisticated speaker diarization
   - Speaker identity persistence across sessions
   - Voice characteristics analysis

3. **Enhanced Analytics**
   - Session duration analysis
   - Speaking time distribution charts
   - Therapeutic technique frequency analysis

## 🛠️ API Endpoints

### Sessions API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sessions/upload` | Upload audio file for processing |
| GET | `/sessions` | Get all sessions list |
| GET | `/sessions/:id` | Get detailed session with speakers/segments |
| DELETE | `/sessions/:id` | Delete a session and all related data |
| GET | `/health` | API health check |

### Example Responses

#### Session Upload Response
```json
{
  "sessionId": "uuid-here",
  "message": "Session uploaded successfully. Processing started."
}
```

#### Session Detail Response
```json
{
  "id": "uuid",
  "created_at": "2024-01-11T10:00:00Z",
  "filename": "therapy_session.mp3",
  "status": "completed",
  "transcript": "Full transcript text...",
  "summary": "AI generated summary...",
  "speaker_count": 2,
  "vector_status": "completed",
  "speakers": [
    {
      "id": "uuid",
      "speaker_label": "Speaker 1", 
      "total_speaking_time": 1245
    }
  ],
  "segments": [
    {
      "id": "uuid",
      "speaker_label": "Speaker 1",
      "start_time": 0.0,
      "end_time": 5.2,
      "text": "Hello, how are you feeling today?",
      "confidence": 0.95
    }
  ]
}
```

## ⚖️ Assumptions and Trade-offs

### Assumptions Made

1. **Audio Quality**: Assumes reasonably clear audio with minimal background noise
2. **Session Length**: Designed for typical therapy sessions (30-90 minutes)
3. **Language**: Optimized for English language sessions
4. **Speaker Count**: Assumes 2-4 speakers maximum (therapist + client(s))
5. **Internet Connectivity**: Requires stable connection for OpenAI API calls

### Trade-offs and Design Decisions

#### Chosen Approach: Simplified Speaker Identification
- **Decision**: Use basic alternating speaker detection
- **Trade-off**: Less accurate than advanced diarization but faster and simpler
- **Alternative**: Could integrate with services like AssemblyAI or rev.ai for better speaker separation
- **Rationale**: Good enough for MVP while keeping complexity manageable

#### Chosen Approach: OpenAI for All AI Services  
- **Decision**: Single provider for transcription, summarization, and embeddings
- **Trade-off**: Higher cost but consistent quality and simpler integration
- **Alternative**: Mix of services (Whisper local, other providers)
- **Rationale**: Prioritized development speed and API reliability

#### Chosen Approach: Supabase with pgvector
- **Decision**: Use Supabase's managed PostgreSQL with vector extension
- **Trade-off**: Less control than dedicated vector database like Pinecone
- **Alternative**: Separate vector database (Pinecone, Weaviate, etc.)
- **Rationale**: Reduces infrastructure complexity, keeps all data in one place

#### Chosen Approach: Background Processing
- **Decision**: Process audio asynchronously after upload
- **Trade-off**: Users must wait for results vs immediate processing
- **Alternative**: Real-time processing with WebSocket updates  
- **Rationale**: Better user experience for long files, allows system to handle multiple uploads

### Scalability Considerations

#### Current Limitations
- Single-threaded processing per session
- In-memory audio handling
- No processing queue management
- Local file storage during processing

#### Scaling Solutions (Future)
- **Processing Queue**: Add Redis/Bull for job management
- **File Storage**: Move to cloud storage (S3, Supabase Storage)
- **Caching**: Add Redis for session metadata caching
- **Load Balancing**: Multiple backend instances with load balancer
- **Database**: Read replicas for analytics queries

### Security Considerations

#### Implemented
- Input validation on file uploads
- File type and size restrictions
- CORS configuration
- Environment variable separation

#### Missing (Production Requirements)
- Authentication and authorization
- File encryption at rest
- API rate limiting  
- Input sanitization for AI prompts
- Audit logging
- HIPAA compliance measures

## 🚀 Future Enhancements

### Phase 1: Core Improvements
- [ ] Advanced speaker diarization integration
- [ ] Real-time processing status via WebSockets
- [ ] Basic semantic search interface
- [ ] Session deletion functionality

### Phase 2: Analytics and Insights  
- [ ] Session analytics dashboard
- [ ] Therapeutic technique identification
- [ ] Progress tracking across sessions
- [ ] Export functionality (PDF reports)

### Phase 3: Enterprise Features
- [ ] Multi-user authentication
- [ ] Role-based access control
- [ ] Client management system
- [ ] HIPAA compliance features
- [ ] Integration with EHR systems

### Phase 4: Advanced AI
- [ ] Emotion detection in speech
- [ ] Therapeutic outcome prediction
- [ ] Personalized session recommendations
- [ ] Multi-language support

## 📝 Development Notes

### Code Organization
- **Backend**: Clean architecture with modules, services, controllers
- **Frontend**: Component-based React with TypeScript
- **Database**: Normalized schema with proper indexing
- **API**: RESTful design with consistent error handling

### Testing Strategy (Recommended)
- Unit tests for services and utilities
- Integration tests for API endpoints  
- E2E tests for critical user workflows
- Load testing for audio processing pipeline

### Monitoring (Production Ready)
- Application performance monitoring
- Error tracking and alerting
- Database query performance monitoring
- Audio processing success/failure rates

---

## 📞 Support

For questions or issues:
1. Check the API health endpoint: `GET /health`
2. Verify environment variables are correctly set
3. Ensure Supabase database schema is properly installed
4. Check OpenAI API key permissions and quota

This application demonstrates modern full-stack development with AI integration, suitable for real-world therapy practice management with proper production hardening.