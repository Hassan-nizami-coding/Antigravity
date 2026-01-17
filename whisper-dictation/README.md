# Whisper Dictation - Production Speech-to-Text Application

A production-grade web application for speech-to-text transcription using the **Whisper V3** model via the **Groq API**. This application features a stunning, Apple-level polished UI with real-time audio visualization, dark mode support, and robust error handling.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Audio Recorder │  │   Transcription │  │   UI Components │ │
│  │  (MediaRecorder)│  │   Display/Edit  │  │   (Framer Motion)│ │
│  └────────┬────────┘  └────────┬────────┘  └─────────────────┘ │
│           │                    │                                 │
│           ▼                    ▼                                 │
│  ┌─────────────────────────────────────────┐                    │
│  │           API Service Layer             │                    │
│  │     (FormData Upload to Backend)        │                    │
│  └────────────────────┬────────────────────┘                    │
└───────────────────────┼─────────────────────────────────────────┘
                        │ HTTP POST /api/transcribe
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Express + TypeScript)                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Rate Limiter  │  │   Audio Handler │  │  Error Handler  │ │
│  │   (express-rate)│  │   (Multer)      │  │  (Centralized)  │ │
│  └────────┬────────┘  └────────┬────────┘  └─────────────────┘ │
│           │                    │                                 │
│           ▼                    ▼                                 │
│  ┌─────────────────────────────────────────┐                    │
│  │        Transcription Controller         │                    │
│  │     (Validation, Request Handling)      │                    │
│  └────────────────────┬────────────────────┘                    │
│                       │                                          │
│                       ▼                                          │
│  ┌─────────────────────────────────────────┐                    │
│  │       Transcription Service             │                    │
│  │   (Whisper V3 via Groq API)             │                    │
│  │   - Retry logic with backoff            │                    │
│  │   - Format detection                    │                    │
│  │   - Error handling                      │                    │
│  └────────────────────┬────────────────────┘                    │
└───────────────────────┼─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Groq API (Whisper V3)                       │
│                                                                  │
│  Endpoint: https://api.groq.com/openai/v1/audio/transcriptions  │
│  Model: whisper-large-v3                                         │
│  Response: { text, language, duration, segments }                │
└─────────────────────────────────────────────────────────────────┘
```

## Audio Flow

```
1. User clicks "Record" button
                │
                ▼
2. Browser requests microphone permission (getUserMedia)
                │
                ▼
3. MediaRecorder captures audio chunks (WebM/Opus format)
   └── Audio level monitoring via Web Audio API (AudioContext + AnalyserNode)
                │
                ▼
4. User clicks "Stop" → MediaRecorder.stop()
                │
                ▼
5. Audio chunks combined into Blob
                │
                ▼
6. Frontend sends Blob via FormData to POST /api/transcribe
                │
                ▼
7. Backend (Multer) receives file in memory
                │
                ▼
8. Backend validates:
   - File exists
   - File size ≤ 25MB
   - Audio format supported
                │
                ▼
9. Backend sends to Groq API:
   - FormData with audio file
   - Model: whisper-large-v3
   - Response format: verbose_json
                │
                ▼
10. Groq returns transcription
                │
                ▼
11. Backend formats response and returns to frontend
                │
                ▼
12. Frontend displays editable transcription result
```

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Groq API key (already configured)

### Installation

```bash
# Navigate to project
cd whisper-dictation

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd whisper-dictation/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd whisper-dictation/frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

## Project Structure

### Backend Structure

