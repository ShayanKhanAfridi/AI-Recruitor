import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertTriangle, Home, CheckCircle } from "lucide-react";

interface ExpiredPageProps {
  type: "expired" | "not-started" | "completed";
}

export default function ExpiredPage({ type }: ExpiredPageProps) {
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);

  useEffect(() => {
    if (type === "not-started") {
      const stored = sessionStorage.getItem("interviewScheduledTime");
      if (stored) {
        const date = new Date(stored);
        setScheduledTime(date.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }));
      }
    }
  }, [type]);

  const content = {
    expired: {
      icon: Clock,
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
      title: "Interview Link Expired",
      description: "The scheduled time for this interview has passed. Please contact the hiring team if you believe this is an error.",
    },
    "not-started": {
      icon: Clock,
      iconBg: "bg-yellow-500/10",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      title: "Interview Not Started Yet",
      description: "This interview is scheduled for a future time. Please return at the scheduled time.",
    },
    completed: {
      icon: CheckCircle,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-600 dark:text-green-400",
      title: "Interview Completed",
      description: "Thank you for completing your interview! The hiring team will review your responses and get back to you soon.",
    },
  };

  const { icon: Icon, iconBg, iconColor, title, description } = content[type];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg" data-testid="text-brand">AI Interview</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg">
          <Card className="border-card-border">
            <CardHeader className="text-center pb-4 space-y-4">
              <div className={`mx-auto w-20 h-20 rounded-2xl ${iconBg} flex items-center justify-center`} data-testid="status-icon">
                <Icon className={`w-10 h-10 ${iconColor}`} />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl sm:text-3xl font-bold" data-testid="text-status-title">
                  {title}
                </CardTitle>
                <CardDescription className="text-base" data-testid="text-status-description">
                  {description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {scheduledTime && type === "not-started" && (
                <div className="p-4 rounded-lg bg-muted/50 text-center" data-testid="scheduled-time-container">
                  <p className="text-sm text-muted-foreground mb-1">Scheduled Time</p>
                  <p className="font-mono font-medium" data-testid="text-scheduled-time">
                    {scheduledTime}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full gap-2" data-testid="button-go-home">
                    <Home className="w-4 h-4" />
                    Return Home
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Need assistance?{" "}
                <a href="mailto:support@aiinterview.com" className="text-primary underline" data-testid="link-support">
                  Contact Support
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border py-4">
        <p className="text-center text-xs text-muted-foreground" data-testid="text-footer">
          Powered by AI Interview System
        </p>
      </footer>
    </div>
  );
}
