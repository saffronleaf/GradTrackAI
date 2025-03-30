import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavedResult, AdmissionData, AnalysisResult } from "@shared/schema";

// Define a more explicit type since the db type might be stored as jsonb
interface DetailedSavedResult {
  id: number;
  userId: number;
  formData: AdmissionData;
  resultData: AnalysisResult;
  createdAt: string;
}

interface UserProfileProps {
  user: {
    id: number;
    username: string;
    email: string;
  };
  onLogout: () => void;
}

export function UserProfile({ user, onLogout }: UserProfileProps) {
  const { toast } = useToast();
  const [userAssessments, setUserAssessments] = useState<DetailedSavedResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserAssessments() {
      try {
        const response = await apiRequest<{ success: boolean; results: DetailedSavedResult[] }>({
          url: "/api/my-assessments",
          method: "GET"
        });

        if (response.success) {
          setUserAssessments(response.results);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch your assessment history"
          });
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "An error occurred while fetching data"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchUserAssessments();
  }, [toast]);

  async function handleLogout() {
    try {
      const response = await apiRequest<{ success: boolean; message: string }>({
        url: "/api/logout",
        method: "POST"
      });

      if (response.success) {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out"
        });
        onLogout();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to log out"
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred during logout"
      });
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getChanceColor(chance: string) {
    if (chance.toLowerCase().includes('high')) return 'text-green-600';
    if (chance.toLowerCase().includes('medium')) return 'text-amber-600';
    return 'text-red-600';
  }

  function viewAssessment(assessment: DetailedSavedResult) {
    // Future expansion: detailed view of an assessment
    toast({
      title: "Assessment Details",
      description: `Viewing assessment from ${formatDate(assessment.createdAt)}`
    });
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Username:</strong> {user.username}
          </div>
          <div>
            <strong>Email:</strong> {user.email}
          </div>
          <Button onClick={handleLogout} variant="outline">Logout</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : userAssessments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>You haven't completed any assessments yet.</p>
              <Button className="mt-4" onClick={() => window.location.href = "/"}>
                Start an Assessment
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {userAssessments.map((assessment) => (
                <Card key={assessment.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <Tabs defaultValue="overview" className="w-full">
                      <div className="bg-muted p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">
                            Assessment for {assessment.formData.colleges.join(", ")}
                          </h3>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(assessment.createdAt)}
                          </span>
                        </div>
                        <TabsList className="bg-background">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="chances">College Chances</TabsTrigger>
                          <TabsTrigger value="plan">Improvement Plan</TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="overview" className="p-4">
                        <p className="text-sm mb-4">{assessment.resultData.overallAssessment}</p>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <span className="text-sm font-medium">Major:</span>
                            <p className="text-sm">{assessment.formData.major}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium">GPA:</span>
                            <p className="text-sm">{assessment.formData.academics.gpa}</p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="chances" className="p-4">
                        <ul className="space-y-3">
                          {assessment.resultData.collegeChances.map((college: { name: string, chance: string }, index: number) => (
                            <li key={index} className="flex justify-between">
                              <span className="font-medium">{college.name}</span>
                              <span className={getChanceColor(college.chance)}>
                                {college.chance}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </TabsContent>

                      <TabsContent value="plan" className="p-4">
                        <ul className="space-y-2 list-disc pl-5">
                          {assessment.resultData.improvementPlan.map((item: string, index: number) => (
                            <li key={index} className="text-sm">{item}</li>
                          ))}
                        </ul>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}