```
backend/
├── src/
│   ├── config/
│   │   └── index.ts          # Centralized configuration with Zod validation
│   ├── controllers/
│   │   ├── health.ts         # Health check endpoints
│   │   └── transcription.ts  # Transcription request handling
│   ├── middleware/
│   │   └── index.ts          # Express middleware (error handling, logging, CORS)
│   ├── routes/
│   │   └── index.ts          # API route definitions
│   ├── services/
│   │   └── transcription.ts  # Groq Whisper V3 service with retry logic
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── utils/
│   │   ├── audio.ts          # Audio format validation utilities
│   │   ├── errors.ts         # Custom error classes
│   │   └── logger.ts         # Pino logger configuration
│   └── index.ts              # Application entry point
├── .env                      # Environment variables (NEVER commit!)
├── .env.example              # Example environment file
├── package.json
└── tsconfig.json
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx    # Reusable button component
│   │   │   ├── Card.tsx      # Glass-morphism card
│   │   │   ├── TextArea.tsx  # Auto-resizing textarea
│   │   │   └── index.ts
│   │   ├── AudioVisualizer.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── RecordingButton.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── TranscriptionResult.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useAudioRecorder.ts  # Audio recording hook
│   │   ├── useTheme.ts          # Dark mode management
│   │   └── index.ts
│   ├── services/
│   │   └── api.ts            # API client for backend
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   ├── utils/
│   │   └── index.ts          # Utility functions
│   ├── App.tsx               # Main application
│   ├── index.css             # Global styles
│   └── main.tsx              # Entry point
├── public/
│   └── mic.svg               # Favicon
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

## API Reference

### POST /api/transcribe

Transcribe an audio file to text.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `audio` (required): Audio file (max 25MB)
  - `language` (optional): ISO 639-1 language code (e.g., "en", "es")
  - `prompt` (optional): Context prompt for better accuracy
  - `temperature` (optional): Sampling temperature (0-1)

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "uuid",
    "text": "Transcribed text here",
    "language": "en",
    "processingTimeMs": 1234,
    "audioDurationSeconds": 10.5,
    "timestamp": "2024-01-15T12:00:00.000Z"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2024-01-15T12:00:00.000Z",
    "processingTimeMs": 1234
  }
}
```

### GET /api/transcribe/formats

Get supported audio formats.

**Response:**
```json
{
  "success": true,
  "data": {
    "formats": ["flac", "mp3", "mp4", "mpeg", "mpga", "ogg", "wav", "webm"],
    "maxFileSizeMb": 25,
    "maxFileSizeBytes": 26214400
  }
}
```

### GET /health

Basic health check.

### GET /health/detailed

Detailed health check with service status.

### GET /api/info

API information and configuration.

## Environment Variables

### Backend (.env)

```bash
# Server
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Groq API (Whisper V3)
GROQ_API_KEY=your_api_key_here
GROQ_API_URL=https://api.groq.com/openai/v1/audio/transcriptions

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30

# Audio Processing
MAX_AUDIO_SIZE_MB=25
AUDIO_TIMEOUT_MS=60000

# Logging
LOG_LEVEL=info
```

## Security Considerations

### API Key Protection
- API key is stored ONLY in backend `.env` file
- `.env` is in `.gitignore` - NEVER committed
- API key never exposed to frontend
- All API calls proxied through backend

### Request Security
- Helmet.js for security headers
- CORS configured with allowed origins
- Rate limiting (30 requests/minute)
- Input validation with Zod
- File type validation
- File size limits (25MB max)

### Error Handling
- No stack traces in production
- Sanitized error messages
- Request ID tracking for debugging
- Centralized error handler

## Whisper V3 Integration Details

### Endpoint
```
POST https://api.groq.com/openai/v1/audio/transcriptions
```

### Request Structure
```javascript
const formData = new FormData();
formData.append('file', audioBuffer, { filename, contentType });
formData.append('model', 'whisper-large-v3');
formData.append('response_format', 'verbose_json');
formData.append('language', 'en'); // optional

fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    ...formData.getHeaders(),
  },
  body: formData.getBuffer(),
});
```

### Response Parsing
```typescript
interface GroqTranscriptionResponse {
  text: string;           // Full transcription
  language?: string;      // Detected language
  duration?: number;      // Audio duration in seconds
  segments?: Array<{      // Word-level timestamps (verbose_json)
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}
```

### Error Handling
- **429 Rate Limited**: Retry with exponential backoff
- **500 Server Error**: Retry up to 3 times
- **4xx Client Error**: Return error to user
- **Timeout**: 60 second limit with abort controller

## Future Expansion

### Adding New AI Services
1. Create new service in `backend/src/services/`
2. Implement `ITranscriptionService` interface
3. Use dependency injection in controller
4. No changes to routes or middleware needed

### Scaling Horizontally
- Stateless backend design
- No session storage
- Ready for load balancing
- Health check endpoints for orchestration

### Potential Enhancements
- Real-time streaming transcription
- Speaker diarization
- Translation support
- Audio file upload (not just recording)
- Transcription history with database
- User authentication
- WebSocket for live progress

## Browser Support

- Chrome 66+ (recommended)
- Firefox 62+
- Safari 14.1+
- Edge 79+

Note: Microphone access requires HTTPS in production.

## License

MIT License
