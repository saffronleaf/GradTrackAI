import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type AdmissionData, type AnalysisResult } from "@shared/schema";
import { ProgressIndicator } from "./progressIndicator";
import { AcademicInfo } from "./form-steps/academicInfo";
import { Extracurriculars } from "./form-steps/extracurriculars";
import { HonorsAwards } from "./form-steps/honorsAwards";
import { CollegesMajor } from "./form-steps/collegesMajor";
import { ReviewSubmit } from "./form-steps/reviewSubmit";
import { ResultsDisplay } from "./results/resultsDisplay";

export function AdmissionForm() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState<AdmissionData>({
    academics: {
      gpa: "",
      weightedGpa: "",
      sat: "",
      act: "",
      apCourses: "",
      courseRigor: "medium",
    },
    extracurriculars: [{
      activity: "",
      role: "",
      yearsInvolved: "",
      hoursPerWeek: "",
      description: "",
    }],
    honorsAwards: [{
      title: "",
      level: "school",
      year: "",
    }],
    colleges: [""],
    major: "",
  });
  const [results, setResults] = useState<AnalysisResult | null>(null);

  // Mutation for submitting form data
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: AdmissionData) => {
      return apiRequest({
        url: "/api/analyze-admission",
        method: "POST",
        body: data
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        // Check if we have a note about fallback mode
        const isFallbackMode = data.note && data.note.includes("simulation");
        
        // Set the results and any fallback notification
        setResults({
          ...data.result,
          isFallbackMode: isFallbackMode || false,
          fallbackNote: data.note || null
        });
        
        // If using fallback mode, show a toast
        if (isFallbackMode) {
          toast({
            title: "Using Simulated Analysis",
            description: data.note,
            duration: 6000,
          });
        }
        
        setFormSubmitted(true);
        window.scrollTo(0, 0);
      } else {
        // Display the specific error message from the server
        const errorMessage = data.message || "Failed to analyze your profile. Please try again.";
        toast({
          title: "Analysis Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        console.error("API error response:", data);
      }
    },
    onError: (error: any) => {
      console.error("Form submission error:", error);
      let errorMessage = "Failed to connect to the server. Please try again later.";
      
      // Check if we have a more specific error message
      if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Analysis Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = () => {
    mutate(formData);
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormSubmitted(false);
    setResults(null);
    setFormData({
      academics: {
        gpa: "",
        weightedGpa: "",
        sat: "",
        act: "",
        apCourses: "",
        courseRigor: "medium",
      },
      extracurriculars: [{
        activity: "",
        role: "",
        yearsInvolved: "",
        hoursPerWeek: "",
        description: "",
      }],
      honorsAwards: [{
        title: "",
        level: "school",
        year: "",
      }],
      colleges: [""],
      major: "",
    });
  };

  // Main content based on step or if form is submitted
  const renderContent = () => {
    if (formSubmitted && results) {
      return <ResultsDisplay results={results} onReset={resetForm} />;
    }

    switch (currentStep) {
      case 1:
        return (
          <AcademicInfo 
            formData={formData} 
            setFormData={setFormData} 
            onNext={handleNextStep} 
          />
        );
      case 2:
        return (
          <Extracurriculars 
            formData={formData} 
            setFormData={setFormData} 
            onNext={handleNextStep} 
            onPrev={handlePrevStep} 
          />
        );
      case 3:
        return (
          <HonorsAwards 
            formData={formData} 
            setFormData={setFormData} 
            onNext={handleNextStep} 
            onPrev={handlePrevStep} 
          />
        );
      case 4:
        return (
          <CollegesMajor 
            formData={formData} 
            setFormData={setFormData} 
            onNext={handleNextStep} 
            onPrev={handlePrevStep} 
          />
        );
      case 5:
        return (
          <ReviewSubmit 
            formData={formData} 
            onPrev={handlePrevStep} 
            onSubmit={handleSubmit} 
            isSubmitting={isPending} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">College Admissions Advisor</h1>
            {formSubmitted && (
              <button
                onClick={resetForm}
                className="text-sm text-gray-600 hover:text-primary flex items-center"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
                Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!formSubmitted && (
          <ProgressIndicator 
            currentStep={currentStep} 
            totalSteps={totalSteps} 
          />
        )}
        
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-sm">
            <p className="mb-2">College Admissions Advisor uses AI to provide personalized guidance.</p>
            <p>This tool is for informational purposes only and should not be considered a guarantee of admission.</p>
            <p className="mt-4">© {new Date().getFullYear()} College Admissions Advisor. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
