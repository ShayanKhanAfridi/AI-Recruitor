# AI Voice Interviewer - Quick Reference

## 🚀 Quick Start

### 1. Start Server
```bash
npm run dev
```
Server runs at: `http://127.0.0.1:3000`

### 2. Create Interview (Dashboard)
- Go to `/dashboard`
- Click "Create Interview"
- Fill in candidate details
- Copy link and password

### 3. Candidate Takes Interview
- Visit interview link
- Enter password
- Select "AI Voice" mode
- Click "Begin Interview"
- Speak answers when prompted
- Download transcript when done

## 📋 API Quick Reference

### Initialize Voice Interview
```bash
curl -X POST http://127.0.0.1:3000/api/interview/start-voice \
  -H "Content-Type: application/json" \
  -d '{
    "interviewId": "INT-123456",
    "candidateName": "John Doe",
    "role": "Software Engineer"
  }'
```

### Submit Candidate Response
```bash
curl -X POST http://127.0.0.1:3000/api/interview/send-audio \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "uuid-here",
    "candidateText": "My answer to the question..."
  }'
```

### Download Transcript
```bash
curl http://127.0.0.1:3000/api/interview/INT-123456/transcript/uuid-here
```

### End Session
```bash
curl -X POST http://127.0.0.1:3000/api/interview/end-session \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "uuid-here"}'
```

## 🎯 Key Components

### Voice Interview Room
**File**: `client/src/pages/voice-interview-room.tsx`
- Main interview interface
- Handles video, audio, timer
- Manages conversation flow

### Voice Service
**File**: `server/voice-service.ts`
- Session management
- Conversation engine
- Transcript storage

### Voice Recorder Hook
**File**: `client/src/hooks/use-voice-recorder.ts`
- Speech recognition
- Text-to-speech
- Transcript handling

### Waveform Component
**File**: `client/src/components/voice/waveform.tsx`
- Animated visualization
- Microphone activity display

### Captions Panel
**File**: `client/src/components/voice/captions-panel.tsx`
- Message display
- Auto-scroll
- Download button

## 🔧 Configuration

### Change Interview Duration
**File**: `server/storage.ts` (line 167)
```typescript
durationMinutes: (insertInterview as any).durationMinutes ?? "60",
```

### Change Interview Questions
**File**: `server/voice-service.ts` (line 26)
```typescript
const DEFAULT_QUESTIONS = [
  "Tell me about yourself.",
  // Add more questions here
];
```

### Change AI Responses
**File**: `server/voice-service.ts` (line 35)
```typescript
const AI_RESPONSES: Record<string, string> = {
  greeting: "Custom greeting here...",
  acknowledgment: "Custom acknowledgment...",
  // etc
};
```

## 🎨 Styling

### Waveform Colors
**File**: `client/src/components/voice/waveform.tsx` (line 42)
```typescript
ctx.fillStyle = isListening
  ? "rgb(59, 130, 246)" // blue
  : isSpeaking
  ? "rgb(34, 197, 94)" // green
  : "rgb(156, 163, 175)"; // gray
```

### Message Styling
**File**: `client/src/components/voice/captions-panel.tsx` (line 65)
```typescript
className={`max-w-xs lg:max-w-sm px-4 py-3 rounded-lg ${
  message.role === "ai"
    ? "bg-primary/10 text-foreground border border-primary/20"
    : "bg-secondary text-secondary-foreground"
}`}
```

## 🔌 Integration Points

### Add OpenAI Realtime API
**File**: `server/voice-service.ts`
```typescript
async processAudioAndRespond(sessionId: string, candidateText: string) {
  // Replace with OpenAI API call
  const response = await openai.chat.completions.create({...});
  return { aiResponse: response.choices[0].message.content };
}
```

### Add ElevenLabs TTS
**File**: `client/src/hooks/use-voice-recorder.ts`
```typescript
const speak = useCallback((text: string) => {
  // Replace with ElevenLabs API call
  const audio = await elevenLabs.textToSpeech(text);
  // Play audio
});
```

### Add Custom STT
**File**: `client/src/hooks/use-voice-recorder.ts`
```typescript
const startListening = useCallback(() => {
  // Replace with custom STT service
  const transcript = await customSTT.recognize();
});
```

