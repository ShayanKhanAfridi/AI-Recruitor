# AI Voice Interviewer System - Complete Guide

## Overview

The AI Voice Interviewer is a comprehensive system that enables real-time voice conversations between candidates and an AI interviewer. It features live captions, transcript storage, and a professional interview interface.

## Features Implemented

### 🎯 1. AI Interviewer (Voice Model)
- **Web Speech API Integration**: Uses browser's native speech recognition and synthesis
- **Real-time Voice Conversation**:
  - AI asks questions with text-to-speech
  - Candidate answers via microphone
  - AI processes answers and asks next question
  - Live captions display all interactions
- **Future-Ready**: Hooks included for OpenAI Realtime API and ElevenLabs integration

### 🧠 2. Conversation Engine
- **Greeting**: "Hello {candidateName}, let's start your interview."
- **Flow**: 
  - Candidate speaks → STT converts to text → shown in captions
  - AI text response → TTS plays as voice → shown in captions
  - Loop continues until interview ends or time expires
- **Transcript Storage**: Full Q&A stored in backend JSON format

### 🎤 3. Frontend Mic + Video Setup
- **Left Panel**: Candidate video feed
- **Below Video**: Animated waveform showing microphone activity
- **Controls**:
  - Mic on/off toggle
  - Camera on/off toggle
  - Mute/unmute button
  - Real-time streaming indicators

### 💬 4. Captions + Transcript Panel
- **Right Panel**: Chat-style conversation display
- **Features**:
  - AI questions and candidate answers with timestamps
  - Auto-scroll to latest message
  - Color-coded messages (AI vs Candidate)
  - Download transcript button
- **Storage Format**:
```json
{
  "role": "ai" | "candidate",
  "text": "...",
  "audioUrl": "optional",
  "timestamp": "ISO8601"
}
```

### 🎨 5. Layout & UI
- **Left (60%)**: Video + waveform + controls
- **Right (40%)**: Captions panel + response input
- **Top Bar**: Timer, candidate name, exit button
- **Bottom**: Start/End buttons, mute/camera toggles
- **Responsive**: Desktop and mobile optimized

### ⏰ 6. Timer & Auto-End Logic
- **Countdown Timer**: Shows remaining interview time
- **Color Coding**:
  - Green: Normal time
  - Yellow: < 5 minutes warning
  - Red/Pulsing: < 2 minutes critical
- **Auto-Stop**: Disables controls when time expires
- **Completion Message**: "Interview Completed"

### 📡 7. Backend Routes

#### Start Voice Interview
```
POST /api/interview/start-voice
Body: { interviewId, candidateName, role }
Response: { sessionId, greeting, questions, currentQuestion }
```

#### Process Candidate Audio
```
POST /api/interview/send-audio
Body: { sessionId, candidateText }
Response: { aiResponse, nextQuestion, sessionEnded, messages }
```

#### Get AI Response
```
POST /api/interview/ai-respond
Body: { sessionId }
Response: { question, messages, questionIndex, totalQuestions }
```

#### Download Transcript
```
GET /api/interview/:interviewId/transcript/:sessionId
Response: Full transcript JSON
```

#### End Session
```
POST /api/interview/end-session
Body: { sessionId }
Response: { message: "Session ended successfully" }
```

### 🛠 8. Code Structure

#### Backend
- **`server/voice-service.ts`**: Core conversation engine
  - Session management
  - Transcript storage
  - AI response generation
  - Question management

- **`server/routes.ts`**: Voice interview endpoints
  - All REST API routes
  - Session handling
  - Transcript retrieval

#### Frontend
- **`client/src/pages/voice-interview-room.tsx`**: Main interview component
  - Video/audio setup
  - Interview flow management
  - Timer handling
  - Response submission

- **`client/src/hooks/use-voice-recorder.ts`**: Voice recording hook
  - Web Speech API integration
  - Speech recognition
  - Text-to-speech synthesis
  - Transcript management

- **`client/src/components/voice/waveform.tsx`**: Animated waveform
  - Real-time visualization
  - Listening/speaking indicators
  - Canvas-based animation

- **`client/src/components/voice/captions-panel.tsx`**: Transcript display
  - Message rendering
  - Auto-scroll
  - Download functionality
  - Status indicators

### 📌 9. Additional Features

#### AI Avatar Reactions
- Pulse animation when speaking
- Visual feedback during processing
- Status indicators (listening, speaking, processing)

#### Loading Animation
- Spinner while AI generates responses
- Processing state management
- User feedback

#### Error Handling
- Mic/camera permission denied handling
- Network error recovery
- Graceful fallbacks
- User-friendly error messages

#### Continuous Listening
- Auto-start listening after AI speaks
- Manual stop/start controls
- Transcript accumulation

