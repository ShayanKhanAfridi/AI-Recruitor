import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, type LoginCredentials, type InterviewSession } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Video, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function LoginPage() {
  const { interviewId } = useParams<{ interviewId?: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      interviewId: interviewId || "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginCredentials) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const responseData = await res.json();
      
      if (!res.ok) {
        // Handle specific error types
        if (responseData.type === "not_started") {
          throw { type: "not_started", message: responseData.message, scheduledTime: responseData.scheduledTime };
        } else if (responseData.type === "expired") {
          throw { type: "expired", message: responseData.message };
        }
        throw new Error(responseData.message || "Authentication failed");
      }
      
      return responseData as InterviewSession;
    },
    onSuccess: (data) => {
      sessionStorage.setItem("interviewSession", JSON.stringify(data));
      setLocation(`/interview/${data.id}/room`);
    },
    onError: (error: any) => {
      // Redirect to appropriate page based on error type
      if (error?.type === "not_started") {
        sessionStorage.setItem("interviewScheduledTime", error.scheduledTime);
        setLocation("/interview/not-started");
        return;
      }
      if (error?.type === "expired") {
        setLocation("/interview/expired");
        return;
      }
      
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials or interview not available",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginCredentials) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg hidden sm:block">AI Interview</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <Card className="border-card-border">
            <CardHeader className="text-center pb-4 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Video className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">
                  Begin Your Interview
                </CardTitle>
                <CardDescription className="text-base">
                  Enter your credentials to access the interview room
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="interviewId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interview ID</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your interview ID"
                            className="font-mono h-12"
                            readOnly={!!interviewId}
                            data-testid="input-interview-id"
                          />
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
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="h-12 pr-10"
                              data-testid="input-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-12 w-12"
                              onClick={() => setShowPassword(!showPassword)}
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loginMutation.isPending}
                    data-testid="button-begin-interview"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Begin Interview"
                    )}
                  </Button>
                </form>
              </Form>

              <p className="text-xs text-center text-muted-foreground mt-6">
                Make sure you have your camera and microphone ready before starting.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border py-4">
        <p className="text-center text-xs text-muted-foreground">
          Powered by AI Interview System
        </p>
      </footer>
    </div>
  );
}
