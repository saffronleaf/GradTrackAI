import { 
  users, type User, type InsertUser,
  type AdmissionData, type AnalysisResult 
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveAnalysisRequest(data: AdmissionData): Promise<string>;
  getAnalysisResult(requestId: string): Promise<AnalysisResult | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private analysisRequests: Map<string, AdmissionData>;
  private analysisResults: Map<string, AnalysisResult>;
  currentId: number;
  
  constructor() {
    this.users = new Map();
    this.analysisRequests = new Map();
    this.analysisResults = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async saveAnalysisRequest(data: AdmissionData): Promise<string> {
    const requestId = Date.now().toString();
    this.analysisRequests.set(requestId, data);
    return requestId;
  }

  async getAnalysisResult(requestId: string): Promise<AnalysisResult | undefined> {
    return this.analysisResults.get(requestId);
  }

  async saveAnalysisResult(requestId: string, result: AnalysisResult): Promise<void> {
    this.analysisResults.set(requestId, result);
  }
}

export const storage = new MemStorage();
