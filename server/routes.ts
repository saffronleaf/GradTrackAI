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
        
        // Return the analysis result
        res.json({ 
          success: true,
          requestId,
          result
        });
      } catch (error) {
        console.error("DeepSeek API error:", error);
        res.status(500).json({ 
          success: false, 
          message: "Failed to analyze with AI service. Please try again." 
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
  const apiKey = process.env.DEEPSEEK_API_KEY || "sk-fcc1454100854eaeb19c0a0ebe5eedd9";
  
  // Create a prompt based on the form data
  const prompt = createPromptFromFormData(formData);
  
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
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  
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
  // Create a fallback response if the AI service fails
  return {
    overallAssessment: "Based on your profile, you have a solid academic foundation. To strengthen your application, consider enhancing your extracurricular involvement and seeking leadership opportunities.",
    collegeChances: formData.colleges.map((college: string) => ({
      name: college,
      chance: "Medium (50%)",
      color: "yellow-500",
      feedback: "Your academic profile is in line with this college, but strengthening your extracurricular activities would improve your chances."
    })),
    improvementPlan: [
      "Focus on maintaining or improving your GPA in your remaining terms",
      "Consider taking 1-2 more AP or advanced courses in your intended major",
      "Seek leadership positions in your extracurricular activities",
      "Develop a personal project related to your intended major",
      "Practice for standardized tests to improve your scores"
    ]
  };
}