#### Real-time Captions
- Instant message display
- Timestamp tracking
- Role-based styling
- Auto-scroll to latest

#### Fully Functional Controls
- Start/End buttons
- Mute/unmute
- Camera on/off
- Submit response
- Download transcript

## How to Use

### For Candidates

1. **Login**: Enter Interview ID and Password
2. **Select Mode**: Choose "AI Voice" mode
3. **Start Interview**: Click "Start Interview" button
4. **Listen**: AI will greet you and ask the first question
5. **Respond**: 
   - Click "Listen" button
   - Speak your answer
   - Click "Stop" when done
6. **Submit**: Click "Submit" to send your response
7. **Continue**: AI will ask next question
8. **End**: Interview ends when all questions are answered or time expires
9. **Download**: Download your transcript as JSON

### For Administrators

1. **Create Interview**: Use dashboard to create new interview
2. **Share Link**: Copy interview link and password to candidate
3. **Monitor**: View interview status on dashboard
4. **Review**: Access transcripts for review

## API Integration Hooks

### For OpenAI Realtime API
```typescript
// In voice-service.ts, replace processAudioAndRespond with:
async processAudioAndRespond(sessionId: string, audioBlob: Buffer) {
  // Call OpenAI Realtime API
  const response = await openaiClient.audio.transcriptions.create({
    file: audioBlob,
    model: "whisper-1",
  });
  
  const aiResponse = await openaiClient.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [...conversationHistory],
  });
  
  // Convert to speech with ElevenLabs
  const audioUrl = await elevenLabsClient.textToSpeech(aiResponse.text);
  
  return { aiResponse: aiResponse.text, audioUrl };
}
```

### For ElevenLabs TTS
```typescript
// In use-voice-recorder.ts, replace speak with:
async speak(text: string) {
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/{voice_id}', {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.REACT_APP_ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({ text }),
  });
  
  const audio = await response.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(audio);
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start(0);
}
```

## Transcript Storage

Transcripts are stored in `data/transcripts/` directory with format:
```
{interviewId}-{sessionId}.json
```

Example structure:
```json
{
  "interviewId": "INT-123456",
  "sessionId": "uuid",
  "candidateName": "John Doe",
  "role": "Software Engineer",
  "startedAt": "2024-01-15T10:00:00Z",
  "completedAt": "2024-01-15T10:15:00Z",
  "messages": [
    {
      "id": "msg-1",
      "role": "ai",
      "text": "Hello John, let's start your interview...",
      "timestamp": "2024-01-15T10:00:00Z"
    },
    {
      "id": "msg-2",
      "role": "candidate",
      "text": "Thank you, I'm excited to be here...",
      "timestamp": "2024-01-15T10:00:05Z"
    }
  ],
  "totalQuestions": 8,
  "questionsAnswered": 8
}
```

## Browser Compatibility

- **Chrome/Edge**: Full support (Web Speech API)
- **Safari**: Full support (Web Speech API)
- **Firefox**: Limited support (Web Speech API via flag)
- **Mobile**: Supported on iOS Safari and Android Chrome

## Environment Variables

No API keys required for free version using Web Speech API.

For premium features, add to `.env`:
```
REACT_APP_OPENAI_API_KEY=sk-...
REACT_APP_ELEVENLABS_API_KEY=...
REACT_APP_ELEVENLABS_VOICE_ID=...
```

## Performance Considerations

- Waveform animation uses requestAnimationFrame for smooth 60fps
- Message auto-scroll uses smooth behavior
- Transcript stored locally and on server
- Audio processing happens in browser (no server processing for free version)

## Security

- Interview sessions are unique per candidate
- Transcripts stored server-side with interview ID
- No audio files stored (only text transcripts)
- Session timeout after interview ends
- Password-protected interview access

## Future Enhancements

1. **Real AI Integration**: OpenAI Realtime API for true AI conversations
2. **Professional Voice**: ElevenLabs for natural-sounding AI voice
3. **Multi-language**: Support for different languages
4. **Analytics**: Interview performance metrics
5. **Feedback**: Real-time candidate feedback
6. **Recording**: Optional video/audio recording
7. **Scoring**: Automatic response scoring
8. **Integration**: ATS system integration

## Troubleshooting

### Microphone not working
- Check browser permissions
- Try "Try Again" button
- Restart browser
- Check system audio settings

### Speech not recognized
- Speak clearly and slowly
- Check microphone volume
- Ensure quiet environment
- Try different browser

### Transcript not saving
- Check server logs
- Verify `data/transcripts/` directory exists
- Check disk space
- Verify file permissions

### AI not responding
- Check network connection
- Verify backend is running
- Check browser console for errors
- Try refreshing page

## Support

For issues or questions, check:
1. Browser console for errors
2. Server logs for backend issues
3. Network tab for API failures
4. Microphone/camera permissions

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Status**: Production Ready
