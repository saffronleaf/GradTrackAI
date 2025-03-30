import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { EmailVerification } from "./emailVerification";
import { useAuth } from "@/hooks/use-auth";
import { signInWithEmail, isEmailVerified } from "@/lib/supabase";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess: (userData: any) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { toast } = useToast();
  const { login, updateVerificationStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [loginUser, setLoginUser] = useState<any>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      // Use Supabase for authentication
      const { user, session } = await signInWithEmail(values.email, values.password);
      
      if (user) {
        // Check if email is verified
        const verified = await isEmailVerified();
        
        if (!verified) {
          toast({
            title: "Verification required",
            description: "Please verify your email to continue. Check your inbox for a verification link.",
          });
          setUserEmail(values.email);
          
          // Create a user object in our app's format for later use
          const appUser = {
            id: user.id,
            email: user.email || "",
            username: user.user_metadata?.username || user.email?.split('@')[0] || "",
            isVerified: false
          };
          
          setLoginUser(appUser);
          setShowVerification(true);
        } else {
          // Create a user object in our app's format
          const appUser = {
            id: user.id,
            email: user.email || "",
            username: user.user_metadata?.username || user.email?.split('@')[0] || "",
            isVerified: true
          };
          
          toast({
            title: "Login successful",
            description: `Welcome back, ${appUser.username}!`,
          });
          
          // Update auth context
          login(appUser);
          updateVerificationStatus(true);
          onSuccess(appUser);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid email or password",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "An error occurred during login",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleVerificationSuccess = () => {
    toast({
      title: "Email verified",
      description: "Your account is now fully activated",
    });
    updateVerificationStatus(true);
    if (loginUser) {
      onSuccess({
        ...loginUser,
        isVerified: true
      });
    }
  };

  if (showVerification) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
          <CardDescription>
            We've sent a verification code to your email. Please enter it below to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailVerification 
            email={userEmail} 
            onVerificationSuccess={handleVerificationSuccess} 
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register">
            <span className="text-primary underline-offset-4 hover:underline cursor-pointer">Register</span>
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}