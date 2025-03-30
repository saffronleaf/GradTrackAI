import { 
  users, type User, type InsertUser, type LoginUser, type RegisterUser,
  type AdmissionData, type AnalysisResult, savedResults, type SavedResult
} from "@shared/schema";

// Enhanced storage interface with authentication methods
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateLogin(email: string, password: string): Promise<User | undefined>;
  saveAnalysisRequest(data: AdmissionData, userId?: number): Promise<string>;
  getAnalysisResult(requestId: string): Promise<AnalysisResult | undefined>;
  saveAnalysisResult(requestId: string, result: AnalysisResult): Promise<void>;
  getUserResults(userId: number): Promise<SavedResult[]>;
  saveUserResult(userId: number, formData: AdmissionData, resultData: AnalysisResult): Promise<SavedResult>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private analysisRequests: Map<string, AdmissionData>;
  private analysisResults: Map<string, AnalysisResult>;
  private savedUserResults: Map<number, SavedResult[]>;
  currentId: number;
  currentResultId: number;
  
  constructor() {
    this.users = new Map();
    this.analysisRequests = new Map();
    this.analysisResults = new Map();
    this.savedUserResults = new Map();
    this.currentId = 1;
    this.currentResultId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async validateLogin(email: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByEmail(email);
    if (user && user.password === password) {
      return user;
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date().toISOString()
    };
    this.users.set(id, user);
    return user;
  }

  async saveAnalysisRequest(data: AdmissionData, userId?: number): Promise<string> {
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
  
  async getUserResults(userId: number): Promise<SavedResult[]> {
    return this.savedUserResults.get(userId) || [];
  }
  
  async saveUserResult(userId: number, formData: AdmissionData, resultData: AnalysisResult): Promise<SavedResult> {
    const id = this.currentResultId++;
    const savedResult: SavedResult = {
      id,
      userId,
      formData: formData as any, // Type simplification for in-memory storage
      resultData: resultData as any, // Type simplification for in-memory storage
      createdAt: new Date().toISOString()
    };
    
    if (!this.savedUserResults.has(userId)) {
      this.savedUserResults.set(userId, []);
    }
    
    const userResults = this.savedUserResults.get(userId)!;
    userResults.push(savedResult);
    
    return savedResult;
  }
}

export const storage = new MemStorage();
