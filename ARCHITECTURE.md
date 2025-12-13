# AI Voice Interviewer - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CANDIDATE BROWSER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Voice Interview Room Component                    │   │
│  │  (client/src/pages/voice-interview-room.tsx)             │   │
│  │                                                            │   │
│  │  ┌─────────────────────┐  ┌──────────────────────────┐   │   │
│  │  │  Video Feed         │  │  Captions Panel          │   │   │
│  │  │  - Camera stream    │  │  - AI messages           │   │   │
│  │  │  - Recording status │  │  - Candidate responses   │   │   │
│  │  │  - Indicators       │  │  - Timestamps            │   │   │
│  │  │                     │  │  - Download button       │   │   │
│  │  └─────────────────────┘  └──────────────────────────┘   │   │
│  │                                                            │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │  Waveform Component                              │    │   │
│  │  │  - Real-time mic visualization                   │    │   │
│  │  │  - Listening/speaking indicators                 │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │                                                            │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │  Response Input Section                          │    │   │
│  │  │  - Listen button                                 │    │   │
│  │  │  - Stop button                                   │    │   │
│  │  │  - Submit button                                 │    │   │
│  │  │  - Transcript display                            │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │                                                            │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │  Controls Bar                                    │    │   │
│  │  │  - Mute/Unmute                                   │    │   │
│  │  │  - Camera On/Off                                 │    │   │
│  │  │  - End Interview                                 │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Voice Recorder Hook                              │   │
│  │  (client/src/hooks/use-voice-recorder.ts)               │   │
│  │                                                            │   │
│  │  ┌─────────────────┐  ┌──────────────────────────────┐  │   │
│  │  │ Web Speech API  │  │  Browser APIs                │  │   │
│  │  │ - STT (Listen)  │  │  - SpeechRecognition         │  │   │
│  │  │ - TTS (Speak)   │  │  - SpeechSynthesis           │  │   │
│  │  │ - Transcript    │  │  - MediaDevices              │  │   │
│  │  └─────────────────┘  └──────────────────────────────┘  │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                        (HTTP/REST API)
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                         EXPRESS SERVER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Voice Interview Routes                           │   │
│  │  (server/routes.ts)                                      │   │
│  │                                                            │   │
│  │  POST /api/interview/start-voice                         │   │
│  │  POST /api/interview/send-audio                          │   │
│  │  POST /api/interview/ai-respond                          │   │
│  │  GET  /api/interview/:id/transcript/:sessionId           │   │
│  │  POST /api/interview/end-session                         │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↕                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Voice Interview Service                          │   │
│  │  (server/voice-service.ts)                               │   │
│  │                                                            │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  Session Management                             │   │   │
│  │  │  - Create session                               │   │   │
│  │  │  - Store messages                               │   │   │
│  │  │  - Track question index                         │   │   │
│  │  │  - End session                                  │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                            │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  Conversation Engine                            │   │   │
│  │  │  - AI responses                                 │   │   │
│  │  │  - Question management                          │   │   │
│  │  │  - Response processing                          │   │   │
│  │  │  - Interview flow                               │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                            │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  Transcript Storage                             │   │   │
│  │  │  - Save to file                                 │   │   │
│  │  │  - Retrieve transcript                          │   │   │
│  │  │  - JSON format                                  │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↕                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         File System                                       │   │
│  │  data/transcripts/{interviewId}-{sessionId}.json          │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────┐
│  Candidate      │
│  Logs In        │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Select Interview Mode              │
│  - Standard (Q&A)                   │
│  - AI Voice (Real-time voice)       │
└────────┬────────────────────────────┘
         │
         ↓ (AI Voice selected)
┌─────────────────────────────────────┐
│  POST /api/interview/start-voice    │
│  Initialize session                 │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  AI Greeting (TTS)                  │
│  "Hello {name}, let's start..."     │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Display in Captions Panel          │
│  Add to conversation history        │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Candidate Listens & Speaks         │
│  Microphone captures audio          │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Speech to Text (STT)               │
│  Web Speech API converts to text    │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Display in Response Box            │
│  Show real-time transcript          │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Candidate Clicks Submit            │
│  POST /api/interview/send-audio     │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Backend Processing                 │
│  - Store candidate response         │
│  - Generate AI response             │
│  - Get next question                │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Return AI Response                 │
│  - AI text                          │
│  - Next question                    │
│  - Session status                   │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Display Response in Captions       │
│  Add to conversation history        │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Text to Speech (TTS)               │
│  Web Speech API plays AI voice      │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Loop Back                          │
│  Candidate listens & responds       │
└────────┬────────────────────────────┘
         │
         ↓ (Repeat until interview ends)
         │
         ↓
