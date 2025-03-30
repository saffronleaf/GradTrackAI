import { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { academicInfoSchema, type AdmissionData } from "@shared/schema";

interface AcademicInfoProps {
  formData: AdmissionData;
  setFormData: Dispatch<SetStateAction<AdmissionData>>;
  onNext: () => void;
}

export function AcademicInfo({ formData, setFormData, onNext }: AcademicInfoProps) {
  const form = useForm<z.infer<typeof academicInfoSchema>>({
    resolver: zodResolver(academicInfoSchema),
    defaultValues: formData.academics,
  });

  function onSubmit(values: z.infer<typeof academicInfoSchema>) {
    setFormData((prev) => ({
      ...prev,
      academics: values,
    }));
    onNext();
  }

  return (
    <Card className="bg-white shadow-sm rounded-lg p-6 mb-8">
      <CardContent className="p-0 pt-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Academic Information</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="gpa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unweighted GPA (out of 4.0)</FormLabel>
                    <FormControl>
                      <Input placeholder="3.8" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter your unweighted GPA on a 4.0 scale
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weightedGpa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weighted GPA (if applicable)</FormLabel>
                    <FormControl>
                      <Input placeholder="4.2" {...field} />
                    </FormControl>
                    <FormDescription>
                      If your school uses weighted GPA (typically 5.0 scale)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SAT Score (out of 1600)</FormLabel>
                    <FormControl>
                      <Input placeholder="1350" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="act"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ACT Score (out of 36)</FormLabel>
                    <FormControl>
                      <Input placeholder="28" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apCourses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of AP/IB Courses</FormLabel>
                    <FormControl>
                      <Input placeholder="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="courseRigor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall Course Rigor</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course rigor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Basic Courses</SelectItem>
                        <SelectItem value="medium">Some Honors/Advanced</SelectItem>
                        <SelectItem value="high">Mostly Honors/Advanced</SelectItem>
                        <SelectItem value="very_high">Maximum Rigor Available</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-8 flex justify-end">
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
