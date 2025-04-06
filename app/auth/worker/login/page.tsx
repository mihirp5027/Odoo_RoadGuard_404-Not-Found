"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Shield, Wrench } from "lucide-react";

const formSchema = z.object({
  mobileNumber: z.string().regex(/^[0-9]{10}$/, "Invalid mobile number"),
  otp: z.string().optional(),
});

export default function WorkerLoginPage() {
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [previousMobileNumber, setPreviousMobileNumber] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mobileNumber: "",
      otp: "",
    },
  });

  // Watch for mobile number changes
  const mobileNumber = form.watch("mobileNumber");

  // Reset OTP state when mobile number changes
  useEffect(() => {
    if (mobileNumber !== previousMobileNumber) {
      setPreviousMobileNumber(mobileNumber);
      setOtp("");
      setShowOtpInput(false);
      setIsVerifying(false);
      form.setValue("otp", "");
    }
  }, [mobileNumber, previousMobileNumber, form]);

  const sendOTP = async (mobileNumber: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/otp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobileNumber,
          role: "worker"
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send OTP");
      }

      setShowOtpInput(true);
      toast({
        title: "OTP Sent",
        description: "Please check your mobile number for OTP",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (mobileNumber: string, otp: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobileNumber,
          otp,
          role: "worker"
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to verify OTP");
      }

      const data = await response.json();
      
      // Log the response data for debugging
      console.log("Login response:", data);

      // Store only the token in localStorage for authentication
      localStorage.setItem("workerToken", data.token);

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });

      // Redirect to worker dashboard
      router.push("/worker/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await sendOTP(values.mobileNumber);
  };

  const handleVerifyOTP = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!mobileNumber || !otp) return;
    await verifyOTP(mobileNumber, otp);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b shadow-sm dark:border-gray-700">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-bold dark:text-white">RoadGuard Worker</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Wrench className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center dark:text-white">Worker Login</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-gray-300">Mobile Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your mobile number"
                            {...field}
                            disabled={isLoading || isVerifying}
                            className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!showOtpInput && (
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Sending OTP..." : "Send OTP"}
                    </Button>
                  )}
                </form>
              </Form>

              {showOtpInput && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="dark:text-gray-300">OTP</Label>
                    <Input
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      disabled={isVerifying}
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>

                  <Button
                    type="button"
                    className="w-full"
                    disabled={isVerifying || !otp}
                    onClick={handleVerifyOTP}
                  >
                    {isVerifying ? "Verifying..." : "Verify OTP"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 