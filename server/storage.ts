import { type User, type InsertUser, type Interview, type InsertInterview } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Interview methods
  getInterview(id: string): Promise<Interview | undefined>;
  getAllInterviews(): Promise<Interview[]>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  updateInterview(id: string, updates: Partial<Interview>): Promise<Interview | undefined>;
  deleteInterview(id: string): Promise<boolean>;
}

// Generate a random password for interviews
function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Generate a unique interview ID
function generateInterviewId(): string {
  const prefix = "INT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private interviews: Map<string, Interview>;

  constructor() {
    this.users = new Map();
    this.interviews = new Map();
    
    // Add sample interviews for demo
    this.seedSampleData();
  }

  private seedSampleData() {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Active interview (currently accessible)
    const activeInterview: Interview = {
      id: "INT-DEMO-ACTIVE",
      password: "DEMO1234",
      candidateName: "John Smith",
      candidateEmail: "john@example.com",
      role: "Senior Software Engineer",
      startTime: now,
      endTime: twoHoursFromNow,
      durationMinutes: "60",
      isUsed: false,
      isStarted: false,
      sessionStartedAt: null,
      sessionDeadline: null,
      currentQuestionIndex: "0",
    };

    // Scheduled interview (future)
    const scheduledInterview: Interview = {
      id: "INT-DEMO-FUTURE",
      password: "FUTURE99",
      candidateName: "Sarah Johnson",
      candidateEmail: "sarah@example.com",
      role: "Product Manager",
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
      durationMinutes: "60",
      isUsed: false,
      isStarted: false,
      sessionStartedAt: null,
      sessionDeadline: null,
      currentQuestionIndex: "0",
    };

    // Expired interview
    const expiredInterview: Interview = {
      id: "INT-DEMO-EXPIRED",
      password: "EXPIRED1",
      candidateName: "Mike Wilson",
      candidateEmail: "mike@example.com",
      role: "UX Designer",
      startTime: new Date(yesterday.getTime() - 60 * 60 * 1000),
      endTime: yesterday,
      durationMinutes: "60",
      isUsed: false,
      isStarted: false,
      sessionStartedAt: null,
      sessionDeadline: null,
      currentQuestionIndex: "0",
    };

    // Completed interview
    const completedInterview: Interview = {
      id: "INT-DEMO-DONE",
      password: "DONE5678",
      candidateName: "Emily Chen",
      candidateEmail: "emily@example.com",
      role: "Data Analyst",
      startTime: new Date(yesterday.getTime() - 2 * 60 * 60 * 1000),
      endTime: new Date(yesterday.getTime() - 60 * 60 * 1000),
      durationMinutes: "60",
      isUsed: true,
      isStarted: true,
      sessionStartedAt: new Date(yesterday.getTime() - 2 * 60 * 60 * 1000),
      sessionDeadline: new Date(yesterday.getTime() - 60 * 60 * 1000),
      currentQuestionIndex: "8",
    };

    this.interviews.set(activeInterview.id, activeInterview);
    this.interviews.set(scheduledInterview.id, scheduledInterview);
    this.interviews.set(expiredInterview.id, expiredInterview);
    this.interviews.set(completedInterview.id, completedInterview);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getInterview(id: string): Promise<Interview | undefined> {
    return this.interviews.get(id);
  }

  async getAllInterviews(): Promise<Interview[]> {
    return Array.from(this.interviews.values()).sort((a, b) => {
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });
  }

  async createInterview(insertInterview: InsertInterview): Promise<Interview> {
    const id = generateInterviewId();
    const password = generatePassword();
    
    const interview: Interview = {
      id,
      password,
      candidateName: insertInterview.candidateName,
      candidateEmail: insertInterview.candidateEmail ?? null,
      role: insertInterview.role,
      startTime: new Date(insertInterview.startTime),
      endTime: new Date(insertInterview.endTime),
      durationMinutes: (insertInterview as any).durationMinutes ?? "60",
      isUsed: false,
      isStarted: false,
      sessionStartedAt: null,
      sessionDeadline: null,
      currentQuestionIndex: "0",
    };
    
    this.interviews.set(id, interview);
    return interview;
  }

  async updateInterview(id: string, updates: Partial<Interview>): Promise<Interview | undefined> {
    const existing = this.interviews.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.interviews.set(id, updated);
    return updated;
  }

  async deleteInterview(id: string): Promise<boolean> {
    return this.interviews.delete(id);
  }
}

export const storage = new MemStorage();
