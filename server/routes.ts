import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { voiceInterviewService } from "./voice-service";
import { loginSchema, insertInterviewSchema, updateInterviewSchema, type InterviewSession } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get all interviews (for dashboard) - without exposing passwords
  app.get("/api/interviews", async (req, res) => {
    try {
      const interviews = await storage.getAllInterviews();
      // Remove passwords from response for security
      const sanitizedInterviews = interviews.map(({ password, ...rest }) => ({
        ...rest,
        password: "********", // Mask password
      }));
      res.json(sanitizedInterviews);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      res.status(500).json({ message: "Failed to fetch interviews" });
    }
  });

  // Get interview with password (admin only - for copy to clipboard)
  app.get("/api/interviews/:id/credentials", async (req, res) => {
    try {
      const interview = await storage.getInterview(req.params.id);
      
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      res.json({
        id: interview.id,
        password: interview.password,
      });
    } catch (error) {
      console.error("Error fetching interview credentials:", error);
      res.status(500).json({ message: "Failed to fetch credentials" });
    }
  });

  // Get single interview info (public, without password)
  app.get("/api/interviews/:id", async (req, res) => {
    try {
      const interview = await storage.getInterview(req.params.id);
      
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      // Return public info only
      res.json({
        id: interview.id,
        candidateName: interview.candidateName,
        role: interview.role,
        startTime: interview.startTime,
        endTime: interview.endTime,
        isUsed: interview.isUsed,
      });
    } catch (error) {
      console.error("Error fetching interview:", error);
      res.status(500).json({ message: "Failed to fetch interview" });
    }
  });

  // Create new interview
  app.post("/api/interviews", async (req, res) => {
    try {
      const validated = insertInterviewSchema.safeParse(req.body);
      
      if (!validated.success) {
        return res.status(400).json({ 
          message: "Invalid interview data",
          errors: validated.error.errors 
        });
      }

      const interview = await storage.createInterview(validated.data);
      res.status(201).json(interview);
    } catch (error) {
      console.error("Error creating interview:", error);
      res.status(500).json({ message: "Failed to create interview" });
    }
  });

  // Authenticate and start interview session
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validated = loginSchema.safeParse(req.body);
      
      if (!validated.success) {
        return res.status(400).json({ 
          message: "Invalid credentials format",
          errors: validated.error.errors 
        });
      }

      const { interviewId, password } = validated.data;
      const interview = await storage.getInterview(interviewId);

      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      if (interview.password !== password) {
        return res.status(401).json({ message: "Invalid password" });
      }

      // Check if already completed or used
      if (interview.isUsed) {
        return res.status(403).json({ 
          message: "This interview has already been completed",
          type: "expired"
        });
      }

      const now = new Date();
      const startTime = new Date(interview.startTime);
      const endTime = new Date(interview.endTime);
      const durationMinutes = parseInt(interview.durationMinutes || "60");

      // Check if interview was already started (single-use enforcement)
      if (interview.isStarted && interview.sessionDeadline) {
        const sessionDeadline = new Date(interview.sessionDeadline);
        
        // If the session deadline has passed, mark as used and reject
        if (now > sessionDeadline) {
          await storage.updateInterview(interviewId, { isUsed: true });
          return res.status(403).json({ 
            message: "Interview session has expired",
            type: "expired"
          });
        }
        
        // Re-login allowed (page refresh), calculate remaining from session deadline
        const remainingSeconds = Math.max(0, Math.floor((sessionDeadline.getTime() - now.getTime()) / 1000));
        
        const session: InterviewSession = {
          id: interview.id,
          candidateName: interview.candidateName,
          role: interview.role,
          startTime: startTime.toISOString(),
          endTime: sessionDeadline.toISOString(),
          remainingSeconds,
          currentQuestionIndex: parseInt(interview.currentQuestionIndex || "0"),
        };

        return res.json(session);
      }

      // Check time window for new sessions
      if (now < startTime) {
        return res.status(403).json({ 
          message: "Interview has not started yet",
          type: "not_started",
          scheduledTime: startTime.toISOString()
        });
      }

      if (now > endTime) {
        // Mark as used since it's expired
        await storage.updateInterview(interviewId, { isUsed: true });
        return res.status(403).json({ 
          message: "Interview link has expired",
          type: "expired"
        });
      }

      // Calculate session deadline: min(now + duration, endTime)
      const sessionDeadline = new Date(Math.min(
        now.getTime() + durationMinutes * 60 * 1000,
        endTime.getTime()
      ));

      // Calculate remaining time based on session deadline
      const remainingSeconds = Math.max(0, Math.floor((sessionDeadline.getTime() - now.getTime()) / 1000));

      // Mark interview as started with session deadline
      await storage.updateInterview(interviewId, { 
        isStarted: true, 
        sessionStartedAt: now,
        sessionDeadline: sessionDeadline
      });

      // Create session response
      const session: InterviewSession = {
        id: interview.id,
        candidateName: interview.candidateName,
        role: interview.role,
        startTime: startTime.toISOString(),
        endTime: sessionDeadline.toISOString(),
        remainingSeconds,
        currentQuestionIndex: parseInt(interview.currentQuestionIndex || "0"),
      };

      res.json(session);
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // Update interview (mark as used, update question index)
  app.patch("/api/interviews/:id", async (req, res) => {
    try {
      const interview = await storage.getInterview(req.params.id);
      
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      // Validate update payload with Zod schema
      const validated = updateInterviewSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({ 
          message: "Invalid update data",
          errors: validated.error.errors 
        });
      }

      const updates: Partial<typeof interview> = {};
      
      // Only allow setting isUsed to true (never back to false)
      if (validated.data.isUsed === true) {
        updates.isUsed = true;
      }
      
      // Convert currentQuestionIndex to string for storage
      // Clamp to valid question range (0-7 for 8 questions)
      if (validated.data.currentQuestionIndex !== undefined) {
        const index = typeof validated.data.currentQuestionIndex === "number" 
          ? validated.data.currentQuestionIndex 
          : parseInt(validated.data.currentQuestionIndex);
        if (!isNaN(index) && index >= 0 && index <= 7) {
          updates.currentQuestionIndex = index.toString();
        }
      }

      const updated = await storage.updateInterview(req.params.id, updates);
      
      // Return sanitized response (without password)
      if (updated) {
        const { password, ...sanitized } = updated;
        res.json(sanitized);
      } else {
        res.status(404).json({ message: "Failed to update interview" });
      }
    } catch (error) {
      console.error("Error updating interview:", error);
      res.status(500).json({ message: "Failed to update interview" });
    }
  });

  // Delete interview
  app.delete("/api/interviews/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteInterview(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Interview not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting interview:", error);
      res.status(500).json({ message: "Failed to delete interview" });
    }
  });

  // ===== VOICE INTERVIEW ROUTES =====

  // Start voice interview session
  app.post("/api/interview/start-voice", async (req, res) => {
    try {
      const { interviewId, candidateName, role } = req.body;

      if (!interviewId || !candidateName || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const session = await voiceInterviewService.startVoiceInterview(
        interviewId,
        candidateName,
        role
      );

      res.json({
        sessionId: session.sessionId,
        greeting: session.messages[0]?.text,
        questions: voiceInterviewService.getQuestions(),
        currentQuestion: voiceInterviewService.getCurrentQuestion(session.sessionId),
      });
    } catch (error) {
      console.error("Error starting voice interview:", error);
      res.status(500).json({ message: "Failed to start voice interview" });
    }
  });

  // Process candidate audio and get AI response
  app.post("/api/interview/send-audio", async (req, res) => {
    try {
      const { sessionId, candidateText } = req.body;

      if (!sessionId || !candidateText) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const session = voiceInterviewService.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const result = await voiceInterviewService.processAudioAndRespond(
        sessionId,
        candidateText
      );

      res.json({
        aiResponse: result.aiResponse,
        nextQuestion: result.nextQuestion,
        sessionEnded: result.sessionEnded,
        messages: voiceInterviewService.getSessionMessages(sessionId),
      });
    } catch (error) {
      console.error("Error processing audio:", error);
      res.status(500).json({ message: "Failed to process audio" });
    }
  });

  // Get AI response (for voice synthesis)
  app.post("/api/interview/ai-respond", async (req, res) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: "Missing sessionId" });
      }

      const session = voiceInterviewService.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const currentQuestion = voiceInterviewService.getCurrentQuestion(sessionId);

      res.json({
        question: currentQuestion,
        messages: voiceInterviewService.getSessionMessages(sessionId),
        questionIndex: session.currentQuestionIndex,
        totalQuestions: voiceInterviewService.getQuestions().length,
      });
    } catch (error) {
      console.error("Error getting AI response:", error);
      res.status(500).json({ message: "Failed to get AI response" });
    }
  });

  // Get transcript for download
  app.get("/api/interview/:interviewId/transcript/:sessionId", async (req, res) => {
    try {
      const { interviewId, sessionId } = req.params;

      const transcript = await voiceInterviewService.getTranscript(
        interviewId,
        sessionId
      );

      if (!transcript) {
        return res.status(404).json({ message: "Transcript not found" });
      }

      res.json(transcript);
    } catch (error) {
      console.error("Error fetching transcript:", error);
      res.status(500).json({ message: "Failed to fetch transcript" });
    }
  });

  // End voice interview session
  app.post("/api/interview/end-session", async (req, res) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: "Missing sessionId" });
      }

      voiceInterviewService.endSession(sessionId);

      res.json({ message: "Session ended successfully" });
    } catch (error) {
      console.error("Error ending session:", error);
      res.status(500).json({ message: "Failed to end session" });
    }
  });

  return httpServer;
}
