import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EmailVerificationProps {
  email: string;
  verificationCode?: string;
  onVerificationSuccess: () => void;
}

export function EmailVerification({ email, verificationCode, onVerificationSuccess }: EmailVerificationProps) {
  const [code, setCode] = useState(verificationCode || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await apiRequest<{ success: boolean; message: string }>({
        url: "/api/verify-email",
        method: "POST",
        body: { email, code },
      });

      if (response.success) {
        toast({
          title: "Email verified",
          description: "Your email has been successfully verified!",
        });
        onVerificationSuccess();
      } else {
        setError(response.message || "Failed to verify email. Please try again.");
      }
    } catch (err: any) {
      setError(
        err.message || "An error occurred while verifying your email. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await apiRequest<{ success: boolean; message: string; verificationCode?: string }>({
        url: "/api/resend-verification",
        method: "POST",
        body: { email },
      });

      if (response.success) {
        // In a real application, we would not send the code in the response but would send it via email
        if (response.verificationCode) {
          setCode(response.verificationCode);
        }
        
        toast({
          title: "Verification code sent",
          description: "A new verification code has been sent to your email.",
        });
      } else {
        setError(response.message || "Failed to send verification code. Please try again.");
      }
    } catch (err: any) {
      setError(
        err.message || "An error occurred while sending the verification code. Please try again."
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
          Enter the 6-digit verification code sent to {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Enter verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              className="text-center text-lg tracking-wider"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <div className="text-sm text-center text-muted-foreground">
            Didn't receive a code? Check your spam folder or{" "}
            <button
              onClick={handleResendCode}
              disabled={isSubmitting}
              className="text-primary underline underline-offset-4 hover:text-primary/90 disabled:opacity-50"
            >
              resend the code
            </button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleVerify}
          disabled={isSubmitting || !code}
          className="w-full"
        >
          {isSubmitting ? "Verifying..." : "Verify Email"}
        </Button>
      </CardFooter>
    </Card>
  );
}