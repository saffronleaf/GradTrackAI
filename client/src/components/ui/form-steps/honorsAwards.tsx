import { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, X } from "lucide-react";
import { type AdmissionData, type HonorAward } from "@shared/schema";

interface HonorsAwardsProps {
  formData: AdmissionData;
  setFormData: Dispatch<SetStateAction<AdmissionData>>;
  onNext: () => void;
  onPrev: () => void;
}

export function HonorsAwards({ formData, setFormData, onNext, onPrev }: HonorsAwardsProps) {
  const handleInputChange = (index: number, field: keyof HonorAward, value: string) => {
    const updatedHonorsAwards = [...formData.honorsAwards];
    updatedHonorsAwards[index] = {
      ...updatedHonorsAwards[index],
      [field]: value,
    };
    
    setFormData((prev) => ({
      ...prev,
      honorsAwards: updatedHonorsAwards,
    }));
  };

  const addHonorAward = () => {
    setFormData((prev) => ({
      ...prev,
      honorsAwards: [
        ...prev.honorsAwards,
        {
          title: "",
          level: "school",
          year: "",
        },
      ],
    }));
  };

  const removeHonorAward = (index: number) => {
    if (formData.honorsAwards.length <= 1) return;
    
    const updatedHonorsAwards = formData.honorsAwards.filter((_, i) => i !== index);
    
    setFormData((prev) => ({
      ...prev,
      honorsAwards: updatedHonorsAwards,
    }));
  };

  const handleContinue = () => {
    // Filter out empty honors
    const filteredHonorsAwards = formData.honorsAwards.filter(
      (honor) => honor.title.trim() !== ""
    );
    
    // If all are empty, keep at least one empty record
    const updatedHonorsAwards = 
      filteredHonorsAwards.length > 0 
        ? filteredHonorsAwards 
        : [{ title: "", level: "school", year: "" }];
    
    setFormData((prev) => ({
      ...prev,
      honorsAwards: updatedHonorsAwards,
    }));
    
    onNext();
  };

  return (
    <Card className="bg-white shadow-sm rounded-lg p-6 mb-8">
      <CardContent className="p-0 pt-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Honors & Awards</h2>
        <p className="text-sm text-gray-600 mb-4">
          List academic honors, awards, and recognitions you've received.
        </p>
        
        {formData.honorsAwards.map((honor, index) => (
          <div key={index} className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium text-gray-700">
                {honor.title ? honor.title : `Honor/Award ${index + 1}`}
              </h3>
              <button 
                type="button"
                onClick={() => removeHonorAward(index)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor={`honor-title-${index}`}>Honor/Award Title</Label>
                <Input 
                  id={`honor-title-${index}`}
                  value={honor.title}
                  onChange={(e) => handleInputChange(index, "title", e.target.value)}
                  placeholder="National Merit Scholar"
                />
              </div>
              
              <div>
                <Label htmlFor={`honor-level-${index}`}>Level</Label>
                <Select 
                  value={honor.level}
                  onValueChange={(value) => handleInputChange(index, "level", value as any)}
                >
                  <SelectTrigger id={`honor-level-${index}`}>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="district">District/Regional</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                    <SelectItem value="national">National</SelectItem>
                    <SelectItem value="international">International</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor={`honor-year-${index}`}>Year Received</Label>
                <Select 
                  value={honor.year}
                  onValueChange={(value) => handleInputChange(index, "year", value)}
                >
                  <SelectTrigger id={`honor-year-${index}`}>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9">Freshman Year (9th)</SelectItem>
                    <SelectItem value="10">Sophomore Year (10th)</SelectItem>
                    <SelectItem value="11">Junior Year (11th)</SelectItem>
                    <SelectItem value="12">Senior Year (12th)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
        
        <button 
          type="button"
          onClick={addHonorAward}
          className="mb-8 flex items-center text-sm font-medium text-primary hover:text-primary/80"
        >
          <PlusCircle className="h-5 w-5 mr-1" />
          Add Another Honor/Award
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
