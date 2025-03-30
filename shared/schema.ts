import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User credentials schema remains the same
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Schema for academic information
export const academicInfoSchema = z.object({
  gpa: z.string().min(1, "GPA is required"),
  weightedGpa: z.string().optional(),
  sat: z.string().optional(),
  act: z.string().optional(),
  apCourses: z.string().optional(),
  courseRigor: z.enum(["low", "medium", "high", "very_high"]).default("medium"),
});

// Schema for extracurricular activities
export const extracurricularSchema = z.object({
  activity: z.string().min(1, "Activity name is required"),
  role: z.string().optional(),
  yearsInvolved: z.string().optional(),
  hoursPerWeek: z.string().optional(),
  description: z.string().optional(),
});

// Schema for honors and awards
export const honorAwardSchema = z.object({
  title: z.string().min(1, "Title is required"),
  level: z.enum(["school", "district", "state", "national", "international"]).default("school"),
  year: z.string().optional(),
});

// Full admission form data schema
export const admissionDataSchema = z.object({
  academics: academicInfoSchema,
  extracurriculars: z.array(extracurricularSchema),
  honorsAwards: z.array(honorAwardSchema),
  colleges: z.array(z.string()),
  major: z.string().min(1, "Major is required"),
  residency: z.enum(["in-state", "out-of-state", "international"]).optional(),
});

export type AcademicInfo = z.infer<typeof academicInfoSchema>;
export type Extracurricular = z.infer<typeof extracurricularSchema>;
export type HonorAward = z.infer<typeof honorAwardSchema>;
export type AdmissionData = z.infer<typeof admissionDataSchema>;

// Schema for the API response from DeepSeek
export const collegeChanceSchema = z.object({
  name: z.string(),
  chance: z.string(),
  color: z.string(),
  collegeTier: z.string().optional(),
  tierColor: z.string().optional(),
  feedback: z.string(),
});

export const assessmentSectionSchema = z.object({
  title: z.string(),
  grade: z.string().optional(),
  content: z.string(),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
});

export const analysisResultSchema = z.object({
  overallAssessment: z.string(),
  assessmentSections: z.array(assessmentSectionSchema).optional(),
  collegeChances: z.array(collegeChanceSchema),
  improvementPlan: z.array(z.string()),
  isFallbackMode: z.boolean().optional(),
  fallbackNote: z.string().nullable().optional(),
});

export type CollegeChance = z.infer<typeof collegeChanceSchema>;
export type AssessmentSection = z.infer<typeof assessmentSectionSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