## 📊 Data Flow

```
Candidate Login
    ↓
Select "AI Voice" Mode
    ↓
Initialize Voice Session (POST /api/interview/start-voice)
    ↓
AI Greeting Plays (TTS)
    ↓
Candidate Listens & Speaks
    ↓
Speech to Text (STT)
    ↓
Submit Response (POST /api/interview/send-audio)
    ↓
AI Processes & Generates Response
    ↓
Response Plays (TTS)
    ↓
Display in Captions
    ↓
Repeat until Interview Ends
    ↓
Save Transcript (JSON)
    ↓
Candidate Downloads Transcript
```

## 🐛 Debugging

### Check Browser Console
```javascript
// See all voice recorder events
console.log('Listening:', voiceRecorder.isListening);
console.log('Speaking:', voiceRecorder.isSpeaking);
console.log('Transcript:', voiceRecorder.transcript);
```

### Check Server Logs
```bash
# Terminal shows:
# - Session creation
# - Audio processing
# - Transcript saving
# - API calls
```

### Check Transcript Files
```bash
# Transcripts stored in:
data/transcripts/{interviewId}-{sessionId}.json
```

## ⚙️ Environment Variables

### For Free Version (Web Speech API)
No environment variables needed!

### For Premium Features
```bash
# .env file
REACT_APP_OPENAI_API_KEY=sk-...
REACT_APP_ELEVENLABS_API_KEY=...
REACT_APP_ELEVENLABS_VOICE_ID=...
```

## 🎯 Common Tasks

### Change Interview Time Limit
1. Open `server/storage.ts`
2. Find line 167: `durationMinutes`
3. Change default value

### Add New Questions
1. Open `server/voice-service.ts`
2. Find `DEFAULT_QUESTIONS` array
3. Add new questions

### Customize AI Responses
1. Open `server/voice-service.ts`
2. Find `AI_RESPONSES` object
3. Edit response text

### Change Waveform Colors
1. Open `client/src/components/voice/waveform.tsx`
2. Find `ctx.fillStyle` assignments
3. Change RGB values

### Modify Timer Warning Levels
1. Open `client/src/pages/voice-interview-room.tsx`
2. Find `isTimeWarning` and `isTimeCritical`
3. Adjust time thresholds

## 📱 Mobile Optimization

- Responsive grid layout (1 col mobile, 3 col desktop)
- Touch-friendly button sizes (48x48px minimum)
- Optimized font sizes for readability
- Flexible video aspect ratio
- Scrollable captions panel

## 🔐 Security Checklist

- ✅ Password-protected interviews
- ✅ Unique session IDs
- ✅ Server-side transcript storage
- ✅ No audio files stored
- ✅ Session timeout
- ✅ Input validation
- ✅ Error handling

## 📈 Performance Tips

1. **Reduce Waveform Resolution**: Change `barCount` in waveform.tsx
2. **Limit Message History**: Archive old transcripts
3. **Optimize Images**: Compress candidate avatars
4. **Enable Caching**: Add HTTP caching headers
5. **Use CDN**: Serve static assets from CDN

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Mic not working | Check browser permissions |
| No speech recognition | Try Chrome/Edge/Safari |
| Transcript not saving | Check `data/transcripts/` directory |
| AI not responding | Check network connection |
| Timer not counting | Refresh page |
| Video not showing | Allow camera permission |

## 📚 Documentation Files

- `VOICE_INTERVIEWER_GUIDE.md` - Complete feature guide
- `IMPLEMENTATION_SUMMARY.md` - What was built
- `QUICK_REFERENCE.md` - This file

## 🎓 Learning Resources

- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [React Hooks](https://react.dev/reference/react/hooks)
- [Express.js](https://expressjs.com/)

## 💡 Pro Tips

1. **Test with Different Voices**: Try different browser TTS voices
2. **Record Sessions**: Add recording for quality assurance
3. **Analyze Responses**: Use NLP to analyze candidate answers
4. **Track Metrics**: Monitor interview completion rates
5. **A/B Test**: Try different questions and measure results

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0  
**Status**: Production Ready