┌─────────────────────────────────────┐
│  Interview Complete                 │
│  - Save transcript                  │
│  - End session                      │
│  - Show completion message          │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Download Transcript                │
│  GET /api/interview/:id/transcript  │
│  JSON file downloaded               │
└─────────────────────────────────────┘
```

## Component Hierarchy

```
App
├── Router
│   ├── LandingPage
│   ├── LoginPage
│   │   └── Interview Mode Selection
│   ├── InterviewRoomPage (Standard)
│   ├── VoiceInterviewRoomPage (AI Voice)
│   │   ├── Header
│   │   │   ├── Candidate Info
│   │   │   ├── Timer
│   │   │   └── Exit Button
│   │   ├── Main Content
│   │   │   ├── Video Panel (Left)
│   │   │   │   ├── Video Feed
│   │   │   │   ├── Waveform
│   │   │   │   └── Controls
│   │   │   └── Captions Panel (Right)
│   │   │       ├── Messages
│   │   │       ├── Download Button
│   │   │       └── Response Input
│   ├── DashboardPage
│   ├── ExpiredPage
│   └── NotFoundPage
└── Providers
    ├── QueryClientProvider
    └── TooltipProvider
```

## State Management

```
VoiceInterviewRoomPage
├── Session State
│   ├── session (InterviewSession)
│   ├── voiceSession (VoiceSession)
│   ├── isStarted (boolean)
│   └── remainingSeconds (number)
├── Media State
│   ├── mediaStream (MediaStream)
│   ├── isMuted (boolean)
│   ├── isCameraOff (boolean)
│   └── mediaError (string)
├── Voice State
│   ├── isProcessing (boolean)
│   ├── isSpeakingAI (boolean)
│   ├── captions (CaptionMessage[])
│   └── currentQuestionIndex (number)
└── Refs
    ├── videoRef (HTMLVideoElement)
    └── voiceRecorder (VoiceRecorderHook)
```

## API Response Structures

### Start Voice Interview
```json
{
  "sessionId": "uuid",
  "greeting": "Hello John, let's start your interview...",
  "questions": ["Question 1", "Question 2", ...],
  "currentQuestion": "Question 1"
}
```

### Send Audio Response
```json
{
  "aiResponse": "Thank you for that answer...",
  "nextQuestion": "Question 2",
  "sessionEnded": false,
  "messages": [
    {
      "id": "msg-1",
      "role": "ai",
      "text": "...",
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Transcript Download
```json
{
  "interviewId": "INT-123456",
  "sessionId": "uuid",
  "candidateName": "John Doe",
  "role": "Software Engineer",
  "startedAt": "2024-01-15T10:00:00Z",
  "completedAt": "2024-01-15T10:15:00Z",
  "messages": [...],
  "totalQuestions": 8,
  "questionsAnswered": 8
}
```

## Technology Stack

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Wouter**: Routing
- **React Query**: Data fetching
- **React Hook Form**: Form handling
- **Zod**: Schema validation
- **Tailwind CSS**: Styling
- **shadcn/ui**: Component library
- **Lucide React**: Icons

### Backend
- **Express.js**: Web framework
- **TypeScript**: Type safety
- **Node.js**: Runtime
- **File System**: Transcript storage

### Browser APIs
- **Web Speech API**: Speech recognition & synthesis
- **MediaDevices API**: Camera & microphone access
- **Canvas API**: Waveform visualization
- **localStorage/sessionStorage**: Session management

## Security Considerations

1. **Session Management**
   - Unique session IDs per interview
   - Session timeout after interview ends
   - No sensitive data in client storage

2. **Data Protection**
   - Transcripts stored server-side only
   - No audio files stored (text only)
   - Password-protected interview access

3. **API Security**
   - Input validation on all endpoints
   - Error handling without exposing internals
   - CORS headers configured

4. **Client Security**
   - No API keys in client code
   - Secure session storage
   - HTTPS recommended for production

## Performance Optimization

1. **Frontend**
   - Canvas animation at 60fps
   - Efficient message rendering
   - Lazy component loading
   - Optimized re-renders

2. **Backend**
   - Async file operations
   - Efficient session management
   - Minimal memory footprint

3. **Network**
   - Minimal API payload size
   - Compression enabled
   - Efficient data structures

## Scalability Considerations

1. **Current Implementation**
   - In-memory session storage
   - File-based transcript storage
   - Single server instance

2. **Future Improvements**
   - Database for session storage
   - Cloud storage for transcripts
   - Load balancing for multiple servers
   - Caching layer for performance

---

**Architecture Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Status**: Production Ready
