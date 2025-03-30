import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { type AdmissionData } from "@shared/schema";

interface ReviewSubmitProps {
  formData: AdmissionData;
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ReviewSubmit({ formData, onPrev, onSubmit, isSubmitting }: ReviewSubmitProps) {
  const [privacyChecked, setPrivacyChecked] = useState(false);
  
  const handleSubmit = () => {
    if (privacyChecked) {
      onSubmit();
    }
  };
  
  // Format course rigor for display
  const formatCourseRigor = (rigor: string) => {
    switch (rigor) {
      case "low": return "Basic Courses";
      case "medium": return "Some Honors/Advanced";
      case "high": return "Mostly Honors/Advanced";
      case "very_high": return "Maximum Rigor Available";
      default: return "Not provided";
    }
  };
  
  // Format honor/award level for display
  const formatLevel = (level?: string) => {
    if (!level) return "Not specified";
    
    switch (level) {
      case "school": return "School";
      case "district": return "District/Regional";
      case "state": return "State";
      case "national": return "National";
      case "international": return "International";
      default: return level;
    }
  };
  
  // Format grade year for display
  const formatGradeYear = (year?: string) => {
    if (!year) return "Not specified";
    
    switch (year) {
      case "9": return "Freshman Year (9th)";
      case "10": return "Sophomore Year (10th)";
      case "11": return "Junior Year (11th)";
      case "12": return "Senior Year (12th)";
      default: return year;
    }
  };

  return (
    <Card className="bg-white shadow-sm rounded-lg p-6 mb-8">
      <CardContent className="p-0 pt-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Review & Submit</h2>
        <p className="text-sm text-gray-600 mb-6">
          Please review your information before submitting. Our AI will analyze your profile and provide personalized feedback.
        </p>
        
        <div className="space-y-6">
          {/* Academic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Academic Information</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Unweighted GPA</dt>
                  <dd className="text-sm text-gray-900">{formData.academics.gpa || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Weighted GPA</dt>
                  <dd className="text-sm text-gray-900">{formData.academics.weightedGpa || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">SAT Score</dt>
                  <dd className="text-sm text-gray-900">{formData.academics.sat || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">ACT Score</dt>
                  <dd className="text-sm text-gray-900">{formData.academics.act || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">AP/IB Courses</dt>
                  <dd className="text-sm text-gray-900">{formData.academics.apCourses || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Course Rigor</dt>
                  <dd className="text-sm text-gray-900">{formatCourseRigor(formData.academics.courseRigor)}</dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* Extracurricular Activities */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Extracurricular Activities</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              {formData.extracurriculars.filter(ec => ec.activity).length === 0 ? (
                <p className="text-sm text-gray-500">No extracurricular activities provided.</p>
              ) : (
                <ul className="space-y-3">
                  {formData.extracurriculars.map((activity, index) => (
                    activity.activity && (
                      <li key={index}>
                        <p className="text-sm font-medium text-gray-900">{activity.activity}</p>
                        <p className="text-sm text-gray-500">
                          {activity.role || "No role"} • {activity.yearsInvolved || "0"} years • {activity.hoursPerWeek || "0"} hrs/week
                        </p>
                      </li>
                    )
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Honors & Awards */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Honors & Awards</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              {formData.honorsAwards.filter(honor => honor.title).length === 0 ? (
                <p className="text-sm text-gray-500">No honors or awards provided.</p>
              ) : (
                <ul className="space-y-2">
                  {formData.honorsAwards.map((honor, index) => (
                    honor.title && (
                      <li key={index}>
                        <p className="text-sm text-gray-900">
                          {honor.title}
                          <span className="text-gray-500">
                            {" "}({formatLevel(honor.level)} level, {formatGradeYear(honor.year)})
                          </span>
                        </p>
                      </li>
                    )
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Colleges & Major */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Colleges & Major</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-500">Colleges of Interest</h4>
                {formData.colleges.filter(c => c).length === 0 ? (
                  <p className="text-sm text-gray-900">No colleges provided.</p>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {formData.colleges.map((college, index) => (
                      college && (
                        <li key={index} className="text-sm text-gray-900">{college}</li>
                      )
                    ))}
                  </ul>
                )}
              </div>
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-500">Intended Major</h4>
                <p className="text-sm text-gray-900">{formData.major || "Not provided"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Residency Status</h4>
                <p className="text-sm text-gray-900">
                  {formData.residency === "in-state" ? "In-State Student" : 
                   formData.residency === "international" ? "International Student" :
                   "Out-of-State Student"}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 mb-4">
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="privacy" 
              checked={privacyChecked}
              onCheckedChange={(checked) => setPrivacyChecked(checked as boolean)}
            />
            <div>
              <label 
                htmlFor="privacy" 
                className="font-medium text-gray-700 text-sm cursor-pointer"
              >
                I understand my data will be processed
              </label>
              <p className="text-gray-500 text-sm">
                The information provided will be used to generate personalized college admissions advice. Your data is not stored permanently.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={onPrev}>
            Back
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!privacyChecked || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Get My Admissions Analysis"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
