/**
 * Voice Interview Service
 * Handles AI conversation engine, transcript storage, and voice processing
 * Supports Web Speech API (free) and future integration with OpenAI Realtime / ElevenLabs
 */

import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export interface TranscriptMessage {
  id: string;
  role: "ai" | "candidate";
  text: string;
  audioUrl?: string;
  timestamp: string;
  duration?: number; // in seconds
}

export interface VoiceInterviewSession {
  interviewId: string;
  sessionId: string;
  candidateName: string;
  role: string;
  startedAt: string;
  messages: TranscriptMessage[];
  currentQuestionIndex: number;
  isActive: boolean;
}

// Interview questions - can be customized per role
const DEFAULT_QUESTIONS = [
  "Tell me about yourself.",
  "Why do you want this job?",
  "What are your greatest strengths?",
  "Describe a challenge you overcame.",
  "Where do you see yourself in 5 years?",
  "Why should we hire you?",
  "Tell me about a time you worked in a team.",
  "How do you handle stress and pressure?",
];

// AI responses - can be replaced with real AI API
const AI_RESPONSES: Record<string, string> = {
  greeting: "Hello {candidateName}, let's start your interview. I'm excited to learn more about you. Let's begin with the first question.",
  acknowledgment: "Thank you for that response. That's interesting. Let me ask you the next question.",
  closing: "Thank you for completing this interview. Your responses have been recorded. The hiring team will review them and get back to you soon.",
  error: "I didn't quite catch that. Could you please repeat your answer?",
};

export class VoiceInterviewService {
  private sessions: Map<string, VoiceInterviewSession> = new Map();
  private transcriptDir = path.join(process.cwd(), "data", "transcripts");

  constructor() {
    this.ensureTranscriptDir();
  }

  private async ensureTranscriptDir() {
    try {
      await fs.mkdir(this.transcriptDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create transcript directory:", error);
    }
  }

  /**
   * Start a new voice interview session
   */
  async startVoiceInterview(
    interviewId: string,
    candidateName: string,
    role: string
  ): Promise<VoiceInterviewSession> {
    const sessionId = randomUUID();
    const now = new Date().toISOString();

    const session: VoiceInterviewSession = {
      interviewId,
      sessionId,
      candidateName,
      role,
      startedAt: now,
      messages: [],
      currentQuestionIndex: 0,
      isActive: true,
    };

    this.sessions.set(sessionId, session);

    // Add initial AI greeting
    const greeting = AI_RESPONSES.greeting.replace("{candidateName}", candidateName);
    session.messages.push({
      id: randomUUID(),
      role: "ai",
      text: greeting,
      timestamp: now,
    });

    return session;
  }

  /**
   * Get current session
   */
  getSession(sessionId: string): VoiceInterviewSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Process candidate speech and generate AI response
   * In production, this would use real STT/TTS APIs
   */
  async processAudioAndRespond(
    sessionId: string,
    candidateText: string,
    audioBlob?: Buffer
  ): Promise<{
    aiResponse: string;
    nextQuestion: string;
    sessionEnded: boolean;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const now = new Date().toISOString();

    // Store candidate response
    session.messages.push({
      id: randomUUID(),
      role: "candidate",
      text: candidateText,
      timestamp: now,
    });

    // Determine if interview should continue
    const shouldContinue = session.currentQuestionIndex < DEFAULT_QUESTIONS.length - 1;

    let aiResponse: string;
    let nextQuestion: string = "";

    if (shouldContinue) {
      // Move to next question
      session.currentQuestionIndex++;
      aiResponse = AI_RESPONSES.acknowledgment;
      nextQuestion = DEFAULT_QUESTIONS[session.currentQuestionIndex];
    } else {
      // Interview complete
      aiResponse = AI_RESPONSES.closing;
      session.isActive = false;
    }

    // Store AI response
    session.messages.push({
      id: randomUUID(),
      role: "ai",
      text: aiResponse,
      timestamp: now,
    });

    // Save transcript to file
    await this.saveTranscript(session);

    return {
      aiResponse,
      nextQuestion,
      sessionEnded: !shouldContinue,
    };
  }

  /**
   * Get current question for the session
   */
  getCurrentQuestion(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    return DEFAULT_QUESTIONS[session.currentQuestionIndex] || "";
  }

  /**
   * Get all questions
   */
  getQuestions(): string[] {
    return DEFAULT_QUESTIONS;
  }

  /**
   * Save transcript to file
   */
  private async saveTranscript(session: VoiceInterviewSession): Promise<void> {
    try {
      const filename = `${session.interviewId}-${session.sessionId}.json`;
      const filepath = path.join(this.transcriptDir, filename);

      const transcript = {
        interviewId: session.interviewId,
        sessionId: session.sessionId,
        candidateName: session.candidateName,
        role: session.role,
        startedAt: session.startedAt,
        completedAt: new Date().toISOString(),
        messages: session.messages,
        totalQuestions: DEFAULT_QUESTIONS.length,
        questionsAnswered: session.currentQuestionIndex + 1,
      };

      await fs.writeFile(filepath, JSON.stringify(transcript, null, 2));
    } catch (error) {
      console.error("Failed to save transcript:", error);
    }
  }

  /**
   * Get transcript for download
   */
  async getTranscript(interviewId: string, sessionId: string): Promise<any> {
    try {
      const filename = `${interviewId}-${sessionId}.json`;
      const filepath = path.join(this.transcriptDir, filename);
      const content = await fs.readFile(filepath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      console.error("Failed to read transcript:", error);
      return null;
    }
  }

  /**
   * End interview session
   */
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.saveTranscript(session).catch(console.error);
    }
  }

  /**
   * Get session messages (for real-time captions)
   */
  getSessionMessages(sessionId: string): TranscriptMessage[] {
    const session = this.sessions.get(sessionId);
    return session?.messages || [];
  }
}

// Export singleton instance
export const voiceInterviewService = new VoiceInterviewService();
