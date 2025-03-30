import { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, X } from "lucide-react";
import { type AdmissionData, type Extracurricular } from "@shared/schema";

interface ExtracurricularsProps {
  formData: AdmissionData;
  setFormData: Dispatch<SetStateAction<AdmissionData>>;
  onNext: () => void;
  onPrev: () => void;
}

export function Extracurriculars({ formData, setFormData, onNext, onPrev }: ExtracurricularsProps) {
  const handleInputChange = (index: number, field: keyof Extracurricular, value: string) => {
    const updatedExtracurriculars = [...formData.extracurriculars];
    updatedExtracurriculars[index] = {
      ...updatedExtracurriculars[index],
      [field]: value,
    };
    
    setFormData((prev) => ({
      ...prev,
      extracurriculars: updatedExtracurriculars,
    }));
  };

  const addExtracurricular = () => {
    setFormData((prev) => ({
      ...prev,
      extracurriculars: [
        ...prev.extracurriculars,
        {
          activity: "",
          role: "",
          yearsInvolved: "",
          hoursPerWeek: "",
          description: "",
        },
      ],
    }));
  };

  const removeExtracurricular = (index: number) => {
    if (formData.extracurriculars.length <= 1) return;
    
    const updatedExtracurriculars = formData.extracurriculars.filter((_, i) => i !== index);
    
    setFormData((prev) => ({
      ...prev,
      extracurriculars: updatedExtracurriculars,
    }));
  };

  const handleContinue = () => {
    // Filter out empty activities
    const filteredExtracurriculars = formData.extracurriculars.filter(
      (activity) => activity.activity.trim() !== ""
    );
    
    // If all are empty, keep at least one empty record
    const updatedExtracurriculars = 
      filteredExtracurriculars.length > 0 
        ? filteredExtracurriculars 
        : [{ activity: "", role: "", yearsInvolved: "", hoursPerWeek: "", description: "" }];
    
    setFormData((prev) => ({
      ...prev,
      extracurriculars: updatedExtracurriculars,
    }));
    
    onNext();
  };

  return (
    <Card className="bg-white shadow-sm rounded-lg p-6 mb-8">
      <CardContent className="p-0 pt-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Extracurricular Activities</h2>
        <p className="text-sm text-gray-600 mb-4">
          Add activities you've participated in outside of the classroom, including clubs, sports, volunteer work, jobs, etc.
        </p>
        
        {formData.extracurriculars.map((activity, index) => (
          <div key={index} className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium text-gray-700">
                {activity.activity ? activity.activity : `Activity ${index + 1}`}
              </h3>
              <button 
                type="button"
                onClick={() => removeExtracurricular(index)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor={`activity-name-${index}`}>Activity Name</Label>
                <Input 
                  id={`activity-name-${index}`}
                  value={activity.activity}
                  onChange={(e) => handleInputChange(index, "activity", e.target.value)}
                  placeholder="Debate Club"
                />
              </div>
              
              <div>
                <Label htmlFor={`activity-role-${index}`}>Position/Role</Label>
                <Input 
                  id={`activity-role-${index}`}
                  value={activity.role}
                  onChange={(e) => handleInputChange(index, "role", e.target.value)}
                  placeholder="President, Member, etc."
                />
              </div>
              
              <div>
                <Label htmlFor={`activity-years-${index}`}>Years Involved</Label>
                <Select 
                  value={activity.yearsInvolved}
                  onValueChange={(value) => handleInputChange(index, "yearsInvolved", value)}
                >
                  <SelectTrigger id={`activity-years-${index}`}>
                    <SelectValue placeholder="Select years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 year</SelectItem>
                    <SelectItem value="2">2 years</SelectItem>
                    <SelectItem value="3">3 years</SelectItem>
                    <SelectItem value="4">4 years</SelectItem>
                    <SelectItem value="5+">5+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor={`activity-hours-${index}`}>Hours per Week</Label>
                <Input 
                  id={`activity-hours-${index}`}
                  value={activity.hoursPerWeek}
                  onChange={(e) => handleInputChange(index, "hoursPerWeek", e.target.value)}
                  placeholder="5"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor={`activity-description-${index}`}>Brief Description</Label>
                <Textarea 
                  id={`activity-description-${index}`}
                  value={activity.description}
                  onChange={(e) => handleInputChange(index, "description", e.target.value)}
                  placeholder="Describe your responsibilities, achievements, and impact"
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
        
        <button 
          type="button"
          onClick={addExtracurricular}
          className="mb-8 flex items-center text-sm font-medium text-primary hover:text-primary/80"
        >
          <PlusCircle className="h-5 w-5 mr-1" />
          Add Another Activity
        </button>
        
        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={onPrev}>
            Back
          </Button>
          <Button onClick={handleContinue}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
