import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, Award, Book, School, Lightbulb, AlertTriangle, TrendingUp, 
  GraduationCap, ScrollText, Medal, Brain, ChevronRight, Plus, Minus 
} from "lucide-react";
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
        return "bg-red-100 text-red-800 border-red-200";
      case "yellow-500":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "green-500":
        return "bg-green-100 text-green-800 border-green-200";
      case "violet-600":
        return "bg-violet-100 text-violet-800 border-violet-200";
      case "blue-600":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "teal-600":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "emerald-600":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "gray-600":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  // Get the appropriate grade color
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return "text-green-600";
    if (grade.startsWith('B')) return "text-blue-600";
    if (grade.startsWith('C')) return "text-yellow-600";
    return "text-red-600";
  };
  
  // Get the icon for a section based on its title
  const getSectionIcon = (title: string) => {
    if (title.includes("Academic")) return <GraduationCap className="h-5 w-5 text-blue-600" />;
    if (title.includes("Extracurricular")) return <ScrollText className="h-5 w-5 text-purple-600" />;
    if (title.includes("Honor")) return <Medal className="h-5 w-5 text-amber-600" />;
    return <Brain className="h-5 w-5 text-teal-600" />;
  };

  const getChanceIcon = (chance: string) => {
    if (chance.includes("High")) return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (chance.includes("Medium")) return <Lightbulb className="h-5 w-5 text-yellow-500" />;
    return <AlertTriangle className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Fallback mode notification */}
      {results.isFallbackMode && (
        <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">Using Simulated Analysis</h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>{results.fallbackNote || "The DeepSeek AI analysis is currently unavailable. Showing a simulated analysis based on your input."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Overall Assessment Card */}
      <div className="relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/80 to-primary rounded-t-lg"></div>
        <Card className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-4">
            <div className="flex items-center gap-3">
              <School className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl text-gray-800">Your College Admissions Assessment</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed">{results.overallAssessment}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Assessment Sections */}
      {results.assessmentSections && results.assessmentSections.length > 0 && (
        <Card className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-purple-600" />
              <CardTitle className="text-xl text-gray-800">Detailed Profile Assessment</CardTitle>
            </div>
            <CardDescription className="text-sm text-gray-500 mt-1">
              Each area of your profile evaluated in detail
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid gap-4">
              {results.assessmentSections.map((section, index) => (
                <div key={index} className="border rounded-lg overflow-hidden shadow-sm">
                  <div className="p-4 bg-slate-50 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getSectionIcon(section.title)}
                        <h3 className="text-lg font-medium text-gray-800">{section.title}</h3>
                      </div>
                      {section.grade && (
                        <Badge className={`text-base px-3 py-1 ${getGradeColor(section.grade)}`}>
                          Grade: {section.grade}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <p className="text-gray-700 mb-4">{section.content}</p>
                    
                    {section.strengths && section.strengths.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                          <Plus className="h-4 w-4 text-green-500" />
                          Strengths
                        </h4>
                        <ul className="space-y-1 pl-6">
                          {section.strengths.map((strength, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {section.weaknesses && section.weaknesses.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                          <Minus className="h-4 w-4 text-red-500" />
                          Areas for Improvement
                        </h4>
                        <ul className="space-y-1 pl-6">
                          {section.weaknesses.map((weakness, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></span>
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* College Admission Chances Card */}
      <Card className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-4">
          <div className="flex items-center gap-3">
            <Book className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-xl text-gray-800">College Admission Chances</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 px-5">
          <div className="grid gap-4">
            {results.collegeChances.map((college, index) => (
              <div key={index} 
                className={`border rounded-lg overflow-hidden shadow-sm ${index === 0 ? 'border-blue-200' : 
                          college.tierColor ? `border-${college.tierColor.replace('600', '200')}` : ''}`}
              >
                <div className={`p-4 flex justify-between items-center ${index === 0 ? 'bg-blue-50' : 
                               college.tierColor ? `bg-${college.tierColor.replace('600', '50')}` : ''}`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-800">{college.name}</h3>
                      {index === 0 && <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">Top Choice</Badge>}
                    </div>
                    
                    {college.collegeTier && (
                      <div className="flex items-center gap-1">
                        <span className={`h-2 w-2 rounded-full bg-${college.tierColor || 'gray-600'}`}></span>
                        <span className="text-xs text-gray-600">
                          {college.collegeTier === "ivy-plus" ? "Elite Institution" :
                           college.collegeTier === "tier1" ? "Highly Selective" :
                           college.collegeTier === "tier2" ? "Very Selective" :
                           college.collegeTier === "tier3" ? "Selective" : "Standard Admission"}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getChanceIcon(college.chance)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getColorClass(college.color)}`}>
                      {college.chance}
                    </span>
                  </div>
                </div>
                <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                  <p className="text-sm text-gray-700 leading-relaxed">{college.feedback}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personalized Improvement Plan Card */}
      <Card className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-50 to-transparent pb-4">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-green-600" />
            <CardTitle className="text-xl text-gray-800">Your Action Plan</CardTitle>
          </div>
          <p className="text-sm text-gray-500 mt-1">Follow these steps to enhance your college application profile</p>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="grid gap-4">
            {results.improvementPlan.map((item, index) => (
              <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                <div className="flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="bg-gray-50 pt-4 flex justify-center">
          <Button 
            onClick={onReset}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full shadow-sm transition-all hover:shadow"
          >
            Start a New Assessment
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
