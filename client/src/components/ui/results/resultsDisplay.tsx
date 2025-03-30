import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { type AnalysisResult } from "@shared/schema";

interface ResultsDisplayProps {
  results: AnalysisResult;
  onReset: () => void;
}

export function ResultsDisplay({ results, onReset }: ResultsDisplayProps) {
  // Get the appropriate color class based on the college chance color value
  const getColorClass = (color: string) => {
    switch (color) {
      case "red-500":
        return "bg-red-100 text-red-800";
      case "yellow-500":
        return "bg-yellow-100 text-yellow-800";
      case "green-500":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      {/* Fallback mode notification */}
      {results.isFallbackMode && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Using Simulated Analysis</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{results.fallbackNote || "The DeepSeek AI analysis is currently unavailable. Showing a simulated analysis based on your input."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Overall Assessment Card */}
      <Card className="bg-white shadow-sm rounded-lg p-6 border-l-4 border-primary">
        <CardContent className="p-0">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Overall Assessment</h2>
          <p className="text-gray-700">{results.overallAssessment}</p>
        </CardContent>
      </Card>

      {/* College Admission Chances Card */}
      <Card className="bg-white shadow-sm rounded-lg p-6">
        <CardContent className="p-0">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">College Admission Chances</h2>
          
          <div className="space-y-4">
            {results.collegeChances.map((college, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div className="p-4 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-800">{college.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getColorClass(college.color)}`}>
                    {college.chance}
                  </span>
                </div>
                <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                  <p className="text-sm text-gray-700">{college.feedback}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personalized Improvement Plan Card */}
      <Card className="bg-white shadow-sm rounded-lg p-6">
        <CardContent className="p-0">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Personalized Improvement Plan</h2>
          
          <ul className="space-y-3">
            {results.improvementPlan.map((item, index) => (
              <li key={index} className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <span className="ml-3 text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-center mt-8">
        <Button 
          variant="outline" 
          onClick={onReset}
          className="px-6 py-3"
        >
          Start a New Assessment
        </Button>
      </div>
    </div>
  );
}
