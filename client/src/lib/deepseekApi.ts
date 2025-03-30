import { type AdmissionData, type AnalysisResult } from "@shared/schema";
import { apiRequest } from "./queryClient";

export async function analyzeAdmission(formData: AdmissionData): Promise<AnalysisResult> {
  try {
    const response = await apiRequest("POST", "/api/analyze-admission", formData);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || "Failed to analyze admission data");
    }
    
    return data.result;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}
