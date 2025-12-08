import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Shield, Clock, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg hidden sm:block" data-testid="text-brand">AI Interview</span>
          </div>
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
                <CardTitle className="text-2xl sm:text-3xl font-bold" data-testid="text-title">
                  AI Interview System
                </CardTitle>
                <CardDescription className="text-base">
                  Welcome to your video interview. Get ready to showcase your skills with our AI-powered interview platform.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Secure & Private</p>
                    <p className="text-xs text-muted-foreground">Your interview is encrypted and confidential</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Time-Limited Access</p>
                    <p className="text-xs text-muted-foreground">Complete your interview within the scheduled window</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Video className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Video Interview</p>
                    <p className="text-xs text-muted-foreground">Ensure your camera and microphone are working</p>
                  </div>
                </div>
              </div>

              <Link href="/interview">
                <Button 
                  className="w-full" 
                  size="lg"
                  data-testid="button-access-interview"
                >
                  Access Your Interview
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>

              <p className="text-xs text-center text-muted-foreground">
                Need help? Contact{" "}
                <a href="mailto:support@aiinterview.com" className="text-primary underline" data-testid="link-support">
                  support@aiinterview.com
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
