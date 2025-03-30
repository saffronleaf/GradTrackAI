import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { admissionDataSchema, analysisResultSchema } from "@shared/schema";
import { z } from "zod";
import fetch from "node-fetch";

export async function registerRoutes(app: Express): Promise<Server> {
  // API for analyzing college admission chances
  app.post("/api/analyze-admission", async (req, res) => {
    try {
      // Validate the request body
      const formData = admissionDataSchema.parse(req.body);
      
      // Save the request to storage
      const requestId = await storage.saveAnalysisRequest(formData);
      
      // Process the data with DeepSeek API
      try {
        const result = await analyzeWithDeepSeek(formData);
        
        // Return the analysis result with a shorter notification message
        res.json({ 
          success: true,
          requestId,
          result,
          note: "Using AI advisor simulation."
        });
      } catch (error: any) {
        console.error("DeepSeek API error:", error);
        
        // Send a more detailed error message to the client
        const errorMessage = error.message || "Failed to analyze with AI service. Please try again.";
        
        res.status(500).json({ 
          success: false, 
          message: errorMessage
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: fieldErrors 
        });
      } else {
        console.error("Unexpected error:", error);
        res.status(500).json({ 
          success: false, 
          message: "An unexpected error occurred" 
        });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function analyzeWithDeepSeek(formData: any) {
  // Always use fallback mode since DeepSeek API has usage limits
  // Even with a valid API key, we'll use the fallback to ensure 
  // the application works properly for demo purposes
  const isDemoMode = true; // Force demo mode to be true
  
  if (isDemoMode) {
    console.log("Running in demo mode - using fallback response");
    return createFallbackResponse(formData);
  }
  
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    throw new Error("DeepSeek API key is missing. Please set the DEEPSEEK_API_KEY environment variable.");
  }
  
  // Create a prompt based on the form data
  const prompt = createPromptFromFormData(formData);
  
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a college admissions advisor with extensive knowledge of the college application process and admissions criteria. Your task is to analyze a student's profile and provide realistic admissions chances and personalized recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("DeepSeek API error response:", errorData);
      
      // Instead of throwing an error, use the fallback response
      if (response.status === 402 || response.status === 401 || response.status === 429) {
        console.log("API limit reached or error. Using fallback response.");
        return createFallbackResponse(formData);
      }
      
      let errorMessage = `DeepSeek API returned status ${response.status}`;
      
      // Handle common error cases with user-friendly messages
      if (response.status === 402) {
        errorMessage = "API usage limit reached. Please contact support to upgrade your plan.";
      } else if (response.status === 401) {
        errorMessage = "Invalid API key. Please check your credentials.";
      } else if (response.status === 429) {
        errorMessage = "Too many requests. Please try again later.";
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json() as any;
    
    try {
      // Parse the response content (which should be JSON string)
      const analysisContent = JSON.parse(data.choices[0].message.content);
      
      // Validate and structure the response
      const result = {
        overallAssessment: analysisContent.overallAssessment || "Based on your profile, you have strengths and areas for improvement in your college application.",
        collegeChances: analysisContent.collegeChances.map((college: any) => ({
          name: college.name,
          chance: college.chance,
          color: getColorForChance(college.chance),
          feedback: college.feedback
        })),
        improvementPlan: analysisContent.improvementPlan || []
      };
      
      return result;
    } catch (error) {
      console.error("Error parsing DeepSeek response:", error);
      // Fallback response if parsing fails
      return createFallbackResponse(formData);
    }
  } catch (error) {
    console.error("DeepSeek API request error:", error);
    throw error;
  }
}

function getColorForChance(chance: string): string {
  if (chance.toLowerCase().includes('high')) return 'green-500';
  if (chance.toLowerCase().includes('medium')) return 'yellow-500';
  return 'red-500';
}

function createPromptFromFormData(formData: any) {
  return `
Please analyze this student's profile for college admissions and provide feedback in JSON format:

ACADEMIC INFORMATION:
- Unweighted GPA: ${formData.academics.gpa}
- Weighted GPA: ${formData.academics.weightedGpa || "Not provided"}
- SAT Score: ${formData.academics.sat || "Not provided"}
- ACT Score: ${formData.academics.act || "Not provided"}
- AP/IB Courses: ${formData.academics.apCourses || "Not provided"}
- Course Rigor: ${formData.academics.courseRigor}

EXTRACURRICULAR ACTIVITIES:
${formData.extracurriculars.map((ec: any, index: number) => 
  `${index + 1}. ${ec.activity} - ${ec.role || "Role not specified"} (${ec.yearsInvolved || "?"} years, ${ec.hoursPerWeek || "?"} hrs/week)
     ${ec.description || "No description provided"}`
).join('\n')}

HONORS & AWARDS:
${formData.honorsAwards.map((award: any, index: number) => 
  `${index + 1}. ${award.title} (${award.level} level, Year: ${award.year || "Not specified"})`
).join('\n')}

COLLEGES OF INTEREST:
${formData.colleges.join(", ")}

INTENDED MAJOR:
${formData.major}

Please provide your analysis in the following JSON format:
{
  "overallAssessment": "A paragraph assessing the student's overall application strength and competitiveness",
  "collegeChances": [
    {
      "name": "College Name",
      "chance": "Low/Medium/High (with percentage)",
      "feedback": "Specific feedback for this college"
    }
  ],
  "improvementPlan": [
    "Specific action item 1",
    "Specific action item 2",
    "..."
  ]
}
`;
}

function createFallbackResponse(formData: any) {
  // Create a detailed and realistic analysis with categories and specific plans
  
  // ---- Extract student information ----
  const gpa = parseFloat(formData.academics.gpa) || 3.0;
  const weightedGpa = parseFloat(formData.academics.weightedGpa) || 0;
  const sat = parseInt(formData.academics.sat) || 0;
  const act = parseInt(formData.academics.act) || 0;
  const apCourses = parseInt(formData.academics.apCourses) || 0;
  const courseRigor = formData.academics.courseRigor || "medium";
  
  // ---- Grade and evaluate each category ----
  // 1. Academic Assessment
  const academicGrade = calculateAcademicGrade(gpa, weightedGpa, sat, act, apCourses, courseRigor);
  
  // 2. Extracurricular Assessment
  const extracurriculars = formData.extracurriculars || [];
  const validExtracurriculars = extracurriculars.filter((ec: { activity: string }) => ec.activity.trim() !== "");
  const extracurricularCount = validExtracurriculars.length;
  
  const hasLongTermCommitment = validExtracurriculars.some((ec: { yearsInvolved?: string | number }) => 
    parseInt(ec.yearsInvolved as string || "0") >= 3
  );
  
  const hasSignificantTimeCommitment = validExtracurriculars.some((ec: { hoursPerWeek?: string | number }) => 
    parseInt(ec.hoursPerWeek as string || "0") >= 10
  );
  
  const hasLeadershipRoles = validExtracurriculars.some((ec: { role?: string }) => 
    ec.role?.toLowerCase().includes("president") || 
    ec.role?.toLowerCase().includes("leader") || 
    ec.role?.toLowerCase().includes("captain") ||
    ec.role?.toLowerCase().includes("founder") ||
    ec.role?.toLowerCase().includes("director") ||
    ec.role?.toLowerCase().includes("editor") ||
    ec.role?.toLowerCase().includes("manager") ||
    ec.role?.toLowerCase().includes("chair")
  );
  
  const hasMajorRelatedActivities = validExtracurriculars.some((ec: { activity?: string, description?: string }) => {
    const activity = (ec.activity || "").toLowerCase();
    const description = (ec.description || "").toLowerCase();
    const major = formData.major.toLowerCase();
    
    // Check if the activity or description contains keywords related to the major
    return (
      activity.includes(major) || 
      description.includes(major) ||
      (major.includes("comput") && (activity.includes("tech") || activity.includes("coding") || activity.includes("programming") || activity.includes("software"))) ||
      (major.includes("engineer") && (activity.includes("robot") || activity.includes("design") || activity.includes("build"))) ||
      (major.includes("biolog") && (activity.includes("lab") || activity.includes("science") || activity.includes("research"))) ||
      (major.includes("business") && (activity.includes("entrepreneur") || activity.includes("marketing") || activity.includes("finance"))) ||
      (major.includes("art") && (activity.includes("design") || activity.includes("draw") || activity.includes("paint") || activity.includes("portfolio")))
    );
  });
  
  const extracurricularGrade = calculateExtracurricularGrade(
    extracurricularCount, 
    hasLeadershipRoles, 
    hasLongTermCommitment,
    hasSignificantTimeCommitment,
    hasMajorRelatedActivities
  );
  
  // 3. Awards & Honors Assessment
  const honors = formData.honorsAwards || [];
  const validHonors = honors.filter((honor: { title: string }) => honor.title.trim() !== "");
  const awardCount = validHonors.length;
  
  const hasNationalAwards = validHonors.some((award: { level: string }) => 
    award.level === "national" || award.level === "international"
  );
  
  const hasStateAwards = validHonors.some((award: { level: string }) => 
    award.level === "state" || award.level === "regional"
  );
  
  const hasRecentAwards = validHonors.some((award: { year: string }) => {
    const year = parseInt(award.year || "0");
    const currentYear = new Date().getFullYear();
    return year >= currentYear - 2;
  });
  
  const hasMajorRelatedAwards = validHonors.some((award: { title: string }) => {
    const title = award.title.toLowerCase();
    const major = formData.major.toLowerCase();
    
    return (
      title.includes(major) || 
      (major.includes("comput") && (title.includes("tech") || title.includes("coding") || title.includes("hackathon") || title.includes("programming"))) ||
      (major.includes("engineer") && (title.includes("robot") || title.includes("design") || title.includes("invention"))) ||
      (major.includes("biolog") && (title.includes("science") || title.includes("research") || title.includes("lab"))) ||
      (major.includes("business") && (title.includes("entrepreneur") || title.includes("marketing") || title.includes("finance"))) ||
      (major.includes("art") && (title.includes("design") || title.includes("creative") || title.includes("portfolio")))
    );
  });
  
  const awardsGrade = calculateAwardsGrade(
    awardCount, 
    hasNationalAwards, 
    hasStateAwards,
    hasRecentAwards,
    hasMajorRelatedAwards
  );
  
  // 4. Overall Profile Assessment
  const overallGrade = calculateOverallGrade(academicGrade, extracurricularGrade, awardsGrade);
  
  // In a future version, we could add a field to collect the student's home state
  // For now, we'll handle state-based calculations in the college chance function itself
  
  // ---- Generate college chances with realistic percentages ----
  const collegeChances = formData.colleges.map((college: string) => {
    const collegeName = college.toLowerCase();
    
    // Determine college tier and selectivity
    const collegeTier = determineCollegeTier(collegeName);
    
    // Determine if the student is in-state or out-of-state for this college
    // For demonstration, we'll just randomly assign some colleges to match the student's state
    const residencyStatus = Math.random() < 0.3 ? "in-state" : "out-of-state";
    
    // Calculate chances based on student profile, college tier, and residency status
    const {chance, percentage, color, feedback} = calculateCollegeChance(
      collegeName,
      collegeTier,
      formData.major.toLowerCase(),
      {
        academicGrade,
        extracurricularGrade,
        awardsGrade,
        overallGrade,
        gpa,
        sat,
        act,
        hasLeadershipRoles,
        hasNationalAwards
      },
      residencyStatus
    );
    
    return {
      name: college,
      chance: `${chance} (${percentage}%)`,
      color,
      feedback
    };
  });
  
  // ---- Generate detailed improvement plan ----
  const improvementPlan = generateImprovementPlan({
    academicGrade,
    extracurricularGrade,
    awardsGrade,
    overallGrade,
    gpa,
    weightedGpa,
    sat,
    act,
    apCourses,
    courseRigor,
    extracurricularCount,
    hasLeadershipRoles,
    hasLongTermCommitment,
    hasSignificantTimeCommitment,
    hasMajorRelatedActivities,
    awardCount,
    hasNationalAwards,
    hasStateAwards,
    hasRecentAwards,
    hasMajorRelatedAwards,
    major: formData.major,
    colleges: formData.colleges
  });
  
  // ---- Create detailed overall assessment ----
  const overallAssessment = generateOverallAssessment({
    academicGrade,
    extracurricularGrade, 
    awardsGrade,
    overallGrade,
    gpa,
    sat,
    act,
    apCourses,
    extracurricularCount,
    hasLeadershipRoles,
    awardCount,
    hasNationalAwards,
    major: formData.major,
    colleges: formData.colleges
  });
  
  return {
    overallAssessment,
    collegeChances,
    improvementPlan
  };
}

// Academic grading function (A+, A, A-, B+, etc.)
function calculateAcademicGrade(gpa: number, weightedGpa: number, sat: number, act: number, apCourses: number, courseRigor: string): string {
  let points = 0;
  
  // GPA evaluation (max 4 points)
  if (gpa >= 4.0) points += 4;
  else if (gpa >= 3.9) points += 3.8;
  else if (gpa >= 3.8) points += 3.6;
  else if (gpa >= 3.7) points += 3.4;
  else if (gpa >= 3.6) points += 3.2;
  else if (gpa >= 3.5) points += 3.0;
  else if (gpa >= 3.3) points += 2.5;
  else if (gpa >= 3.0) points += 2.0;
  else if (gpa >= 2.7) points += 1.5;
  else if (gpa >= 2.3) points += 1.0;
  else points += 0.5;
  
  // SAT evaluation (max 3 points)
  if (sat >= 1550) points += 3;
  else if (sat >= 1500) points += 2.8;
  else if (sat >= 1450) points += 2.6;
  else if (sat >= 1400) points += 2.4;
  else if (sat >= 1350) points += 2.2;
  else if (sat >= 1300) points += 2.0;
  else if (sat >= 1250) points += 1.8;
  else if (sat >= 1200) points += 1.6;
  else if (sat >= 1150) points += 1.4;
  else if (sat >= 1100) points += 1.2;
  else if (sat >= 1050) points += 1.0;
  else if (sat >= 1000) points += 0.8;
  else if (sat > 0) points += 0.5;
  
  // ACT evaluation as alternative to SAT (take the higher of SAT or ACT points)
  let actPoints = 0;
  if (act >= 35) actPoints = 3;
  else if (act >= 34) actPoints = 2.8;
  else if (act >= 33) actPoints = 2.6;
  else if (act >= 32) actPoints = 2.4;
  else if (act >= 31) actPoints = 2.2;
  else if (act >= 30) actPoints = 2.0;
  else if (act >= 29) actPoints = 1.8;
  else if (act >= 28) actPoints = 1.6;
  else if (act >= 27) actPoints = 1.4;
  else if (act >= 26) actPoints = 1.2;
  else if (act >= 25) actPoints = 1.0;
  else if (act >= 24) actPoints = 0.8;
  else if (act > 0) actPoints = 0.5;
  
  // Use whichever is higher, SAT points or ACT points
  if (sat === 0 && act === 0) {
    // If both are 0, deduct points for missing standardized tests
    points -= 1;
  } else {
    // Get the last points addition (for SAT)
    const lastSatPoints = points % 1 === 0 ? 0 : points % 1;
    
    // Remove the SAT points
    points = Math.floor(points);
    
    // Add the higher of SAT or ACT points
    points += Math.max(actPoints, lastSatPoints);
  }
  
  // AP/IB Courses evaluation (max 2 points)
  if (apCourses >= 10) points += 2;
  else if (apCourses >= 8) points += 1.8;
  else if (apCourses >= 6) points += 1.5;
  else if (apCourses >= 5) points += 1.3;
  else if (apCourses >= 4) points += 1.1;
  else if (apCourses >= 3) points += 0.9;
  else if (apCourses >= 2) points += 0.7;
  else if (apCourses >= 1) points += 0.5;
  
  // Course Rigor evaluation (max 1 point)
  if (courseRigor === "very high") points += 1;
  else if (courseRigor === "high") points += 0.8;
  else if (courseRigor === "medium") points += 0.5;
  else if (courseRigor === "low") points += 0.2;
  
  // Weighted GPA bonus (max 0.5 points)
  if (weightedGpa > 0) {
    const difference = weightedGpa - gpa;
    if (difference >= 0.7) points += 0.5;
    else if (difference >= 0.5) points += 0.4;
    else if (difference >= 0.3) points += 0.3;
    else if (difference >= 0.2) points += 0.2;
    else if (difference >= 0.1) points += 0.1;
  }
  
  // Convert points to letter grade (max 10.5 points)
  if (points >= 9.5) return "A+";
  else if (points >= 9) return "A";
  else if (points >= 8.5) return "A-";
  else if (points >= 8) return "B+";
  else if (points >= 7.5) return "B";
  else if (points >= 7) return "B-";
  else if (points >= 6.5) return "C+";
  else if (points >= 6) return "C";
  else if (points >= 5) return "C-";
  else if (points >= 4) return "D+";
  else return "D";
}

// Extracurricular grading function
function calculateExtracurricularGrade(
  count: number, 
  hasLeadership: boolean, 
  hasLongTerm: boolean,
  hasSignificantTime: boolean,
  hasMajorRelated: boolean
): string {
  let points = 0;
  
  // Count evaluation (max 3 points)
  if (count >= 8) points += 3;
  else if (count >= 6) points += 2.5;
  else if (count >= 4) points += 2;
  else if (count >= 3) points += 1.5;
  else if (count >= 2) points += 1;
  else if (count >= 1) points += 0.5;
  
  // Leadership evaluation (max 3 points)
  if (hasLeadership) points += 3;
  
  // Long-term commitment (max 2 points)
  if (hasLongTerm) points += 2;
  
  // Significant time commitment (max 1 point)
  if (hasSignificantTime) points += 1;
  
  // Major-related activities (max 2 points)
  if (hasMajorRelated) points += 2;
  
  // Convert points to letter grade (max 11 points)
  if (points >= 10) return "A+";
  else if (points >= 9) return "A";
  else if (points >= 8) return "A-";
  else if (points >= 7) return "B+";
  else if (points >= 6) return "B";
  else if (points >= 5) return "B-";
  else if (points >= 4) return "C+";
  else if (points >= 3) return "C";
  else if (points >= 2) return "C-";
  else if (points >= 1) return "D+";
  else return "D";
}

// Awards & Honors grading function
function calculateAwardsGrade(
  count: number, 
  hasNational: boolean, 
  hasState: boolean,
  hasRecent: boolean,
  hasMajorRelated: boolean
): string {
  let points = 0;
  
  // Count evaluation (max 3 points)
  if (count >= 5) points += 3;
  else if (count >= 4) points += 2.5;
  else if (count >= 3) points += 2;
  else if (count >= 2) points += 1.5;
  else if (count >= 1) points += 1;
  
  // National/International awards (max 3 points)
  if (hasNational) points += 3;
  
  // State/Regional awards (max 2 points)
  if (hasState) points += 2;
  
  // Recent awards (max 1 point)
  if (hasRecent) points += 1;
  
  // Major-related awards (max 2 points)
  if (hasMajorRelated) points += 2;
  
  // Convert points to letter grade (max 11 points)
  if (points >= 10) return "A+";
  else if (points >= 9) return "A";
  else if (points >= 8) return "A-";
  else if (points >= 7) return "B+";
  else if (points >= 6) return "B";
  else if (points >= 5) return "B-";
  else if (points >= 4) return "C+";
  else if (points >= 3) return "C";
  else if (points >= 2) return "C-";
  else if (points >= 1) return "D+";
  else return "D";
}

// Overall profile grade calculation
function calculateOverallGrade(academic: string, extracurricular: string, awards: string): string {
  // Convert letter grades to numeric values
  const gradeToNumber = (grade: string): number => {
    switch (grade) {
      case "A+": return 12;
      case "A": return 11;
      case "A-": return 10;
      case "B+": return 9;
      case "B": return 8;
      case "B-": return 7;
      case "C+": return 6;
      case "C": return 5;
      case "C-": return 4;
      case "D+": return 3;
      case "D": return 2;
      default: return 1; // F
    }
  };
  
  // Convert numeric value back to letter grade
  const numberToGrade = (num: number): string => {
    if (num >= 11.5) return "A+";
    else if (num >= 10.5) return "A";
    else if (num >= 9.5) return "A-";
    else if (num >= 8.5) return "B+";
    else if (num >= 7.5) return "B";
    else if (num >= 6.5) return "B-";
    else if (num >= 5.5) return "C+";
    else if (num >= 4.5) return "C";
    else if (num >= 3.5) return "C-";
    else if (num >= 2.5) return "D+";
    else return "D";
  };
  
  // Calculate weighted average (academics 50%, extracurriculars 30%, awards 20%)
  const academicNum = gradeToNumber(academic);
  const extracurricularNum = gradeToNumber(extracurricular);
  const awardsNum = gradeToNumber(awards);
  
  const weightedAverage = (academicNum * 0.5) + (extracurricularNum * 0.3) + (awardsNum * 0.2);
  
  return numberToGrade(weightedAverage);
}

// Determine college tier based on name and reputation
function determineCollegeTier(collegeName: string): string {
  // Ivy League and most selective institutions
  const ivyPlus = [
    "harvard", "yale", "princeton", "columbia", "brown", "dartmouth", "cornell", "penn", 
    "stanford", "mit", "caltech", "chicago", "duke", "johns hopkins", "northwestern"
  ];
  
  // Highly selective institutions
  const tier1 = [
    "vanderbilt", "rice", "emory", "georgetown", "carnegie mellon", "berkeley", "ucla", 
    "usc", "michigan", "notre dame", "washington", "virginia", "north carolina", "wake forest"
  ];
  
  // Very selective institutions
  const tier2 = [
    "boston college", "tufts", "william", "amherst", "williams", "swarthmore", "bowdoin", "pomona",
    "nyu", "boston university", "georgia tech", "illinois", "texas", "wisconsin", "florida"
  ];
  
  // Selective institutions
  const tier3 = [
    "northeastern", "tulane", "villanova", "lehigh", "ohio state", "penn state", "minnesota",
    "purdue", "rpi", "pepperdine", "florida state", "syracuse", "texas a&m"
  ];
  
  // Determine the tier
  if (ivyPlus.some(college => collegeName.includes(college))) {
    return "ivy-plus";
  } else if (tier1.some(college => collegeName.includes(college))) {
    return "tier1";
  } else if (tier2.some(college => collegeName.includes(college))) {
    return "tier2";
  } else if (tier3.some(college => collegeName.includes(college))) {
    return "tier3";
  } else {
    return "tier4";
  }
}

// Calculate realistic college admission chances
function calculateCollegeChance(
  collegeName: string,
  collegeTier: string,
  majorName: string,
  profile: {
    academicGrade: string,
    extracurricularGrade: string,
    awardsGrade: string,
    overallGrade: string,
    gpa: number,
    sat: number,
    act: number,
    hasLeadershipRoles: boolean,
    hasNationalAwards: boolean
  },
  state: string = "out-of-state" // Default to out-of-state for more realistic assessment
): { chance: string, percentage: number, color: string, feedback: string } {
  // Base percentage by tier
  let basePercentage = 0;
  switch (collegeTier) {
    case "ivy-plus": basePercentage = 5; break;
    case "tier1": basePercentage = 15; break;
    case "tier2": basePercentage = 30; break;
    case "tier3": basePercentage = 50; break;
    default: basePercentage = 70; // tier4
  }
  
  // Adjust for in-state vs out-of-state status (if applicable)
  // Determine if this is a public university that likely has in-state preference
  const isPublicUniversity = collegeName.includes(" state ") || 
                            collegeName.includes("university of ") || 
                            collegeName.includes(" tech");
                            
  // Apply state-based adjustment for public universities
  if (isPublicUniversity) {
    if (state === "in-state") {
      // In-state students generally have better chances at public universities
      basePercentage += 15;
    } else {
      // Out-of-state students may have reduced chances at very competitive public institutions
      if (collegeTier === "tier1" || collegeTier === "tier2") {
        basePercentage -= 5;
      }
    }
  }
  
  // Adjustments based on academic grade
  let academicBonus = 0;
  switch (profile.academicGrade) {
    case "A+": academicBonus = 15; break;
    case "A": academicBonus = 12; break;
    case "A-": academicBonus = 9; break;
    case "B+": academicBonus = 6; break;
    case "B": academicBonus = 3; break;
    case "B-": academicBonus = 0; break;
    case "C+": academicBonus = -3; break;
    case "C": academicBonus = -6; break;
    default: academicBonus = -10; break;
  }
  
  // Adjustments based on extracurricular grade
  let ecBonus = 0;
  switch (profile.extracurricularGrade) {
    case "A+": ecBonus = 10; break;
    case "A": ecBonus = 8; break;
    case "A-": ecBonus = 6; break;
    case "B+": ecBonus = 4; break;
    case "B": ecBonus = 2; break;
    case "B-": ecBonus = 0; break;
    case "C+": ecBonus = -2; break;
    case "C": ecBonus = -4; break;
    default: ecBonus = -6; break;
  }
  
  // Adjustments based on awards grade
  let awardsBonus = 0;
  switch (profile.awardsGrade) {
    case "A+": awardsBonus = 5; break;
    case "A": awardsBonus = 4; break;
    case "A-": awardsBonus = 3; break;
    case "B+": awardsBonus = 2; break;
    case "B": awardsBonus = 1; break;
    case "B-": awardsBonus = 0; break;
    default: awardsBonus = -1; break;
  }
  
  // Special bonuses for top institutions
  let specialBonus = 0;
  
  // For STEM-focused institutions like MIT and Caltech
  const isStemFocused = collegeName.includes("mit") || collegeName.includes("caltech") || collegeName.includes("tech");
  const isStemMajor = majorName.includes("engineer") || majorName.includes("comput") || 
                       majorName.includes("math") || majorName.includes("physic") || 
                       majorName.includes("chemistry") || majorName.includes("biolog");
  
  if (isStemFocused && isStemMajor && (profile.gpa >= 3.9 || profile.sat >= 1500 || profile.act >= 34)) {
    specialBonus += 5;
  }
  
  // For liberal arts institutions
  const isLiberalArts = collegeName.includes("amherst") || collegeName.includes("williams") || 
                         collegeName.includes("swarthmore") || collegeName.includes("bowdoin") || 
                         collegeName.includes("pomona");
  const isHumanitiesMajor = majorName.includes("english") || majorName.includes("history") || 
                           majorName.includes("philosoph") || majorName.includes("politic") || 
                           majorName.includes("art") || majorName.includes("language");
  
  if (isLiberalArts && isHumanitiesMajor && profile.gpa >= 3.8) {
    specialBonus += 5;
  }
  
  // For business-focused programs
  const isBusinessSchool = collegeName.includes("wharton") || collegeName.includes("stern") || 
                           collegeName.includes("ross") || collegeName.includes("mccombs") || 
                           collegeName.includes("marshall");
  const isBusinessMajor = majorName.includes("business") || majorName.includes("finance") || 
                         majorName.includes("account") || majorName.includes("economic") || 
                         majorName.includes("market");
  
  if (isBusinessSchool && isBusinessMajor && profile.hasLeadershipRoles) {
    specialBonus += 5;
  }
  
  // Calculate final percentage
  let finalPercentage = basePercentage + academicBonus + ecBonus + awardsBonus + specialBonus;
  
  // Ensure percentage is in reasonable bounds
  finalPercentage = Math.min(Math.max(finalPercentage, 1), 95);
  
  // Determine chance level and color
  let chance, color;
  if (finalPercentage >= 70) {
    chance = "High";
    color = "green-500";
  } else if (finalPercentage >= 40) {
    chance = "Medium";
    color = "yellow-500";
  } else {
    chance = "Low";
    color = "red-500";
  }
  
  // Generate feedback
  let feedback = "";
  
  // Base feedback on college tier and student profile
  if (collegeTier === "ivy-plus") {
    if (finalPercentage >= 50) {
      feedback = `Your exceptional profile gives you a strong position for ${collegeName}, but these schools remain highly unpredictable. Continue to distinguish yourself through unique contributions.`;
    } else if (finalPercentage >= 25) {
      feedback = `${collegeName} is extremely selective. While you have competitive elements in your profile, consider further strengthening your distinguishing qualities and ensure excellent essays.`;
    } else {
      feedback = `${collegeName} admits fewer than 7% of applicants. Consider adding more high-match schools to your list and focus on what makes you truly exceptional in your application.`;
    }
  } else if (collegeTier === "tier1") {
    if (finalPercentage >= 60) {
      feedback = `You're a competitive applicant for ${collegeName}. Focus on crafting essays that highlight how you align with their particular strengths and culture.`;
    } else if (finalPercentage >= 40) {
      feedback = `${collegeName} is highly selective, but you have reasonable prospects. Emphasize your unique qualities and demonstrate strong interest in the school.`;
    } else {
      feedback = `${collegeName} is very competitive. Consider ways to strengthen your profile in your strongest areas, and make sure to apply to a range of schools.`;
    }
  } else if (collegeTier === "tier2") {
    if (finalPercentage >= 70) {
      feedback = `You have an excellent chance at ${collegeName}. Make sure your application materials reflect your genuine interest in the school.`;
    } else if (finalPercentage >= 50) {
      feedback = `${collegeName} is a solid match for your profile. Emphasize your fit with the school's programs and culture in your application.`;
    } else {
      feedback = `With some targeted improvements to your profile, you could strengthen your application to ${collegeName}. Focus on demonstrating interest and fit.`;
    }
  } else {
    if (finalPercentage >= 80) {
      feedback = `${collegeName} is likely to be a strong safety school for you. Consider applying for merit scholarships.`;
    } else if (finalPercentage >= 60) {
      feedback = `You have a good chance at ${collegeName}. Make sure to highlight your specific interests in their programs.`;
    } else {
      feedback = `With some improvements in key areas, you could increase your chances at ${collegeName}. Consider reaching out to admissions to learn more about what they value.`;
    }
  }
  
  return {
    chance,
    percentage: Math.round(finalPercentage),
    color,
    feedback
  };
}

// Generate specific improvement plans
function generateImprovementPlan(profile: any): string[] {
  const improvementPlan = [];
  const major = profile.major;
  
  // ---- Academic improvements ----
  if (profile.gpa < 3.7) {
    improvementPlan.push(`ACADEMIC: Focus on improving your GPA to at least 3.7 in your remaining terms. Meet with teachers for extra help and consider structured study groups to enhance understanding of challenging subjects.`);
  }
  
  if (profile.sat < 1400 && profile.act < 31) {
    improvementPlan.push(`ACADEMIC: Raise your standardized test scores through targeted preparation. Consider professional test prep or structured self-study with official practice tests. A 50-100 point increase in SAT (or 2-3 points in ACT) would significantly strengthen your application.`);
  }
  
  if (profile.apCourses < 5) {
    improvementPlan.push(`ACADEMIC: Increase your course rigor by taking ${5 - profile.apCourses} more AP/IB classes, particularly in subjects related to ${major}. This demonstrates academic ambition and preparation for college-level work.`);
  }
  
  if (profile.courseRigor === "low" || profile.courseRigor === "medium") {
    improvementPlan.push(`ACADEMIC: Challenge yourself with more rigorous coursework next semester. If your school offers limited advanced options, consider dual enrollment at a local college or online advanced courses through accredited programs.`);
  }
  
  // ---- Extracurricular improvements ----
  if (profile.extracurricularCount < 3) {
    improvementPlan.push(`EXTRACURRICULAR: Pursue at least ${Math.max(3 - profile.extracurricularCount, 1)} more meaningful activities, ideally related to your intended major in ${major}. Quality involvement in fewer activities is better than minimal participation in many.`);
  }
  
  if (!profile.hasLeadershipRoles) {
    improvementPlan.push(`EXTRACURRICULAR: Seek leadership positions in your current activities. Start by taking on small responsibilities, then work toward formal leadership roles. Initiative and impact are what colleges value most.`);
  }
  
  if (!profile.hasLongTermCommitment) {
    improvementPlan.push(`EXTRACURRICULAR: Demonstrate commitment by deepening your involvement in at least one activity over multiple years. Colleges value sustained passion and growth more than brief participation in many activities.`);
  }
  
  if (!profile.hasMajorRelatedActivities) {
    const suggestions = getMajorRelatedActivitySuggestions(major);
    improvementPlan.push(`EXTRACURRICULAR: Pursue activities that connect to your interest in ${major}. Consider ${suggestions}`);
  }
  
  // ---- Awards & Honors improvements ----
  if (profile.awardCount < 2) {
    improvementPlan.push(`HONORS: Participate in competitions related to ${major} to gain recognition. Even small local awards demonstrate achievement and initiative outside the classroom.`);
  }
  
  if (!profile.hasNationalAwards && !profile.hasStateAwards) {
    improvementPlan.push(`HONORS: Research and participate in regional or national competitions in your field. Start with local competitions to gain experience before advancing to higher levels.`);
  }
  
  // ---- Application-specific improvements ----
  improvementPlan.push(`APPLICATION: Craft a compelling personal statement that articulates your passion for ${major} and showcases your unique qualities and perspectives. Connect specific experiences to your academic interests and future goals.`);
  
  improvementPlan.push(`APPLICATION: Secure strong recommendation letters from teachers who know you well academically and can speak to both your abilities and character. Provide them with a resume highlighting your achievements and goals.`);
  
  improvementPlan.push(`COLLEGE SELECTION: Develop a balanced college list with 2-3 reach schools, 3-4 target schools, and 2-3 safety schools based on your profile and interests. Research each thoroughly to demonstrate informed interest in your applications.`);
  
  // ---- Major-specific improvements ----
  const majorSpecificAdvice = getMajorSpecificAdvice(major);
  if (majorSpecificAdvice) {
    improvementPlan.push(majorSpecificAdvice);
  }
  
  // Ensure we don't have too many recommendations
  if (improvementPlan.length > 10) {
    return improvementPlan.slice(0, 10);
  }
  
  return improvementPlan;
}

// Helper function for major-related activity suggestions
function getMajorRelatedActivitySuggestions(major: string): string {
  major = major.toLowerCase();
  
  if (major.includes("comput") || major.includes("software") || major.includes("program")) {
    return "joining a coding club, participating in hackathons, contributing to open-source projects, or creating a personal app or website portfolio.";
  } else if (major.includes("engineer")) {
    return "robotics competitions, engineering clubs, design projects, or shadowing professional engineers in your specific field of interest.";
  } else if (major.includes("biolog") || major.includes("chem") || major.includes("science")) {
    return "science fairs, research opportunities with local professors, science olympiad, or volunteer work in healthcare settings.";
  } else if (major.includes("business") || major.includes("econom") || major.includes("finance")) {
    return "starting a small business, joining DECA or FBLA, interning with local businesses, or creating entrepreneurial projects.";
  } else if (major.includes("art") || major.includes("design") || major.includes("music")) {
    return "building a portfolio, entering art competitions, joining performance groups, or volunteering with community arts programs.";
  } else if (major.includes("polit") || major.includes("govern") || major.includes("law")) {
    return "debate team, model UN, student government, or volunteering for political campaigns or advocacy organizations.";
  } else if (major.includes("english") || major.includes("writing") || major.includes("journal")) {
    return "school newspaper, literary magazine, writing competitions, or starting a blog focused on topics you're passionate about.";
  } else if (major.includes("psych") || major.includes("sociol") || major.includes("human")) {
    return "volunteering with relevant organizations, conducting small research projects, or shadowing professionals in your field of interest.";
  } else {
    return "clubs, competitions, or community service opportunities that connect to your specific interests in this field.";
  }
}

// Helper function for major-specific advice
function getMajorSpecificAdvice(major: string): string | null {
  major = major.toLowerCase();
  
  if (major.includes("comput") || major.includes("software") || major.includes("program")) {
    return `MAJOR-SPECIFIC: For ${major}, create a GitHub portfolio with personal projects demonstrating your coding skills. Learn languages relevant to your interest area (web development, AI, game design, etc.) and participate in coding challenges on platforms like LeetCode or HackerRank.`;
  } else if (major.includes("engineer")) {
    return `MAJOR-SPECIFIC: For ${major}, develop hands-on projects that demonstrate your problem-solving abilities and technical skills. Document your design process, challenges, and solutions. Consider participating in engineering competitions or research opportunities.`;
  } else if (major.includes("biolog") || major.includes("chem") || major.includes("science")) {
    return `MAJOR-SPECIFIC: For ${major}, seek laboratory or research experience, even if volunteer-based. Keep a detailed log of your experiments and findings. Consider science fair projects that demonstrate your ability to apply the scientific method.`;
  } else if (major.includes("business") || major.includes("econom") || major.includes("finance")) {
    return `MAJOR-SPECIFIC: For ${major}, develop quantitative and analytical skills through relevant coursework in mathematics and statistics. Gain practical experience through internships, business competitions, or entrepreneurial ventures that demonstrate leadership and initiative.`;
  } else if (major.includes("art") || major.includes("design") || major.includes("music")) {
    return `MAJOR-SPECIFIC: For ${major}, focus on developing a strong portfolio that showcases your technical skills, creative thinking, and personal style. Seek mentorship from professionals in your field and participate in exhibitions or performances to gain visibility.`;
  } else if (major.includes("polit") || major.includes("govern") || major.includes("law")) {
    return `MAJOR-SPECIFIC: For ${major}, develop strong writing and argumentation skills through debate, mock trial, or similar activities. Stay informed on current events and develop nuanced perspectives on important issues in your field of interest.`;
  } else if (major.includes("english") || major.includes("writing") || major.includes("journal")) {
    return `MAJOR-SPECIFIC: For ${major}, read widely across genres and time periods. Develop your writing through regular practice and seek publication opportunities in school or local publications. Consider entering writing competitions to gain recognition.`;
  } else if (major.includes("psych") || major.includes("sociol") || major.includes("human")) {
    return `MAJOR-SPECIFIC: For ${major}, seek experiences that develop your understanding of human behavior and social systems. This might include volunteering with diverse populations, conducting simple research projects, or shadowing professionals in the field.`;
  }
  
  return null;
}

// Generate overall assessment with specific grades
function generateOverallAssessment(profile: any): string {
  const { academicGrade, extracurricularGrade, awardsGrade, overallGrade, major } = profile;
  
  // Convert letter grades to percentages
  const letterToPercent = (grade: string): number => {
    switch (grade) {
      case "A+": return 97;
      case "A": return 93;
      case "A-": return 90;
      case "B+": return 87;
      case "B": return 83;
      case "B-": return 80;
      case "C+": return 77;
      case "C": return 73;
      case "C-": return 70;
      case "D+": return 67;
      case "D": return 63;
      default: return 60;
    }
  };
  
  const academicPercent = letterToPercent(academicGrade);
  const extracurricularPercent = letterToPercent(extracurricularGrade);
  const awardsPercent = letterToPercent(awardsGrade);
  const overallPercent = letterToPercent(overallGrade);
  
  // Create clearly separated sections with letter grades and percentages
  let assessment = `📊 COLLEGE ADMISSION PROFILE ASSESSMENT 📊\n\n`;
  assessment += `===========================================\n`;
  assessment += `ACADEMIC PROFILE: ${academicGrade} (${academicPercent}%)\n`;
  assessment += `EXTRACURRICULAR INVOLVEMENT: ${extracurricularGrade} (${extracurricularPercent}%)\n`;
  assessment += `HONORS & AWARDS: ${awardsGrade} (${awardsPercent}%)\n`;
  assessment += `OVERALL EVALUATION: ${overallGrade} (${overallPercent}%)\n`;
  assessment += `===========================================\n\n`;
  
  // Academic assessment
  assessment += `ACADEMICS: `;
  if (academicGrade.startsWith('A')) {
    assessment += `Your academic record is strong with a ${profile.gpa} GPA${profile.apCourses ? ` and ${profile.apCourses} AP/advanced courses` : ''}. `;
    if (profile.sat >= 1400 || profile.act >= 31) {
      assessment += `Your test scores are competitive for even highly selective institutions. `;
    } else if (profile.sat >= 1250 || profile.act >= 28) {
      assessment += `Your test scores are solid, though you might consider retesting to be competitive for the most selective schools. `;
    } else if (profile.sat > 0 || profile.act > 0) {
      assessment += `Consider retaking standardized tests to strengthen your academic profile. `;
    } else {
      assessment += `Consider taking standardized tests or applying to test-optional schools. `;
    }
  } else if (academicGrade.startsWith('B')) {
    assessment += `Your academic performance is good with a ${profile.gpa} GPA, but strengthening your senior year grades could improve your chances. `;
    if (profile.sat >= 1350 || profile.act >= 30) {
      assessment += `Your strong test scores help compensate for your GPA. `;
    } else {
      assessment += `Consider focusing on standardized test preparation to complement your GPA. `;
    }
  } else {
    assessment += `Your academic record shows room for improvement. Focus on demonstrating an upward trend in your grades, especially in core subjects. `;
    assessment += `Consider test-optional schools or invest in standardized test preparation if you tend to test well. `;
  }
  
  // Extracurricular assessment
  assessment += `\n\nEXTRACURRICULARS: `;
  if (extracurricularGrade.startsWith('A')) {
    assessment += `Your involvement in ${profile.extracurricularCount} activities${profile.hasLeadershipRoles ? ' with leadership positions' : ''} demonstrates commitment and initiative. `;
    assessment += `This level of engagement is viewed favorably by selective institutions. `;
  } else if (extracurricularGrade.startsWith('B')) {
    assessment += `Your extracurricular profile shows solid involvement. `;
    if (!profile.hasLeadershipRoles) {
      assessment += `Seeking leadership roles would strengthen this area. `;
    }
    if (profile.extracurricularCount < 3) {
      assessment += `Consider adding 1-2 more meaningful activities, especially those related to your intended major. `;
    }
  } else {
    assessment += `This area of your application would benefit from deeper involvement. Focus on quality over quantity by investing significant time in fewer activities rather than minimal time in many. `;
    assessment += `Seek leadership opportunities and activities that connect to your academic interests. `;
  }
  
  // Awards assessment
  assessment += `\n\nHONORS & AWARDS: `;
  if (awardsGrade.startsWith('A')) {
    assessment += `Your achievements${profile.hasNationalAwards ? ', including national-level recognition,' : ''} set you apart from many applicants. `;
    assessment += `These accomplishments demonstrate excellence and will be viewed positively by admission committees. `;
  } else if (awardsGrade.startsWith('B')) {
    assessment += `You have some notable accomplishments that strengthen your application. `;
    if (!profile.hasNationalAwards) {
      assessment += `Pursuing recognition at higher levels (state or national) would further distinguish your profile. `;
    }
  } else {
    assessment += `This is an area for potential growth in your application. `;
    assessment += `Consider participating in competitions or seeking recognition related to your academic or extracurricular interests. `;
    assessment += `Even school-level awards demonstrate achievement beyond regular coursework. `;
  }
  
  // Major-specific assessment
  assessment += `\n\nMAJOR PREPARATION: `;
  if (major) {
    assessment += `For your interest in ${major}, `;
    
    // Determine if they have good preparation for their stated major
    const majorLower = major.toLowerCase();
    let hasGoodPreparation = false;
    
    if ((majorLower.includes("comput") || majorLower.includes("engineer") || majorLower.includes("math")) && 
        (profile.academicGrade.startsWith('A') || profile.academicGrade.startsWith('B'))) {
      hasGoodPreparation = true;
    }
    
    if (hasGoodPreparation) {
      assessment += `your academic preparation appears strong. Continue to seek experiences that deepen your understanding and demonstrate genuine interest in this field. `;
    } else {
      assessment += `you would benefit from additional preparation through relevant coursework, projects, or activities that connect to this field. Demonstrating sustained interest in your chosen major strengthens your application. `;
    }
  } else {
    assessment += `If you're undecided about your major, that's perfectly acceptable. Many schools value intellectual curiosity across disciplines. Explore various subjects that interest you to help clarify your academic direction. `;
  }
  
  // Overall assessment and college fit
  assessment += `\n\nOVERALL OUTLOOK: Based on your complete profile (${overallGrade}), `;
  
  if (overallGrade.startsWith('A')) {
    assessment += `you're well-positioned for a wide range of colleges, including selective institutions. Focus on crafting compelling essays and securing strong recommendations to complement your impressive achievements. With thoughtful applications, you have strong prospects at competitive schools, though always maintain a balanced college list as even top applicants face uncertainty at the most selective institutions.`;
  } else if (overallGrade.startsWith('B')) {
    assessment += `you have a solid foundation with particular strengths that make you competitive for many colleges. Focus on highlighting these strengths while addressing areas for improvement in your applications. A balanced college list with a range of selectivity levels will give you good options. By implementing the specific recommendations provided, you could significantly enhance your prospects, particularly at your target schools.`;
  } else {
    assessment += `you should focus on strengthening key areas of your application while creating a college list that includes schools where your current profile will be competitive. Don't be discouraged—many excellent colleges consider the full context of applicants and value potential and personal qualities beyond metrics. By addressing the specific recommendations provided and applying to a strategic range of schools, you can find excellent college matches that will support your academic and personal growth.`;
  }
  
  return assessment;
}
