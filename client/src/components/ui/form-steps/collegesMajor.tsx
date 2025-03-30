import { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, X } from "lucide-react";
import { type AdmissionData } from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CollegesMajorProps {
  formData: AdmissionData;
  setFormData: Dispatch<SetStateAction<AdmissionData>>;
  onNext: () => void;
  onPrev: () => void;
}

const collegesMajorSchema = z.object({
  major: z.string().min(1, "Major is required"),
  residency: z.enum(["in-state", "out-of-state", "international"]).default("out-of-state"),
});

export function CollegesMajor({ formData, setFormData, onNext, onPrev }: CollegesMajorProps) {
  const form = useForm<z.infer<typeof collegesMajorSchema>>({
    resolver: zodResolver(collegesMajorSchema),
    defaultValues: {
      major: formData.major,
      residency: formData.residency || "out-of-state",
    },
  });

  function onSubmit(values: z.infer<typeof collegesMajorSchema>) {
    // Filter out empty colleges
    const filteredColleges = formData.colleges.filter(
      (college) => college.trim() !== ""
    );
    
    // If all are empty, keep at least one empty record
    const updatedColleges = 
      filteredColleges.length > 0 
        ? filteredColleges 
        : [""];
    
    setFormData((prev) => ({
      ...prev,
      colleges: updatedColleges,
      major: values.major,
      residency: values.residency,
    }));
    
    onNext();
  }
  
  const handleCollegeChange = (index: number, value: string) => {
    const updatedColleges = [...formData.colleges];
    updatedColleges[index] = value;
    
    setFormData((prev) => ({
      ...prev,
      colleges: updatedColleges,
    }));
  };
  
  const addCollege = () => {
    setFormData((prev) => ({
      ...prev,
      colleges: [...prev.colleges, ""],
    }));
  };
  
  const removeCollege = (index: number) => {
    if (formData.colleges.length <= 1) return;
    
    const updatedColleges = formData.colleges.filter((_, i) => i !== index);
    
    setFormData((prev) => ({
      ...prev,
      colleges: updatedColleges,
    }));
  };

  return (
    <Card className="bg-white shadow-sm rounded-lg p-6 mb-8">
      <CardContent className="p-0 pt-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Colleges & Major</h2>
        <p className="text-sm text-gray-600 mb-4">
          List the colleges you're interested in and your intended major.
        </p>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Colleges of Interest</h3>
          
          {formData.colleges.map((college, index) => (
            <div key={index} className="mb-3 flex items-center">
              <Input 
                value={college}
                onChange={(e) => handleCollegeChange(index, e.target.value)}
                placeholder="University Name"
                className="flex-1"
              />
              <button 
                type="button"
                onClick={() => removeCollege(index)}
                className="ml-2 text-gray-400 hover:text-red-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
          
          <button 
            type="button"
            onClick={addCollege}
            className="mt-2 flex items-center text-sm font-medium text-primary hover:text-primary/80"
          >
            <PlusCircle className="h-5 w-5 mr-1" />
            Add Another College
          </button>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="mb-6">
              <FormField
                control={form.control}
                name="major"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intended Major</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Computer Science, Biology, Economics" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="mb-6">
              <FormField
                control={form.control}
                name="residency"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Residency Status</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="in-state" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            In-State Student
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="out-of-state" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Out-of-State Student
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="international" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            International Student
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="mt-8 flex justify-between">
              <Button type="button" variant="outline" onClick={onPrev}>
                Back
              </Button>
              <Button type="submit">
                Continue
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
