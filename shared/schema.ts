import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Interview Schema
export const interviews = pgTable("interviews", {
  id: varchar("id").primaryKey(),
  password: text("password").notNull(),
  candidateName: text("candidate_name").notNull(),
  candidateEmail: text("candidate_email"),
  role: text("role").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  durationMinutes: varchar("duration_minutes").default("60"), // Interview duration in minutes
  isUsed: boolean("is_used").default(false),
  isStarted: boolean("is_started").default(false),
  sessionStartedAt: timestamp("session_started_at"),
  sessionDeadline: timestamp("session_deadline"), // Computed: sessionStartedAt + duration
  currentQuestionIndex: varchar("current_question_index").default("0"),
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  isUsed: true,
  isStarted: true,
  sessionStartedAt: true,
  sessionDeadline: true,
  currentQuestionIndex: true,
});

// Update schema for PATCH requests - only allow setting to true, not false
export const updateInterviewSchema = z.object({
  isUsed: z.literal(true).optional(), // Can only be set to true
  currentQuestionIndex: z.union([z.number(), z.string()]).optional(),
});

export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Interview = typeof interviews.$inferSelect;

// Login schema for validation
export const loginSchema = z.object({
  interviewId: z.string().min(1, "Interview ID is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// Interview session response
export interface InterviewSession {
  id: string;
  candidateName: string;
  role: string;
  startTime: string;
  endTime: string;
  remainingSeconds: number;
  currentQuestionIndex: number;
}

// Dummy interview questions
export const interviewQuestions = [
  "Tell me about yourself.",
  "Why do you want this job?",
  "What are your greatest strengths?",
  "Describe a challenge you overcame.",
  "Where do you see yourself in 5 years?",
  "Why should we hire you?",
  "Tell me about a time you worked in a team.",
  "How do you handle stress and pressure?",
];
