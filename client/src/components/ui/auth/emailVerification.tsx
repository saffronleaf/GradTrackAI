import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface EmailVerificationProps {
  email: string;
  verificationCode?: string;
  onVerificationSuccess: () => void;
}

export function EmailVerification({ email, verificationCode, onVerificationSuccess }: EmailVerificationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // With Supabase, we don't handle verification codes manually anymore.
  // Instead, Supabase sends verification emails with links.
  // This component now just provides guidance and a way to resend the verification email.

  const handleResendVerification = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Verification email sent",
        description: "We've sent a new verification email. Please check your inbox.",
      });
    } catch (err: any) {
      setError(
        err.message || "An error occurred while sending the verification email. Please try again."
      );
      
      toast({
        variant: "destructive",
        title: "Failed to send verification email",
        description: err.message || "Please try again or contact support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check verification status
  const checkVerificationStatus = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      // Refresh the session and user data
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }
      
      if (data.user?.email_confirmed_at) {
        // Email has been verified
        toast({
          title: "Email verified",
          description: "Your email has been successfully verified!",
        });
        onVerificationSuccess();
      } else {
        setError("Your email is not verified yet. Please check your inbox or resend the verification email.");
      }
    } catch (err: any) {
      setError(
        err.message || "Failed to check verification status. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          We've sent a verification link to {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="mb-2">Please check your email inbox and click the verification link we sent to verify your account.</p>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </div>
          <div className="text-sm text-center text-muted-foreground">
            Didn't receive the email? Check your spam folder or{" "}
            <button
              onClick={handleResendVerification}
              disabled={isSubmitting}
              className="text-primary underline underline-offset-4 hover:text-primary/90 disabled:opacity-50"
            >
              resend the verification email
            </button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button
          onClick={checkVerificationStatus}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Checking..." : "I've Verified My Email"}
        </Button>
      </CardFooter>
    </Card>
  );
}